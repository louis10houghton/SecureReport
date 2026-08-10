// POST /api/stripe/webhook — Stripe calls this to confirm payments/subscriptions.
// Signature verification needs the RAW request body, so body parsing is disabled.
import { createHandler, sendJson } from "../_lib/http.js";
import { prisma } from "../_lib/prisma.js";
import { stripe, stripeEnabled, WEBHOOK_SECRET } from "../_lib/stripe.js";

// Tell Vercel not to parse the body — we need the raw bytes for verification.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default createHandler("POST", async (req, res) => {
  if (!stripeEnabled || !WEBHOOK_SECRET) {
    return sendJson(res, 503, { error: "Stripe webhook is not configured." });
  }

  const signature = req.headers["stripe-signature"];
  const raw = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, WEBHOOK_SECRET);
  } catch (err) {
    return sendJson(res, 400, { error: `Webhook signature verification failed: ${err.message}` });
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

      // Finalise the matching pending transaction.
      await prisma.transaction.updateMany({
        where: { stripeCheckoutId: session.id },
        data: {
          status: "approved",
          amount: Math.round((session.amount_total ?? 0) / 100),
          stripePaymentIntentId: session.payment_intent ?? null,
        },
      });
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

  return sendJson(res, 200, { received: true });
});
