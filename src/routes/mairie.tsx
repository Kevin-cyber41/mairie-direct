import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Map, FileText, Users as UsersIcon, BarChart3, Settings, LogOut, ChevronDown, Zap, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoVille from "@/assets/logo-ville.png";

export const Route = createFileRoute("/mairie")({
  component: MairieLayout,
});

const NAV = [
  { to: "/mairie", label: "Accueil", icon: LayoutDashboard, exact: true },
  { to: "/mairie/carte", label: "Carte", icon: Map },
  { to: "/mairie/signalements", label: "Tous les signalements", icon: FileText },
  { to: "/mairie/agents", label: "Agents", icon: UsersIcon },
  { to: "/mairie/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/mairie/parametres", label: "Paramètres", icon: Settings },
];

function MairieLayout() {
  const { user, isAgent, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!user || !isAgent)) navigate({ to: "/login" });
  }, [user, isAgent, loading, navigate]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function quickDemoLogin() {
    setSwitching(true);
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({
      email: "agent@mairie.test",
      password: "Demo2026!",
    });
    setSwitching(false);
    setMenuOpen(false);
    if (error) return toast.error(error.message);
    toast.success("Connecté en démo");
    navigate({ to: "/mairie" });
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement…</div>;
  if (!user || !isAgent) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="relative border-b border-sidebar-border p-4" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg p-1 transition-colors hover:bg-sidebar-accent"
          >
            <img src={logoVille} alt="Romorantin" width={36} height={36} className="h-9 w-9 rounded-lg bg-white/95 p-0.5" />
            <div className="min-w-0 flex-1 text-left">
              <p className="font-bold leading-tight">Mairie</p>
              <p className="text-[11px] text-sidebar-foreground/70 truncate">Romorantin-Lanthenay</p>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform text-sidebar-foreground/60", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar shadow-xl">
              <button
                onClick={quickDemoLogin}
                disabled={switching}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-sidebar-accent disabled:opacity-50"
              >
                <Zap className="h-4 w-4 text-gold" />
                <div>
                  <p className="font-semibold">Connexion rapide démo</p>
                  <p className="text-[10px] text-sidebar-foreground/60">agent@mairie.test</p>
                </div>
              </button>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 border-t border-sidebar-border px-3 py-2.5 text-sm hover:bg-sidebar-accent"
              >
                <UserPlus className="h-4 w-4 text-gold" />
                <p className="font-semibold">Créer un nouvel accès agent</p>
              </Link>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((it) => {
            const Icon = it.icon;
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-gold" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2 rounded-lg p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-sidebar-primary-foreground">
              {(user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-[11px] text-sidebar-foreground/60">Administrateur</p>
            </div>
            <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="rounded p-1.5 hover:bg-sidebar-accent" aria-label="Déconnexion">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="md:hidden border-b border-border bg-sidebar text-sidebar-foreground">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-bold">Mairie</p>
            <Link to="/" className="text-xs underline">App citoyen</Link>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
