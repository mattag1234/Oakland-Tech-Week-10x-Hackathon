"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Printer, Shield } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatRelative, formatWhen } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Textarea,
  statusTone,
} from "@/components/ui";

export default function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    state,
    sendReferral,
    updateReferral,
    addInternalNote,
    setRole,
  } = useStore();
  const [note, setNote] = useState("");

  const referral = state.referrals.find((r) => r.id === id);
  const provider = referral
    ? state.providers.find((p) => p.id === referral.providerId)
    : undefined;
  const request = referral
    ? state.requests.find((r) => r.id === referral.requestId)
    : undefined;

  if (!referral || !provider || !request) {
    return (
      <div>
        <PageHeader title="Referral Detail" />
        <EmptyState
          title="Referral not found"
          detail="This synthetic referral ID is not in the current session."
        />
        <Button className="mt-4" onClick={() => router.push("/referrals")}>
          Back to referrals
        </Button>
      </div>
    );
  }

  const accepted =
    referral.status === "Placement accepted" ||
    referral.status === "Participant handoff confirmed" ||
    referral.status === "Arrival confirmed";

  const confirmHandoff = () => {
    updateReferral(
      referral.id,
      {
        status: "Participant handoff confirmed",
        handoffConfirmedAt: new Date().toISOString(),
        nextAction: "Provide handoff card and confirm transportation / arrival.",
      },
      "Participant handoff confirmed",
      "Handoff summary shared with participant (privacy-safe)"
    );
  };

  return (
    <div>
      <PageHeader
        title={`Referral ${referral.id}`}
        subtitle="Synthetic referral detail with timeline, next action, and privacy-safe handoff."
        actions={
          <Badge tone={statusTone(referral.status)}>{referral.status}</Badge>
        }
      />

      {accepted ? (
        <div className="mb-6 rounded-xl border border-teal-300 bg-teal-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-7 w-7 text-teal-700" />
            <div>
              <h2 className="font-display text-xl font-semibold text-teal-950">
                Next step confirmed
              </h2>
              <p className="mt-1 text-sm text-teal-900">
                {provider.name} accepted this placement. Share the handoff card
                below — never reveal confidential DV shelter locations.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold">
                Request summary
              </h2>
            </CardHeader>
            <CardBody className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Urgency:</span> {request.urgency}
              </p>
              <p>
                <span className="text-slate-500">Service:</span>{" "}
                {request.serviceNeeded}
              </p>
              <p>
                <span className="text-slate-500">Household:</span>{" "}
                {request.householdType} ({request.householdSize})
              </p>
              <p>
                <span className="text-slate-500">Safety:</span>{" "}
                {request.genderSafety}
              </p>
              <p>
                <span className="text-slate-500">Accessibility:</span>{" "}
                {request.accessibility}
              </p>
              <p>
                <span className="text-slate-500">Language:</span> {request.language}
              </p>
              <p>
                <span className="text-slate-500">Transportation:</span>{" "}
                {request.transportation}
              </p>
              <p>
                <span className="text-slate-500">Documents:</span>{" "}
                {request.documents}
              </p>
              <p>
                <span className="text-slate-500">Intake timing:</span>{" "}
                {request.intakeTiming}
              </p>
              <p>
                <span className="text-slate-500">Region:</span> {request.region}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold">Provider</h2>
            </CardHeader>
            <CardBody className="text-sm space-y-1">
              <p className="font-medium">{provider.name}</p>
              <p className="text-slate-600">
                General region: {provider.region}
              </p>
              <p className="text-slate-600">
                Intake: {provider.intakeHours} (cutoff {provider.intakeCutoff})
              </p>
              <p className="text-slate-600">
                Confirmation deadline: {formatWhen(referral.confirmationDeadline)}
              </p>
              {provider.protectedSafetyPathway ? (
                <p className="mt-2 flex items-center gap-2 text-amber-900">
                  <Shield className="h-4 w-4" />
                  Protected pathway — secure contact only; no confidential location.
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold">Timeline</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {referral.timeline.map((t) => (
                <div key={t.id} className="border-l-2 border-navy-200 pl-3">
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-slate-500">
                    {t.actor} · {formatRelative(t.at)}
                  </p>
                  {t.detail ? (
                    <p className="text-sm text-slate-600">{t.detail}</p>
                  ) : null}
                </div>
              ))}
            </CardBody>
          </Card>

          {accepted ? (
            <Card className="print-card border-teal-200">
              <CardHeader className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  Participant handoff card
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  className="no-print"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                <p>
                  <strong>Referral ID:</strong> {referral.id}
                </p>
                <p>
                  <strong>Provider:</strong> {provider.name}
                </p>
                <p>
                  <strong>General location / secure contact:</strong>{" "}
                  {provider.protectedSafetyPathway
                    ? "Secure contact will be provided by staff — confidential location not printed."
                    : `${provider.region} · Intake desk during ${provider.intakeHours}`}
                </p>
                <p>
                  <strong>Intake deadline:</strong> Arrive before{" "}
                  {provider.intakeCutoff}
                </p>
                <p>
                  <strong>Transportation:</strong>{" "}
                  {referral.transportationNeeded
                    ? "Staff coordinating transportation"
                    : "Participant has or can use transit"}
                </p>
                <p>
                  <strong>Next action:</strong> {referral.nextAction}
                </p>
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  Privacy-safe instructions: This card contains no name, exact
                  address of confidential shelters, medical history, or domestic-
                  violence details. Bring any available identification if you have
                  it; missing ID may still be accepted with staff attestation.
                </p>
                {referral.status !== "Participant handoff confirmed" &&
                referral.status !== "Arrival confirmed" ? (
                  <Button className="no-print mt-2" variant="confirm" onClick={confirmHandoff}>
                    Mark handoff confirmed
                  </Button>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold">Next action</h2>
            </CardHeader>
            <CardBody className="text-sm text-slate-700">
              <p>{referral.nextAction}</p>
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Privacy reminder: share only minimum necessary details with
                providers and participants.
              </p>
            </CardBody>
          </Card>

          <Card className="no-print">
            <CardHeader>
              <h2 className="font-display text-lg font-semibold">Actions</h2>
            </CardHeader>
            <CardBody className="flex flex-col gap-2">
              {referral.status === "Ready to send" ? (
                <Button variant="confirm" onClick={() => sendReferral(referral.id)}>
                  Send referral request
                </Button>
              ) : null}
              {referral.status === "Awaiting provider response" ? (
                <Button
                  variant="warn"
                  onClick={() => {
                    setRole("provider");
                    router.push("/provider-portal");
                  }}
                >
                  Switch to Provider role to respond
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() =>
                  updateReferral(
                    referral.id,
                    {},
                    "Provider confirmation requested",
                    "Synthetic confirmation ping sent"
                  )
                }
              >
                Request provider confirmation
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  updateReferral(
                    referral.id,
                    {
                      transportationNeeded: true,
                      nextAction:
                        "Transportation flagged — coordinate pickup or transit support.",
                    },
                    "Transportation marked needed"
                  )
                }
              >
                Mark transportation needed
              </Button>
              <div className="space-y-2 pt-2">
                <Textarea
                  rows={3}
                  placeholder="Add internal note (no PII)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button
                  variant="secondary"
                  disabled={!note.trim()}
                  onClick={() => {
                    addInternalNote(referral.id, note.trim());
                    setNote("");
                  }}
                >
                  Add internal note
                </Button>
              </div>
              {referral.internalNotes.length ? (
                <ul className="space-y-1 text-xs text-slate-600">
                  {referral.internalNotes.map((n) => (
                    <li key={n} className="rounded bg-slate-50 px-2 py-1">
                      {n}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button
                variant="danger"
                onClick={() =>
                  updateReferral(
                    referral.id,
                    {
                      status: "Cancelled",
                      nextAction: "Referral cancelled — no further action.",
                    },
                    "Cancelled"
                  )
                }
              >
                Cancel referral
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  router.push(`/providers?requestId=${request.id}`)
                }
              >
                Return to provider options
              </Button>
              <Link
                href="/referrals"
                className="text-center text-sm text-teal-700 underline"
              >
                All referrals
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
