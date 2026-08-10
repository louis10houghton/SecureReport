// Single Prisma client, reused across serverless invocations.
// In serverless/dev environments modules are cached between calls, so we stash
// the client on globalThis to avoid opening a new connection pool every time.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__securereportPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__securereportPrisma = prisma;
}
