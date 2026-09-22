import { describe, expect, it } from "vitest";
import { EvidenceError, checkAuthor, checkKind, isMilestoneUnlocked, validateReflection } from "./pr-journey";

function words(n: number): string {
    return Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
}

function reflection(over: Partial<Record<"tried" | "broke" | "differently", number>> = {}) {
    return {
        tried: words(over.tried ?? 5),
        broke: words(over.broke ?? 5),
        reviewerSaid: "The reviewer asked for a smaller diff.",
        differently: words(over.differently ?? 5),
        hours: 2,
        rounds: 1,
        status: "open" as const,
    };
}

describe("validateReflection", () => {
    it("names the field that is over its word cap", () => {
        const cases = [
            { field: "tried" as const, count: 101, label: "What I tried", cap: 100 },
            { field: "broke" as const, count: 101, label: "What broke", cap: 100 },
            { field: "differently" as const, count: 61, label: "What I would do differently", cap: 60 },
        ];

        for (const { field, count, label, cap } of cases) {
            expect(() => validateReflection(reflection({ [field]: count }))).toThrow(
                new EvidenceError(`"${label}" is capped at ${cap} words — yours is ${count}. Cut it down.`),
            );
        }
    });
});

describe("isMilestoneUnlocked", () => {
    it("always opens milestone 1", () => {
        expect(isMilestoneUnlocked({}, 1)).toBe(true);
    });

    it("opens the next milestone once the previous one is submitted or signed off", () => {
        expect(isMilestoneUnlocked({ "1": { state: "submitted" } }, 2)).toBe(true);
        expect(isMilestoneUnlocked({ "1": { state: "signed-off" } }, 2)).toBe(true);
    });

    it("keeps it closed when the previous one is missing or was sent back", () => {
        expect(isMilestoneUnlocked({}, 2)).toBe(false);
        expect(isMilestoneUnlocked({ "1": { state: "changes-requested" } }, 2)).toBe(false);
        expect(isMilestoneUnlocked({ "1": { state: "submitted" } }, 3)).toBe(false);
    });
});

describe("checkAuthor", () => {
    const selfRule = { kind: "pr", author: "self", arena: "club" } as const;
    const otherRule = { kind: "pr", author: "other", arena: "club" } as const;

    it("allows evidence from the signed-in GitHub id when the rule requires self", () => {
        expect(() =>
            checkAuthor({ login: "old-name", id: 1 }, selfRule, { login: "new-name", id: 1 }),
        ).not.toThrow();
    });

    it("rejects someone else's evidence when the rule requires self", () => {
        expect(() =>
            checkAuthor({ login: "other", id: 2 }, selfRule, { login: "me", id: 1 }),
        ).toThrow(EvidenceError);
    });

    it("allows someone else's evidence when the rule requires other", () => {
        expect(() =>
            checkAuthor({ login: "other", id: 2 }, otherRule, { login: "me", id: 1 }),
        ).not.toThrow();
    });

    it("rejects the signed-in user's evidence when the rule requires other", () => {
        expect(() =>
            checkAuthor({ login: "me", id: 1 }, otherRule, { login: "me", id: 1 }),
        ).toThrow(EvidenceError);
    });
});

describe("checkKind", () => {
    const prRule = { kind: "pr", author: "self", arena: "club" } as const;
    const issueRule = { kind: "issue", author: "self", arena: "club" } as const;

    it("allows the evidence kind required by the rule", () => {
        expect(() => checkKind("pr", prRule)).not.toThrow();
        expect(() => checkKind("issue", issueRule)).not.toThrow();
    });

    it("rejects pull request evidence when the rule requires an issue", () => {
        expect(() => checkKind("pr", issueRule)).toThrow(EvidenceError);
    });

    it("rejects issue evidence when the rule requires a pull request", () => {
        expect(() => checkKind("issue", prRule)).toThrow(EvidenceError);
    });
});
