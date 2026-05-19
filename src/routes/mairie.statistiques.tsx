import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, getCategory, type Category, STATUSES, type Status } from "@/lib/categories";

export const Route = createFileRoute("/mairie/statistiques")({
  component: StatsPage,
});

function StatsPage() {
  const { data: reports = [] } = useQuery({
    queryKey: ["mairie-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*");
      return data ?? [];
    },
  });

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    count: reports.filter((r) => r.category === c.id).length,
  })).sort((a, b) => b.count - a.count);

  const total = reports.length || 1;
  const byStatus: { s: Status; n: number }[] = (["recu", "en_cours", "resolu"] as Status[]).map((s) => ({
    s, n: reports.filter((r) => r.status === s).length,
  }));

  return (
    <div className="flex-1 p-4 md:p-6 max-w-[1200px] w-full mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Statistiques</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de l'activité</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Répartition par statut</h2>
        <div className="space-y-3">
          {byStatus.map(({ s, n }) => (
            <div key={s}>
              <div className="flex justify-between text-sm mb-1">
                <span>{STATUSES[s].label}</span>
                <span className="font-semibold">{n}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${STATUSES[s].dot}`} style={{ width: `${(n / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Répartition par catégorie</h2>
        <div className="space-y-3">
          {byCategory.map((c) => (
            <div key={c.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.label}
                </span>
                <span className="font-semibold">{c.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full" style={{ width: `${(c.count / total) * 100}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
