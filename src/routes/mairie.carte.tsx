import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GoogleMap, type MapMarker } from "@/components/google-map";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORIES, getCategory, STATUSES, type Category, type Status } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mairie/carte")({
  component: MairieCartePage,
});

function MairieCartePage() {
  const navigate = useNavigate();
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const { data: reports = [] } = useQuery({
    queryKey: ["mairie-map-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("id,reference,category,status,description,address,latitude,longitude,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
    refetchInterval: 20000,
  });

  const filtered = reports.filter(
    (r) =>
      (catFilter === "all" || r.category === catFilter) &&
      (statusFilter === "all" || r.status === statusFilter)
  );

  const markers: MapMarker[] = useMemo(
    () =>
      filtered
        .filter((r) => r.latitude && r.longitude)
        .map((r) => {
          const cat = getCategory(r.category as Category);
          return {
            id: r.id,
            lat: r.latitude as number,
            lng: r.longitude as number,
            color: cat.color,
            title: `#${r.reference} — ${r.description ?? cat.label}`,
            onClick: () => navigate({ to: "/signalement/$id", params: { id: r.id } }),
          };
        }),
    [filtered, navigate]
  );

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 max-w-[1400px] w-full mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Carte des signalements</h1>
        <p className="text-sm text-muted-foreground">{markers.length} signalement{markers.length > 1 ? "s" : ""} géolocalisé{markers.length > 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Tous statuts</Chip>
        {(["recu", "en_cours", "resolu"] as Status[]).map((s) => (
          <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{STATUSES[s].label}</Chip>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <Chip active={catFilter === "all"} onClick={() => setCatFilter("all")}>Toutes catégories</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>{c.label}</Chip>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="relative aspect-video lg:aspect-auto lg:h-[70vh] overflow-hidden rounded-2xl border border-border bg-muted">
          <GoogleMap markers={markers} className="h-full w-full" />
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden max-h-[70vh] flex flex-col">
          <div className="border-b border-border px-4 py-2.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Liste ({filtered.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.map((r) => {
              const cat = getCategory(r.category as Category);
              return (
                <button
                  key={r.id}
                  onClick={() => navigate({ to: "/signalement/$id", params: { id: r.id } })}
                  className="w-full text-left px-4 py-3 hover:bg-accent/30 flex items-start gap-3"
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[11px] text-muted-foreground">#{r.reference}</p>
                      <StatusBadge status={r.status as Status} />
                    </div>
                    <p className="text-sm font-semibold truncate">{r.description || cat.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.address || "Sans adresse"}</p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Aucun signalement</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"
    )}>{children}</button>
  );
}
