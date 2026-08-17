# Running SecureReport locally

A quick guide for anyone who receives this project as a zip and wants to run it.

## 1. Prerequisites

- **Node.js 20 or newer** (this project was built on Node 22). Get it from https://nodejs.org.
  Check with: `node -v`
- npm comes bundled with Node.

## 2. Unzip and install

```bash
cd SecureReport        # the unzipped project folder
npm install
```

> **Important:** don't rely on any `node_modules` folder that came inside the zip —
> it's machine-specific and will fail on a different OS. Always run `npm install`
> fresh. (Ideally `node_modules` and `dist` are excluded from the zip entirely.)

If the API later complains that the Prisma client is missing, run:

```bash
npm run prisma:generate
```

## 3. Environment variables (optional for a basic demo)

Copy the example file and fill in any keys you have:

```bash
cp .env.example .env      # macOS/Linux
copy .env.example .env    # Windows
```

Everything is optional for a quick look:

- **No keys at all** — the site runs and checkout falls back to a *simulated*
  approval so the flow still completes. Emails just won't send.
- **Stripe / Resend / database keys** — add them to `.env` to exercise the real
  payment, email, and storage paths.

`.env` is gitignored and holds secrets — decide whether to include it when sharing.

## 4. Run it

```bash
npm run dev
```

This now starts **both** the frontend and the API together:

- Frontend: http://localhost:5173
- API: http://localhost:8787 (the frontend proxies `/api/*` to it automatically)

Press `Ctrl+C` once to stop both.

### Other scripts

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Frontend + API together (the usual one)       |
| `npm run dev:web`      | Frontend only                                 |
| `npm run dev:api`      | API only                                      |
| `npm run build`        | Production build (`prisma generate` + Vite)   |
| `npm run preview`      | Preview the production build locally          |
