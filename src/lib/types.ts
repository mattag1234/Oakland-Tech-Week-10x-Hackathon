export type Role =
  | "outreach"
  | "provider"
  | "county_ops"
  | "county_analyst";

export type Urgency = "Tonight" | "Within 24 hours" | "Within 72 hours";

export type HouseholdType =
  | "Single adult"
  | "Couple"
  | "Family with children"
  | "Youth"
  | "Older adult";

export type ServiceNeeded =
  | "Emergency shelter"
  | "Safe parking"
  | "Day services"
  | "Recuperative care"
  | "Temporary housing"
  | "Housing navigation"
  | "Document assistance"
  | "Transportation assistance";

export type GenderSafety =
  | "None"
  | "Women-only"
  | "Men-only"
  | "Family-only"
  | "LGBTQ+ affirming"
  | "Protected safety pathway";

export type AccessibilityNeed =
  | "No specific requirement"
  | "Wheelchair accessible"
  | "Ground-floor access"
  | "Accessible restroom"
  | "Medical respite"
  | "Service animal accommodation";

export type PetStatus = "No pet" | "Pet accompanying person" | "Service animal";

export type Language =
  | "English"
  | "Spanish"
  | "Cantonese"
  | "Mandarin"
  | "Vietnamese"
  | "Other";

export type TransportationNeed =
  | "Has transportation"
  | "Needs transportation"
  | "Transit accessible"
  | "Requires staff coordination";

export type DocumentStatus =
  | "Has required documents"
  | "Missing identification"
  | "Missing documents"
  | "Unknown";

export type IntakeTiming =
  | "Can arrive during normal intake"
  | "Requires late intake"
  | "Unknown";

export type FieldClassification =
  | "Required"
  | "Operational barrier"
  | "Preference"
  | "Unknown"
  | "Declined to answer";

export type CapacityStatus =
  | "Confirmed recently"
  | "Needs confirmation"
  | "No current usable space";

export type ReferralStatus =
  | "Ready to send"
  | "Awaiting provider response"
  | "Clarification requested"
  | "Placement accepted"
  | "Declined"
  | "Expired"
  | "Cancelled"
  | "Participant handoff confirmed"
  | "Arrival confirmed"
  | "Arrival not confirmed";

export type DeclineReason =
  | "No capacity"
  | "Transportation barrier"
  | "Documents required"
  | "Intake timing mismatch"
  | "Service type mismatch"
  | "Accessibility mismatch"
  | "Household type mismatch"
  | "Other";

export type NeedClassification =
  | "Hard requirement"
  | "Operational barrier"
  | "Preference"
  | "Unknown";

export interface PlacementRequest {
  id: string;
  createdAt: string;
  urgency: Urgency;
  householdType: HouseholdType;
  householdSize: number;
  serviceNeeded: ServiceNeeded;
  genderSafety: GenderSafety;
  accessibility: AccessibilityNeed;
  pet: PetStatus;
  language: Language;
  transportation: TransportationNeed;
  documents: DocumentStatus;
  intakeTiming: IntakeTiming;
  region: string;
  noUnnecessaryPii: boolean;
  fieldClassifications: Partial<Record<string, FieldClassification>>;
}

export interface Provider {
  id: string;
  name: string;
  serviceTypes: ServiceNeeded[];
  region: string;
  capacity: number;
  capacityUnit: "beds" | "spaces" | "appointments";
  capacityStatus: CapacityStatus;
  lastConfirmedAt: string;
  lastConfirmedBy: string;
  confirmationSource: string;
  intakeHours: string;
  intakeCutoff: string;
  lateIntake: boolean;
  accessibility: AccessibilityNeed[];
  languages: Language[];
  transportationSupport: string[];
  petPolicy: string;
  requiredDocuments: string;
  genderSafety: GenderSafety[];
  householdTypes: HouseholdType[];
  protectedSafetyPathway: boolean;
  temporaryClosure: boolean;
  responseWindowHours: number;
  notes: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  actor: string;
  label: string;
  detail?: string;
}

export interface Referral {
  id: string;
  requestId: string;
  providerId: string;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  confirmationDeadline: string;
  declineReason?: DeclineReason;
  clarificationNote?: string;
  internalNotes: string[];
  transportationNeeded: boolean;
  nextAction: string;
  timeline: TimelineEvent[];
  handoffConfirmedAt?: string;
}

export interface UnmetNeedEvent {
  id: string;
  referralId: string;
  at: string;
  category: DeclineReason | string;
  serviceNeeded: ServiceNeeded;
  region: string;
  detail: string;
}

export interface AgentTask {
  id: string;
  agent:
    | "Provider Registry"
    | "Referral Coordination"
    | "Capacity Verification"
    | "Data Quality"
    | "Unmet-Need Insight"
    | "Safety Guardrail";
  createdAt: string;
  task: string;
  proposedAction: string;
  reasoning: string;
  humanApproval: "Pending" | "Approved" | "Rejected" | "Auto-logged";
  result: string;
}

export interface ActivityEvent {
  id: string;
  at: string;
  label: string;
  detail: string;
}

export interface ProviderUpdate {
  id: string;
  providerId: string;
  at: string;
  by: string;
  field: string;
  previousValue: string;
  newValue: string;
  confirmationSource: string;
  approved: boolean;
}

export interface AppState {
  role: Role;
  providers: Provider[];
  requests: PlacementRequest[];
  referrals: Referral[];
  unmetNeeds: UnmetNeedEvent[];
  agentTasks: AgentTask[];
  activity: ActivityEvent[];
  providerUpdates: ProviderUpdate[];
  draftRequest: Partial<PlacementRequest> | null;
}

export interface MatchResult {
  provider: Provider;
  compatible: boolean;
  selectable: boolean;
  score: number;
  reasonsFit: string[];
  reasonsNot: string[];
  classifications: { need: string; classification: NeedClassification }[];
}
