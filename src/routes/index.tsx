import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, Map as MapIcon, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { StatusBadge } from "@/components/status-badge";
import { getCategory, timeAgo, type Status, type Category } from "@/lib/categories";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface Report {
  id: string;
  category: Category;
  status: Status;
  description: string | null;
  address: string | null;
  created_at: string;
}

function HomePage() {
  const { user, isAgent } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("status");
      const rows = data ?? [];
      return {
        recu: rows.filter((r) => r.status === "recu").length,
        en_cours: rows.filter((r) => r.status === "en_cours").length,
        resolu: rows.filter((r) => r.status === "resolu").length,
      };
    },
    refetchOnWindowFocus: false,
  });

  const { data: recent } = useQuery({
    queryKey: ["my-recent", user?.id],
    queryFn: async (): Promise<Report[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("reports")
        .select("id,category,status,description,address,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return (data ?? []) as Report[];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="mx-auto max-w-md px-4 py-5 space-y-5">
        {/* Hero */}
        <section className="rounded-3xl bg-primary-soft p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-primary-dark/70 font-semibold">Commune de Romorantin-Lanthenay</p>
          <h2 className="mt-2 text-2xl font-bold text-primary-dark leading-tight">
            Un problème dans votre quartier ?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Signalez-le en moins de 30 secondes.</p>

          <div className="mt-5 space-y-2">
            <Link
              to="/signaler"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" />
              Signaler un problème
            </Link>
            <Link
              to="/carte"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card py-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary-soft"
            >
              <MapIcon className="h-5 w-5" />
              Voir la carte
            </Link>
          </div>
        </section>

        {/* Counters */}
        <section>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Signalements en cours</p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Reçus" value={stats?.recu ?? 0} color="text-[oklch(0.45_0.16_245)]" />
            <StatCard label="En cours" value={stats?.en_cours ?? 0} color="text-[oklch(0.5_0.15_75)]" />
            <StatCard label="Résolus" value={stats?.resolu ?? 0} color="text-primary" />
          </div>
        </section>

        {/* Recent */}
        {user && recent && recent.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Mes signalements récents</p>
              <Link to="/mes-signalements" className="text-xs font-semibold text-primary flex items-center gap-0.5">
                Tout voir <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recent.map((r) => <ReportRow key={r.id} report={r} />)}
            </div>
          </section>
        )}

        {!user && (
          <section className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Connectez-vous pour suivre vos signalements.</p>
            <Link to="/login" className="mt-2 inline-block text-sm font-semibold text-primary">Se connecter →</Link>
          </section>
        )}

        {isAgent && (
          <Link to="/mairie" className="block rounded-2xl bg-gradient-to-r from-primary-dark to-primary p-4 text-primary-foreground">
            <p className="text-xs uppercase tracking-wider opacity-80">Espace mairie</p>
            <p className="text-base font-semibold">Accéder au tableau de bord →</p>
          </Link>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function ReportRow({ report }: { report: Report }) {
  const cat = getCategory(report.category);
  const Icon = cat.icon;
  return (
    <Link
      to="/signalement/$id"
      params={{ id: report.id }}
      className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3 hover:bg-accent/30 transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 15%, transparent)` }}>
        <Icon className="h-5 w-5" style={{ color: cat.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{report.description || cat.label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {cat.label} · {timeAgo(report.created_at)}
        </p>
      </div>
      <StatusBadge status={report.status} />
    </Link>
  );
}
