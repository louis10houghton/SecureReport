// POST /api/transactions
// Backward-compatible with the existing checkout form in App.jsx:
//   { plan, customer:{fullName,email,company}, payment:{cardNumber,expiry,cvc} }
//   -> { transactionId, status, plan, amount, nextBillingDate, message }
//
// Unlike the old in-memory version, the record is now persisted to Postgres.
// NOTE: raw card numbers are validated locally (Luhn) but never sent to Stripe —
// that would require PCI-scoped raw-card handling. For a real payment use the
// hosted Stripe Checkout flow at /api/checkout instead. This route stays as the
// demo path so the current UI keeps working unchanged.
import { createHandler, readJsonBody, sendJson } from "../_lib/http.js";
import { prisma } from "../_lib/prisma.js";
import { getAuth } from "../_lib/auth.js";
import {
  PLAN_PRICING,
  isValidPlan,
  isValidEmail,
  luhnCheck,
  validateExpiry,
  cardBrand,
} from "../_lib/validation.js";

export default createHandler("POST", async (req, res) => {
  const body = await readJsonBody(req);
  const { plan, customer, payment } = body ?? {};

  if (!isValidPlan(plan)) {
    return sendJson(res, 400, { error: "Invalid plan selected." });
  }
  if (!customer?.fullName || !customer?.email || !customer?.company) {
    return sendJson(res, 400, { error: "Customer full name, email, and company are required." });
  }
  if (!isValidEmail(customer.email)) {
    return sendJson(res, 400, { error: "Please provide a valid email address." });
  }

  const cardNumber = String(payment?.cardNumber || "").replace(/\s+/g, "");
  const cvc = String(payment?.cvc || "").trim();

  if (!luhnCheck(cardNumber)) {
    return sendJson(res, 400, { error: "Invalid card number." });
  }
  const expiry = validateExpiry(payment?.expiry);
  if (!expiry.valid) {
    return sendJson(res, 400, { error: expiry.reason });
  }
  if (!/^\d{3,4}$/.test(cvc)) {
    return sendJson(res, 400, { error: "CVC must be 3 or 4 digits." });
  }

  // Link to a signed-in user if a valid token was supplied (optional).
  const claims = getAuth(req);

  const record = await prisma.transaction.create({
    data: {
      userId: claims?.sub ?? null,
      plan,
      amount: PLAN_PRICING[plan],
      currency: "aud",
      status: "approved", // simulated approval for the demo path
      last4: cardNumber.slice(-4),
      cardBrand: cardBrand(cardNumber),
    },
  });

  const nextBilling = new Date(record.createdAt);
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  return sendJson(res, 201, {
    transactionId: record.id,
    status: record.status,
    plan: record.plan,
    amount: record.amount,
    nextBillingDate: nextBilling.toISOString().slice(0, 10),
    message: "Subscription purchased successfully.",
  });
});
