// Authentication helpers: password hashing (bcrypt) and stateless JWT sessions.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Pulls a bearer token off the Authorization header and returns its payload,
// or null if missing/invalid. Route handlers use this to gate protected data.
export function getAuth(req) {
  const header = req.headers?.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return verifyToken(token);
}

// True when JWT_SECRET has not been configured — surfaced in health checks so
// you never accidentally deploy with the insecure default.
export function isUsingInsecureSecret() {
  return !process.env.JWT_SECRET;
}
