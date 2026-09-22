/** Just the fields capability checks read, role as a plain string so both
 *  MemberRecord and lighter actor shapes satisfy it. */
type CapabilityInput = { role: string; councilPosition?: string };

/**
 * Fine-grained capabilities, granted per Executive Council position rather than
 * by a blanket admin role, powers follow the governance document.
 *
 *   members:manage      approve / reject join requests
 *   roles:manage        change a member's access role
 *   sessions:manage     create and manage club sessions
 *   announcements:send  push a notification to all members
 *   projects:manageAny  edit or delete any member's project
 *   journey:review      sign off 10 PR Journey milestones
 */
export type Capability =
    | "members:manage"
    | "roles:manage"
    | "sessions:manage"
    | "announcements:send"
    | "projects:manageAny"
    | "journey:review";

export const ALL_CAPABILITIES: Capability[] = [
    "members:manage",
    "roles:manage",
    "sessions:manage",
    "announcements:send",
    "projects:manageAny",
    "journey:review",
];

/**
 * Council position → capabilities, straight from each role's remit in the
 * governance document. President and Vice President carry everything (the VP
 * acts on the President's behalf). Every position can sign off 10 PR Journey
 * milestones, so the review queue is shared across the whole council instead
 * of waiting on one or two people.
 */
const POSITION_CAPABILITIES: Record<string, Capability[]> = {
    President: ALL_CAPABILITIES,
    "Vice President": ALL_CAPABILITIES,
    "General Secretary": ["announcements:send", "journey:review"],
    Treasurer: ["journey:review"],
    "Membership Lead": ["members:manage", "roles:manage", "journey:review"],
    "Technical Lead": ["sessions:manage", "projects:manageAny", "journey:review"],
    "Community Lead": ["sessions:manage", "announcements:send", "journey:review"],
    "Marketing Lead": ["announcements:send", "journey:review"],
};

/** Baseline for a plain mentor (e.g. an off-roster mentor with no council seat). */
const MENTOR_CAPABILITIES: Capability[] = ["sessions:manage", "projects:manageAny", "journey:review"];

export function capabilitiesFor(member: CapabilityInput): Set<Capability> {
    // The admin role remains the all-powers safety net (the President holds it).
    if (member.role === "admin") return new Set(ALL_CAPABILITIES);

    const caps = new Set<Capability>();
    if (member.role === "mentor") MENTOR_CAPABILITIES.forEach((c) => caps.add(c));
    if (member.councilPosition) {
        (POSITION_CAPABILITIES[member.councilPosition] ?? []).forEach((c) => caps.add(c));
    }
    return caps;
}

export function can(member: CapabilityInput, capability: Capability): boolean {
    return capabilitiesFor(member).has(capability);
}

/** Whether the member has any capability that the /admin area exposes. */
export function canAccessAdminArea(member: CapabilityInput): boolean {
    return can(member, "members:manage") || can(member, "announcements:send");
}

/** Any elevated capability at all, used to decide whether to show admin-ish UI. */
export function isElevated(member: CapabilityInput): boolean {
    return capabilitiesFor(member).size > 0;
}
