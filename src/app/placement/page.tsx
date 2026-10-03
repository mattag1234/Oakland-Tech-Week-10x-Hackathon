"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { DEMO_REQUEST, REGIONS } from "@/lib/data";
import { uid } from "@/lib/utils";
import type {
  AccessibilityNeed,
  DocumentStatus,
  FieldClassification,
  GenderSafety,
  HouseholdType,
  IntakeTiming,
  Language,
  PetStatus,
  PlacementRequest,
  ServiceNeeded,
  TransportationNeed,
  Urgency,
} from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Label,
  PageHeader,
  Select,
} from "@/components/ui";

const CLASSIFICATIONS: FieldClassification[] = [
  "Required",
  "Operational barrier",
  "Preference",
  "Unknown",
  "Declined to answer",
];

type FormState = Omit<
  PlacementRequest,
  "id" | "createdAt" | "fieldClassifications"
> & {
  fieldClassifications: Record<string, FieldClassification>;
};

const defaults: FormState = {
  urgency: "Tonight",
  householdType: "Single adult",
  householdSize: 1,
  serviceNeeded: "Emergency shelter",
  genderSafety: "None",
  accessibility: "No specific requirement",
  pet: "No pet",
  language: "English",
  transportation: "Transit accessible",
  documents: "Unknown",
  intakeTiming: "Can arrive during normal intake",
  region: REGIONS[0],
  noUnnecessaryPii: false,
  fieldClassifications: {
    urgency: "Required",
    householdType: "Required",
    householdSize: "Required",
    serviceNeeded: "Required",
    genderSafety: "Required",
    accessibility: "Operational barrier",
    pet: "Preference",
    language: "Preference",
    transportation: "Operational barrier",
    documents: "Operational barrier",
    intakeTiming: "Operational barrier",
    region: "Preference",
  },
};

function buildFormFromDraft(
  draft: Partial<PlacementRequest> | null | undefined,
  forceDemo: boolean
): FormState {
  if (!forceDemo && !draft?.urgency) return defaults;
  const d = { ...DEMO_REQUEST, ...(draft ?? {}) };
  return {
    urgency: d.urgency ?? DEMO_REQUEST.urgency,
    householdType: d.householdType ?? DEMO_REQUEST.householdType,
    householdSize: d.householdSize ?? 1,
    serviceNeeded: d.serviceNeeded ?? DEMO_REQUEST.serviceNeeded,
    genderSafety: d.genderSafety ?? DEMO_REQUEST.genderSafety,
    accessibility: d.accessibility ?? DEMO_REQUEST.accessibility,
    pet: d.pet ?? DEMO_REQUEST.pet,
    language: d.language ?? DEMO_REQUEST.language,
    transportation: d.transportation ?? DEMO_REQUEST.transportation,
    documents: d.documents ?? DEMO_REQUEST.documents,
    intakeTiming: d.intakeTiming ?? DEMO_REQUEST.intakeTiming,
    region: d.region ?? DEMO_REQUEST.region,
    noUnnecessaryPii: true,
    fieldClassifications: {
      ...defaults.fieldClassifications,
      ...(d.fieldClassifications as Record<string, FieldClassification>),
    },
  };
}

function FieldRow({
  label,
  fieldKey,
  classification,
  onClassification,
  children,
}: {
  label: string;
  fieldKey: string;
  classification: FieldClassification;
  onClassification: (c: FieldClassification) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_11rem]">
      <div>
        <Label htmlFor={fieldKey}>{label}</Label>
        {children}
      </div>
      <div>
        <Label htmlFor={`${fieldKey}-class`}>Classification</Label>
        <Select
          id={`${fieldKey}-class`}
          value={classification}
          onChange={(e) =>
            onClassification(e.target.value as FieldClassification)
          }
        >
          {CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function PlacementForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, submitRequest, saveDraft } = useStore();
  const isDemoParam = searchParams.get("demo") === "1";
  const draftKey = `${isDemoParam ? "demo" : "live"}:${state.draftRequest?.id ?? "none"}:${state.draftRequest?.urgency ?? ""}`;

  const [form, setForm] = useState<FormState>(() =>
    buildFormFromDraft(state.draftRequest, isDemoParam)
  );
  const [formKey, setFormKey] = useState(draftKey);
  const [error, setError] = useState("");

  if (formKey !== draftKey) {
    setFormKey(draftKey);
    setForm(buildFormFromDraft(state.draftRequest, isDemoParam));
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      saveDraft(next);
      return next;
    });
  };

  const setClass = (key: string, value: FieldClassification) => {
    setForm((f) => ({
      ...f,
      fieldClassifications: { ...f.fieldClassifications, [key]: value },
    }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.noUnnecessaryPii) {
      setError(
        "Confirm that this request contains no unnecessary personally identifying information."
      );
      return;
    }
    const request: PlacementRequest = {
      ...form,
      id: uid("req"),
      createdAt: new Date().toISOString(),
    };
    submitRequest(request);
    router.push(`/providers?requestId=${request.id}`);
  };

  const isDemo = useMemo(
    () =>
      form.genderSafety === "Women-only" &&
      form.accessibility === "Wheelchair accessible" &&
      form.urgency === "Tonight",
    [form]
  );

  return (
    <div>
      <PageHeader
        title="What does this person need right now?"
        subtitle="Enter minimum necessary requirements only. Do not ask for or enter the person’s name."
      />

      <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
        <strong>Safety notice:</strong> Do not enter names, exact locations,
        medical histories, domestic-violence details, or other sensitive
        narratives into this prototype.
      </div>

      {isDemo ? (
        <div className="mb-4">
          <Badge tone="info">Demo scenario loaded</Badge>
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-semibold">
              Placement requirements
            </h2>
          </CardHeader>
          <CardBody className="space-y-5">
            <FieldRow
              label="Urgency"
              fieldKey="urgency"
              classification={form.fieldClassifications.urgency}
              onClassification={(c) => setClass("urgency", c)}
            >
              <Select
                id="urgency"
                value={form.urgency}
                onChange={(e) => set("urgency", e.target.value as Urgency)}
              >
                {(
                  ["Tonight", "Within 24 hours", "Within 72 hours"] as Urgency[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Household type"
              fieldKey="householdType"
              classification={form.fieldClassifications.householdType}
              onClassification={(c) => setClass("householdType", c)}
            >
              <Select
                id="householdType"
                value={form.householdType}
                onChange={(e) =>
                  set("householdType", e.target.value as HouseholdType)
                }
              >
                {(
                  [
                    "Single adult",
                    "Couple",
                    "Family with children",
                    "Youth",
                    "Older adult",
                  ] as HouseholdType[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Household size"
              fieldKey="householdSize"
              classification={form.fieldClassifications.householdSize}
              onClassification={(c) => setClass("householdSize", c)}
            >
              <Input
                id="householdSize"
                type="number"
                min={1}
                max={12}
                value={form.householdSize}
                onChange={(e) =>
                  set("householdSize", Number(e.target.value) || 1)
                }
              />
            </FieldRow>

            <FieldRow
              label="Service needed"
              fieldKey="serviceNeeded"
              classification={form.fieldClassifications.serviceNeeded}
              onClassification={(c) => setClass("serviceNeeded", c)}
            >
              <Select
                id="serviceNeeded"
                value={form.serviceNeeded}
                onChange={(e) =>
                  set("serviceNeeded", e.target.value as ServiceNeeded)
                }
              >
                {(
                  [
                    "Emergency shelter",
                    "Safe parking",
                    "Day services",
                    "Recuperative care",
                    "Temporary housing",
                    "Housing navigation",
                    "Document assistance",
                    "Transportation assistance",
                  ] as ServiceNeeded[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Gender or safety requirement"
              fieldKey="genderSafety"
              classification={form.fieldClassifications.genderSafety}
              onClassification={(c) => setClass("genderSafety", c)}
            >
              <Select
                id="genderSafety"
                value={form.genderSafety}
                onChange={(e) =>
                  set("genderSafety", e.target.value as GenderSafety)
                }
              >
                {(
                  [
                    "None",
                    "Women-only",
                    "Men-only",
                    "Family-only",
                    "LGBTQ+ affirming",
                    "Protected safety pathway",
                  ] as GenderSafety[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Accessibility"
              fieldKey="accessibility"
              classification={form.fieldClassifications.accessibility}
              onClassification={(c) => setClass("accessibility", c)}
            >
              <Select
                id="accessibility"
                value={form.accessibility}
                onChange={(e) =>
                  set("accessibility", e.target.value as AccessibilityNeed)
                }
              >
                {(
                  [
                    "No specific requirement",
                    "Wheelchair accessible",
                    "Ground-floor access",
                    "Accessible restroom",
                    "Medical respite",
                    "Service animal accommodation",
                  ] as AccessibilityNeed[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Pet"
              fieldKey="pet"
              classification={form.fieldClassifications.pet}
              onClassification={(c) => setClass("pet", c)}
            >
              <Select
                id="pet"
                value={form.pet}
                onChange={(e) => set("pet", e.target.value as PetStatus)}
              >
                {(
                  [
                    "No pet",
                    "Pet accompanying person",
                    "Service animal",
                  ] as PetStatus[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Language"
              fieldKey="language"
              classification={form.fieldClassifications.language}
              onClassification={(c) => setClass("language", c)}
            >
              <Select
                id="language"
                value={form.language}
                onChange={(e) => set("language", e.target.value as Language)}
              >
                {(
                  [
                    "English",
                    "Spanish",
                    "Cantonese",
                    "Mandarin",
                    "Vietnamese",
                    "Other",
                  ] as Language[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Transportation"
              fieldKey="transportation"
              classification={form.fieldClassifications.transportation}
              onClassification={(c) => setClass("transportation", c)}
            >
              <Select
                id="transportation"
                value={form.transportation}
                onChange={(e) =>
                  set("transportation", e.target.value as TransportationNeed)
                }
              >
                {(
                  [
                    "Has transportation",
                    "Needs transportation",
                    "Transit accessible",
                    "Requires staff coordination",
                  ] as TransportationNeed[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Documents"
              fieldKey="documents"
              classification={form.fieldClassifications.documents}
              onClassification={(c) => setClass("documents", c)}
            >
              <Select
                id="documents"
                value={form.documents}
                onChange={(e) =>
                  set("documents", e.target.value as DocumentStatus)
                }
              >
                {(
                  [
                    "Has required documents",
                    "Missing identification",
                    "Missing documents",
                    "Unknown",
                  ] as DocumentStatus[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Intake timing"
              fieldKey="intakeTiming"
              classification={form.fieldClassifications.intakeTiming}
              onClassification={(c) => setClass("intakeTiming", c)}
            >
              <Select
                id="intakeTiming"
                value={form.intakeTiming}
                onChange={(e) =>
                  set("intakeTiming", e.target.value as IntakeTiming)
                }
              >
                {(
                  [
                    "Can arrive during normal intake",
                    "Requires late intake",
                    "Unknown",
                  ] as IntakeTiming[]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow
              label="Broad service region"
              fieldKey="region"
              classification={form.fieldClassifications.region}
              onClassification={(c) => setClass("region", c)}
            >
              <Select
                id="region"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
              >
                {REGIONS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldRow>

            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.noUnnecessaryPii}
                onChange={(e) => set("noUnnecessaryPii", e.target.checked)}
              />
              <span>
                This request contains no unnecessary personally identifying
                information.
              </span>
            </label>

            {error ? (
              <p className="text-sm text-rose-700" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="confirm">
                Find compatible providers
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm(defaults)}
              >
                Clear form
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}

export default function PlacementPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
          Loading placement form…
        </div>
      }
    >
      <PlacementForm />
    </Suspense>
  );
}
