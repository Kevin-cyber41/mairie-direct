import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Search, ChevronLeft, ChevronRight, ArrowUpDown, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORIES, getCategory, STATUSES, type Category, type Status } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mairie/signalements")({
  component: SignalementsPage,
});

type SortKey = "date" | "status" | "category" | "agent";

function SignalementsPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [period, setPeriod] = useState<"all" | "today" | "week" | "month">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["mairie-reports-all"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(1000);
      return data ?? [];
    },
    refetchInterval: 20000,
  });

  const agentNames = useMemo(() => {
    const s = new Set<string>();
    reports.forEach((r) => r.assigned_agent_name && s.add(r.assigned_agent_name));
    return Array.from(s).sort();
  }, [reports]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoffs = {
      today: now - 86400000,
      week: now - 7 * 86400000,
      month: now - 30 * 86400000,
      all: 0,
    };
    const cutoff = cutoffs[period];

    const rows = reports.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (agentFilter !== "all") {
        if (agentFilter === "__none__" ? r.assigned_agent_name : r.assigned_agent_name !== agentFilter) return false;
      }
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (q) {
        const hay = `${r.reference} ${r.description ?? ""} ${r.address ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortKey === "status") cmp = String(a.status).localeCompare(String(b.status));
      else if (sortKey === "category") cmp = String(a.category).localeCompare(String(b.category));
      else if (sortKey === "agent") cmp = String(a.assigned_agent_name ?? "").localeCompare(String(b.assigned_agent_name ?? ""));
      return sortAsc ? cmp : -cmp;
    });

    return rows;
  }, [reports, q, statusFilter, catFilter, agentFilter, period, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc((v) => !v);
    else { setSortKey(k); setSortAsc(false); }
  }

  function exportCSV() {
    const rows = [
      ["Référence", "Catégorie", "Statut", "Adresse", "Description", "Agent", "Date"],
      ...filtered.map((r) => [r.reference, r.category, r.status, r.address ?? "", r.description ?? "", r.assigned_agent_name ?? "", new Date(r.created_at).toISOString()]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signalements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Tous les signalements</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-accent">
          <Download className="h-3.5 w-3.5" /> Exporter CSV
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Recherche par référence, description, adresse…" className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
            <option value="all">Tous statuts</option>
            {(["recu", "en_cours", "resolu"] as Status[]).map((s) => <option key={s} value={s}>{STATUSES[s].label}</option>)}
          </select>
          <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value as any); setPage(1); }} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
            <option value="all">Toutes catégories</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={agentFilter} onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
            <option value="all">Tous agents</option>
            <option value="__none__">Non assignés</option>
            {agentNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={period} onChange={(e) => { setPeriod(e.target.value as any); setPage(1); }} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
            <option value="all">Toute période</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <Th>Réf</Th>
                <Th onSort={() => toggleSort("category")}>Catégorie</Th>
                <Th>Description</Th>
                <Th className="hidden md:table-cell">Adresse</Th>
                <Th onSort={() => toggleSort("status")}>Statut</Th>
                <Th onSort={() => toggleSort("agent")} className="hidden md:table-cell">Agent</Th>
                <Th onSort={() => toggleSort("date")} className="hidden md:table-cell">Date</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Chargement…</td></tr>
              )}
              {!isLoading && pageRows.map((r) => {
                const cat = getCategory(r.category as Category);
                return (
                  <tr key={r.id} className="border-b border-border hover:bg-accent/40">
                    <td className="px-3 py-2.5 font-mono text-xs">#{r.reference}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[220px] truncate">{r.description || "—"}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell max-w-[180px] truncate">{r.address || "—"}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.status as Status} /></td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-xs">{r.assigned_agent_name || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Link to="/mairie/signalement/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-accent">
                        <Eye className="h-3 w-3" /> Détail
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && pageRows.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Aucun signalement</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs">
          <p className="text-muted-foreground">
            {filtered.length === 0 ? "0" : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)}`} sur {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="rounded border border-border bg-background px-1.5 py-1">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-border p-1 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-border p-1 disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children, onSort, className }: { children: React.ReactNode; onSort?: () => void; className?: string }) {
  return (
    <th className={cn("px-3 py-2 font-semibold", className)}>
      {onSort ? (
        <button onClick={onSort} className="inline-flex items-center gap-1 hover:text-foreground">
          {children}<ArrowUpDown className="h-3 w-3" />
        </button>
      ) : children}
    </th>
  );
}
