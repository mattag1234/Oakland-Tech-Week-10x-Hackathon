"use client";

import { AGENT_CATALOG } from "@/lib/agents";
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

export default function AgentsPage() {
  const { state, runAgents, approveAgentTask, approveProviderUpdate, setRole } =
    useStore();

  const pendingUpdates = state.providerUpdates.filter((u) => !u.approved);
  const stale = state.providers.filter(
    (p) => p.capacityStatus === "Needs confirmation"
  );

  return (
    <div>
      <PageHeader
        title="Supervised coordination agents"
        subtitle="AI assists with verification, follow-up, data quality, and summarization — it does not decide who receives shelter."
        actions={
          <Button
            variant="confirm"
            onClick={() => {
              setRole("county_ops");
              runAgents();
            }}
          >
            Run agent cycle
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase text-slate-500">Pending tasks</p>
            <p className="font-display text-2xl font-semibold">
              {state.agentTasks.filter((t) => t.humanApproval === "Pending").length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase text-slate-500">Stale providers</p>
            <p className="font-display text-2xl font-semibold">{stale.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase text-slate-500">
              Profile updates awaiting approval
            </p>
            <p className="font-display text-2xl font-semibold">
              {pendingUpdates.length}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENT_CATALOG.map((agent) => (
          <Card key={agent.name}>
            <CardHeader>
              <h2 className="font-display text-base font-semibold">
                {agent.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{agent.summary}</p>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <p className="rounded-lg bg-slate-50 p-3 text-slate-700">
                Example: {agent.example}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => runAgents()}
              >
                Propose tasks
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-display text-lg font-semibold">
            Agent activity log
          </h2>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Task</th>
                <th className="pb-2 font-medium">Proposed action</th>
                <th className="pb-2 font-medium">Approval</th>
                <th className="pb-2 font-medium">Result</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.agentTasks.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 align-top">
                  <td className="py-3 text-xs text-slate-500">
                    {formatRelative(t.createdAt)}
                  </td>
                  <td className="py-3 font-medium">{t.agent}</td>
                  <td className="py-3">
                    <p>{t.task}</p>
                    <p className="mt-1 text-xs text-slate-500">{t.reasoning}</p>
                  </td>
                  <td className="py-3 text-slate-700">{t.proposedAction}</td>
                  <td className="py-3">
                    <Badge
                      tone={
                        t.humanApproval === "Approved" ||
                        t.humanApproval === "Auto-logged"
                          ? "ok"
                          : t.humanApproval === "Rejected"
                            ? "danger"
                            : "warn"
                      }
                    >
                      {t.humanApproval}
                    </Badge>
                  </td>
                  <td className="py-3 text-slate-600">{t.result}</td>
                  <td className="py-3">
                    {t.humanApproval === "Pending" ? (
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="confirm"
                          onClick={() => approveAgentTask(t.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => approveAgentTask(t.id, false)}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {pendingUpdates.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold">
              Proposed provider-data updates
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {pendingUpdates.map((u) => {
              const p = state.providers.find((x) => x.id === u.providerId);
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {p?.name}: {u.field}
                    </p>
                    <p className="text-xs">
                      {u.previousValue} → {u.newValue}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="confirm"
                    onClick={() => approveProviderUpdate(u.id)}
                  >
                    Approve update
                  </Button>
                </div>
              );
            })}
          </CardBody>
        </Card>
      ) : null}

      {stale.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Stale providers after agent cycle:{" "}
          {stale.map((p) => p.name).join(", ")}. Status remains{" "}
          <Badge tone={statusTone("Needs confirmation")}>Needs confirmation</Badge>{" "}
          — not unavailable.
        </div>
      ) : null}
    </div>
  );
}
