import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Hash, Calendar, Loader2, Send, ImageOff, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/status-badge";
import { GoogleMap } from "@/components/google-map";
import { getCategory, STATUSES, type Category, type Status } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mairie/signalement/$id")({
  component: MairieDetail,
});

function MairieDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: report, isLoading } = useQuery({
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

  const { data: comments = [] } = useQuery({
    queryKey: ["report-comments", id],
    queryFn: async () => {
      const { data } = await supabase.from("report_comments").select("*").eq("report_id", id).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: agentRoles = [] } = useQuery({
    queryKey: ["agent-list-simple"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const ids = (roles ?? []).filter((r) => r.role === "agent" || r.role === "admin").map((r) => r.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return profs ?? [];
    },
  });

  const [status, setStatus] = useState<Status>("recu");
  const [agentId, setAgentId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    if (!report) return;
    setStatus(report.status as Status);
    setAgentId(report.assigned_agent_id ?? "");
    setMessage(report.message_mairie ?? "");
  }, [report?.id]);

  if (isLoading || !report) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Chargement…</div>;
  }

  const cat = getCategory(report.category as Category);

  async function save() {
    setSaving(true);
    const selectedAgent = agentRoles.find((a) => a.id === agentId);
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        assigned_agent_id: agentId || null,
        assigned_agent_name: selectedAgent?.full_name ?? null,
        message_mairie: message || null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Mis à jour");
    qc.invalidateQueries({ queryKey: ["report", id] });
    qc.invalidateQueries({ queryKey: ["report-history", id] });
    qc.invalidateQueries({ queryKey: ["mairie-reports"] });
    qc.invalidateQueries({ queryKey: ["mairie-reports-all"] });
  }

  async function addComment() {
    if (!comment.trim() || !user) return;
    setSavingComment(true);
    const { error } = await supabase.from("report_comments").insert({
      report_id: id,
      author_id: user.id,
      author_name: user.user_metadata?.full_name ?? user.email,
      body: comment.trim(),
    });
    setSavingComment(false);
    if (error) return toast.error(error.message);
    setComment("");
    qc.invalidateQueries({ queryKey: ["report-comments", id] });
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/mairie/signalements" })} className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">#{report.reference}</span>
            <span>{report.description ? report.description.slice(0, 60) : cat.label}</span>
          </h1>
          <p className="text-xs text-muted-foreground">Détail signalement</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          {/* Photo */}
          {report.photo_url ? (
            <img src={report.photo_url} alt="" className="aspect-[16/10] w-full rounded-2xl object-cover border border-border" />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-border bg-muted">
              <ImageOff className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          {/* Infos */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm">
            <Row icon={Hash}><span className="font-mono">#{report.reference}</span></Row>
            <Row icon={Calendar}>{new Date(report.created_at).toLocaleString("fr-FR")}</Row>
            {report.address && <Row icon={MapPin}>{report.address}</Row>}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
              <span>{cat.label}</span>
            </div>
            {report.description && (
              <p className="pt-2 border-t border-border text-sm">{report.description}</p>
            )}
          </div>

          {/* Mini map */}
          {report.latitude && report.longitude && (
            <div className="aspect-video rounded-2xl overflow-hidden border border-border">
              <GoogleMap
                markers={[{ id: report.id, lat: report.latitude, lng: report.longitude, color: cat.color, title: report.reference }]}
                className="h-full w-full"
              />
            </div>
          )}

          {/* Timeline */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Historique</p>
            <ol className="space-y-3">
              <TimelineItem date={report.created_at} label="Signalement reçu" agent={null} status="recu" />
              {history.map((h) => (
                <TimelineItem key={h.id} date={h.created_at} label={STATUSES[h.status as Status].label} agent={h.agent_name} status={h.status as Status} note={h.note} />
              ))}
            </ol>
          </section>

          {/* Comments */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Commentaires internes ({comments.length})
            </p>
            <div className="space-y-2 mb-3">
              {comments.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun commentaire pour le moment.</p>}
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-muted/40 p-2.5 text-sm">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    <span className="font-semibold text-foreground">{c.author_name ?? "Agent"}</span> · {new Date(c.created_at).toLocaleString("fr-FR")}
                  </p>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                rows={2}
                placeholder="Note interne pour l'équipe…"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
              />
              <button onClick={addComment} disabled={savingComment || !comment.trim()} className="self-end flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                {savingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Ajouter
              </button>
            </div>
          </section>
        </div>

        {/* Right panel: actions */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Statut</p>
            <div><StatusBadge status={report.status as Status} /></div>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {(["recu", "en_cours", "resolu"] as Status[]).map((s) => <option key={s} value={s}>{STATUSES[s].label}</option>)}
            </select>

            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Agent assigné</p>
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">— Non assigné —</option>
                {agentRoles.map((a) => <option key={a.id} value={a.id}>{a.full_name ?? a.id.slice(0, 8)}</option>)}
              </select>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Message au citoyen</p>
              <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 500))} rows={4} placeholder="Votre signalement est en cours…" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
              <p className="text-right text-[10px] text-muted-foreground mt-1">{message.length}/500</p>
            </div>

            <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function TimelineItem({ date, label, agent, status, note }: { date: string; label: string; agent: string | null; status: Status; note?: string | null }) {
  return (
    <li className="flex gap-3">
      <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", STATUSES[status].dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(date).toLocaleString("fr-FR")}{agent ? ` · ${agent}` : ""}
        </p>
        {note && <p className="mt-1 text-xs italic text-muted-foreground">"{note}"</p>}
      </div>
    </li>
  );
}
