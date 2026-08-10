// POST /api/auth/login — verify credentials, return a JWT.
import { createHandler, readJsonBody, sendJson } from "../_lib/http.js";
import { prisma } from "../_lib/prisma.js";
import { verifyPassword, signToken } from "../_lib/auth.js";
import { isValidEmail } from "../_lib/validation.js";

export default createHandler("POST", async (req, res) => {
  const body = await readJsonBody(req);
  const { email, password } = body;

  if (!isValidEmail(email) || !password) {
    return sendJson(res, 400, { error: "Email and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  // Same response whether the user is missing or the password is wrong, to avoid
  // leaking which emails have accounts.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return sendJson(res, 401, { error: "Invalid email or password." });
  }

  const token = signToken(user);
  return sendJson(res, 200, {
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName, company: user.company },
  });
});
