# SecureReport AI — Backend

The backend is a set of **Vercel serverless functions** under `/api`, backed by
**Neon Postgres** (via Prisma), with **JWT auth**, **Stripe** for payments, and
**Resend** for email. Locally, `server/dev.js` mounts the same function modules
behind Express so you can run everything without the Vercel CLI.

## Architecture at a glance

```
Browser (React/Vite SPA)
        │  fetch("/api/…")
        ▼
/api/*  Vercel serverless functions      ← same modules run locally via server/dev.js
        │
        ├── _lib/prisma.js      Prisma client singleton
        ├── _lib/auth.js        bcrypt hashing + JWT sign/verify
        ├── _lib/validation.js  Luhn, email, expiry, password (pure, testable)
        ├── _lib/email.js       Resend wrappers (welcome / receipt / contact)
        ├── _lib/stripe.js      Stripe client + price-id map
        └── _lib/http.js        CORS, JSON body, method guard, error wrapper
        ▼
Neon Postgres  (Prisma schema in prisma/schema.prisma)
```

## Endpoints

| Method | Path                       | Auth | Purpose                                            |
|--------|----------------------------|------|----------------------------------------------------|
| GET    | `/api/health`              | —    | Liveness + which integrations are configured       |
| POST   | `/api/auth/signup`         | —    | Create account, returns JWT                         |
| POST   | `/api/auth/login`          | —    | Verify credentials, returns JWT                     |
| GET    | `/api/auth/me`             | JWT  | Current user + subscription                         |
| POST   | `/api/contact`             | —    | Persist contact enquiry + notify inbox              |
| POST   | `/api/transactions`        | opt. | Demo checkout (backward compatible with current UI) |
| GET    | `/api/transactions/:id`    | —    | Fetch a transaction record                          |
| POST   | `/api/checkout`            | JWT  | **Proper** Stripe hosted Checkout session           |
| POST   | `/api/stripe/webhook`      | sig  | Stripe events → update subscription/transaction     |

Auth is a Bearer token: `Authorization: Bearer <jwt>`.

### Two payment paths
- `/api/transactions` keeps the **existing checkout form** working. It validates
  the card locally (Luhn/expiry/CVC) and stores a record, but does **not** send
  raw card data to Stripe (that needs PCI scope). Fine for the demo.
- `/api/checkout` is the **production pattern**: it creates a hosted Stripe
  Checkout session and returns a `url` to redirect to. Card data never touches
  the server. The `/api/stripe/webhook` confirms the result.

## Local setup

```bash
npm install
cp .env.example .env          # then fill in values (see below)
npm run prisma:generate       # generate the Prisma client
npm run prisma:push           # create tables in your Neon database
npm run dev:api               # backend on http://localhost:8787
npm run dev                   # frontend on http://localhost:5173 (proxies /api)
```

The MVP runs without every integration: leave `STRIPE_SECRET_KEY` /
`RESEND_API_KEY` unset and those features degrade gracefully (simulated approval,
logged emails). A database **is** required for auth/contact/transactions.

## Environment variables

See `.env.example`. Minimum to run: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`.
Add Stripe/Resend keys to enable those features.

## Deploying to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from `.env.example` in **Project → Settings → Environment Variables**.
3. Build command is `npm run build` (runs `prisma generate` then `vite build`) — already set in `vercel.json`.
4. Run `npm run prisma:push` once against your Neon DB (locally or via a one-off) to create tables.
5. In the Stripe dashboard, add a webhook endpoint pointing to
   `https://<your-app>.vercel.app/api/stripe/webhook` and copy its signing
   secret into `STRIPE_WEBHOOK_SECRET`.

## Notes for grading / review
- Passwords are hashed with bcrypt; sessions are stateless JWTs.
- Login returns an identical error for unknown-email vs wrong-password (no user enumeration).
- Validation logic is pure and isolated in `_lib/validation.js` for easy testing.
- The in-memory `Map` from the original prototype is replaced by persisted Postgres tables.
