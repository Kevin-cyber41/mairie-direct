import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MapPin, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "./status-badge";
import { getCategory, STATUSES, type Status, type Category } from "@/lib/categories";

export function AssignPanel({ report }: { report: any }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>(report.status);
  const [agent, setAgent] = useState(report.assigned_agent_name ?? "");
  const [message, setMessage] = useState(report.message_mairie ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(report.status);
    setAgent(report.assigned_agent_name ?? "");
    setMessage(report.message_mairie ?? "");
  }, [report.id]);

  const cat = getCategory(report.category as Category);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("reports").update({
      status,
      assigned_agent_name: agent || null,
      message_mairie: message || null,
    }).eq("id", report.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signalement mis à jour");
    qc.invalidateQueries({ queryKey: ["mairie-reports"] });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Détail sélectionné</p>
        <p className="font-mono text-sm font-bold">#{report.reference}</p>
      </div>

      {report.photo_url && <img src={report.photo_url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />}

      <dl className="space-y-2 text-sm">
        <Row label="Catégorie">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
            {cat.label}
          </span>
        </Row>
        {report.address && <Row label="Adresse">{report.address}</Row>}
        <Row label="Signalé le">{new Date(report.created_at).toLocaleString("fr-FR")}</Row>
      </dl>

      <hr className="border-border" />

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Changer le statut</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
          {(["recu", "en_cours", "resolu"] as Status[]).map((s) => (
            <option key={s} value={s}>{STATUSES[s].label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigner un agent</label>
        <input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Jean Dupont" className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message au citoyen</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 500))} rows={3} placeholder="Votre signalement a été pris en compte…" className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm resize-none" />
      </div>

      <button disabled={saving} onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{children}</dd>
    </div>
  );
}
