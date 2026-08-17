# AI Prompt Log — SecureReport

**Project:** SecureReport AI — automated CCTV incident-reporting landing page (university MVP)
**Session date:** 16 August 2026
**Purpose:** A record of how I used an AI assistant to extend the site, including the actual prompts I gave, what the AI did in response, and what I learned about working with it.

Prompts are quoted exactly as I typed them (typos and all). The commentary around each one is a summary, not word-for-word.

---

## The session, prompt by prompt

### 1. Adding the dashboard screenshots

> *"here are screenshots from the securereport dashboard. Add these into the website"*

I attached two screenshots — the **Incident Reports** list and the **Upload CCTV Footage** page — and asked for them to be added to the site.

The AI first read through the existing codebase (a Vite + React single-page app, `src/App.jsx`, styled with CSS variables in `App.css`) rather than guessing. It noticed the request was ambiguous — "add these" could mean *build these screens as real pages* or *embed the images as a preview* — so instead of charging ahead it paused to ask which I wanted. A useful reminder that a vague prompt gets a clarifying question back.

### 2. A detour to GitHub

> *"actually dont build anything yet - how do i update this version to github"*

I changed direction and asked how to push my work to GitHub.

The AI checked the git status and caught something I'd have missed: my local copy was actually **one commit behind** GitHub, not ahead. So the fix was to `git pull` first, not push. It explained the state plainly and gave me the exact commands rather than letting me force-push and clobber the newer remote commit. It also confirmed my `.env` was safely gitignored.

### 3. Committing to the simple approach

> *"just add the photos in"*

I settled the earlier ambiguity — I just wanted the images on the page.

The AI copied both screenshots into the project's `public/` folder and added a new **"Product Preview"** section to the landing page, styled to match the existing dark theme (rounded cards, hover lift, responsive layout). It kept the change self-contained and tracked the steps as a small task list.

### 4. Three upgrades at once

> *"Can you add the ability to click on the pictures in product preview and they expand (meaning you can actually open the pictures)*
>
> *After that, if I zip this project and send it, how can someone run this on their machine (what do they need to do)*
>
> *Also, can you make it so i dont have to run npm dev: api to get the api to work everytime, just make it so you can run npm run dev and all the api runs"*

Three things in one message. The AI handled each:

- **Click-to-expand images** — it added a lightbox: hovering shows a zoom icon, clicking opens the full-size screenshot in a dark overlay, and it closes on `Esc`, on a backdrop click, or via a × button (with page scrolling locked while open).
- **Run-from-a-zip instructions** — it wrote a `SETUP.md` file so the steps travel with the project: install Node, `npm install`, optional `.env`, then `npm run dev`. It flagged an important gotcha — **don't zip `node_modules`**, because it's machine-specific and breaks on another OS (a problem it had actually hit itself while testing).
- **One command to run everything** — it rewrote the `dev` script so `npm run dev` now launches the frontend **and** the API together, via a small zero-dependency runner (`server/start-dev.js`), with colour-coded output and clean `Ctrl+C` shutdown. It kept `dev:web` and `dev:api` around for running them individually.

It was honest about a limitation too: it couldn't run a full production build in its own sandbox because the installed dependencies were for a different operating system, so it verified the changes by inspection and partial testing and left the final build to my machine.

### 5. Asking for this log

> *"can you create a quick log of my Ai prompts, I need it for the assignment, doesn't have to be comprehensive, just the basic jist of what i was doing"*

The AI produced a short summary table of the session.

### 6. Expanding the log

> *"ok expand the log make it longer, use actual prompts in quotation marks, you can spruce it up"*

Which produced the document you're reading now.

---

## What changed in the project

| File | Change |
| ---- | ------ |
| `public/screenshot-reports.png`, `public/screenshot-upload.png` | The two dashboard screenshots, added to the app. |
| `src/App.jsx` | New "Product Preview" section + click-to-expand lightbox logic. |
| `src/App.css` | Styling for the preview cards and the lightbox overlay. |
| `server/start-dev.js` | New zero-dependency runner that starts the frontend and API together. |
| `package.json` | `npm run dev` now runs both; added `dev:web`. |
| `SETUP.md` | Instructions for running the project from a zip. |
| `AI-PROMPT-LOG.md` | This log. |

---

## Reflection — what I took away

- **Vague prompts get questions back.** My first "add these into the website" was ambiguous, and the AI asked what I meant instead of guessing. Being specific up front is faster.
- **It's worth letting the AI check state before acting.** The GitHub detour is the best example — it caught that I was behind the remote and stopped me from doing the wrong thing.
- **Batching related requests works.** I put three separate asks in one message and each was handled and explained in turn.
- **Honesty about limits is useful.** It told me it couldn't fully build in its sandbox and why, rather than pretending everything passed — so I knew to run the final check myself.
