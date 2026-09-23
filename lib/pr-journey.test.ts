import { describe, expect, it } from "vitest";
import { checkArena, EvidenceError, isMilestoneUnlocked, validateReflection } from "./pr-journey";

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
describe("checkArena", () => {
    it.each(["workbook", "club"] as const)(
        "allows the DevForge organization for the %s arena, regardless of case",
        (arena) => {
            expect(() => checkArena("NST-DEVFORGE", arena)).not.toThrow();
            expect(() => checkArena("nst-devforge", arena)).not.toThrow();
            expect(() => checkArena("NsT-DeVfOrGe", arena)).not.toThrow();
        },
    );

    it.each(["workbook", "club"] as const)(
        "rejects a different organization for the %s arena",
        (arena) => {
            expect(() => checkArena("unrelated-org", arena)).toThrow(EvidenceError);
        },
    );

    it("rejects the DevForge organization for the external arena", () => {
        expect(() => checkArena("NST-DEVFORGE", "external")).toThrow(EvidenceError);
        expect(() => checkArena("nst-devforge", "external")).toThrow(EvidenceError);
    });

    it("rejects the member's own GitHub account, regardless of case", () => {
        expect(() =>
            checkArena("Jaydeep83721-Dev", "external", "jaydeep83721-dev"),
        ).toThrow(EvidenceError);
    });

    it("allows an unrelated organization for the external arena", () => {
        expect(() =>
            checkArena("unrelated-org", "external", "jaydeep83721-dev"),
        ).not.toThrow();
    });
});
