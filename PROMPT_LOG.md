# SecureReport AI — AI-Assisted Development Log

This document records the key prompts used to direct an AI assistant across the
full development of SecureReport AI — from initial concept and market research,
through the landing-page design, to the production backend. Prompts have been
rewritten for clarity and professionalism and made specific about the intended
technology stack. Routine debugging and environment-setup exchanges have been
omitted. Each prompt is followed by the assistant's actual response.

---

## Phase 1 — Concept and Market Research

**Prompt**

> Review my research on launching an automated security business in Australia
> (Victoria), comparing a hardware-and-installation model against a
> physical-guarding model, and sanity-check the licensing, sourcing, and
> automation considerations before I build on it.

**Claude's response**

This looks like a set of research notes on starting a security business in
Australia (installation/automation vs. physical guarding), covering licensing,
sourcing, and automation trends. A few things worth flagging before I dig in:

On the content itself:

- The licensing list is roughly right for Victoria — you'd need a Private Security
  Business Licence from Victoria Police, individual guard licences if you're
  providing personnel, a Labour Hire Licence (mandatory in Victoria since 2019 if
  you're supplying security labour to a third party), and Portable Long Service
  Authority registration if you employ security workers. If you go the
  installation route instead, you'd instead be looking at electrical/low-voltage
  contractor licensing rather than the guard-specific licences.
- The "hardware + installation" vs "guards" fork is the right first question to
  answer, because it changes almost everything downstream — licensing, insurance,
  capital requirements, and how you compete (trade pricing and dealer programs
  vs. labour hire compliance).

What I'm not sure of yet: whether you want me to actually build something from
this (a business plan doc, a comparison of the two paths, a costed startup
budget) or just sanity-check/expand the research.

## Phase 2 — Landing Page Design and Styling Approach

**Prompt**

> Build the SecureReport AI marketing landing page in React with Vite as a
> single-file component, styled with scoped CSS-in-JS rather than CSS Modules or
> Tailwind, and explain how that single-file styling approach works.

**Claude's response**

The trick is just plain CSS scoped by a wrapper class, with no CSS Modules or
Tailwind needed — three parts working together:

1. A wrapper class on the outer div

```jsx
<div className="sr">
  ...everything...
</div>
```

Every element inside is a descendant of `.sr`.

2. A CSS string, injected via a `<style>` tag inside the JSX

```jsx
const css = `
.sr { background: #0A1628; color: #E8EDF6; }
.sr h1 { font-size: 52px; }
.sr .btn { padding: 13px 22px; }
`;
```

This is just a normal JavaScript template literal (backtick string) holding
regular CSS as text — nothing React-specific about the CSS itself.

3. Rendering that string into a `<style>` element

```jsx
<div className="sr">
  <style>{css}</style>
  ...rest of the page...
</div>
```

React renders `<style>{css}</style>` as a literal `<style>` tag in the page's
HTML, and the browser reads whatever's inside it as normal CSS — exactly the same
as if you'd linked a `.css` file.

Why prefix every selector with `.sr`? Since the styles are injected globally into
the page (not scoped automatically like CSS Modules would), prefixing everything
with `.sr` — e.g. `.sr h1`, `.sr .btn` — stops these styles from leaking out and
accidentally overriding other components if you ever add more to the same
project. That's also why I explicitly set `color` on headings — without the
prefix's specificity, Vite's own default styles could win instead (which is
actually the bug we fixed earlier).

So the "one file" trick is really: HTML-like JSX + a JS string of CSS + a
`<style>` tag — three ordinary things combined, not a special React styling
feature.

**Prompt**

> Add imagery to the landing page to make it feel like a real product rather than
> a wireframe — a hero visual for the top section and supporting graphics for the
> capabilities and dashboard areas — keeping everything on-brand with the dark
> navy/azure theme and without hurting page load or the single-file structure.

**Claude's response**

*(Reconstructed — this exchange is from an earlier design session and is not
preserved verbatim.)*

Added a hero image to the top section and kept the lighter, repeatable visuals as
inline SVG so they stay crisp at any size, load instantly, and remain part of the
single-file component. The hero uses a real raster image (`src/assets/hero.png`)
imported through Vite so it's bundled and cache-busted on build, while the
capability cards and dashboard mock-up use hand-drawn SVG icons tinted with the
existing azure accent so nothing looks like stock clip-art. This keeps the page
visually convincing for the demo without adding heavy image assets or breaking the
scoped CSS-in-JS approach.

## Phase 3 — Feature Feasibility and Planning

**Prompt**

> Assess the difficulty of adding transactional email on form submission, Stripe
> subscription payments, and interactive form/button behaviour to the landing
> page for a two-week university MVP, and recommend a concrete approach and stack
> for each.

**Claude's response**

Honestly no — it's moderate difficulty, not hard, because each piece individually
is a well-worn pattern with good tooling. Here's the realistic breakdown:

Email on demo request — easy. Services like Resend or SendGrid give you a free
tier and a simple API: you POST the form data to your backend, the backend calls
their API with an API key, done. Maybe 20 lines of backend code. The tricky part
isn't code, it's just signing up for the service and getting an API key.

Stripe payments — moderate. Stripe's own React library and documentation are
excellent, and for a subscription checkout you mostly just: create a
"Product/Price" in your Stripe dashboard, call one API endpoint from your backend
to create a checkout session, redirect the user to Stripe's hosted payment page.
Stripe handles the actual card form, security, and compliance — you're not
building any of that yourself. Testing is free and safe using Stripe's test mode
and fake card numbers.

Interactive buttons/layout — already mostly done. The page I built already has
working buttons, a form, and a pricing toggle — I just need to wire the form to
actually submit somewhere instead of just updating local state, which is a small
change.

What actually makes this "hours" not "minutes": you need a small backend server
(Node/Express) to hold your secret API keys safely, since a browser can never be
trusted with a Stripe secret key or an email API key. That's the one genuinely
new piece — but it's maybe 40–60 lines of code total for both features, and it's
a completely standard pattern with tons of tutorials/documentation to lean on if
something breaks.

For a two-week class project timeline, this is very achievable — probably a few
focused hours, not days.

**Prompt**

> Advise whether the landing page should include a login option for returning
> customers, given the assessment rubric and the two-week MVP timeline, and
> recommend how much authentication is actually warranted for the demo.

**Claude's response**

Yes — worth including, for a few practical reasons:

Why add it:

- It's the natural next step for a returning customer — someone who signed up last
  week shouldn't have to scroll to pricing and re-enter payment details, they just
  want their dashboard
- The rubric's "Product or Service Completeness" criterion is partly about the
  site functioning like a real business, and a SaaS product without a login option
  looks unfinished — retailers expect an account-based product
- It's a very small addition to what's already built — I already have a "Log in"
  link in the nav, it's just not wired to anything yet

What it should actually do for your project scope: it doesn't need full
authentication (password hashing, sessions, etc.) to satisfy the assignment —
that's a lot of extra backend work for a class demo. A reasonable middle ground:

- For the pitch/demo: a simple login form that, on submit, takes the user straight
  to your dashboard/incident view (no real auth check) — this is completely normal
  for a class MVP and lets you demo the product rather than spend your limited time
  building auth infrastructure
- If you have time and want it to look more real: a basic email/password form with
  Stripe's own customer records, or a lightweight auth service (Clerk, Supabase
  Auth) which handles the hard parts for you in a few lines

My recommendation for your timeline: add a login page/modal that's visually
complete but functionally simple (redirects to dashboard on submit, no real
password checking) — it completes the "look" of a real product for demo purposes
without burning your remaining time on building real authentication.

**Prompt**

> Produce a detailed, paste-ready GitHub Copilot prompt to implement a
> Resend-backed demo-request email endpoint (wired to the existing contact form)
> and a simple login system with a themed modal and dashboard redirect, on a
> React + Node/Express stack, keeping the code beginner-readable.

**Claude's response**

Here's a detailed prompt you can paste directly into GitHub Copilot Chat. I've
written it to give Copilot enough context to generate working code in one or two
passes rather than vague scaffolding.

Prompt to paste into Copilot:

```
I'm building a React + Node/Express app called SecureReport AI (a SaaS
platform for retailers to upload CCTV footage and get AI-generated
incident reports). I need two features implemented:

CONTEXT:
- Frontend: React (Vite), single App.jsx currently, plain CSS-in-JS
- Backend: Node.js with Express (needs to be created)
- This is a student project MVP — favour simple, working code over
  production-grade complexity

FEATURE 1: Demo request email
- Add a POST /api/demo-request endpoint in Express
- It should accept { name, email, business, message } from a request body
- Use the Resend API (npm package "resend") to send an email notification
  to my business inbox when someone submits the "Request a demo" form
- Store the Resend API key in a .env file, never hardcoded
- Return a JSON success/error response the frontend can read
- On the frontend, update the existing contact form's submit handler to
  POST to this endpoint instead of just setting local state, and show a
  loading state while sending and an error message if it fails

FEATURE 2: Simple login system
- This does NOT need production-grade security — it's for a class
  project demo, not real customer data
- Add a POST /api/login endpoint that accepts { email, password }
- For now, check credentials against a small hardcoded array of demo
  users in the backend (I'll extend this to a real database later) —
  respond with a success flag and a fake token if the email/password
  match, or an error if not
- On the frontend, build a login form/modal component (matching my
  existing dark navy/blue design system — I'll paste my current CSS
  variables below) with email and password fields, a submit button,
  and basic client-side validation (both fields required)
- On successful login, redirect the user to a placeholder /dashboard
  route (react-router-dom, please set that up too since I don't have
  routing yet) and store the fake token in localStorage
- On failed login, show an inline error message under the form

REQUIREMENTS FOR BOTH:
- Explain any new npm packages I need to install and give me the exact
  npm install commands
- Show me where each new file goes in my project structure
- Add basic error handling (network failures, missing fields) on both
  frontend and backend
- Keep the code beginner-readable with comments explaining each step,
  since I'm a student and want to understand what's happening, not just
  copy-paste

Here are my existing CSS design tokens to match the visual style:
[paste your --bg, --azure, --text etc. CSS variables from App.jsx here]

Please start with the backend Express server setup (server/index.js,
package.json, .env.example), then the two endpoints, then the frontend
changes.
```

A few things to know before you use this:

1. Resend needs a free account and API key (resend.com) — the prompt assumes that.
   If you'd rather use a different service (SendGrid, Nodemailer with Gmail), just
   swap that line.
2. The login is intentionally fake/hardcoded — real authentication (hashed
   passwords, sessions, a database) is a much bigger job than your timeline needs.
   This gets you a working demo flow for the presentation without derailing your
   two weeks on security infrastructure.
3. Paste your actual CSS variables where indicated so Copilot matches your existing
   navy/blue theme instead of generating generic styling.

## Phase 4 — Backend Architecture and Implementation

**Prompt**

> Review the current code files and my project instructions, then start designing
> and implementing both the backend architecture and its API for the SecureReport
> AI MVP, deployable on Vercel. Replace the in-memory prototype and placeholder
> login with: Vercel serverless API functions; a PostgreSQL database on Neon
> modelled with Prisma (users, subscriptions, transactions, contact submissions,
> incidents); JWT authentication with bcrypt-hashed passwords (sign-up, login,
> session); a persisted contact endpoint backed by Resend email; and a Stripe
> hosted-checkout flow with a confirming webhook. Provide a local development
> harness that mounts the same functions so the API runs without the Vercel CLI.

**Claude's response**

Backend is built and wired into your existing frontend. What I implemented:

**Structure** — serverless functions under `/api` (how Vercel actually runs
backends), with shared logic in `api/_lib/`. `server/dev.js` mounts those same
modules behind Express so `npm run dev:api` works locally without the Vercel CLI
— one source of truth, two runtimes.

**The four things from your instructions:**

- **Database** — Prisma schema (`prisma/schema.prisma`) with Postgres tables for
  users, subscriptions, transactions, contact submissions, and incidents. The old
  in-memory `Map()` that lost data on restart is gone.
- **Auth** — email/password with bcrypt hashing + JWT sessions (`signup`, `login`,
  `me`). Login gives an identical error for wrong-email vs wrong-password so you
  can't enumerate accounts.
- **Email** — Resend integration for welcome, receipt, and contact-notification
  emails. I also wired the landing-page contact form (which previously only did
  `alert()`) to actually POST to `/api/contact`.
- **Stripe** — two paths: `/api/transactions` keeps your current checkout form
  working unchanged (now persisted to the DB), and `/api/checkout` +
  `/api/stripe/webhook` is the proper hosted-Checkout flow where card data never
  touches your server.

**Verified:** all 15 files pass syntax checks, 24 unit tests on the validation/auth
logic pass, 4 HTTP-layer tests pass, ESLint is clean, and the API contract matches
what `App.jsx` already sends.

One limitation worth flagging: this sandbox firewalls Prisma's engine download, so
I couldn't run `prisma generate` or hit a live database here. On your machine and
on Vercel that works normally — `BACKEND.md` has the exact setup steps. The short
version:

```
npm install
cp .env.example .env      # add your Neon, JWT, Stripe, Resend values
npm run prisma:generate
npm run prisma:push        # creates the tables
npm run dev:api            # + npm run dev in another terminal
```

You'll need a free Neon database and a `JWT_SECRET` to run it; Stripe and Resend
keys are optional (those features degrade gracefully until you add them).

## Phase 5 — Production Considerations

**Prompt**

> Without modifying any code, explain what is required to move from simulated
> email and payments to live email delivery and real Stripe payments, including
> the account, domain, and compliance considerations relevant to a university
> project.

**Claude's response**

Good question, and one small correction to your premise first: **payments** (the
Transaction records) are stored in the database, but **emails are not** — email
content isn't saved anywhere. Right now, when there's no Resend key, the app just
prints "would have sent…" to the backend terminal. The database only holds contact
submissions, users, and transactions.

Here's what "making them real" actually involves.

**Email (Resend)**

Two levels. The bare minimum is what you already have hooks for — put a real
`RESEND_API_KEY` in `.env`. But out of the box, Resend only lets you send *from*
`onboarding@resend.dev` and only *to* the email address you signed up with. That's
enough to prove it works, but it's not "real." To send real email to any customer
from your own address (e.g. `hello@securereport.com.au`), you have to **verify a
domain** in Resend: you add a few DNS records (SPF and DKIM) to your domain
provider, Resend confirms them, and then you set `EMAIL_FROM` to an address on
that domain. That domain verification is the actual work — the code doesn't change.

**Payments (Stripe)**

Your app already has the correct real-payment path built (`/api/checkout` + the
webhook) — it's just not switched on. Making it take real money means:

1. **Activate your Stripe account** — provide business details and a bank account.
   This flips you from *test mode* to *live mode*. This requires a real registered
   business, which is the main hurdle for a student project.
2. **Recreate your products/prices in live mode** and put the live `price_...` IDs
   and the live `sk_live_...` key in `.env`.
3. **Point the frontend at the hosted checkout.** For real money you'd redirect the
   customer to Stripe's hosted page (via `/api/checkout`), so card data never
   touches your server and Stripe handles PCI compliance.
4. **Register the live webhook** in Stripe and drop its `whsec_...` secret in
   `.env` so subscriptions get confirmed.

**My honest recommendation for a university project**

Don't take real payments. Keep Stripe in **test mode** and demonstrate the full
flow with Stripe's test card `4242 4242 4242 4242` — that exercises checkout, the
webhook, and the database exactly like production, with zero real money, no
business registration, and no legal/PCI exposure. Lecturers expect test mode; real
charges would be a liability, not a bonus.

---

*Prepared as a development record for the SecureReport AI university project.*
