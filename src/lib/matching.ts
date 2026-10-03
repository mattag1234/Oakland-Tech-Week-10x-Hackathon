import type {
  MatchResult,
  NeedClassification,
  PlacementRequest,
  Provider,
} from "./types";
import { freshnessLabel } from "./data";

function classify(
  need: string,
  classification: NeedClassification
): { need: string; classification: NeedClassification } {
  return { need, classification };
}

export function matchProviders(
  request: PlacementRequest,
  providers: Provider[]
): MatchResult[] {
  return providers
    .map((provider) => evaluate(request, provider))
    .sort((a, b) => {
      if (a.selectable !== b.selectable) return a.selectable ? -1 : 1;
      if (a.compatible !== b.compatible) return a.compatible ? -1 : 1;
      return b.score - a.score;
    });
}

function evaluate(request: PlacementRequest, provider: Provider): MatchResult {
  const reasonsFit: string[] = [];
  const reasonsNot: string[] = [];
  const classifications: { need: string; classification: NeedClassification }[] =
    [];
  let score = 0;
  let hardFail = false;

  // Protected safety pathway — never expose confidential DV locations
  if (request.genderSafety === "Protected safety pathway") {
    classifications.push(
      classify("Protected safety pathway", "Hard requirement")
    );
    if (!provider.protectedSafetyPathway) {
      hardFail = true;
      reasonsNot.push(
        "This request requires a protected safety pathway; only designated secure-contact providers are shown with general region only."
      );
    } else {
      reasonsFit.push(
        "Provider supports protected safety pathway coordination (secure contact only — no confidential location disclosed)."
      );
      score += 30;
    }
  }

  // Service type
  classifications.push(classify("Service needed", "Hard requirement"));
  if (provider.serviceTypes.includes(request.serviceNeeded)) {
    reasonsFit.push(`Offers ${request.serviceNeeded}`);
    score += 40;
  } else {
    hardFail = true;
    reasonsNot.push(`Does not offer ${request.serviceNeeded}`);
  }

  // Household
  classifications.push(classify("Household type", "Hard requirement"));
  if (provider.householdTypes.includes(request.householdType)) {
    reasonsFit.push(`Serves ${request.householdType.toLowerCase()} households`);
    score += 20;
  } else {
    hardFail = true;
    reasonsNot.push(`Does not serve ${request.householdType.toLowerCase()} households`);
  }

  // Gender / safety
  if (request.genderSafety !== "None" && request.genderSafety !== "Protected safety pathway") {
    classifications.push(classify("Gender / safety requirement", "Hard requirement"));
    if (provider.genderSafety.includes(request.genderSafety)) {
      reasonsFit.push(`Meets ${request.genderSafety} requirement`);
      score += 25;
    } else {
      hardFail = true;
      reasonsNot.push(`Does not meet ${request.genderSafety} requirement`);
    }
  } else if (request.genderSafety === "None") {
    classifications.push(classify("Gender / safety requirement", "Preference"));
  }

  // Accessibility
  if (request.accessibility !== "No specific requirement") {
    classifications.push(classify("Accessibility", "Operational barrier"));
    if (provider.accessibility.includes(request.accessibility)) {
      reasonsFit.push(`Supports ${request.accessibility.toLowerCase()}`);
      score += 18;
    } else {
      hardFail = true;
      reasonsNot.push(`Missing accessibility: ${request.accessibility}`);
    }
  }

  // Pets
  classifications.push(
    classify(
      "Pet",
      request.pet === "No pet" ? "Preference" : "Operational barrier"
    )
  );
  if (request.pet === "Pet accompanying person") {
    if (/pet/i.test(provider.petPolicy) && !/no pets/i.test(provider.petPolicy)) {
      reasonsFit.push("Pet-friendly policy");
      score += 12;
    } else {
      hardFail = true;
      reasonsNot.push("Does not accept accompanying pets");
    }
  } else if (request.pet === "Service animal") {
    if (/service animal/i.test(provider.petPolicy)) {
      reasonsFit.push("Accommodates service animals");
      score += 12;
    } else {
      reasonsNot.push("Service animal accommodation not confirmed");
      score -= 5;
    }
  }

  // Language
  classifications.push(classify("Language", "Preference"));
  if (provider.languages.includes(request.language)) {
    reasonsFit.push(`Staff language support includes ${request.language}`);
    score += 8;
  } else {
    reasonsNot.push(`${request.language} not listed among confirmed languages`);
  }

  // Transportation
  classifications.push(classify("Transportation", "Operational barrier"));
  if (request.transportation === "Needs transportation") {
    if (
      provider.transportationSupport.some((t) =>
        /coordinate|voucher|pickup|transit/i.test(t)
      )
    ) {
      reasonsFit.push("Can help with transportation coordination");
      score += 10;
    } else {
      reasonsNot.push("Limited transportation support — may need staff coordination");
      score -= 4;
    }
  } else if (request.transportation === "Transit accessible") {
    if (provider.transportationSupport.some((t) => /transit/i.test(t))) {
      reasonsFit.push("Transit accessible");
      score += 6;
    }
  }

  // Intake timing
  classifications.push(
    classify(
      "Intake timing",
      request.intakeTiming === "Unknown" ? "Unknown" : "Operational barrier"
    )
  );
  if (request.intakeTiming === "Requires late intake") {
    if (provider.lateIntake) {
      reasonsFit.push("Supports late intake");
      score += 12;
    } else {
      hardFail = true;
      reasonsNot.push("Does not offer late intake");
    }
  }

  // Documents
  classifications.push(
    classify(
      "Documents",
      request.documents === "Unknown" ? "Unknown" : "Operational barrier"
    )
  );
  if (
    request.documents === "Missing identification" ||
    request.documents === "Missing documents"
  ) {
    if (/missing id|attestation|helps obtain|none required|none for/i.test(provider.requiredDocuments)) {
      reasonsFit.push("Can proceed with missing identification / documents");
      score += 8;
    } else if (/required/i.test(provider.requiredDocuments)) {
      reasonsNot.push("Documents are typically required — confirm before arrival");
      score -= 6;
    }
  }

  // Urgency / response window
  classifications.push(classify("Urgency", "Hard requirement"));
  if (request.urgency === "Tonight" && provider.responseWindowHours <= 4) {
    reasonsFit.push(`Fast response window (~${provider.responseWindowHours}h)`);
    score += 8;
  }

  // Capacity & freshness — stale is NOT unavailable
  if (provider.capacity <= 0 || provider.capacityStatus === "No current usable space") {
    reasonsNot.push("No current usable space");
    hardFail = true;
  } else {
    reasonsFit.push(
      `${provider.capacity} ${provider.capacityUnit} listed · ${freshnessLabel(provider)}`
    );
    score += 5;
    if (provider.capacityStatus === "Needs confirmation") {
      reasonsFit.push("Capacity needs confirmation before referring — not marked unavailable");
      score -= 2;
    }
  }

  // Region soft match
  classifications.push(classify("Region", "Preference"));
  if (provider.region === request.region || /countywide/i.test(provider.region)) {
    reasonsFit.push(`Serves ${provider.region}`);
    score += 6;
  } else {
    reasonsNot.push(`General region differs (${provider.region})`);
  }

  const compatible = !hardFail;
  const selectable =
    compatible &&
    provider.capacity > 0 &&
    provider.capacityStatus !== "No current usable space" &&
    !provider.temporaryClosure;

  return {
    provider,
    compatible,
    selectable,
    score,
    reasonsFit,
    reasonsNot,
    classifications,
  };
}

export type ProviderSort =
  | "best"
  | "recent"
  | "fastest"
  | "transportation"
  | "accessibility"
  | "language"
  | "pet"
  | "late";

export function sortMatches(
  matches: MatchResult[],
  sort: ProviderSort,
  request: PlacementRequest
): MatchResult[] {
  const copy = [...matches];
  switch (sort) {
    case "recent":
      return copy.sort(
        (a, b) =>
          new Date(b.provider.lastConfirmedAt).getTime() -
          new Date(a.provider.lastConfirmedAt).getTime()
      );
    case "fastest":
      return copy.sort(
        (a, b) => a.provider.responseWindowHours - b.provider.responseWindowHours
      );
    case "transportation":
      return copy.sort((a, b) => {
        const score = (m: MatchResult) =>
          m.provider.transportationSupport.some((t) =>
            /coordinate|voucher|transit/i.test(t)
          )
            ? 1
            : 0;
        return score(b) - score(a);
      });
    case "accessibility":
      return copy.sort((a, b) => {
        const need = request.accessibility;
        const score = (m: MatchResult) =>
          need === "No specific requirement"
            ? m.provider.accessibility.length
            : m.provider.accessibility.includes(need)
              ? 1
              : 0;
        return score(b) - score(a);
      });
    case "language":
      return copy.sort((a, b) => {
        const score = (m: MatchResult) =>
          m.provider.languages.includes(request.language) ? 1 : 0;
        return score(b) - score(a);
      });
    case "pet":
      return copy.sort((a, b) => {
        const score = (m: MatchResult) =>
          /pet/i.test(m.provider.petPolicy) &&
          !/^no pets$/i.test(m.provider.petPolicy)
            ? 1
            : 0;
        return score(b) - score(a);
      });
    case "late":
      return copy.sort(
        (a, b) => Number(b.provider.lateIntake) - Number(a.provider.lateIntake)
      );
    default:
      return copy;
  }
}

export function relayAssistantTips(
  request: PlacementRequest,
  matches: MatchResult[]
): string[] {
  const selectable = matches.filter((m) => m.selectable);
  const tips: string[] = [];
  tips.push(
    "Relay Assistant compares minimum necessary requirements to provider profiles. It does not decide eligibility, rank deservingness, predict success, invent capacity, or override providers."
  );
  if (selectable.length === 0) {
    tips.push(
      "No currently selectable providers match all hard requirements. Consider updating operational barriers, requesting provider confirmation, or reviewing unmet-need patterns with County ops."
    );
  } else {
    tips.push(
      `${selectable.length} provider${selectable.length === 1 ? "" : "s"} currently selectable. Prefer recently confirmed capacity when urgency is Tonight.`
    );
  }
  if (request.transportation === "Needs transportation") {
    tips.push(
      "Transportation is an operational barrier — confirm pickup or transit support before sending the person."
    );
  }
  if (request.genderSafety === "Protected safety pathway") {
    tips.push(
      "Protected safety pathway active: only secure-contact details are shown. Confidential shelter locations are never displayed."
    );
  }
  const stale = selectable.filter(
    (m) => m.provider.capacityStatus === "Needs confirmation"
  );
  if (stale.length) {
    tips.push(
      `${stale.length} selectable option${stale.length === 1 ? "" : "s"} need confirmation. Stale data means “Confirm before referring,” not unavailable.`
    );
  }
  return tips;
}
