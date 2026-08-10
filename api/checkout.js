// POST /api/checkout — the *proper* Stripe integration (recommended over the
// legacy /api/transactions demo path). Creates a hosted Stripe Checkout Session
// in subscription mode and returns its URL for the client to redirect to.
// Card details never touch our server. Requires authentication.
import { createHandler, readJsonBody, sendJson } from "./_lib/http.js";
import { prisma } from "./_lib/prisma.js";
import { getAuth } from "./_lib/auth.js";
import { isValidPlan } from "./_lib/validation.js";
import { stripe, stripeEnabled, PRICE_IDS } from "./_lib/stripe.js";

export default createHandler("POST", async (req, res) => {
  if (!stripeEnabled) {
    return sendJson(res, 503, {
      error: "Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs, or use /api/transactions for the demo path.",
    });
  }

  const claims = getAuth(req);
  if (!claims) {
    return sendJson(res, 401, { error: "Authentication required to start checkout." });
  }

  const body = await readJsonBody(req);
  const { plan } = body;
  if (!isValidPlan(plan)) {
    return sendJson(res, 400, { error: "Invalid plan selected." });
  }
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return sendJson(res, 503, { error: `No Stripe price configured for the ${plan} plan.` });
  }

  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user) {
    return sendJson(res, 404, { error: "User not found." });
  }

  const origin = process.env.PUBLIC_BASE_URL || `https://${req.headers.host}`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { userId: user.id, plan },
    success_url: `${origin}/transaction?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/transaction?status=cancelled`,
  });

  // Record the pending attempt for the audit trail.
  await prisma.transaction.create({
    data: {
      userId: user.id,
      plan,
      amount: 0, // final amount is confirmed by the webhook
      currency: "aud",
      status: "pending",
      stripeCheckoutId: session.id,
    },
  });

  return sendJson(res, 200, { url: session.url, sessionId: session.id });
});
