// Small helpers shared by every serverless function: CORS, JSON body parsing,
// method guarding, and consistent JSON responses.

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";

export function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Returns true when the request was a preflight and has been handled.
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

// Vercel parses JSON bodies automatically, but the local dev harness and raw
// Node requests may not. This normalises both cases.
export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

// Wraps a handler with CORS + method check + error catching so each route
// file stays focused on its own logic.
export function createHandler(methods, handler) {
  const allowed = Array.isArray(methods) ? methods : [methods];
  return async (req, res) => {
    if (applyCors(req, res)) return;
    if (!allowed.includes(req.method)) {
      return sendJson(res, 405, { error: `Method ${req.method} not allowed.` });
    }
    try {
      await handler(req, res);
    } catch (err) {
      console.error("[api error]", err);
      if (!res.writableEnded) {
        sendJson(res, 500, { error: "Internal server error." });
      }
    }
  };
}
