import { describe, expect, it } from "vitest";
import {
  LEAKED_PASSWORD_MESSAGE,
  authErrorMessage,
  hasLeakedPasswordWarning,
} from "@/lib/auth/messages";

describe("auth error messages", () => {
  it("turns Supabase leaked-password errors into actionable, provider-neutral copy", () => {
    const error = { code: "weak_password", reasons: ["pwned"], message: "provider detail" };
    expect(authErrorMessage(error, "signup")).toBe(LEAKED_PASSWORD_MESSAGE);
    expect(authErrorMessage(error, "signup")).not.toContain("provider detail");
  });

  it("recognizes the weak-password warning returned after a successful sign-in", () => {
    expect(hasLeakedPasswordWarning({ reasons: ["pwned"], message: "warning" })).toBe(true);
    expect(hasLeakedPasswordWarning({ reasons: ["length"] })).toBe(false);
  });

  it("uses safe messages for credentials, rate limits, and unknown provider failures", () => {
    expect(authErrorMessage({ code: "invalid_credentials" }, "signin")).toBe("The email or password is incorrect.");
    expect(authErrorMessage({ code: "over_request_rate_limit" }, "signin")).toContain("Wait a few minutes");
    expect(authErrorMessage(new Error("internal provider detail"), "signin")).not.toContain("internal provider detail");
  });
});
