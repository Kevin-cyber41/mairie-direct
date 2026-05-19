import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Mail, Phone, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/profil")({
  component: ProfilPage,
});

function ProfilPage() {
  const { user, signOut, isAgent } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="Profil" />
        <main className="mx-auto max-w-md px-4 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Connectez-vous</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pour suivre vos signalements et recevoir les mises à jour.</p>
          <Link to="/login" className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Se connecter / S'inscrire</Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Mon profil" />
      <main className="mx-auto max-w-md px-4 py-5 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-xl font-bold">
              {(user.user_metadata?.full_name || user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{user.user_metadata?.full_name || "Citoyen"}</p>
              <p className="text-sm text-primary-foreground/80 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {isAgent && (
          <Link to="/mairie" className="flex items-center justify-between rounded-2xl bg-gold/20 border border-gold/40 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-primary-dark/70">Espace agent</p>
              <p className="font-semibold">Tableau de bord mairie</p>
            </div>
            <ChevronRight className="h-5 w-5" />
          </Link>
        )}

        <div className="rounded-2xl bg-card border border-border divide-y divide-border">
          <Row icon={Mail} label="Email">{user.email}</Row>
          {user.phone && <Row icon={Phone} label="Téléphone">{user.phone}</Row>}
        </div>

        <button
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card py-3 text-sm font-semibold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </main>
      <BottomNav />
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{children}</p>
      </div>
    </div>
  );
}
