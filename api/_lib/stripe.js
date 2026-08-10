// Stripe client + price lookup. Uses test-mode keys for the MVP demo.
// If STRIPE_SECRET_KEY is absent the client is null and callers fall back to a
// simulated approval so the checkout still demos end-to-end without live keys.
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey ? new Stripe(secretKey) : null;
export const stripeEnabled = Boolean(stripe);

// Map plan name -> Stripe Price ID (set these in your env once you create the
// products in the Stripe dashboard). Falls back to null when unset.
export const PRICE_IDS = {
  Starter: process.env.STRIPE_PRICE_STARTER || null,
  Professional: process.env.STRIPE_PRICE_PROFESSIONAL || null,
  Business: process.env.STRIPE_PRICE_BUSINESS || null,
};

export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || null;
