import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { StatusBadge } from "@/components/status-badge";
import { GoogleMap, type MapMarker } from "@/components/google-map";
import { CATEGORIES, getCategory, timeAgo, type Category, type Status } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/carte")({
  component: CartePage,
});

interface R {
  id: string;
  category: Category;
  status: Status;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

function CartePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Category | "all">("all");

  const { data: reports = [] } = useQuery({
    queryKey: ["all-reports"],
    queryFn: async (): Promise<R[]> => {
      const { data } = await supabase
        .from("reports")
        .select("id,category,status,description,address,latitude,longitude,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []) as R[];
    },
  });

  const filtered = filter === "all" ? reports : reports.filter((r) => r.category === filter);
  const markers: MapMarker[] = useMemo(
    () =>
      filtered
        .filter((r) => r.latitude && r.longitude)
        .map((r) => {
          const cat = getCategory(r.category);
          return {
            id: r.id,
            lat: r.latitude!,
            lng: r.longitude!,
            color: cat.color,
            title: r.description ?? cat.label,
            onClick: () => navigate({ to: "/signalement/$id", params: { id: r.id } }),
          };
        }),
    [filtered, navigate]
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Carte des signalements" />

      <div className="border-b border-border bg-card sticky top-[57px] z-20">
        <div className="mx-auto flex max-w-md gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Tous</FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-md px-4 py-4 space-y-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted">
          <GoogleMap markers={markers} className="h-full w-full" />
        </div>

        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          {filtered.length} signalement{filtered.length > 1 ? "s" : ""}
        </p>

        <div className="space-y-2">
          {filtered.map((r) => {
            const cat = getCategory(r.category);
            return (
              <Link key={r.id} to="/signalement/$id" params={{ id: r.id }} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3 hover:bg-accent/30 transition">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{r.description || cat.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.address || "Sans adresse"} · {timeAgo(r.created_at)}</p>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"
    )}>{children}</button>
  );
}
