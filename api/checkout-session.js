// POST /api/checkout-session  { sessionId }
// Called by the success page after a Stripe redirect. It verifies the session
// with Stripe (so we trust the payment actually happened), finalises the local
// transaction, and emails the customer their receipt.
//
// This is the "no webhook required" path: it lets the receipt email send as soon
// as the customer lands on the "Subscription Activated" screen. It is idempotent
// — the receipt is only emailed the first time the transaction moves from
// pending → approved, so refreshing the page (or a webhook also firing) will not
// send a second email.
import { createHandler, readJsonBody, sendJson } from "./_lib/http.js";
import { prisma } from "./_lib/prisma.js";
import { stripe, stripeEnabled } from "./_lib/stripe.js";
import { sendReceiptEmail } from "./_lib/email.js";

export default createHandler("POST", async (req, res) => {
  if (!stripeEnabled) {
    return sendJson(res, 400, { error: "Stripe is not configured." });
  }

  const { sessionId } = (await readJsonBody(req)) ?? {};
  if (!sessionId || typeof sessionId !== "string") {
    return sendJson(res, 400, { error: "sessionId is required." });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // Only act on a genuinely paid session.
  if (session.payment_status !== "paid") {
    return sendJson(res, 202, { status: session.payment_status, emailed: false });
  }

  const amount = Math.round((session.amount_total ?? 0) / 100);
  const plan = session.metadata?.plan;
  const userId = session.metadata?.userId || session.client_reference_id;

  // Atomically flip the pending transaction to approved. Only the call that
  // actually performs the flip (count > 0) is responsible for the email.
  const finalized = await prisma.transaction.updateMany({
    where: { stripeCheckoutId: session.id, status: "pending" },
    data: {
      status: "approved",
      amount,
      stripePaymentIntentId: session.payment_intent ?? null,
    },
  });

  // Mirror the subscription for signed-in users (guests have no account yet).
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

  let emailed = false;
  const email = session.customer_details?.email || session.customer_email;
  if (finalized.count > 0 && email) {
    try {
      await sendReceiptEmail(
        { email, fullName: session.metadata?.fullName || "there" },
        { id: session.id, plan, amount }
      );
      emailed = true;
    } catch (err) {
      console.error("[checkout-session receipt email]", err);
    }
  }

  return sendJson(res, 200, { status: "paid", emailed, plan, amount });
});
