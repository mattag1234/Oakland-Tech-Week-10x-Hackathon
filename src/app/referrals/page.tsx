"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";
import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  statusTone,
} from "@/components/ui";

export default function ReferralsPage() {
  const { state } = useStore();

  return (
    <div>
      <PageHeader
        title="Referral Tracking"
        subtitle="Track referral status from draft through confirmed next step."
      />

      {state.referrals.length === 0 ? (
        <EmptyState
          title="No referrals yet"
          detail="Draft a referral from compatible provider options."
        />
      ) : (
        <Card>
          <CardBody className="overflow-x-auto pt-5">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Referral</th>
                  <th className="pb-3 font-medium">Provider</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Updated</th>
                  <th className="pb-3 font-medium">Next action</th>
                </tr>
              </thead>
              <tbody>
                {state.referrals.map((r) => {
                  const provider = state.providers.find(
                    (p) => p.id === r.providerId
                  );
                  return (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-3">
                        <Link
                          href={`/referrals/${r.id}`}
                          className="font-semibold text-teal-800 hover:underline"
                        >
                          {r.id}
                        </Link>
                      </td>
                      <td className="py-3">{provider?.name}</td>
                      <td className="py-3">
                        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                      </td>
                      <td className="py-3 text-slate-600">
                        {formatRelative(r.updatedAt)}
                      </td>
                      <td className="py-3 text-slate-600">{r.nextAction}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
