type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
  reasons?: unknown;
};

export const LEAKED_PASSWORD_MESSAGE =
  "That password has appeared in a known data breach. Choose a unique password you have not used elsewhere.";

export const LEAKED_PASSWORD_NOTICE =
  "Your current password has appeared in a known data breach. Replace it with a unique password now to keep your account secure.";

function errorDetails(error: unknown): AuthErrorLike {
  return typeof error === "object" && error !== null ? (error as AuthErrorLike) : {};
}

function hasReason(error: unknown, reason: string): boolean {
  const { reasons } = errorDetails(error);
  return Array.isArray(reasons) && reasons.includes(reason);
}

export function hasLeakedPasswordWarning(value: unknown): boolean {
  return hasReason(value, "pwned");
}

export function authErrorMessage(error: unknown, action: "signin" | "signup" | "update"): string {
  const details = errorDetails(error);
  const code = typeof details.code === "string" ? details.code : "";

  if (code === "weak_password" || hasReason(error, "length") || hasReason(error, "characters") || hasReason(error, "pwned")) {
    if (hasReason(error, "pwned")) return LEAKED_PASSWORD_MESSAGE;
    return "Choose a stronger password with at least 8 characters, including a mix of letters, numbers, and symbols.";
  }
  if (code === "invalid_credentials") return "The email or password is incorrect.";
  if (code === "email_exists" || code === "user_already_exists") return "An account already exists for this email. Try signing in instead.";
  if (code === "email_address_invalid") return "Enter a valid email address.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") return "Too many attempts. Wait a few minutes, then try again.";

  if (action === "signin") return "We could not sign you in. Check your details and try again.";
  if (action === "signup") return "We could not create your account. Please try again.";
  return "We could not update your password. Please try again.";
}
