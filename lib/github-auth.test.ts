import { describe, expect, it } from "vitest";
import { authorizeUrl, callbackUrl, safeNext, statesMatch } from "./github-auth";

describe("safeNext", () => {
    it("keeps same-site paths", () => {
        expect(safeNext("/dashboard/journey")).toBe("/dashboard/journey");
        expect(safeNext("/learn/open-source?m=3#top")).toBe("/learn/open-source?m=3#top");
    });

    it("falls back when there is nothing to use", () => {
        expect(safeNext(null)).toBe("/learn/open-source");
        expect(safeNext(undefined, "/home")).toBe("/home");
        expect(safeNext("")).toBe("/learn/open-source");
    });

    it.each([
        ["absolute URL", "https://evil.com"],
        ["protocol-relative", "//evil.com"],
        ["backslash trick", "/\\evil.com"],
        ["tab smuggled between slashes", "/\t/evil.com"],
        ["newline smuggled between slashes", "/\n/evil.com"],
        ["relative path", "dashboard"],
    ])("rejects %s", (_, input) => {
        expect(safeNext(input)).toBe("/learn/open-source");
    });
});

describe("statesMatch", () => {
    it("matches identical states", () => {
        expect(statesMatch("abc123", "abc123")).toBe(true);
    });

    it("rejects different or missing states", () => {
        expect(statesMatch("abc123", "abc124")).toBe(false);
        expect(statesMatch("abc123", "abc")).toBe(false);
        expect(statesMatch(undefined, "abc123")).toBe(false);
        expect(statesMatch("abc123", null)).toBe(false);
    });
});

describe("callbackUrl", () => {
    it("builds the GitHub callback URL from origin", () => {
        expect(callbackUrl("https://www.devforge.club")).toBe("https://www.devforge.club/api/auth/github/callback");
    });

    it("does not double up trailing slashes", () => {
        expect(callbackUrl("https://www.devforge.club/")).toBe("https://www.devforge.club/api/auth/github/callback");
    });

    it("works with local development origins", () => {
        expect(callbackUrl("http://localhost:3000")).toBe("http://localhost:3000/api/auth/github/callback");
        expect(callbackUrl("http://localhost:3000/")).toBe("http://localhost:3000/api/auth/github/callback");
    });
});

describe("authorizeUrl", () => {
    it("points at github.com/login/oauth/authorize with required parameters", () => {
        const clientId = "client-123";
        const state = "state-xyz";
        const redirectUri = "https://www.devforge.club/api/auth/github/callback";

        const raw = authorizeUrl(clientId, state, redirectUri);
        const parsed = new URL(raw);

        expect(parsed.origin).toBe("https://github.com");
        expect(parsed.pathname).toBe("/login/oauth/authorize");
        expect(parsed.searchParams.get("client_id")).toBe(clientId);
        expect(parsed.searchParams.get("redirect_uri")).toBe(redirectUri);
        expect(parsed.searchParams.get("state")).toBe(state);
        expect(parsed.searchParams.get("allow_signup")).toBe("true");
    });

    it("does not request any OAuth scope", () => {
        const raw = authorizeUrl("client-123", "state-xyz", "https://example.com/callback");
        const parsed = new URL(raw);

        expect(parsed.searchParams.has("scope")).toBe(false);
        expect(parsed.searchParams.get("scope")).toBeNull();
    });
});

