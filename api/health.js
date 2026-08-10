// GET /api/health — liveness + config sanity for the demo.
import { createHandler, sendJson } from "./_lib/http.js";
import { isUsingInsecureSecret } from "./_lib/auth.js";
import { stripeEnabled } from "./_lib/stripe.js";

export default createHandler("GET", async (_req, res) => {
  sendJson(res, 200, {
    ok: true,
    service: "securereport-api",
    time: new Date().toISOString(),
    config: {
      database: Boolean(process.env.DATABASE_URL),
      stripe: stripeEnabled,
      email: Boolean(process.env.RESEND_API_KEY),
      jwtSecretConfigured: !isUsingInsecureSecret(),
    },
  });
});
