"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    LayoutGrid,
    FolderGit2,
    Compass,
    CalendarCheck,
    Users,
    Trophy,
    ShieldCheck,
    ClipboardCheck,
    Menu,
    X,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface NavLink {
    name: string;
    href: string;
    icon: React.ReactNode;
    elevated?: boolean;
    /** Only for members who can sign off 10 PR Journey milestones. */
    reviewer?: boolean;
}

const LINKS: NavLink[] = [
    { name: "Overview", href: "/dashboard", icon: <LayoutGrid size={18} /> },
    { name: "Projects", href: "/dashboard/projects", icon: <FolderGit2 size={18} /> },
    { name: "Explore", href: "/dashboard/explore", icon: <Compass size={18} /> },
    { name: "Sessions", href: "/dashboard/events", icon: <CalendarCheck size={18} /> },
    { name: "Members", href: "/dashboard/members", icon: <Users size={18} /> },
    { name: "Leaderboard", href: "/dashboard/leaderboard", icon: <Trophy size={18} /> },
    { name: "Sign-offs", href: "/dashboard/journey", icon: <ClipboardCheck size={18} />, reviewer: true },
    { name: "Admin", href: "/admin", icon: <ShieldCheck size={18} />, elevated: true },
];

/**
 * The member app's own top bar. Replaces the public marketing navbar once
 * signed in. `elevated` comes from the server layout (which already reads the
 * member) rather than a client fetch, one fewer round-trip per navigation.
 *
 * Desktop shows a pill row; below `lg` it collapses to a hamburger, since seven
 * links scrolling sideways on a phone read as clutter.
 */
export function DashboardNav({ elevated = false, reviewer = false }: { elevated?: boolean; reviewer?: boolean }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const links = LINKS.filter((link) => (!link.elevated || elevated) && (!link.reviewer || reviewer));

    const isActive = (href: string) =>
        href === "/dashboard" ? pathname === href : pathname.startsWith(href);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 py-3 sm:py-4">
            <div className="max-w-6xl mx-auto px-4">
                <div className="glass !rounded-2xl border border-white/10 px-3 py-2 flex items-center gap-2">
                    <Link href="/dashboard" className="flex items-center gap-2 group shrink-0 pl-1 pr-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt=""
                            className="w-8 h-8 object-contain [filter:hue-rotate(160deg)_saturate(1.2)]"
                        />
                        <span className="text-lg font-bold tracking-tight text-white">
                            Dev<span className="text-cyan-400">Forge</span>
                        </span>
                    </Link>

                    {/* Desktop pill row */}
                    <nav aria-label="Member app" className="hidden lg:flex items-center gap-1 flex-1 min-w-0">
                        {links.map((link) => {
                            const active = isActive(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={active ? "page" : undefined}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                        active
                                            ? "bg-cyan-400/15 text-cyan-300"
                                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    {link.icon}
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
                        <ThemeSwitcher />
                        <div className="hidden lg:block">
                            <SignOutButton />
                        </div>
                        <button
                            onClick={() => setOpen((v) => !v)}
                            className="lg:hidden glass-subtle hover:border-cyan-400/40 text-neutral-200 rounded-full p-2 transition-colors"
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                        >
                            {open ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu, opaque (var background, not translucent glass) so
                    the page content behind it doesn't bleed through. */}
                <AnimatePresence>
                    {open && (
                            <>
                                {/* Scrim (fixed, above page content) dims + closes on tap. */}
                                <motion.button
                                    aria-label="Close menu"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setOpen(false)}
                                    className="lg:hidden fixed inset-0 z-40 bg-black/70 cursor-default"
                                />
                                {/* Fixed + high z so it clears the page's stacking contexts.
                                    Only the slide is animated, never opacity, a throttled
                                    animation frame could otherwise freeze the panel
                                    half-transparent and let the page bleed through. */}
                                <motion.nav
                                    aria-label="Member app"
                                    initial={{ y: -8 }}
                                    animate={{ y: 0 }}
                                    exit={{ y: -8 }}
                                    transition={{ duration: 0.18 }}
                                    className="lg:hidden fixed left-4 right-4 top-[68px] z-50"
                                >
                                    <div
                                        style={{ background: "var(--bg-secondary)" }}
                                        className="max-w-6xl mx-auto rounded-2xl border border-white/10 shadow-2xl p-2"
                                    >
                                        {links.map((link) => {
                                            const active = isActive(link.href);
                                            return (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={() => setOpen(false)}
                                                    aria-current={active ? "page" : undefined}
                                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                                                        active
                                                            ? "bg-cyan-400/15 text-cyan-300"
                                                            : "text-neutral-300 hover:text-white hover:bg-white/5"
                                                    }`}
                                                >
                                                    {link.icon}
                                                    <span>{link.name}</span>
                                                </Link>
                                            );
                                        })}
                                        <div className="border-t border-white/10 mt-2 pt-2 px-1">
                                            <SignOutButton />
                                        </div>
                                    </div>
                                </motion.nav>
                            </>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}
