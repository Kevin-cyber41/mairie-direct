import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Search, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORIES, getCategory, STATUSES, type Status, type Category } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { AssignPanel } from "@/components/assign-panel";

export const Route = createFileRoute("/mairie/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [filter, setFilter] = useState<Status | Category | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const { data: reports = [] } = useQuery({
    queryKey: ["mairie-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  const stats = {
    total: reports.length,
    today: reports.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString()).length,
    recu: reports.filter((r) => r.status === "recu").length,
    en_cours: reports.filter((r) => r.status === "en_cours").length,
    resolu_mois: reports.filter((r) => r.status === "resolu" && new Date(r.updated_at).getMonth() === new Date().getMonth()).length,
  };
  const resoluRate = stats.total ? Math.round((reports.filter((r) => r.status === "resolu").length / stats.total) * 100) : 0;

  const filtered = reports.filter((r) => {
    if (filter !== "all") {
      if (["recu", "en_cours", "resolu"].includes(filter as string)) {
        if (r.status !== filter) return false;
      } else if (r.category !== filter) return false;
    }
    if (q && !`${r.reference} ${r.description ?? ""} ${r.address ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const selected = reports.find((r) => r.id === selectedId);

  function exportCSV() {
    const rows = [
      ["Référence", "Catégorie", "Statut", "Adresse", "Description", "Date"],
      ...filtered.map((r) => [r.reference, r.category, r.status, r.address ?? "", r.description ?? "", new Date(r.created_at).toISOString()]),
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
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-[1400px] w-full mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de votre commune</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent">
            <Download className="h-3.5 w-3.5" /> Exporter CSV
          </button>
          <button className="rounded-lg border border-border bg-card p-1.5 hover:bg-accent" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatBox title="Total signalements" value={stats.total} sub={`+${stats.today} aujourd'hui`} />
        <StatBox title="Reçus (à traiter)" value={stats.recu} sub="2 urgents" tone="blue" />
        <StatBox title="En cours" value={stats.en_cours} sub="3 agents actifs" tone="amber" />
        <StatBox title="Résolus ce mois" value={stats.resolu_mois} sub={`Taux ${resoluRate}%`} tone="green" />
        <StatBox title="Catégorie top" value={(CATEGORIES.find((c) => c.id === topCat(reports))?.label) || "—"} sub="cette semaine" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* List */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>Tous</Chip>
            {(["recu", "en_cours", "resolu"] as Status[]).map((s) => (
              <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>{STATUSES[s].label}</Chip>
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
            {CATEGORIES.slice(0, 4).map((c) => (
              <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>{c.label}</Chip>
            ))}
            <div className="ml-auto relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche…" className="rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs w-40" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-semibold">Réf</th>
                  <th className="px-3 py-2 font-semibold">Catégorie</th>
                  <th className="px-3 py-2 font-semibold hidden md:table-cell">Adresse</th>
                  <th className="px-3 py-2 font-semibold">Statut</th>
                  <th className="px-3 py-2 font-semibold hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const cat = getCategory(r.category as Category);
                  return (
                    <tr key={r.id} onClick={() => setSelectedId(r.id)} className={cn(
                      "border-b border-border cursor-pointer hover:bg-accent/40",
                      selectedId === r.id && "bg-primary-soft"
                    )}>
                      <td className="px-3 py-2.5 font-mono text-xs">#{r.reference}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell truncate max-w-[200px]">{r.address || "—"}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={r.status as Status} /></td>
                      <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Aucun signalement</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-4 lg:self-start">
          {selected ? (
            <AssignPanel report={selected} />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Sélectionnez un signalement
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function topCat(reports: any[]) {
  const counts: Record<string, number> = {};
  for (const r of reports) counts[r.category] = (counts[r.category] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function StatBox({ title, value, sub, tone }: { title: string; value: string | number; sub?: string; tone?: "blue" | "amber" | "green" }) {
  const ring = tone === "blue" ? "ring-[oklch(0.65_0.16_245)]/30" : tone === "amber" ? "ring-[oklch(0.78_0.15_75)]/30" : tone === "green" ? "ring-primary/30" : "ring-border";
  return (
    <div className={cn("rounded-2xl bg-card border border-border p-4 ring-1", ring)}>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"
    )}>{children}</button>
  );
}
