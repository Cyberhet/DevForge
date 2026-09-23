import { describe, expect, it } from "vitest";
import { normalizeLinkedin } from "./members";

describe("normalizeLinkedin", () => {
    it("passes an https:// URL through unchanged", () => {
        expect(normalizeLinkedin("https://linkedin.com/in/x")).toBe("https://linkedin.com/in/x");
    });

    it("passes an http:// URL through unchanged", () => {
        expect(normalizeLinkedin("http://linkedin.com/in/x")).toBe("http://linkedin.com/in/x");
    });

    it("adds https:// to a bare domain", () => {
        expect(normalizeLinkedin("linkedin.com/in/x")).toBe("https://linkedin.com/in/x");
    });

    it("strips a single leading slash before adding the scheme", () => {
        expect(normalizeLinkedin("/linkedin.com/in/x")).toBe("https://linkedin.com/in/x");
    });

    it("strips multiple leading slashes before adding the scheme", () => {
        expect(normalizeLinkedin("///linkedin.com/in/x")).toBe("https://linkedin.com/in/x");
    });

    it("trims surrounding whitespace", () => {
        expect(normalizeLinkedin("  linkedin.com/in/x  ")).toBe("https://linkedin.com/in/x");
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["empty string", ""],
        ["whitespace only", "   "],
    ])("returns undefined for %s", (_, input) => {
        expect(normalizeLinkedin(input)).toBeUndefined();
    });
});
