"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  statusTone,
} from "@/components/ui";

export default function OverviewPage() {
  const router = useRouter();
  const { state, loadDemoScenario } = useStore();

  const urgentToday = state.requests.filter((r) => {
    const sameDay =
      new Date(r.createdAt).toDateString() === new Date().toDateString();
    return sameDay && (r.urgency === "Tonight" || r.urgency === "Within 24 hours");
  }).length;

  const confirmedToday = state.referrals.filter((r) => {
    const sameDay =
      new Date(r.updatedAt).toDateString() === new Date().toDateString();
    return (
      sameDay &&
      (r.status === "Placement accepted" ||
        r.status === "Arrival confirmed" ||
        r.status === "Participant handoff confirmed")
    );
  }).length;

  const awaiting = state.referrals.filter(
    (r) =>
      r.status === "Awaiting provider response" ||
      r.status === "Clarification requested"
  ).length;

  const needingConfirm = state.providers.filter(
    (p) => p.capacityStatus === "Needs confirmation"
  ).length;

  const failedWeek = state.referrals.filter((r) =>
    ["Declined", "Expired", "Cancelled", "Arrival not confirmed"].includes(
      r.status
    )
  ).length;

  const responded = state.referrals.filter((r) =>
    ["Placement accepted", "Declined", "Clarification requested"].includes(
      r.status
    )
  );
  const avgHours =
    responded.length === 0
      ? 2.4
      : Math.round(
          (responded.reduce((sum, r) => {
            const hours =
              (new Date(r.updatedAt).getTime() -
                new Date(r.createdAt).getTime()) /
              3600000;
            return sum + Math.max(0.2, hours);
          }, 0) /
            responded.length) *
            10
        ) / 10;

  const metrics = [
    { label: "Urgent requests today", value: urgentToday || state.requests.filter(r => r.urgency === "Tonight").length },
    { label: "Confirmed placements today", value: confirmedToday },
    { label: "Referrals awaiting response", value: awaiting },
    { label: "Providers needing confirmation", value: needingConfirm },
    { label: "Failed referrals this week", value: failedWeek },
    { label: "Avg provider response time", value: `${avgHours}h` },
  ];

  const steps = [
    "Record minimum necessary requirements",
    "Identify compatible services with transparent fit reasons",
    "Send a referral and track provider response",
    "Confirm the next step and hand off safely",
    "Learn from outcomes and unmet needs",
  ];

  return (
    <div>
      <PageHeader
        title="Solace Relay Coordination Overview"
        subtitle="Helping staff turn requests for help into confirmed next steps."
        actions={
          <>
            <Button
              variant="confirm"
              onClick={() => {
                loadDemoScenario();
                router.push("/placement?demo=1");
              }}
            >
              Load demo scenario
            </Button>
            <Button onClick={() => router.push("/placement")}>
              Start placement request
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardBody className="pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {m.label}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-navy-900">
                {m.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {state.activity.slice(0, 8).map((a) => (
              <div
                key={a.id}
                className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-navy-900">{a.label}</p>
                  <p className="text-xs text-slate-600">{a.detail}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatRelative(a.at)}
                  </p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold">
              How Solace Relay works
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {steps.map((step, i) => (
              <div key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-700">{step}</p>
              </div>
            ))}
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              Solace Relay does not create a bed that does not exist. It helps
              staff find confirmed capacity, coordinate the next step, and learn
              why referrals succeed or fail.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Active referrals</h2>
          <Link href="/referrals" className="text-sm text-teal-700 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Provider</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Next action</th>
              </tr>
            </thead>
            <tbody>
              {state.referrals.slice(0, 5).map((r) => {
                const provider = state.providers.find((p) => p.id === r.providerId);
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2">
                      <Link
                        href={`/referrals/${r.id}`}
                        className="font-medium text-teal-800 hover:underline"
                      >
                        {r.id}
                      </Link>
                    </td>
                    <td className="py-2">{provider?.name}</td>
                    <td className="py-2">
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="py-2 text-slate-600">{r.nextAction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {needingConfirm > 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {needingConfirm} provider{needingConfirm === 1 ? "" : "s"} need
            confirmation. Stale capacity is labeled{" "}
            <strong>Needs confirmation</strong>, not unavailable.{" "}
            <Link href="/agents" className="underline">
              Review agent tasks
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Provider registry freshness looks healthy for this synthetic session.</p>
        </div>
      )}
    </div>
  );
}
