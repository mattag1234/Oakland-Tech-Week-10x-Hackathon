"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { freshnessLabel } from "@/lib/data";
import {
  matchProviders,
  relayAssistantTips,
  sortMatches,
  type ProviderSort,
} from "@/lib/matching";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  statusTone,
} from "@/components/ui";

function ProvidersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const { state, createReferral } = useStore();
  const [sort, setSort] = useState<ProviderSort>("best");

  const request = useMemo(() => {
    if (requestId) return state.requests.find((r) => r.id === requestId);
    return state.requests[0];
  }, [requestId, state.requests]);

  const matches = useMemo(() => {
    if (!request) return [];
    return sortMatches(matchProviders(request, state.providers), sort, request);
  }, [request, state.providers, sort]);

  const tips = useMemo(
    () => (request ? relayAssistantTips(request, matches) : []),
    [request, matches]
  );

  if (!request) {
    return (
      <div>
        <PageHeader
          title="Compatible Provider Options"
          subtitle="Start a placement request to see transparent provider matches."
        />
        <EmptyState
          title="No placement request yet"
          detail="Create a placement request first, or load the demo scenario."
        />
        <div className="mt-4">
          <Button onClick={() => router.push("/placement")}>
            Start placement request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Compatible Provider Options"
        subtitle={`Matching for ${request.serviceNeeded} · ${request.urgency} · ${request.householdType} · ${request.region}`}
        actions={
          <Button variant="secondary" onClick={() => router.push("/placement")}>
            Edit request
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-navy-900" htmlFor="sort">
          Sort / filter
        </label>
        <Select
          id="sort"
          className="w-auto min-w-[14rem]"
          value={sort}
          onChange={(e) => setSort(e.target.value as ProviderSort)}
        >
          <option value="best">Best fit</option>
          <option value="recent">Most recently confirmed</option>
          <option value="fastest">Fastest response</option>
          <option value="transportation">Transportation</option>
          <option value="accessibility">Accessibility</option>
          <option value="language">Language</option>
          <option value="pet">Pet acceptance</option>
          <option value="late">Late intake</option>
        </Select>
        <p className="text-xs text-slate-500">
          General regions only — no public map.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {matches.map((m) => (
            <Card
              key={m.provider.id}
              className={
                m.selectable
                  ? ""
                  : "opacity-80"
              }
            >
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-navy-900">
                    {m.provider.name}
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {m.provider.region} · {m.provider.serviceTypes.join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(m.provider.capacityStatus)}>
                    {freshnessLabel(m.provider)}
                  </Badge>
                  <Badge tone={m.selectable ? "ok" : "muted"}>
                    {m.selectable ? "Selectable" : "Not selectable"}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>
                    <span className="text-slate-500">Capacity:</span>{" "}
                    {m.provider.capacity} {m.provider.capacityUnit}
                  </p>
                  <p>
                    <span className="text-slate-500">Intake cutoff:</span>{" "}
                    {m.provider.intakeCutoff}
                  </p>
                  <p>
                    <span className="text-slate-500">Response window:</span> ~
                    {m.provider.responseWindowHours}h
                  </p>
                  <p>
                    <span className="text-slate-500">Languages:</span>{" "}
                    {m.provider.languages.join(", ")}
                  </p>
                  <p>
                    <span className="text-slate-500">Accessibility:</span>{" "}
                    {m.provider.accessibility.join(", ")}
                  </p>
                  <p>
                    <span className="text-slate-500">Transportation:</span>{" "}
                    {m.provider.transportationSupport.join("; ")}
                  </p>
                  <p>
                    <span className="text-slate-500">Pet policy:</span>{" "}
                    {m.provider.petPolicy}
                  </p>
                  <p>
                    <span className="text-slate-500">Documents:</span>{" "}
                    {m.provider.requiredDocuments}
                  </p>
                </div>

                <div className="rounded-lg bg-teal-50/70 p-3">
                  <p className="font-medium text-teal-900">Why this may fit</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-teal-950">
                    {m.reasonsFit.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  {m.reasonsNot.length ? (
                    <>
                      <p className="mt-2 font-medium text-amber-900">
                        Compatibility notes
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-amber-950">
                        {m.reasonsNot.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!m.selectable}
                    variant="confirm"
                    onClick={() => {
                      const referral = createReferral(request.id, m.provider.id);
                      router.push(`/referrals/${referral.id}`);
                    }}
                  >
                    Select & draft referral
                  </Button>
                  {!m.selectable &&
                  m.provider.capacityStatus === "Needs confirmation" ? (
                    <span className="self-center text-xs text-amber-800">
                      Confirm capacity with provider before selecting — not marked
                      unavailable.
                    </span>
                  ) : null}
                  {!m.selectable &&
                  m.provider.capacityStatus === "No current usable space" ? (
                    <span className="self-center text-xs text-slate-500">
                      No current usable space unless provider updates capacity.
                    </span>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Bot className="h-5 w-5 text-teal-700" />
              Relay Assistant
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Deterministic local guidance — no API key
            </p>
          </CardHeader>
          <CardBody className="space-y-3 text-sm text-slate-700">
            {tips.map((t) => (
              <p key={t} className="rounded-lg bg-slate-50 p-3">
                {t}
              </p>
            ))}
            <div>
              <p className="font-medium text-navy-900">Need classifications</p>
              <ul className="mt-2 space-y-1 text-xs">
                {(matches[0]?.classifications ?? []).map((c) => (
                  <li key={c.need} className="flex justify-between gap-2">
                    <span>{c.need}</span>
                    <Badge tone="neutral">{c.classification}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/safety" className="text-xs text-teal-700 underline">
              Review safety and governance principles
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm">
          Loading provider options…
        </div>
      }
    >
      <ProvidersContent />
    </Suspense>
  );
}
