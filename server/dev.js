// Local development harness.
//
// In production these routes are deployed as individual Vercel serverless
// functions from the /api directory. To avoid duplicating logic, this dev server
// simply mounts the very same handler modules behind Express so `npm run dev:api`
// works locally without the Vercel CLI. One source of truth, two runtimes.
import express from "express";
import health from "../api/health.js";
import signup from "../api/auth/signup.js";
import login from "../api/auth/login.js";
import me from "../api/auth/me.js";
import contact from "../api/contact.js";
import createTransaction from "../api/transactions/index.js";
import getTransaction from "../api/transactions/[id].js";
import checkout from "../api/checkout.js";
import checkoutSession from "../api/checkout-session.js";
import stripeWebhook from "../api/stripe/webhook.js";

const app = express();
const PORT = process.env.PORT || 8787;

// Adapt an Express route to a Vercel-style (req, res) handler. We do NOT parse
// the body here — the handlers read the raw stream themselves (which also keeps
// the Stripe webhook's signature verification working).
const mount = (handler) => (req, res) => {
  // Vercel exposes dynamic segments on req.query; mirror Express params there.
  req.query = { ...req.query, ...req.params };
  return handler(req, res);
};

app.get("/api/health", mount(health));
app.post("/api/auth/signup", mount(signup));
app.post("/api/auth/login", mount(login));
app.get("/api/auth/me", mount(me));
app.post("/api/contact", mount(contact));
app.post("/api/transactions", mount(createTransaction));
app.get("/api/transactions/:id", mount(getTransaction));
app.post("/api/checkout", mount(checkout));
app.post("/api/checkout-session", mount(checkoutSession));
app.post("/api/stripe/webhook", mount(stripeWebhook));

app.listen(PORT, () => {
  console.log(`SecureReport dev API running on http://localhost:${PORT}`);
});
