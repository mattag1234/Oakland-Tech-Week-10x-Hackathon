"use client";

import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/components/ui";

const CONNECTIONS = [
  {
    name: "Coordinated Entry",
    status: "Simulated",
    detail: "Read-limited placement priority context — no live CE writes.",
  },
  {
    name: "HMIS",
    status: "Simulated",
    detail: "Synthetic enrollment echoes only. No real HMIS credentials.",
  },
  {
    name: "211",
    status: "Simulated",
    detail: "Resource category alignment for staff — not a public directory.",
  },
  {
    name: "Provider Portal",
    status: "Active (local)",
    detail: "In-app provider responses and capacity updates via localStorage.",
  },
  {
    name: "Secure CSV / SFTP Import",
    status: "Simulated",
    detail: "Mock nightly roster import path — no outbound network calls.",
  },
  {
    name: "County Analytics Export",
    status: "Simulated",
    detail: "Aggregate unmet-need and response-time export stub.",
  },
];

const FIELD_MAP = [
  {
    source: "Placement urgency",
    target: "Referral.urgency",
    notes: "Minimum necessary; no name fields mapped",
  },
  {
    source: "Household type / size",
    target: "Referral.household",
    notes: "Operational matching only",
  },
  {
    source: "Service needed",
    target: "Provider.serviceTypes",
    notes: "Hard requirement for compatibility",
  },
  {
    source: "Gender / safety requirement",
    target: "Provider.genderSafety",
    notes: "Protected pathway → secure contact only",
  },
  {
    source: "Accessibility need",
    target: "Provider.accessibility",
    notes: "Operational barrier classification",
  },
  {
    source: "Provider capacity + confirmed_at",
    target: "Provider.capacityStatus",
    notes: "Freshness policy; stale ≠ unavailable",
  },
  {
    source: "Decline reason code",
    target: "UnmetNeed.category",
    notes: "Feeds County insights ledger",
  },
  {
    source: "HMIS client ID",
    target: "(not stored in MVP)",
    notes: "Intentionally omitted from prototype",
  },
];

export default function ConnectionsPage() {
  return (
    <div>
      <PageHeader
        title="Data Connections"
        subtitle="Simulated integration surface for County systems. No real credentials or external calls."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CONNECTIONS.map((c) => (
          <Card key={c.name}>
            <CardHeader className="flex items-start justify-between gap-2">
              <h2 className="font-display text-base font-semibold">{c.name}</h2>
              <Badge tone={c.status.includes("Active") ? "ok" : "neutral"}>
                {c.status}
              </Badge>
            </CardHeader>
            <CardBody className="text-sm text-slate-600">{c.detail}</CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-display text-lg font-semibold">
            Field-mapping table
          </h2>
          <p className="text-sm text-slate-600">
            Illustrative mapping for future integrations — prototype stores
            synthetic fields locally only.
          </p>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Source concept</th>
                <th className="pb-2 font-medium">Relay field</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_MAP.map((row) => (
                <tr key={row.source} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{row.source}</td>
                  <td className="py-2 font-mono text-xs">{row.target}</td>
                  <td className="py-2 text-slate-600">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        Solace Relay is an operational coordination layer. It does not replace
        Coordinated Entry, HMIS, or 211 — and this prototype never transmits data
        outside the browser.
      </div>
    </div>
  );
}
