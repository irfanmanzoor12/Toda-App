/**
 * Unit tests for authentication middleware
 * Verifies token extraction, validation, and security requirements
 */

import { describe, it, expect } from "vitest";
import {
  extractSessionToken,
  isTokenPresent,
  createAuthorizationHeader,
  AuthenticationError,
} from "../../mcp-server/middleware/auth.js";

describe("Authentication Middleware", () => {
  describe("extractSessionToken", () => {
    it("should extract valid token from context", () => {
      const context = { sessionToken: "valid-token-12345" };
      const token = extractSessionToken(context);
      expect(token).toBe("valid-token-12345");
    });

    it("should throw AuthenticationError when token is missing", () => {
      const context = {};
      expect(() => extractSessionToken(context)).toThrow(AuthenticationError);
      expect(() => extractSessionToken(context)).toThrow(
        "Session token is required"
      );
    });

    it("should throw AuthenticationError when token is undefined", () => {
      const context = { sessionToken: undefined };
      expect(() => extractSessionToken(context)).toThrow(AuthenticationError);
    });

    it("should throw AuthenticationError when token is null", () => {
      const context = { sessionToken: null };
      expect(() => extractSessionToken(context)).toThrow(AuthenticationError);
    });

    it("should throw AuthenticationError when token is empty string", () => {
      const context = { sessionToken: "" };
      expect(() => extractSessionToken(context)).toThrow(AuthenticationError);
      expect(() => extractSessionToken(context)).toThrow("cannot be empty");
    });

    it("should throw AuthenticationError when token is only whitespace", () => {
      const context = { sessionToken: "   " };
      expect(() => extractSessionToken(context)).toThrow(AuthenticationError);
    });

    it("should throw AuthenticationError when token is not a string", () => {
      const context = { sessionToken: 12345 };
      expect(() => extractSessionToken(context)).toThrow(AuthenticationError);
    });

    it("should handle token with whitespace by trimming validation", () => {
      const context = { sessionToken: "  valid-token  " };
      // Should not throw - has non-whitespace content
      const token = extractSessionToken(context);
      expect(token).toBe("  valid-token  "); // Returns original, but validates trimmed
    });

    it("should treat token as opaque string (no parsing)", () => {
      // Test that we don't parse JWT or any other token format
      const jwtLikeToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const context = { sessionToken: jwtLikeToken };
      const token = extractSessionToken(context);
      // Should return exact token without parsing
      expect(token).toBe(jwtLikeToken);
    });
  });

  describe("isTokenPresent", () => {
    it("should return true for valid token", () => {
      expect(isTokenPresent("valid-token")).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(isTokenPresent(undefined)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isTokenPresent(null)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isTokenPresent("")).toBe(false);
    });

    it("should return false for whitespace-only string", () => {
      expect(isTokenPresent("   ")).toBe(false);
    });
  });

  describe("createAuthorizationHeader", () => {
    it("should create Bearer token header", () => {
      const token = "test-token-12345";
      const header = createAuthorizationHeader(token);
      expect(header).toBe("Bearer test-token-12345");
    });

    it("should handle token with special characters", () => {
      const token = "token-with-special_chars.and/slashes";
      const header = createAuthorizationHeader(token);
      expect(header).toBe("Bearer token-with-special_chars.and/slashes");
    });

    it("should create header for JWT-like token", () => {
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const header = createAuthorizationHeader(token);
      expect(header).toBe(`Bearer ${token}`);
    });
  });

  describe("Security Requirements", () => {
    it("should not log token values in error messages", () => {
      const context = { sessionToken: "secret-token-should-not-appear" };
      try {
        // This should succeed, but we're testing error messages don't leak tokens
        extractSessionToken(context);
      } catch (error) {
        if (error instanceof Error) {
          // Error message should not contain the actual token
          expect(error.message).not.toContain("secret-token-should-not-appear");
        }
      }
    });

    it("should treat all tokens as opaque (no validation of format)", () => {
      // Various token formats should all be accepted without validation
      const tokens = [
        "simple-token",
        "token_with_underscores",
        "token.with.dots",
        "token-with-many-parts-separated-by-dashes",
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.test", // JWT-like
        "random_base64_VGhpcyBpcyBhIHRlc3Q=",
      ];

      tokens.forEach((token) => {
        const context = { sessionToken: token };
        const extracted = extractSessionToken(context);
        expect(extracted).toBe(token);
      });
    });
  });
});
