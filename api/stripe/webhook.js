// POST /api/stripe/webhook — Stripe calls this to confirm payments/subscriptions.
//
// Signature verification requires the RAW, unparsed request body. On Vercel the
// reliable way to get it is the web-standard handler signature (`export function
// POST(request)`), where `await request.text()` returns the exact bytes Stripe
// signed. This avoids the platform's automatic body parsing, which silently
// breaks `constructEvent` in production. The local dev harness bridges Express to
// this same handler (see server/dev.js).
//
// Ref: https://vercel.com/kb/guide/how-do-i-get-the-raw-body-of-a-serverless-function
import { prisma } from "../_lib/prisma.js";
import { stripe, stripeEnabled, WEBHOOK_SECRET } from "../_lib/stripe.js";
import { sendReceiptEmail } from "../_lib/email.js";

export async function POST(request) {
  if (!stripeEnabled || !WEBHOOK_SECRET) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    return Response.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id;
      const plan = session.metadata?.plan;

      if (userId && plan) {
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: "active",
            stripeCustomerId: session.customer ?? null,
            stripeSubscriptionId: session.subscription ?? null,
          },
          update: {
            plan,
            status: "active",
            stripeCustomerId: session.customer ?? null,
            stripeSubscriptionId: session.subscription ?? null,
          },
        });
      }

      // Finalise the matching pending transaction. Only the call that actually
      // performs the flip (count > 0) sends the email — this keeps the receipt
      // idempotent across the webhook and the /api/checkout-session confirm path.
      const amount = Math.round((session.amount_total ?? 0) / 100);
      const finalized = await prisma.transaction.updateMany({
        where: { stripeCheckoutId: session.id, status: "pending" },
        data: {
          status: "approved",
          amount,
          stripePaymentIntentId: session.payment_intent ?? null,
        },
      });

      // Email the customer their receipt (if Stripe captured an address).
      const email = session.customer_details?.email || session.customer_email;
      if (finalized.count > 0 && email) {
        sendReceiptEmail(
          { email, fullName: session.metadata?.fullName || "there" },
          { id: session.id, plan: plan || session.metadata?.plan, amount }
        ).catch((err) => console.error("[webhook receipt email]", err));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: "canceled" },
      });
      break;
    }

    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }

  return Response.json({ received: true });
}
