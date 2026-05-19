import { Bell, User } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function AppHeader({ title = "Ma Ville" }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-primary-dark/20 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        <div className="flex items-center gap-1">
          <button className="rounded-full p-2 transition-colors hover:bg-primary-dark/30" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          <Link to="/profil" className="rounded-full p-2 transition-colors hover:bg-primary-dark/30" aria-label="Profil">
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
