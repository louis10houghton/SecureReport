// POST /api/checkout — the recommended payment path (replaces the raw-card
// /api/transactions demo). Creates a hosted Stripe Checkout Session and returns
// its URL for the client to redirect to. Card details never touch our server,
// so we stay out of PCI scope.
//
// Auth is OPTIONAL: if a Bearer token is present the checkout is linked to that
// user; otherwise it runs as a guest checkout (the public site has no login yet)
// using the name/email/company collected on the checkout page.
//
// If Stripe is not configured (no STRIPE_SECRET_KEY / price IDs), it falls back
// to a simulated approval so the demo still completes end-to-end without keys.
import { createHandler, readJsonBody, sendJson } from "./_lib/http.js";
import { prisma } from "./_lib/prisma.js";
import { getAuth } from "./_lib/auth.js";
import { isValidPlan, isValidEmail, PLAN_PRICING } from "./_lib/validation.js";
import { stripe, stripeEnabled, PRICE_IDS } from "./_lib/stripe.js";
import { sendReceiptEmail } from "./_lib/email.js";

export default createHandler("POST", async (req, res) => {
  const body = await readJsonBody(req);
  const { plan, fullName, email, company } = body ?? {};

  if (!isValidPlan(plan)) {
    return sendJson(res, 400, { error: "Invalid plan selected." });
  }

  // Link to a signed-in user if a valid token was supplied (optional).
  const claims = getAuth(req);
  const user = claims?.sub
    ? await prisma.user.findUnique({ where: { id: claims.sub } })
    : null;

  // Resolve customer details from the account (if logged in) or the guest form.
  const customerEmail = (user?.email || email || "").toLowerCase().trim();
  const customerName = user?.fullName || fullName;
  if (!user) {
    if (!customerName || typeof customerName !== "string") {
      return sendJson(res, 400, { error: "Full name is required." });
    }
    if (!isValidEmail(customerEmail)) {
      return sendJson(res, 400, { error: "A valid email is required." });
    }
    if (!company || typeof company !== "string") {
      return sendJson(res, 400, { error: "Company is required." });
    }
  }

  const origin = process.env.PUBLIC_BASE_URL || `https://${req.headers.host}`;

  // A price ID is only usable if it's set AND not still the ".env.example"
  // placeholder ("price_..."). This avoids calling Stripe with a fake price
  // (which would 500) when the key is set but no products exist yet.
  const priceId = PRICE_IDS[plan];
  const priceConfigured = Boolean(priceId) && !priceId.includes("...");

  // ── Stripe configured → hosted Checkout (recommended, PCI-safe) ───────────
  if (stripeEnabled && priceConfigured) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      client_reference_id: user?.id || undefined,
      metadata: {
        userId: user?.id || "",
        plan,
        fullName: customerName || "",
        company: company || "",
      },
      success_url: `${origin}/transaction?status=success&plan=${encodeURIComponent(plan)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/transaction?status=cancelled&plan=${encodeURIComponent(plan)}`,
    });

    // Record the pending attempt for the audit trail; the webhook finalises it.
    await prisma.transaction.create({
      data: {
        userId: user?.id ?? null,
        plan,
        amount: 0, // final amount confirmed by the webhook
        currency: "aud",
        status: "pending",
        stripeCheckoutId: session.id,
      },
    });

    return sendJson(res, 200, { mode: "stripe", url: session.url });
  }

  // ── Stripe not configured → simulated approval so the demo still works ─────
  const record = await prisma.transaction.create({
    data: {
      userId: user?.id ?? null,
      plan,
      amount: PLAN_PRICING[plan],
      currency: "aud",
      status: "approved",
    },
  });

  // Email the customer their receipt (if we have an address).
  if (customerEmail) {
    sendReceiptEmail({ email: customerEmail, fullName: customerName }, record)
      .catch((err) => console.error("[checkout receipt email]", err));
  }

  const nextBilling = new Date(record.createdAt);
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  return sendJson(res, 200, {
    mode: "simulated",
    transactionId: record.id,
    status: record.status,
    plan: record.plan,
    amount: record.amount,
    nextBillingDate: nextBilling.toISOString().slice(0, 10),
    message: stripeEnabled
      ? "Subscription activated (demo mode — no Stripe price IDs configured yet)."
      : "Subscription activated (demo mode — Stripe keys not configured).",
  });
});
