"use client";
/**
 * Orders dashboard. Dense, sortable, filterable, keyboard-navigable
 * (↑/↓ select, Enter opens). Compliance dot is derived live from the QC engine.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { runQC, complianceHealth, completenessPct } from "@/lib/qc/rules";
import { daysUntil, fmtDate } from "@/lib/format";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/ui";
import type { OrderStatus } from "@/lib/types";

type SortKey = "id" | "client" | "address" | "product" | "due" | "status";

const STATUS_ORDER: OrderStatus[] = ["New", "Inspected", "In Report", "QC", "Ready", "Delivered"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  New: "bg-zinc-100 text-zinc-700",
  Inspected: "bg-sky-50 text-sky-700",
  "In Report": "bg-indigo-50 text-indigo-700",
  QC: "bg-violet-50 text-violet-700",
  Ready: "bg-emerald-50 text-emerald-700",
  Delivered: "bg-zinc-100 text-zinc-500",
};

export default function OrdersDashboard() {
  const router = useRouter();
  const reports = useAppStore((s) => s.reports);
  const user = useCurrentUser();
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [sortAsc, setSortAsc] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [selected, setSelected] = useState(0);
  const [tour, setTour] = useState(false);

  // /demo lands here with ?tour=1 — guided-tour banner for first-time visitors
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tour") === "1") setTour(true);
  }, []);

  const rows = useMemo(() => {
    const all = Object.values(reports).map((r) => {
      const issues = runQC(r);
      return {
        id: r.orderId,
        client: r.assignment.client,
        address: `${r.subject.address.value ?? "(no address)"}, ${r.subject.city.value ?? ""}`,
        product: r.assignment.productVariant,
        due: r.assignment.dueDate,
        status: r.assignment.status,
        health: complianceHealth(issues),
        blockers: issues.filter((i) => i.severity === "Blocker").length,
        completeness: completenessPct(r),
      };
    });
    const q = query.toLowerCase();
    const filtered = all.filter(
      (r) =>
        (statusFilter === "All" || r.status === statusFilter) &&
        (q === "" || `${r.client} ${r.address} ${r.product} ${r.id}`.toLowerCase().includes(q)),
    );
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "due") cmp = a.due.localeCompare(b.due);
      else if (sortKey === "status") cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortAsc ? cmp : -cmp;
    });
    return filtered;
  }, [reports, sortKey, sortAsc, query, statusFilter]);

  const counts = useMemo(() => {
    const all = Object.values(reports).map((r) => r.assignment);
    return {
      dueToday: all.filter((a) => a.status !== "Delivered" && daysUntil(a.dueDate) === 0).length,
      overdue: all.filter((a) => a.status !== "Delivered" && daysUntil(a.dueDate) < 0).length,
      ready: all.filter((a) => a.status === "Ready").length,
    };
  }, [reports]);

  function header(label: string, key: SortKey) {
    return (
      <th
        onClick={() => {
          if (sortKey === key) setSortAsc(!sortAsc);
          else {
            setSortKey(key);
            setSortAsc(true);
          }
        }}
        className="cursor-pointer select-none px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-800"
      >
        {label} {sortKey === key ? (sortAsc ? "↑" : "↓") : ""}
      </th>
    );
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && rows[selected]) {
      router.push(`/app/orders/${rows[selected].id}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      {tour && (
        <div className="flex items-center justify-between gap-3 border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">
          <span>
            <b>Welcome to the live demo.</b> Open order <b>#1001</b>, click the red blocker in the right-hand
            QC panel, and watch the report unblock itself. Everything is seeded — you can’t break anything.
          </span>
          <button onClick={() => setTour(false)} className="shrink-0 text-xs text-indigo-500 hover:underline">
            Dismiss
          </button>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Orders</h1>
            <p className="text-xs text-zinc-500">
              Welcome back, {user.name.split(" ")[0]} · {user.role}
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <SummaryStat label="Due today" value={counts.dueToday} tone={counts.dueToday > 0 ? "amber" : "zinc"} />
            <SummaryStat label="Overdue" value={counts.overdue} tone={counts.overdue > 0 ? "red" : "zinc"} />
            <SummaryStat label="Ready to deliver" value={counts.ready} tone={counts.ready > 0 ? "green" : "zinc"} />
          </div>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by client, address, product…"
            className="w-64 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "All")}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="All">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="ml-auto text-[11px] text-zinc-400">↑/↓ select · Enter opens</span>
        </div>

        <div
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="overflow-hidden rounded-lg border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="w-8 px-3 py-2" title="Compliance health" />
                {header("Order", "id")}
                {header("Client / AMC", "client")}
                {header("Address", "address")}
                {header("Product", "product")}
                {header("Due", "due")}
                {header("Status", "status")}
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Complete
                </th>
                <th className="w-16 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const overdue = daysUntil(r.due) < 0 && r.status !== "Delivered";
                return (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/app/orders/${r.id}`)}
                    onMouseEnter={() => setSelected(i)}
                    className={`cursor-pointer border-b border-zinc-100 last:border-0 ${
                      i === selected ? "bg-indigo-50/60" : "hover:bg-zinc-50"
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <StatusDot
                        health={r.health}
                        title={r.blockers > 0 ? `${r.blockers} blocker(s)` : undefined}
                      />
                    </td>
                    <td className="num px-3 py-2 font-medium text-zinc-700">#{r.id}</td>
                    <td className="px-3 py-2">{r.client}</td>
                    <td className="max-w-56 truncate px-3 py-2">{r.address}</td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{r.product}</td>
                    <td className={`num px-3 py-2 ${overdue ? "font-semibold text-red-600" : ""}`} suppressHydrationWarning>
                      {fmtDate(r.due)}
                      {overdue ? " ⚠" : ""}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="num px-3 py-2 text-xs text-zinc-500">{r.completeness}%</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/app/orders/${r.id}/inspect`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 hover:underline"
                        title="Mobile inspection view"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-sm text-zinc-400">
                    No orders match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "green" | "zinc" }) {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    zinc: "border-zinc-200 bg-white text-zinc-600",
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-1.5 ${tones}`}>
      <div className="num text-lg font-semibold leading-5" suppressHydrationWarning>{value}</div>
      <div className="text-[11px]">{label}</div>
    </div>
  );
}
