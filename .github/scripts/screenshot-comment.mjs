/**
 * Builds the screenshot comment, and posts it as one comment that updates
 * itself on each push. Used by .github/workflows/screenshots-comment.yml.
 *
 * This file never runs code from the pull request: it only reads the images
 * the build job produced and writes a comment.
 */
const MARKER = "<!-- screenshot-bot -->";

/** The comment body. Pure, so it can be tested without GitHub. */
export function buildComment({ shots, rawBase, runUrl }) {
    const ok = shots.filter((s) => s.file);
    const failed = shots.filter((s) => s.error);

    if (ok.length === 0 && failed.length === 0) {
        return `${MARKER}\nNo pages to screenshot for this change.`;
    }

    const routes = [...new Set(ok.map((s) => s.route))];
    const lines = [
        MARKER,
        "## 📸 How this looks",
        "",
        "Built from this PR, so you can see the change without checking it out.",
        "",
    ];

    for (const route of routes) {
        const desktop = ok.find((s) => s.route === route && s.viewport === "desktop");
        const mobile = ok.find((s) => s.route === route && s.viewport === "mobile");
        const status = (desktop ?? mobile)?.status;

        lines.push(`### \`${route}\`${status && status >= 400 ? ` — ⚠️ returned HTTP ${status}` : ""}`);
        lines.push("");
        if (desktop) {
            lines.push(`<details open><summary>Desktop (1280px)${desktop.cropped ? ", top 3000px" : ""}</summary>`, "");
            lines.push(`<img src="${rawBase}/${desktop.file}" width="900">`, "", "</details>", "");
        }
        if (mobile) {
            lines.push(`<details><summary>Mobile (390px)${mobile.cropped ? ", top 3000px" : ""}</summary>`, "");
            lines.push(`<img src="${rawBase}/${mobile.file}" width="320">`, "", "</details>", "");
        }
    }

    if (failed.length > 0) {
        lines.push("### Couldn't capture", "");
        for (const f of failed) lines.push(`- \`${f.route}\` (${f.viewport}): ${f.error}`);
        lines.push("");
    }

    lines.push(
        "<sub>Screenshots are taken from a production build of this PR, signed out. " +
            `Pages behind sign-in show the signed-out view. [Build log](${runUrl})</sub>`,
    );
    return lines.join("\n");
}

/** Posts or updates the bot's single comment on the PR. */
export async function postComment({ github, owner, repo, issue_number, body }) {
    const comments = await github.paginate(github.rest.issues.listComments, {
        owner,
        repo,
        issue_number,
        per_page: 100,
    });
    const mine = comments.find((c) => c.user.type === "Bot" && c.body.includes(MARKER));
    if (mine) await github.rest.issues.updateComment({ owner, repo, comment_id: mine.id, body });
    else await github.rest.issues.createComment({ owner, repo, issue_number, body });
}
