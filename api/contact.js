// POST /api/contact — persist a contact enquiry and notify the inbox.
// Replaces the old client-side alert() with real storage + email.
import { createHandler, readJsonBody, sendJson } from "./_lib/http.js";
import { prisma } from "./_lib/prisma.js";
import { isValidEmail } from "./_lib/validation.js";
import { sendContactNotification } from "./_lib/email.js";

export default createHandler("POST", async (req, res) => {
  const body = await readJsonBody(req);
  // Accept both the landing-form field names (fname/lname) and generic ones.
  const firstName = body.firstName ?? body.fname;
  const lastName = body.lastName ?? body.lname;
  const { email, company, phone, plan, message } = body;

  if (!firstName || typeof firstName !== "string") {
    return sendJson(res, 400, { error: "First name is required." });
  }
  if (!isValidEmail(email)) {
    return sendJson(res, 400, { error: "A valid email is required." });
  }
  if (!message || typeof message !== "string") {
    return sendJson(res, 400, { error: "A message is required." });
  }

  const submission = await prisma.contactSubmission.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      email: email.toLowerCase().trim(),
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      plan: plan?.trim() || null,
      message: message.trim(),
    },
  });

  sendContactNotification(submission).catch((err) => console.error("[contact email]", err));

  return sendJson(res, 201, { ok: true, id: submission.id, message: "Thanks — we'll be in touch within 24 hours." });
});
