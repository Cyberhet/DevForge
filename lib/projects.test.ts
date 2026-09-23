import { describe, expect, it } from "vitest";
import { slugify } from "./projects";

describe("slugify", () => {
    it("lowercases and hyphenates spaces", () => {
        expect(slugify("My Cool App")).toBe("my-cool-app");
    });

    it("strips accents", () => {
        expect(slugify("Café Résumé")).toBe("cafe-resume");
    });

    it("collapses leading, trailing and repeated separators", () => {
        expect(slugify("  --Hello__World--  ")).toBe("hello-world");
        expect(slugify("a   b---c")).toBe("a-b-c");
    });

    it("caps the result at 60 characters", () => {
        const slug = slugify("x".repeat(80));
        expect(slug).toHaveLength(60);
    });

    it("falls back to 'project' for empty or all-symbol titles", () => {
        expect(slugify("")).toBe("project");
        expect(slugify("   ")).toBe("project");
        expect(slugify("!!!@@@###")).toBe("project");
    });
});
