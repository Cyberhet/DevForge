import { describe, expect, it } from "vitest";
import { ALL_CAPABILITIES, can, capabilitiesFor } from "./permissions";

describe("capabilitiesFor", () => {
    it("gives admin every capability", () => {
        expect(capabilitiesFor({ role: "admin" })).toEqual(new Set(ALL_CAPABILITIES));
    });

    it("gives a mentor exactly the mentor capability set", () => {
        expect(capabilitiesFor({ role: "mentor" })).toEqual(
            new Set(["sessions:manage", "projects:manageAny", "journey:review"]),
        );
    });

    it("adds a council position's capabilities", () => {
        expect(capabilitiesFor({ role: "member", councilPosition: "Technical Lead" })).toEqual(
            new Set(["sessions:manage", "projects:manageAny", "journey:review"]),
        );
    });

    it("unions mentor and council capabilities", () => {
        expect(capabilitiesFor({ role: "mentor", councilPosition: "Membership Lead" })).toEqual(
            new Set([
                "sessions:manage",
                "projects:manageAny",
                "journey:review",
                "members:manage",
                "roles:manage",
            ]),
        );
    });

    it("gives a plain member no capabilities", () => {
        expect(capabilitiesFor({ role: "member" }).size).toBe(0);
    });

    it("does not throw on an unknown council position and adds nothing", () => {
        expect(() => capabilitiesFor({ role: "member", councilPosition: "Wizard" })).not.toThrow();
        expect(capabilitiesFor({ role: "member", councilPosition: "Wizard" }).size).toBe(0);
    });
});

describe("can", () => {
    it("agrees with capabilitiesFor for every capability", () => {
        const members = [
            { role: "admin" },
            { role: "mentor" },
            { role: "member", councilPosition: "Community Lead" },
            { role: "member" },
        ];

        for (const member of members) {
            const caps = capabilitiesFor(member);
            for (const capability of ALL_CAPABILITIES) {
                expect(can(member, capability)).toBe(caps.has(capability));
            }
        }
    });
});
