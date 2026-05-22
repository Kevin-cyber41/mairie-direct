import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Users, UserPlus, Copy, Loader2, ShieldOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inviteAgent, revokeAgent } from "@/lib/agents.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mairie/agents")({
  component: AgentsPage,
});

type AgentRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  assigned: number;
  completed: number;
  rate: number;
};

function AgentsPage() {
  const qc = useQueryClient();
  const invite = useServerFn(inviteAgent);
  const revoke = useServerFn(revokeAgent);
  const [showInvite, setShowInvite] = useState(false);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["mairie-agents"],
    queryFn: async (): Promise<AgentRow[]> => {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("user_id, role");
      const agentIds = Array.from(
        new Set((roleRows ?? []).filter((r) => r.role === "agent" || r.role === "admin").map((r) => r.user_id)),
      );
      if (agentIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", agentIds);
      const { data: reports } = await supabase
        .from("reports")
        .select("assigned_agent_id, status")
        .in("assigned_agent_id", agentIds);

      return agentIds.map((id) => {
        const prof = profiles?.find((p) => p.id === id);
        const mine = (reports ?? []).filter((r) => r.assigned_agent_id === id);
        const completed = mine.filter((r) => r.status === "resolu").length;
        const assigned = mine.length;
        return {
          user_id: id,
          full_name: prof?.full_name ?? null,
          email: null,
          assigned,
          completed,
          rate: assigned ? Math.round((completed / assigned) * 100) : 0,
        };
      });
    },
  });

  const totalAgents = agents.length;
  const avgRate = agents.length
    ? Math.round(agents.reduce((s, a) => s + a.rate, 0) / agents.length)
    : 0;
  const totalAssigned = agents.reduce((s, a) => s + a.assigned, 0);

  return (
    <div className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Agents municipaux</h1>
          <p className="text-sm text-muted-foreground">Gestion de l'équipe terrain.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" /> Ajouter un agent
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat title="Total agents" value={totalAgents} />
        <Stat title="Signalements assignés" value={totalAssigned} />
        <Stat title="Taux moyen" value={`${avgRate}%`} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8" />
          Aucun agent enregistré. Cliquez sur "Ajouter un agent" pour commencer.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((a) => (
            <AgentCard
              key={a.user_id}
              agent={a}
              onRevoke={async () => {
                if (!confirm(`Révoquer l'accès agent de ${a.full_name ?? "ce compte"} ?`)) return;
                try {
                  await revoke({ data: { userId: a.user_id } });
                  toast.success("Accès révoqué");
                  qc.invalidateQueries({ queryKey: ["mairie-agents"] });
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            />
          ))}
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSubmit={async (vals) => {
            const res = await invite({ data: vals });
            qc.invalidateQueries({ queryKey: ["mairie-agents"] });
            return res;
          }}
        />
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function AgentCard({ agent, onRevoke }: { agent: AgentRow; onRevoke: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
          {(agent.full_name ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{agent.full_name ?? "Sans nom"}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{agent.user_id.slice(0, 8)}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Agent</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label="Assignés" value={agent.assigned} />
        <Mini label="Résolus" value={agent.completed} />
        <Mini label="Taux" value={`${agent.rate}%`} accent />
      </div>

      <button
        onClick={onRevoke}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
      >
        <ShieldOff className="h-3.5 w-3.5" /> Révoquer l'accès
      </button>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
      <p className={cn("text-base font-bold", accent && "text-primary")}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function InviteModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (v: { email: string; fullName: string }) => Promise<{ email: string; password: string }>;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await onSubmit({ email, fullName });
      setResult({ email: r.email, password: r.password });
      toast.success("Agent créé");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Nouvel agent</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-primary-soft p-3 text-sm">
              <p className="font-semibold mb-2 flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Compte créé</p>
              <p className="text-xs text-muted-foreground">Communiquez ces identifiants à l'agent :</p>
              <div className="mt-2 space-y-1.5 font-mono text-xs">
                <CopyRow label="Email" value={result.email} />
                <CopyRow label="Mot de passe" value={result.password} />
              </div>
            </div>
            <button onClick={onClose} className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">Fermer</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nom complet</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Jean Dupont" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email professionnel</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="agent@mairie.fr" />
            </div>
            <p className="text-xs text-muted-foreground">Un mot de passe temporaire sera généré automatiquement.</p>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Créer le compte
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
      <span className="flex-1 truncate">{value}</span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Copié");
        }}
        className="rounded p-1 hover:bg-accent"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}
