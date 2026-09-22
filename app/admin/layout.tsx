import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

/**
 * /admin sits outside the /dashboard segment, so it needs the member-app nav
 * of its own. Authorization stays in the page itself, which reads the live
 * member record rather than trusting the token's role.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <>
            {/* /admin is only reachable by elevated users (proxy + page guard), all of whom can sign off journey milestones. */}
            <DashboardNav elevated reviewer />
            {children}
        </>
    );
}
