// Email delivery via Resend. Degrades gracefully: if RESEND_API_KEY is not set
// (e.g. a fresh clone or CI), it logs instead of throwing so the flow still works.
import { Resend } from "resend";

// Treat a missing key OR the ".env.example" placeholder ("re_...") as "not
// configured", so a half-filled .env logs the email instead of throwing an
// "API key is invalid" error from Resend.
const rawKey = process.env.RESEND_API_KEY;
const apiKey = rawKey && !rawKey.includes("...") ? rawKey : null;
const FROM = process.env.EMAIL_FROM || "SecureReport AI <onboarding@resend.dev>";
const CONTACT_INBOX = process.env.CONTACT_INBOX || process.env.EMAIL_FROM;

const client = apiKey ? new Resend(apiKey) : null;

async function send({ to, subject, html }) {
  if (!client) {
    console.warn(`[email] RESEND_API_KEY not configured — would have sent "${subject}" to ${to}`);
    return { skipped: true };
  }
  const { data, error } = await client.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message || "Email send failed.");
  return { id: data?.id };
}

export function sendWelcomeEmail(user) {
  return send({
    to: user.email,
    subject: "Welcome to SecureReport AI",
    html: `<p>Hi ${escapeHtml(user.fullName)},</p>
      <p>Your SecureReport AI account is ready. You can now sign in and start turning
      CCTV footage into incident reports.</p>
      <p>— The SecureReport AI team</p>`,
  });
}

export function sendReceiptEmail(user, transaction) {
  return send({
    to: user.email,
    subject: `Your SecureReport AI receipt (${transaction.plan})`,
    html: `<p>Hi ${escapeHtml(user.fullName)},</p>
      <p>Thanks for subscribing to the <strong>${transaction.plan}</strong> plan
      at $${transaction.amount}/mo.</p>
      <p>Transaction ID: ${transaction.id}</p>`,
  });
}

export function sendContactNotification(submission) {
  return send({
    to: CONTACT_INBOX,
    subject: `New contact enquiry from ${submission.firstName} ${submission.lastName || ""}`.trim(),
    html: `<p><strong>${escapeHtml(submission.firstName)} ${escapeHtml(submission.lastName || "")}</strong>
      (${escapeHtml(submission.email)}) enquired about ${escapeHtml(submission.plan || "n/a")}.</p>
      <p>Company: ${escapeHtml(submission.company || "n/a")}<br/>
      Phone: ${escapeHtml(submission.phone || "n/a")}</p>
      <p>${escapeHtml(submission.message)}</p>`,
  });
}

// Acknowledgement sent TO the person who submitted the contact form (as opposed
// to sendContactNotification, which alerts the business inbox).
export function sendContactConfirmation(submission) {
  return send({
    to: submission.email,
    subject: "We've received your enquiry — SecureReport AI",
    html: `<p>Hi ${escapeHtml(submission.firstName)},</p>
      <p>Thanks for reaching out to SecureReport AI. We've received your message and
      a member of our team will be in touch within 24 hours.</p>
      <p><strong>Your message:</strong><br/>${escapeHtml(submission.message)}</p>
      <p>— The SecureReport AI team</p>`,
  });
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
