import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Hash, Calendar, User2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { getCategory, STATUSES, type Category, type Status } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signalement/$id")({
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*").eq("id", id).single();
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["report-history", id],
    queryFn: async () => {
      const { data } = await supabase.from("report_history").select("*").eq("report_id", id).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  if (isLoading || !data) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement…</div>;
  }

  const cat = getCategory(data.category as Category);
  const Icon = cat.icon;

  const timeline = [
    { status: "recu" as Status, date: data.created_at, label: "Signalement reçu", agent: null },
    ...history.map((h) => ({ status: h.status as Status, date: h.created_at, label: STATUSES[h.status as Status].label, agent: h.agent_name })),
  ];
  const currentIdx = ["recu", "en_cours", "resolu"].indexOf(data.status);

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-3">
          <Link to="/mes-signalements" className="rounded-full p-2 hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Détail du signalement</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
          <p className="text-base font-bold">{cat.label}{data.description ? ` — ${data.description}` : ""}</p>
        </div>

        {data.photo_url ? (
          <img src={data.photo_url} alt={cat.label} className="aspect-[4/3] w-full rounded-2xl object-cover border border-border" />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted border border-border">
            <ImageOff className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        <div className="rounded-2xl bg-card border border-border p-4 space-y-2 text-sm">
          {data.address && <Row icon={MapPin}>{data.address}</Row>}
          <Row icon={Calendar}>Signalé le {new Date(data.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</Row>
          <Row icon={Hash}><span className="font-mono">#{data.reference}</span></Row>
        </div>

        <section>
          <p className="mb-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Statut actuel</p>
          <div className="rounded-2xl bg-primary-soft p-4">
            <StatusBadge status={data.status as Status} />
            {data.assigned_agent_name && (
              <p className="mt-2 text-sm flex items-center gap-1.5"><User2 className="h-3.5 w-3.5" /> Agent : {data.assigned_agent_name}</p>
            )}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Suivi du traitement</p>
          <ol className="space-y-3">
            {["recu", "en_cours", "resolu"].map((s, idx) => {
              const entry = timeline.find((t) => t.status === s);
              const reached = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const status = s as Status;
              return (
                <li key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2",
                      reached ? "border-transparent" : "border-border bg-card",
                      isCurrent && "ring-4 ring-primary/20"
                    )} style={reached ? { backgroundColor: status === "resolu" ? "var(--primary)" : status === "en_cours" ? "oklch(0.78 0.15 75)" : "oklch(0.65 0.16 245)" } : {}}>
                      {reached && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {idx < 2 && <span className={cn("w-0.5 flex-1 min-h-6", reached && idx < currentIdx ? "bg-primary" : "bg-border")} />}
                  </div>
                  <div className="pb-3 -mt-0.5">
                    <p className={cn("text-sm font-semibold", !reached && "text-muted-foreground")}>{STATUSES[status].label}</p>
                    {entry && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        {entry.agent ? ` — ${entry.agent}` : ""}
                      </p>
                    )}
                    {!entry && <p className="text-xs text-muted-foreground">En attente</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {data.message_mairie && (
          <section>
            <p className="mb-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Message de la mairie</p>
            <div className="rounded-2xl bg-accent/40 border border-border p-4 text-sm">{data.message_mairie}</div>
          </section>
        )}
      </main>
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-foreground">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
