"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { DeclineReason } from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Select,
  Textarea,
  statusTone,
} from "@/components/ui";

const DECLINE_REASONS: DeclineReason[] = [
  "No capacity",
  "Transportation barrier",
  "Documents required",
  "Intake timing mismatch",
  "Service type mismatch",
  "Accessibility mismatch",
  "Household type mismatch",
  "Other",
];

export default function ProviderPortalPage() {
  const { state, providerRespond, updateProvider, setRole } = useStore();
  const [declineReason, setDeclineReason] = useState<Record<string, DeclineReason>>(
    {}
  );
  const [clarifyNote, setClarifyNote] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState(state.providers[0]?.id ?? "");

  const incoming = useMemo(
    () =>
      state.referrals.filter((r) =>
        [
          "Awaiting provider response",
          "Clarification requested",
          "Ready to send",
        ].includes(r.status)
      ),
    [state.referrals]
  );

  const provider = state.providers.find((p) => p.id === editingId);

  const applyCapacity = (value: number) => {
    if (!provider) return;
    updateProvider(
      provider.id,
      { capacity: value },
      "capacity",
      String(provider.capacity),
      String(value)
    );
  };

  return (
    <div>
      <PageHeader
        title="Provider Portal"
        subtitle="Respond to incoming referrals and keep service information current."
        actions={
          state.role !== "provider" ? (
            <Button variant="secondary" onClick={() => setRole("provider")}>
              Switch to Provider role
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">
            Incoming referrals
          </h2>
          {incoming.length === 0 ? (
            <EmptyState
              title="No open incoming referrals"
              detail="When outreach sends a referral, it appears here for accept / decline / clarification."
            />
          ) : (
            incoming.map((r) => {
              const req = state.requests.find((x) => x.id === r.requestId);
              const prov = state.providers.find((p) => p.id === r.providerId);
              return (
                <Card key={r.id}>
                  <CardHeader className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/referrals/${r.id}`}
                        className="font-semibold text-teal-800 hover:underline"
                      >
                        {r.id}
                      </Link>
                      <p className="text-sm text-slate-600">{prov?.name}</p>
                    </div>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </CardHeader>
                  <CardBody className="space-y-3 text-sm">
                    {req ? (
                      <ul className="grid gap-1 sm:grid-cols-2">
                        <li>Service: {req.serviceNeeded}</li>
                        <li>Urgency: {req.urgency}</li>
                        <li>Household: {req.householdType}</li>
                        <li>Safety: {req.genderSafety}</li>
                        <li>Accessibility: {req.accessibility}</li>
                        <li>Language: {req.language}</li>
                        <li>Transport: {req.transportation}</li>
                        <li>Documents: {req.documents}</li>
                      </ul>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      Updated {formatRelative(r.updatedAt)}
                    </p>
                    {r.status !== "Ready to send" ? (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="confirm"
                          onClick={() => providerRespond(r.id, "accept")}
                        >
                          Accept
                        </Button>
                        <div className="flex flex-wrap gap-2">
                          <Select
                            className="min-w-[12rem] flex-1"
                            value={declineReason[r.id] ?? "No capacity"}
                            onChange={(e) =>
                              setDeclineReason((s) => ({
                                ...s,
                                [r.id]: e.target.value as DeclineReason,
                              }))
                            }
                          >
                            {DECLINE_REASONS.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </Select>
                          <Button
                            variant="danger"
                            onClick={() =>
                              providerRespond(r.id, "decline", {
                                reason: declineReason[r.id] ?? "No capacity",
                              })
                            }
                          >
                            Decline
                          </Button>
                        </div>
                        <Textarea
                          rows={2}
                          placeholder="Clarification question"
                          value={clarifyNote[r.id] ?? ""}
                          onChange={(e) =>
                            setClarifyNote((s) => ({
                              ...s,
                              [r.id]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          variant="warn"
                          onClick={() =>
                            providerRespond(r.id, "clarify", {
                              note:
                                clarifyNote[r.id] ||
                                "Please clarify intake timing or transportation.",
                            })
                          }
                        >
                          Request clarification
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-800">
                        Referral drafted but not yet sent by outreach.
                      </p>
                    )}
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">
            Service profile editor
          </h2>
          <Card>
            <CardBody className="space-y-4 pt-5">
              <div>
                <Label htmlFor="prov">Provider</Label>
                <Select
                  id="prov"
                  value={editingId}
                  onChange={(e) => setEditingId(e.target.value)}
                >
                  {state.providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>

              {provider ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="cap">Capacity</Label>
                      <Input
                        id="cap"
                        type="number"
                        min={0}
                        defaultValue={provider.capacity}
                        key={`${provider.id}-${provider.capacity}`}
                        onBlur={(e) =>
                          applyCapacity(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label>Capacity status</Label>
                      <div className="pt-2">
                        <Badge tone={statusTone(provider.capacityStatus)}>
                          {provider.capacityStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hours">Intake hours</Label>
                    <Input
                      id="hours"
                      defaultValue={provider.intakeHours}
                      key={`${provider.id}-hours`}
                      onBlur={(e) => {
                        if (e.target.value !== provider.intakeHours) {
                          updateProvider(
                            provider.id,
                            { intakeHours: e.target.value },
                            "intakeHours",
                            provider.intakeHours,
                            e.target.value
                          );
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cutoff">Intake cutoff</Label>
                    <Input
                      id="cutoff"
                      defaultValue={provider.intakeCutoff}
                      key={`${provider.id}-cutoff`}
                      onBlur={(e) => {
                        if (e.target.value !== provider.intakeCutoff) {
                          updateProvider(
                            provider.id,
                            { intakeCutoff: e.target.value },
                            "intakeCutoff",
                            provider.intakeCutoff,
                            e.target.value
                          );
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pets">Pet policy</Label>
                    <Input
                      id="pets"
                      defaultValue={provider.petPolicy}
                      key={`${provider.id}-pets`}
                      onBlur={(e) => {
                        if (e.target.value !== provider.petPolicy) {
                          updateProvider(
                            provider.id,
                            { petPolicy: e.target.value },
                            "petPolicy",
                            provider.petPolicy,
                            e.target.value
                          );
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="docs">Required documents</Label>
                    <Textarea
                      id="docs"
                      rows={2}
                      defaultValue={provider.requiredDocuments}
                      key={`${provider.id}-docs`}
                      onBlur={(e) => {
                        if (e.target.value !== provider.requiredDocuments) {
                          updateProvider(
                            provider.id,
                            { requiredDocuments: e.target.value },
                            "requiredDocuments",
                            provider.requiredDocuments,
                            e.target.value
                          );
                        }
                      }}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={provider.temporaryClosure}
                      onChange={(e) =>
                        updateProvider(
                          provider.id,
                          { temporaryClosure: e.target.checked },
                          "temporaryClosure",
                          String(provider.temporaryClosure),
                          String(e.target.checked)
                        )
                      }
                    />
                    Temporary closure
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={provider.lateIntake}
                      onChange={(e) =>
                        updateProvider(
                          provider.id,
                          { lateIntake: e.target.checked },
                          "lateIntake",
                          String(provider.lateIntake),
                          String(e.target.checked)
                        )
                      }
                    />
                    Late intake available
                  </label>

                  <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <p>
                      Last updated: {formatRelative(provider.lastConfirmedAt)}
                    </p>
                    <p>By: {provider.lastConfirmedBy}</p>
                    <p>Confirmation source: {provider.confirmationSource}</p>
                    <p>
                      Accessibility: {provider.accessibility.join(", ")}
                    </p>
                    <p>Languages: {provider.languages.join(", ")}</p>
                    <p>
                      Transportation: {provider.transportationSupport.join("; ")}
                    </p>
                  </div>
                </>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-semibold">
                Recent profile updates
              </h2>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              {state.providerUpdates.length === 0 ? (
                <p className="text-slate-500">No updates yet this session.</p>
              ) : (
                state.providerUpdates.slice(0, 8).map((u) => {
                  const p = state.providers.find((x) => x.id === u.providerId);
                  return (
                    <div
                      key={u.id}
                      className="rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <p className="font-medium">
                        {p?.name}: {u.field}
                      </p>
                      <p className="text-xs text-slate-600">
                        {u.previousValue} → {u.newValue}
                      </p>
                      <p className="text-xs text-slate-500">
                        {u.by} · {u.confirmationSource} ·{" "}
                        {u.approved ? "Approved" : "Pending approval"}
                      </p>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
