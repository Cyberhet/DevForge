/**
 * Screenshots the pages a pull request touches, so a reviewer can see a UI
 * change without checking the branch out. Run by .github/workflows/screenshots.yml
 * against a production build of the PR, on desktop and phone widths.
 *
 *   BASE_URL   where the built site is running (default http://localhost:3000)
 *   CHANGED    newline-separated list of files the PR changes
 *   OUT_DIR    where to write the PNGs and manifest.json (default ./screenshots)
 *
 * Usage: node .github/scripts/screenshot-pages.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = process.env.OUT_DIR ?? "screenshots";
const MAX_ROUTES = 3;
/** Tall pages are cropped: a reviewer wants the change, not 11,000px of page. */
const MAX_HEIGHT = 3000;

/** Pages worth a look when the change isn't tied to one route (a shared component, a lib). */
const FALLBACK_ROUTES = ["/", "/learn/open-source"];

const VIEWPORTS = [
    { name: "desktop", width: 1280, height: 900 },
    { name: "mobile", width: 390, height: 844 },
];

/**
 * Which routes a set of changed files is about.
 * `app/learn/page.tsx` → `/learn`. Route groups `(marketing)` don't appear in
 * URLs, and a dynamic segment `[slug]` has no single URL, so both are dropped.
 */
export function routesFor(files) {
    const routes = new Set();
    let shared = false;

    for (const file of files) {
        if (!file.startsWith("app/") && !file.startsWith("components/") && !file.startsWith("lib/") && !file.startsWith("data/")) continue;
        const page = file.match(/^app\/(.*)\/?page\.tsx$/);
        if (!page) {
            // A layout, a shared component, a data file: could show up anywhere.
            shared = true;
            continue;
        }
        const segments = page[1]
            .split("/")
            .filter(Boolean)
            .filter((s) => !s.startsWith("(")); // route group, not part of the URL
        if (segments.some((s) => s.startsWith("["))) continue; // dynamic, no single URL
        routes.add("/" + segments.join("/"));
    }

    if (routes.size === 0 && shared) FALLBACK_ROUTES.forEach((r) => routes.add(r));
    return [...routes].slice(0, MAX_ROUTES);
}

function fileName(route, viewport) {
    const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
    return `${slug}-${viewport}.jpg`;
}

async function main() {
    const files = (process.env.CHANGED ?? "").split("\n").map((f) => f.trim()).filter(Boolean);
    const routes = routesFor(files);

    if (routes.length === 0) {
        console.log("No routes to screenshot for these files.");
        await mkdir(OUT_DIR, { recursive: true });
        await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify({ shots: [] }, null, 2));
        return;
    }

    console.log(`Screenshotting: ${routes.join(", ")}`);
    await mkdir(OUT_DIR, { recursive: true });

    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const shots = [];

    for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            deviceScaleFactor: 1,
            // Screenshots of a page mid-animation are noise; this keeps them still.
            reducedMotion: "reduce",
        });
        const page = await context.newPage();

        for (const route of routes) {
            const url = new URL(route, BASE_URL).toString();
            try {
                const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
                await page.waitForTimeout(1200); // let fonts and scroll-in animations settle

                // Grow the viewport to the page (up to a cap) instead of a full-page shot:
                // this site's pages run to 11,000px, which is unreadable in a comment and
                // heavy in a repo. JPEG keeps a screenshot around 200KB instead of 3MB.
                const height = await page.evaluate(() => document.documentElement.scrollHeight);
                await page.setViewportSize({ width: viewport.width, height: Math.min(height, MAX_HEIGHT) });
                await page.waitForTimeout(400);

                const name = fileName(route, viewport.name);
                await page.screenshot({ path: path.join(OUT_DIR, name), type: "jpeg", quality: 80 });
                shots.push({
                    route,
                    viewport: viewport.name,
                    file: name,
                    status: response?.status() ?? 0,
                    cropped: height > MAX_HEIGHT,
                });
                console.log(`  ${route} (${viewport.name}) → ${name} [${response?.status()}]`);
            } catch (error) {
                console.log(`  ${route} (${viewport.name}) failed: ${error.message}`);
                shots.push({ route, viewport: viewport.name, error: String(error.message).slice(0, 200) });
            }
        }
        await context.close();
    }

    await browser.close();
    await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify({ shots }, null, 2));
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
    await main();
}
