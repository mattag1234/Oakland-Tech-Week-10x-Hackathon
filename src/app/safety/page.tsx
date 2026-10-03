"use client";

import { Shield } from "lucide-react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui";

const PRINCIPLES = [
  {
    title: "Minimum necessary information",
    body: "Collect only what is required to identify a compatible service and coordinate the next step. Do not ask for the person’s name in this prototype.",
  },
  {
    title: "No guaranteed housing language",
    body: "Solace Relay helps confirm whether a provider can help right now. It does not promise a bed that does not exist.",
  },
  {
    title: "Not a replacement for CE / HMIS / 211",
    body: "This is a coordination layer for staff and providers, not a public map, consumer directory, or eligibility engine.",
  },
  {
    title: "Protected safety pathways",
    body: "Domestic-violence and other confidential shelter locations are never exposed. Secure contact phrasing only.",
  },
  {
    title: "Stale data ≠ unavailable",
    body: "When provider information exceeds the freshness window, status becomes Needs confirmation — not Unavailable.",
  },
  {
    title: "Human approval for sensitive actions",
    body: "Agents propose follow-ups, confirmations, and insights. Humans approve actions that affect people or published data.",
  },
  {
    title: "Transparent matching — no deservingness scores",
    body: "Matching explains fit against requirements. It never scores moral worth, predicted success, or compliance.",
  },
  {
    title: "Learn from failure",
    body: "Declines and unmet needs feed the County ledger so system gaps become visible without identifying individuals.",
  },
  {
    title: "Synthetic data only in this prototype",
    body: "No live County systems, no API keys, no real outbound messages, no real authentication.",
  },
];

export default function SafetyPage() {
  return (
    <div>
      <PageHeader
        title="Safety and Governance"
        subtitle="Principles that keep Solace Relay dignified, privacy-conscious, and operationally honest."
      />

      <Card className="mb-6 border-navy-800 bg-navy-900 text-white">
        <CardBody className="flex gap-4 pt-5">
          <Shield className="h-8 w-8 shrink-0 text-teal-400" />
          <div>
            <h2 className="font-display text-xl font-semibold">
              Solace Relay assists coordination and does not decide who deserves
              help.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Staff and providers remain accountable for referrals, capacity
              confirmations, and the next step offered to each person.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {PRINCIPLES.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <h3 className="font-display text-base font-semibold">{p.title}</h3>
            </CardHeader>
            <CardBody className="text-sm text-slate-600">{p.body}</CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
