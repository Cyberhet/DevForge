import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getMember, getSession } from "@/lib/session";
import { can, canAccessAdminArea } from "@/lib/permissions";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

/**
 * Server-side gate for the whole member app. proxy.ts already redirects
 * anonymous visitors, but it is only a redirect, this is the authorization
 * that actually holds, and it runs before any dashboard page renders.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getSession();
    if (!session) redirect("/login?next=/dashboard");

    const member = await getMember(session.usn);
    if (!member || member.status !== "approved") redirect("/login");

    // Lives outside /dashboard precisely so this redirect can't loop.
    if (member.mustChangePassword) redirect("/change-password");

    return (
        <>
            <DashboardNav elevated={canAccessAdminArea(member)} reviewer={can(member, "journey:review")} />
            {children}
        </>
    );
}
