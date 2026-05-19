import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { StatusBadge } from "@/components/status-badge";
import { getCategory, timeAgo, STATUSES, type Status, type Category } from "@/lib/categories";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mes-signalements")({
  component: MyReports,
});

function MyReports() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<Status | "all">("all");

  const { data: reports = [] } = useQuery({
    queryKey: ["my-reports", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("reports")
        .select("id,category,status,description,address,created_at,photo_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="Mes signalements" />
        <main className="mx-auto max-w-md px-4 py-10 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour voir vos signalements.</p>
          <Link to="/login" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Se connecter</Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Mes signalements" />
      <div className="border-b border-border bg-card sticky top-[57px] z-20">
        <div className="mx-auto flex max-w-md gap-2 overflow-x-auto px-4 py-2.5">
          {(["all", "recu", "en_cours", "resolu"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
              filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            )}>
              {s === "all" ? "Tous" : STATUSES[s].label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-md px-4 py-4 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Aucun signalement pour ce filtre.</p>
            <Link to="/signaler" className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Signaler un problème</Link>
          </div>
        )}
        {filtered.map((r) => {
          const cat = getCategory(r.category as Category);
          const Icon = cat.icon;
          return (
            <Link key={r.id} to="/signalement/$id" params={{ id: r.id }} className="flex gap-3 rounded-2xl bg-card border border-border p-3 hover:bg-accent/30">
              {r.photo_url ? (
                <img src={r.photo_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 15%, transparent)` }}>
                  <Icon className="h-6 w-6" style={{ color: cat.color }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{cat.label}</p>
                  <StatusBadge status={r.status as Status} />
                </div>
                <p className="text-sm font-semibold truncate">{r.description || `Signalement ${cat.label}`}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
              </div>
            </Link>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
}
