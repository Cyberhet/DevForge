import { describe, expect, it } from "vitest";
import { checkAuthor, checkKind, EvidenceError } from "./pr-journey";
import type { EvidenceRule } from "./pr-journey";

describe("checkKind", () => {
    it("passes on a match", () => {
        const prRule: EvidenceRule = { kind: "pr", author: "self", arena: "external" };
        expect(() => checkKind("pr", prRule)).not.toThrow();

        const issueRule: EvidenceRule = { kind: "issue", author: "self", arena: "external" };
        expect(() => checkKind("issue", issueRule)).not.toThrow();
    });

    it("throws EvidenceError on a mismatch in both directions", () => {
        const prRule: EvidenceRule = { kind: "pr", author: "self", arena: "external" };
        expect(() => checkKind("issue", prRule)).toThrow(EvidenceError);

        const issueRule: EvidenceRule = { kind: "issue", author: "self", arena: "external" };
        expect(() => checkKind("pr", issueRule)).toThrow(EvidenceError);
    });
});

describe("checkAuthor", () => {
    it("accepts the member's login (case-insensitive via id matching) and rejects others when author is 'self'", () => {
        const rule: EvidenceRule = { kind: "pr", author: "self", arena: "external" };
        const me = { login: "MyUsername", id: 12345 };

        // Exact match
        expect(() => checkAuthor({ login: "MyUsername", id: 12345 }, rule, me)).not.toThrow();

        // Case-insensitive/login change (as long as GitHub ID matches)
        expect(() => checkAuthor({ login: "myusername", id: 12345 }, rule, me)).not.toThrow();

        // Rejects others (different ID)
        expect(() => checkAuthor({ login: "SomeoneElse", id: 99999 }, rule, me)).toThrow(EvidenceError);
    });

    it("rejects the member's own PR when author is 'other'", () => {
        const rule: EvidenceRule = { kind: "pr", author: "other", arena: "external" };
        const me = { login: "MyUsername", id: 12345 };

        // Should accept someone else's PR
        expect(() => checkAuthor({ login: "SomeoneElse", id: 99999 }, rule, me)).not.toThrow();

        // Should reject my own PR
        expect(() => checkAuthor({ login: "MyUsername", id: 12345 }, rule, me)).toThrow(EvidenceError);
    });
});
