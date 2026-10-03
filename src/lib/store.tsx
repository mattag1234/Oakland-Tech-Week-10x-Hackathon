"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";
import {
  DEMO_REQUEST,
  INITIAL_ACTIVITY,
  INITIAL_AGENT_TASKS,
  INITIAL_PROVIDERS,
  INITIAL_REFERRALS,
  INITIAL_REQUESTS,
  INITIAL_UNMET,
  nextReferralId,
  recomputeCapacityStatus,
} from "./data";
import { runAgentCycle } from "./agents";
import type {
  AppState,
  DeclineReason,
  PlacementRequest,
  Provider,
  Referral,
  ReferralStatus,
  Role,
} from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "solace-relay-mvp-v1";

const defaultState = (): AppState => ({
  role: "outreach",
  providers: INITIAL_PROVIDERS.map((p) => ({
    ...p,
    capacityStatus: recomputeCapacityStatus(p),
  })),
  requests: INITIAL_REQUESTS,
  referrals: INITIAL_REFERRALS,
  unmetNeeds: INITIAL_UNMET,
  agentTasks: INITIAL_AGENT_TASKS,
  activity: INITIAL_ACTIVITY,
  providerUpdates: [],
  draftRequest: null,
});

interface StoreApi {
  state: AppState;
  hydrated: boolean;
  setRole: (role: Role) => void;
  resetDemo: () => void;
  loadDemoScenario: () => PlacementRequest;
  saveDraft: (draft: Partial<PlacementRequest>) => void;
  submitRequest: (request: PlacementRequest) => PlacementRequest;
  createReferral: (requestId: string, providerId: string) => Referral;
  updateReferral: (
    id: string,
    patch: Partial<Referral>,
    timelineLabel?: string,
    timelineDetail?: string
  ) => void;
  sendReferral: (id: string) => void;
  providerRespond: (
    id: string,
    action: "accept" | "decline" | "clarify",
    opts?: { reason?: DeclineReason; note?: string }
  ) => void;
  updateProvider: (
    id: string,
    patch: Partial<Provider>,
    field: string,
    previousValue: string,
    newValue: string
  ) => void;
  approveProviderUpdate: (updateId: string) => void;
  approveAgentTask: (taskId: string, approve: boolean) => void;
  runAgents: () => void;
  addInternalNote: (referralId: string, note: string) => void;
  getRequest: (id: string) => PlacementRequest | undefined;
  getProvider: (id: string) => Provider | undefined;
  getReferral: (id: string) => Referral | undefined;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        startTransition(() => {
          setState({
            ...defaultState(),
            ...parsed,
            providers: (parsed.providers ?? defaultState().providers).map((p) => ({
              ...p,
              capacityStatus: recomputeCapacityStatus(p),
            })),
          });
        });
      }
    } catch {
      // ignore corrupt storage
    }
    startTransition(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const pushActivity = useCallback(
    (label: string, detail: string) => ({
      id: uid("act"),
      at: new Date().toISOString(),
      label,
      detail,
    }),
    []
  );

  const setRole = useCallback((role: Role) => {
    setState((s) => ({ ...s, role }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = defaultState();
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  const loadDemoScenario = useCallback(() => {
    const req: PlacementRequest = {
      ...DEMO_REQUEST,
      id: uid("req"),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, draftRequest: req, role: "outreach" }));
    return req;
  }, []);

  const saveDraft = useCallback((draft: Partial<PlacementRequest>) => {
    setState((s) => ({
      ...s,
      draftRequest: { ...(s.draftRequest ?? {}), ...draft },
    }));
  }, []);

  const submitRequest = useCallback((request: PlacementRequest) => {
    setState((s) => ({
      ...s,
      requests: [request, ...s.requests],
      draftRequest: null,
      activity: [
        pushActivity(
          "Placement request created",
          `${request.serviceNeeded} · ${request.urgency} · ${request.region}`
        ),
        ...s.activity,
      ],
    }));
    return request;
  }, [pushActivity]);

  const createReferral = useCallback((requestId: string, providerId: string) => {
    const snapshot = { current: null as Referral | null };
    setState((s) => {
      const id = nextReferralId(s.referrals);
      const now = new Date().toISOString();
      const provider = s.providers.find((p) => p.id === providerId);
      const created: Referral = {
        id,
        requestId,
        providerId,
        status: "Ready to send",
        createdAt: now,
        updatedAt: now,
        confirmationDeadline: new Date(
          Date.now() + (provider?.responseWindowHours ?? 4) * 3600000
        ).toISOString(),
        internalNotes: [],
        transportationNeeded: false,
        nextAction: "Review and send referral request to provider.",
        timeline: [
          {
            id: uid("t"),
            at: now,
            actor: "Outreach Worker",
            label: "Referral drafted",
            detail: `Compatible provider selected: ${provider?.name ?? providerId}`,
          },
        ],
      };
      snapshot.current = created;
      return {
        ...s,
        referrals: [created, ...s.referrals],
        activity: [
          pushActivity(`Referral ${id} drafted`, provider?.name ?? providerId),
          ...s.activity,
        ],
      };
    });
    return snapshot.current!;
  }, [pushActivity]);

  const updateReferral = useCallback(
    (
      id: string,
      patch: Partial<Referral>,
      timelineLabel?: string,
      timelineDetail?: string
    ) => {
      setState((s) => ({
        ...s,
        referrals: s.referrals.map((r) => {
          if (r.id !== id) return r;
          const now = new Date().toISOString();
          const timeline = timelineLabel
            ? [
                {
                  id: uid("t"),
                  at: now,
                  actor: s.role === "provider" ? "Provider" : "Staff",
                  label: timelineLabel,
                  detail: timelineDetail,
                },
                ...r.timeline,
              ]
            : r.timeline;
          return { ...r, ...patch, updatedAt: now, timeline };
        }),
      }));
    },
    []
  );

  const sendReferral = useCallback(
    (id: string) => {
      setState((s) => {
        const referral = s.referrals.find((r) => r.id === id);
        if (!referral) return s;
        const provider = s.providers.find((p) => p.id === referral.providerId);
        const request = s.requests.find((r) => r.id === referral.requestId);
        const now = new Date().toISOString();
        return {
          ...s,
          referrals: s.referrals.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "Awaiting provider response" as ReferralStatus,
                  updatedAt: now,
                  nextAction: `Waiting for ${provider?.name ?? "provider"} to respond.`,
                  transportationNeeded:
                    request?.transportation === "Needs transportation" ||
                    request?.transportation === "Requires staff coordination" ||
                    r.transportationNeeded,
                  timeline: [
                    {
                      id: uid("t"),
                      at: now,
                      actor: "Outreach Worker",
                      label: "Referral sent",
                      detail: "Synthetic referral transmitted to provider portal",
                    },
                    ...r.timeline,
                  ],
                }
              : r
          ),
          activity: [
            pushActivity(
              `Referral ${id} sent`,
              `Awaiting response from ${provider?.name ?? "provider"}`
            ),
            ...s.activity,
          ],
        };
      });
    },
    [pushActivity]
  );

  const providerRespond = useCallback(
    (
      id: string,
      action: "accept" | "decline" | "clarify",
      opts?: { reason?: DeclineReason; note?: string }
    ) => {
      setState((s) => {
        const referral = s.referrals.find((r) => r.id === id);
        if (!referral) return s;
        const provider = s.providers.find((p) => p.id === referral.providerId);
        const request = s.requests.find((r) => r.id === referral.requestId);
        const now = new Date().toISOString();

        if (action === "accept") {
          const providers = s.providers.map((p) => {
            if (p.id !== referral.providerId) return p;
            const capacity = Math.max(0, p.capacity - 1);
            const updated = {
              ...p,
              capacity,
              lastConfirmedAt: now,
              lastConfirmedBy: `${p.name} (portal)`,
              confirmationSource: "Provider accept action",
            };
            return {
              ...updated,
              capacityStatus: recomputeCapacityStatus(updated),
            };
          });
          return {
            ...s,
            providers,
            referrals: s.referrals.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: "Placement accepted" as ReferralStatus,
                    updatedAt: now,
                    nextAction:
                      "Next step confirmed — prepare participant handoff card and coordinate intake.",
                    timeline: [
                      {
                        id: uid("t"),
                        at: now,
                        actor: provider?.name ?? "Provider",
                        label: "Placement accepted",
                        detail: `Capacity updated to ${Math.max(0, (provider?.capacity ?? 1) - 1)} ${provider?.capacityUnit ?? "beds"}`,
                      },
                      ...r.timeline,
                    ],
                  }
                : r
            ),
            activity: [
              pushActivity(
                `${id} accepted`,
                `${provider?.name ?? "Provider"} confirmed placement`
              ),
              ...s.activity,
            ],
          };
        }

        if (action === "decline") {
          const reason = opts?.reason ?? "Other";
          const unmet = {
            id: uid("un"),
            referralId: id,
            at: now,
            category: reason,
            serviceNeeded: request?.serviceNeeded ?? "Emergency shelter",
            region: request?.region ?? provider?.region ?? "Unknown",
            detail: `${provider?.name ?? "Provider"} declined ${id}: ${reason}`,
          };
          return {
            ...s,
            unmetNeeds: [unmet, ...s.unmetNeeds],
            referrals: s.referrals.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: "Declined" as ReferralStatus,
                    declineReason: reason,
                    updatedAt: now,
                    nextAction:
                      "Return to compatible provider options and log unmet need for County learning.",
                    timeline: [
                      {
                        id: uid("t"),
                        at: now,
                        actor: provider?.name ?? "Provider",
                        label: "Declined",
                        detail: reason,
                      },
                      ...r.timeline,
                    ],
                  }
                : r
            ),
            activity: [
              pushActivity(`${id} declined`, reason),
              ...s.activity,
            ],
          };
        }

        // clarify
        return {
          ...s,
          referrals: s.referrals.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "Clarification requested" as ReferralStatus,
                  clarificationNote: opts?.note ?? "Please clarify requirements.",
                  updatedAt: now,
                  nextAction: "Outreach should respond to provider clarification.",
                  timeline: [
                    {
                      id: uid("t"),
                      at: now,
                      actor: provider?.name ?? "Provider",
                      label: "Clarification requested",
                      detail: opts?.note,
                    },
                    ...r.timeline,
                  ],
                }
              : r
          ),
          activity: [
            pushActivity(`${id} needs clarification`, opts?.note ?? ""),
            ...s.activity,
          ],
        };
      });
    },
    [pushActivity]
  );

  const updateProvider = useCallback(
    (
      id: string,
      patch: Partial<Provider>,
      field: string,
      previousValue: string,
      newValue: string
    ) => {
      setState((s) => {
        const now = new Date().toISOString();
        const update = {
          id: uid("pu"),
          providerId: id,
          at: now,
          by: s.role === "provider" ? "Provider portal user" : "County ops",
          field,
          previousValue,
          newValue,
          confirmationSource: "Provider portal editor",
          approved: s.role === "provider",
        };
        return {
          ...s,
          providerUpdates: [update, ...s.providerUpdates],
          providers: s.providers.map((p) => {
            if (p.id !== id) return p;
            const next = {
              ...p,
              ...patch,
              lastConfirmedAt: now,
              lastConfirmedBy: update.by,
              confirmationSource: update.confirmationSource,
            };
            return {
              ...next,
              capacityStatus: recomputeCapacityStatus(next),
            };
          }),
          activity: [
            pushActivity(`Provider profile updated`, `${field}: ${previousValue} → ${newValue}`),
            ...s.activity,
          ],
        };
      });
    },
    [pushActivity]
  );

  const approveProviderUpdate = useCallback((updateId: string) => {
    setState((s) => ({
      ...s,
      providerUpdates: s.providerUpdates.map((u) =>
        u.id === updateId ? { ...u, approved: true } : u
      ),
    }));
  }, []);

  const approveAgentTask = useCallback((taskId: string, approve: boolean) => {
    setState((s) => ({
      ...s,
      agentTasks: s.agentTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              humanApproval: approve ? "Approved" : "Rejected",
              result: approve
                ? "Approved — synthetic action recorded"
                : "Rejected — no change applied",
            }
          : t
      ),
    }));
  }, []);

  const runAgents = useCallback(() => {
    setState((s) => {
      const result = runAgentCycle(s);
      return {
        ...s,
        agentTasks: result.tasks,
        providers: result.providers,
        activity: [
          pushActivity("Agent cycle completed", result.activityLabel),
          ...s.activity,
        ],
      };
    });
  }, [pushActivity]);

  const addInternalNote = useCallback((referralId: string, note: string) => {
    setState((s) => ({
      ...s,
      referrals: s.referrals.map((r) =>
        r.id === referralId
          ? { ...r, internalNotes: [note, ...r.internalNotes] }
          : r
      ),
    }));
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      hydrated,
      setRole,
      resetDemo,
      loadDemoScenario,
      saveDraft,
      submitRequest,
      createReferral,
      updateReferral,
      sendReferral,
      providerRespond,
      updateProvider,
      approveProviderUpdate,
      approveAgentTask,
      runAgents,
      addInternalNote,
      getRequest: (id) => state.requests.find((r) => r.id === id),
      getProvider: (id) => state.providers.find((p) => p.id === id),
      getReferral: (id) => state.referrals.find((r) => r.id === id),
    }),
    [
      state,
      hydrated,
      setRole,
      resetDemo,
      loadDemoScenario,
      saveDraft,
      submitRequest,
      createReferral,
      updateReferral,
      sendReferral,
      providerRespond,
      updateProvider,
      approveProviderUpdate,
      approveAgentTask,
      runAgents,
      addInternalNote,
    ]
  );

  return (
    <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const ROLE_LABELS: Record<Role, string> = {
  outreach: "Outreach Worker",
  provider: "Provider",
  county_ops: "County Operations Manager",
  county_analyst: "County Analyst",
};
