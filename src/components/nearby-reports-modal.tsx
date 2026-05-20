import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { distanceMeters } from "@/lib/geo";
import { CATEGORIES, getCategory, timeAgo, type Category } from "@/lib/categories";
import { StatusBadge } from "@/components/status-badge";

interface Report {
  id: string;
  reference: string;
  category: Category;
  status: "recu" | "en_cours" | "resolu";
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export function NearbyReportsModal({
  coords,
  onClose,
}: {
  coords: { lat: number; lng: number };
  onClose: () => void;
}) {
  const [reports, setReports] = useState<Report[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("reports")
        .select("id,reference,category,status,address,latitude,longitude,created_at")
        .in("status", ["recu", "en_cours"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      const list = (data ?? []) as Report[];
      const nearby = list
        .filter((r) => r.latitude && r.longitude)
        .map((r) => ({
          ...r,
          _dist: distanceMeters(coords, { lat: r.latitude!, lng: r.longitude! }),
        }))
        .filter((r) => r._dist <= 300)
        .sort((a, b) => a._dist - b._dist);
      setReports(nearby);
    })();
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-card shadow-xl sm:rounded-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold">Anomalies déjà signalées</h2>
            <p className="text-xs text-muted-foreground">À moins de 300 m de vous, non résolues</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-accent" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {reports === null && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Recherche…
            </div>
          )}
          {reports && reports.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <MapPin className="mx-auto h-8 w-8 mb-2 text-primary/50" />
              Aucun signalement non résolu à proximité.<br />
              Vous pouvez créer le vôtre.
            </div>
          )}
          {reports && reports.map((r) => {
            const cat = getCategory(r.category);
            return (
              <Link
                key={r.id}
                to="/signalement/$id"
                params={{ id: r.id }}
                className="flex items-start gap-3 rounded-xl border border-border p-3 mb-2 hover:bg-accent transition-colors"
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 20%, transparent)` }}
                >
                  <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{cat.label}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{r.address ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    #{r.reference} · {timeAgo(r.created_at)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
