// GET /api/transactions/:id — fetch a persisted transaction record.
import { createHandler, sendJson } from "../_lib/http.js";
import { prisma } from "../_lib/prisma.js";

export default createHandler("GET", async (req, res) => {
  // Vercel populates req.query.id; the dev harness passes it through too.
  const id = req.query?.id;
  if (!id) {
    return sendJson(res, 400, { error: "Transaction id is required." });
  }

  const record = await prisma.transaction.findUnique({ where: { id } });
  if (!record) {
    return sendJson(res, 404, { error: "Transaction not found." });
  }
  return sendJson(res, 200, record);
});
