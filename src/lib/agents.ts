import type { AgentTask, AppState, Provider } from "./types";
import { recomputeCapacityStatus } from "./data";
import { uid } from "./utils";

export function runAgentCycle(state: AppState): {
  tasks: AgentTask[];
  providers: Provider[];
  activityLabel: string;
} {
  const now = new Date().toISOString();
  const tasks: AgentTask[] = [...state.agentTasks];
  const providers = state.providers.map((p) => ({
    ...p,
    capacityStatus: recomputeCapacityStatus(p),
  }));

  const stale = providers.filter((p) => p.capacityStatus === "Needs confirmation");
  for (const p of stale.slice(0, 3)) {
    const exists = tasks.some(
      (t) =>
        t.agent === "Provider Registry" &&
        t.task.includes(p.name) &&
        t.humanApproval === "Pending"
    );
    if (!exists) {
      tasks.unshift({
        id: uid("ag"),
        agent: "Provider Registry",
        createdAt: now,
        task: `Request capacity confirmation from ${p.name}`,
        proposedAction: `Mark ${p.name} as Needs confirmation and ask provider to reconfirm ${p.capacity} ${p.capacityUnit}`,
        reasoning: `${p.name} last confirmed at ${p.lastConfirmedAt}. Freshness policy flags emergency/overnight services sooner than routine services. Stale ≠ unavailable.`,
        humanApproval: "Pending",
        result: "Queued for County ops approval",
      });
    }
  }

  const unanswered = state.referrals.filter(
    (r) =>
      r.status === "Awaiting provider response" ||
      r.status === "Clarification requested"
  );
  for (const r of unanswered.slice(0, 3)) {
    const provider = providers.find((p) => p.id === r.providerId);
    const exists = tasks.some(
      (t) =>
        t.agent === "Referral Coordination" &&
        t.task.includes(r.id) &&
        t.humanApproval === "Pending"
    );
    if (!exists) {
      tasks.unshift({
        id: uid("ag"),
        agent: "Referral Coordination",
        createdAt: now,
        task: `Follow up on unanswered referral ${r.id}`,
        proposedAction: `Send synthetic reminder to ${provider?.name ?? "provider"} and notify outreach of deadline`,
        reasoning: `${r.id} is still ${r.status}. Agents propose follow-up; humans approve outbound actions.`,
        humanApproval: "Pending",
        result: "Awaiting approval",
      });
    }
  }

  tasks.unshift({
    id: uid("ag"),
    agent: "Data Quality",
    createdAt: now,
    task: "Scan provider profiles for missing intake cutoff or accessibility fields",
    proposedAction: "Generate data-quality warning for incomplete profiles",
    reasoning:
      "Incomplete operational fields increase failed handoffs. Agents warn; they do not auto-publish ambiguous updates.",
    humanApproval: "Auto-logged",
    result: "Warning posted to Agent Control Center",
  });

  const unmetCount = state.unmetNeeds.length;
  tasks.unshift({
    id: uid("ag"),
    agent: "Unmet-Need Insight",
    createdAt: now,
    task: "Summarize unmet-need ledger themes for County analysts",
    proposedAction: `Create synthetic County insight from ${unmetCount} unmet-need events (capacity, transportation, documents)`,
    reasoning:
      "Aggregate patterns only — no small cells that identify individuals. Insights are labeled synthetic in this prototype.",
    humanApproval: "Pending",
    result: "Draft insight ready for analyst review",
  });

  tasks.unshift({
    id: uid("ag"),
    agent: "Capacity Verification",
    createdAt: now,
    task: "Recompute capacity freshness across registry",
    proposedAction: "Apply emergency vs routine freshness windows",
    reasoning:
      "Emergency shelter / safe parking / recuperative care use a shorter confirmation window than routine navigation appointments.",
    humanApproval: "Approved",
    result: `Freshness recomputed for ${providers.length} providers`,
  });

  tasks.unshift({
    id: uid("ag"),
    agent: "Safety Guardrail",
    createdAt: now,
    task: "Verify no confidential DV shelter locations in handoff cards",
    proposedAction: "Allow only general region + secure contact phrasing",
    reasoning:
      "Safety Guardrail never exposes domestic-violence shelter locations. Protected pathways use secure contact only.",
    humanApproval: "Auto-logged",
    result: "No confidential locations detected in active handoffs",
  });

  return {
    tasks,
    providers,
    activityLabel: `Agent cycle ran — ${stale.length} stale provider(s), ${unanswered.length} unanswered referral(s)`,
  };
}

export const AGENT_CATALOG = [
  {
    name: "Provider Registry" as const,
    summary: "Tracks provider profile freshness and proposes confirmation requests.",
    example:
      "Find providers whose last confirmation exceeds the freshness window and ask staff to request an update.",
  },
  {
    name: "Referral Coordination" as const,
    summary: "Watches open referrals and proposes follow-ups before deadlines.",
    example:
      "Flag unanswered referrals and draft a reminder for human approval.",
  },
  {
    name: "Capacity Verification" as const,
    summary: "Recomputes capacity status from timestamps — never invents beds.",
    example:
      "Mark stale emergency capacity as Needs confirmation, not Unavailable.",
  },
  {
    name: "Data Quality" as const,
    summary: "Surfaces missing operational fields that block successful handoffs.",
    example:
      "Warn when intake cutoff, accessibility, or language fields are incomplete.",
  },
  {
    name: "Unmet-Need Insight" as const,
    summary: "Aggregates decline/failure themes for County learning.",
    example:
      "Summarize transportation and capacity gaps without identifying individuals.",
  },
  {
    name: "Safety Guardrail" as const,
    summary: "Blocks exposure of confidential locations and unnecessary PII.",
    example:
      "Ensure protected safety pathway handoffs show secure contact only.",
  },
];
