// Pure validation helpers (no I/O) so they're easy to unit test.

export const PLAN_PRICING = {
  Starter: 49,
  Professional: 99,
  Business: 199,
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}

export function isValidPlan(plan) {
  return Object.prototype.hasOwnProperty.call(PLAN_PRICING, plan);
}

// Luhn checksum — validates card number format before we ever hand off to Stripe.
export function luhnCheck(input) {
  const digits = String(input || "").replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number.parseInt(digits[i], 10);
    if (shouldDouble) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    shouldDouble = !shouldDouble;
  }
  return digits.length >= 12 && sum % 10 === 0;
}

// Returns { valid, reason } for an MM/YY expiry that must be in the future.
export function validateExpiry(expiry) {
  const value = String(expiry || "").trim();
  if (!/^\d{2}\/\d{2}$/.test(value)) {
    return { valid: false, reason: "Expiry must use MM/YY format." };
  }
  const [monthText, yearText] = value.split("/");
  const month = Number.parseInt(monthText, 10);
  const year = Number.parseInt(`20${yearText}`, 10);
  if (Number.isNaN(month) || month < 1 || month > 12) {
    return { valid: false, reason: "Card expiry month is invalid." };
  }
  // Card is valid through the end of its expiry month.
  const endOfMonth = new Date(year, month, 1);
  if (endOfMonth <= new Date()) {
    return { valid: false, reason: "Card expiry is in the past." };
  }
  return { valid: true };
}

export function cardBrand(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

// Password rule for signup — kept deliberately simple for the MVP.
export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return { valid: false, reason: "Password must be at least 8 characters." };
  }
  return { valid: true };
}
