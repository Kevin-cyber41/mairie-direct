import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES } from "@/lib/categories";
import { Bell, Building2, MapPin, Tag, ShieldCheck, FileText } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/mairie/parametres")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [notifs, setNotifs] = useState({ new: true, msg: true, status: true });

  return (
    <div className="flex-1 p-6 max-w-[1000px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Réglages de l'application et de la commune.</p>
      </div>

      <Card icon={<Building2 className="h-4 w-4" />} title="Commune">
        <Row label="Nom" value="Romorantin-Lanthenay" />
        <Row label="Code postal" value="41200" />
        <Row label="Coordonnées GPS" value="47.3573 N, 1.7415 E" />
        <Row label="Rayon de couverture" value="6 km" />
      </Card>

      <Card icon={<Bell className="h-4 w-4" />} title="Notifications">
        <Toggle label="Nouveaux signalements" value={notifs.new} onChange={(v) => setNotifs((p) => ({ ...p, new: v }))} />
        <Toggle label="Messages des citoyens" value={notifs.msg} onChange={(v) => setNotifs((p) => ({ ...p, msg: v }))} />
        <Toggle label="Changements de statut" value={notifs.status} onChange={(v) => setNotifs((p) => ({ ...p, status: v }))} />
      </Card>

      <Card icon={<Tag className="h-4 w-4" />} title="Catégories">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-sm font-medium">{c.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">L'édition des catégories sera disponible prochainement.</p>
      </Card>

      <Card icon={<MapPin className="h-4 w-4" />} title="Compte">
        <Row label="Email" value={user?.email ?? "—"} />
        <Row label="Rôle" value="Agent / Admin" />
        <button
          onClick={() => signOut()}
          className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-accent"
        >
          Se déconnecter
        </button>
      </Card>

      <Card icon={<ShieldCheck className="h-4 w-4" />} title="API & Intégrations">
        <Row label="Google Maps" value="Connecté ✓" />
        <Row label="Notifications temps réel" value="Actif ✓" />
        <Row label="Stockage photos" value="Actif ✓" />
      </Card>

      <Card icon={<FileText className="h-4 w-4" />} title="Légal & Version">
        <Row label="Version" value="1.0.0" />
        <Row label="Mentions légales" value="—" />
        <Row label="Politique de confidentialité" value="—" />
      </Card>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span> {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-left hover:bg-accent"
    >
      <span className="text-sm">{label}</span>
      <span className={`relative inline-block h-5 w-9 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
