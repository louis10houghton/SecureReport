// GET /api/auth/me — return the authenticated user + subscription. Protected.
import { createHandler, sendJson } from "../_lib/http.js";
import { prisma } from "../_lib/prisma.js";
import { getAuth } from "../_lib/auth.js";

export default createHandler("GET", async (req, res) => {
  const claims = getAuth(req);
  if (!claims) {
    return sendJson(res, 401, { error: "Authentication required." });
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      company: true,
      role: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
    },
  });

  if (!user) {
    return sendJson(res, 404, { error: "User not found." });
  }
  return sendJson(res, 200, { user });
});
