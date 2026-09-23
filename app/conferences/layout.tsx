import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Conferences",
    description:
        "Explore the international conferences where DevForge members share their work and connect with open-source communities.",
    alternates: {
        canonical: "/conferences",
    },
};

export default function ConferencesLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}