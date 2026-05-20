import { Bell, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logoVille from "@/assets/logo-ville.png";

export function AppHeader({ title = "Ma Ville" }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-primary-dark/20 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto grid max-w-md grid-cols-3 items-center px-4 py-2.5">
        <h1 className="text-base font-bold tracking-tight">{title}</h1>
        <div className="flex justify-center">
          <img
            src={logoVille}
            alt="Romorantin-Lanthenay"
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 rounded-full bg-white/95 p-1 shadow-sm ring-1 ring-white/40"
          />
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
