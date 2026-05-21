import { Bell, User, Loader2, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoGold from "@/assets/logo-gold.png";

export function AppHeader({ title = "Ma Ville" }: { title?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Connecté");
    setOpen(false);
    navigate({ to: "/mairie" });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-primary-dark/20 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto grid max-w-md grid-cols-3 items-center px-4 py-2.5">
        <h1 className="text-base font-bold tracking-tight">{title}</h1>
        <div ref={popoverRef} className="relative flex justify-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Espace Mairie"
            className="rounded-full p-1 transition-transform hover:scale-105 active:scale-95"
          >
            <img
              src={logoGold}
              alt="Espace Mairie"
              width={40}
              height={40}
              className="h-10 w-10 object-contain drop-shadow-sm"
            />
          </button>

          <div
            className={`absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 origin-top overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl transition-all duration-300 ${
              open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Espace Mairie
              </p>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-0.5 hover:bg-accent"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-2.5 p-4">
              <input
                type="email"
                required
                placeholder="Identifiant (email)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="password"
                required
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Se connecter
              </button>
              <p className="pt-1 text-center text-[10px] text-muted-foreground">
                Réservé aux agents municipaux
              </p>
            </form>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1">
          <button
            className="rounded-full p-2 transition-colors hover:bg-primary-dark/30"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link
            to="/profil"
            className="rounded-full p-2 transition-colors hover:bg-primary-dark/30"
            aria-label="Profil"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
