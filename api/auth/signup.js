// POST /api/auth/signup — create an account, return a JWT.
import { createHandler, readJsonBody, sendJson } from "../_lib/http.js";
import { prisma } from "../_lib/prisma.js";
import { hashPassword, signToken } from "../_lib/auth.js";
import { isValidEmail, validatePassword } from "../_lib/validation.js";
import { sendWelcomeEmail } from "../_lib/email.js";

export default createHandler("POST", async (req, res) => {
  const body = await readJsonBody(req);
  const { email, password, fullName, company } = body;

  if (!isValidEmail(email)) {
    return sendJson(res, 400, { error: "A valid email is required." });
  }
  const pw = validatePassword(password);
  if (!pw.valid) {
    return sendJson(res, 400, { error: pw.reason });
  }
  if (!fullName || typeof fullName !== "string") {
    return sendJson(res, 400, { error: "Full name is required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return sendJson(res, 409, { error: "An account with this email already exists." });
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      fullName: fullName.trim(),
      company: company?.trim() || null,
    },
  });

  // Fire-and-forget welcome email; never block signup on delivery.
  sendWelcomeEmail(user).catch((err) => console.error("[signup email]", err));

  const token = signToken(user);
  return sendJson(res, 201, {
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName, company: user.company },
  });
});
