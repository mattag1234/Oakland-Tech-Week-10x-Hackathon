"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/lib/store";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Select,
} from "@/components/ui";

const COLORS = ["#0f766e", "#1a2b4a", "#d97706", "#be123c", "#0369a1", "#64748b"];

export default function InsightsPage() {
  const { state, setRole } = useStore();
  const [region, setRegion] = useState("All");

  const filteredUnmet = useMemo(() => {
    if (region === "All") return state.unmetNeeds;
    return state.unmetNeeds.filter((u) => u.region === region);
  }, [state.unmetNeeds, region]);

  const outcomeData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of state.referrals) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state.referrals]);

  const failureData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of filteredUnmet) {
      counts[u.category] = (counts[u.category] ?? 0) + 1;
    }
    for (const r of state.referrals) {
      if (r.status === "Declined" && r.declineReason) {
        // already in unmet for declines created in-session; seed declines counted via unmet
      }
      if (r.status === "Expired") {
        counts["Expired"] = (counts["Expired"] ?? 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredUnmet, state.referrals]);

  const unmetCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of filteredUnmet) {
      counts[u.serviceNeeded] = (counts[u.serviceNeeded] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredUnmet]);

  const freshnessData = useMemo(() => {
    const counts: Record<string, number> = {
      "Confirmed recently": 0,
      "Needs confirmation": 0,
      "No current usable space": 0,
    };
    for (const p of state.providers) {
      counts[p.capacityStatus] = (counts[p.capacityStatus] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state.providers]);

  const regions = useMemo(() => {
    const set = new Set(state.unmetNeeds.map((u) => u.region));
    return ["All", ...Array.from(set)];
  }, [state.unmetNeeds]);

  const insights = [
    {
      title: "Transportation barriers appear in youth referrals",
      detail:
        "Synthetic pattern: declined youth shelter placements cite transportation more often than capacity alone.",
    },
    {
      title: "Recuperative care capacity is thin",
      detail:
        "Synthetic pattern: unmet recuperative-care events concentrate in East bay foothills.",
    },
    {
      title: "Stale overnight capacity needs shorter refresh",
      detail:
        "Synthetic pattern: emergency and safe-parking freshness windows surface Needs confirmation before night intake.",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Unmet-need ledger"
        subtitle="County-facing demand trends, referral outcomes, and capacity freshness — synthetic aggregates only."
        actions={
          <ButtonRole onClick={() => setRole("county_analyst")} />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium" htmlFor="region-filter">
          Region filter
        </label>
        <Select
          id="region-filter"
          className="w-auto min-w-[12rem]"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <Badge tone="info">All insights labeled synthetic</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active referrals" value={state.referrals.length} />
        <Metric label="Unmet-need events" value={filteredUnmet.length} />
        <Metric
          label="Accepted placements"
          value={
            state.referrals.filter((r) =>
              [
                "Placement accepted",
                "Participant handoff confirmed",
                "Arrival confirmed",
              ].includes(r.status)
            ).length
          }
        />
        <Metric
          label="Providers needing confirmation"
          value={
            state.providers.filter((p) => p.capacityStatus === "Needs confirmation")
              .length
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-semibold">
              Referral outcomes
            </h2>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#1a2b4a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-semibold">
              Failure / unmet reasons
            </h2>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={failureData.length ? failureData : [{ name: "None", value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {(failureData.length ? failureData : [{ name: "None", value: 1 }]).map(
                    (_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-semibold">
              Unmet-need categories (by service)
            </h2>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unmetCategories.length ? unmetCategories : [{ name: "None", value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-semibold">
              Provider data freshness
            </h2>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freshnessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {insights.map((ins) => (
          <Card key={ins.title}>
            <CardBody className="pt-5">
              <Badge tone="info" className="mb-2">
                Synthetic insight
              </Badge>
              <h3 className="font-display font-semibold text-navy-900">
                {ins.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{ins.detail}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-display text-lg font-semibold">
            Unmet-need ledger detail
          </h2>
          <p className="text-xs text-slate-500">
            No small cells that identify individuals — aggregate operational events only.
          </p>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Referral</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Region</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnmet.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-2">{u.referralId}</td>
                  <td className="py-2">{u.category}</td>
                  <td className="py-2">{u.serviceNeeded}</td>
                  <td className="py-2">{u.region}</td>
                  <td className="py-2 text-slate-600">{u.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody className="pt-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
      </CardBody>
    </Card>
  );
}

function ButtonRole({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50"
    >
      View as County Analyst
    </button>
  );
}
