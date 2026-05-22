import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Camera, Image as ImageIcon, MapPin, Send, X, Loader2, Check, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type Category } from "@/lib/categories";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { isInRomorantin } from "@/lib/geo";
import { NearbyReportsModal } from "@/components/nearby-reports-modal";

export const Route = createFileRoute("/signaler")({
  component: SignalerPage,
});

type Step = "photo" | "location" | "category" | "description";

function SignalerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("photo");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [showNearby, setShowNearby] = useState(false);

  const outOfZone = coords ? !isInRomorantin(coords.lat, coords.lng) : false;

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  async function reverseGeocode(lat: number, lng: number) {
    // Try Google via connector gateway first; fallback to Nominatim
    try {
      const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?latlng=${lat},${lng}&language=fr`;
      const r = await fetch(url);
      const j = await r.json();
      const first = j?.results?.[0];
      if (first?.formatted_address) return first.formatted_address as string;
    } catch {}
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`, {
        headers: { "Accept-Language": "fr" },
      });
      const j = await r.json();
      const a = j.address ?? {};
      const street = [a.road, a.house_number].filter(Boolean).join(" ");
      return street ? `${street}, ${a.city || a.town || a.village || ""}` : (j.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  function fetchGps() {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const addr = await reverseGeocode(latitude, longitude);
        setAddress(addr);
        setGpsStatus("ok");
      },
      (err) => {
        setGpsStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Géolocalisation refusée", { description: "Vous pouvez saisir l'adresse manuellement." });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  // Initial permission check
  useEffect(() => {
    if (gpsStatus !== "idle") return;
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    const perms = (navigator as any).permissions;
    if (perms?.query) {
      perms.query({ name: "geolocation" }).then((res: any) => {
        if (res.state === "granted") fetchGps();
        else if (res.state === "prompt") setShowPermissionModal(true);
        else { setGpsStatus("error"); }
      }).catch(() => setShowPermissionModal(true));
    } else {
      setShowPermissionModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function handlePhoto(file: File) {
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStep("location");
  }

  async function submit() {
    if (!user) {
      toast.error("Connectez-vous pour envoyer");
      navigate({ to: "/login" });
      return;
    }
    if (!photo || !category) {
      toast.error("Photo et catégorie obligatoires");
      return;
    }
    if (coords && !isInRomorantin(coords.lat, coords.lng)) {
      toast.error("Hors zone : signalement non transmis", {
        description: "Nous ne pouvons prendre en compte que les signalements sur le territoire de Romorantin-Lanthenay. Merci de votre compréhension.",
        duration: 7000,
      });
      return;
    }
    setSubmitting(true);
    try {
      const ext = photo.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, photo, { contentType: photo.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);

      const { data: row, error } = await supabase.from("reports").insert({
        user_id: user.id,
        category,
        photo_url: publicUrl,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        address: address || null,
        description: description.trim() || null,
      }).select("id,reference").single();
      if (error) throw error;
      navigate({ to: "/confirmation/$id", params: { id: row.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Erreur d'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  const stepNum = { photo: 1, location: 2, category: 3, description: 4 }[step];
  const canNext = (step === "photo" && photo) || (step === "location" && coords) || (step === "category" && category) || step === "description";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex max-w-md items-center justify-between px-3 py-3">
          <Link to="/" className="rounded-full p-2 hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 px-3">
            <p className="text-xs font-medium text-muted-foreground">Étape {stepNum} sur 4</p>
            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${stepNum * 25}%` }} />
            </div>
          </div>
          <Link to="/" className="rounded-full p-2 hover:bg-accent">
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 space-y-4">
        {/* PHOTO */}
        <Section active={step === "photo"} title="Photo du problème" required>
          {photoPreview ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <img src={photoPreview} alt="Aperçu" className="h-full w-full object-cover" />
              <button onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="absolute top-2 right-2 rounded-full bg-card/90 p-2 shadow">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/50 p-8 text-center">
              <Camera className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Appuyez pour prendre une photo</p>
            </div>
          )}
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          <input ref={galleryInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => cameraInput.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-card px-4 py-3 text-sm font-semibold text-primary hover:bg-primary-soft">
              <Camera className="h-4 w-4" /> Caméra
            </button>
            <button onClick={() => galleryInput.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-card px-4 py-3 text-sm font-semibold text-primary hover:bg-primary-soft">
              <ImageIcon className="h-4 w-4" /> Galerie
            </button>
          </div>
        </Section>

        {/* LOCATION */}
        <Section active={step === "location" || stepNum > 2} title="Localisation GPS" required>
          <div className="flex items-start gap-3 rounded-xl bg-primary-soft p-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              {gpsStatus === "loading" && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Récupération de votre position…</p>}
              {gpsStatus === "ok" && (
                <>
                  <p className="text-sm font-semibold leading-tight">{address}</p>
                  {coords && <p className="mt-0.5 text-xs text-muted-foreground">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>}
                </>
              )}
              {gpsStatus === "error" && (
                <>
                  <p className="text-sm text-destructive">GPS indisponible.</p>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse manuelle…" className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </>
              )}
            </div>
            {gpsStatus === "ok" && !outOfZone && <Check className="h-5 w-5 text-primary" />}
            {outOfZone && <AlertTriangle className="h-5 w-5 text-destructive" />}
          </div>

          {outOfZone && (
            <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold">Hors de Romorantin-Lanthenay</p>
              <p className="mt-1 text-xs">
                Nous ne pouvons prendre en compte que les signalements sur le territoire de Romorantin-Lanthenay. Merci de votre compréhension.
              </p>
            </div>
          )}

          {coords && !outOfZone && (
            <button
              type="button"
              onClick={() => setShowNearby(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/40 bg-primary-soft px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft/80"
            >
              <Eye className="h-4 w-4" />
              Voir les anomalies déjà signalées à proximité
            </button>
          )}
        </Section>

        {showNearby && coords && (
          <NearbyReportsModal coords={coords} onClose={() => setShowNearby(false)} />
        )}


        {/* CATEGORY */}
        <Section active={step === "category" || stepNum > 3} title="Catégorie" required>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const selected = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { setCategory(c.id); setStep("description"); }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                    selected ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in oklab, ${c.color} 20%, transparent)` }}>
                    <Icon className="h-4 w-4" style={{ color: c.color }} />
                  </span>
                  <span className="text-sm font-medium">{c.label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* DESCRIPTION */}
        <Section active={step === "description"} title="Description (optionnelle)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Nid-de-poule dangereux…"
            rows={3}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{description.length}/500</p>
        </Section>
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-card p-4">
        <div className="mx-auto max-w-md">
          {step !== "description" ? (
            <button
              disabled={!canNext}
              onClick={() => setStep(step === "photo" ? "location" : step === "location" ? "category" : "description")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          ) : (
            <button
              disabled={submitting || !photo || !category || outOfZone}
              onClick={submit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-md disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {submitting ? "Envoi…" : "Envoyer le signalement"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Section({ active, title, required, children }: { active: boolean; title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-4 transition-all", active ? "border-primary/40 shadow-sm" : "border-border opacity-90")}>
      <p className="mb-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
        {title} {required && <span className="text-destructive normal-case">— obligatoire</span>}
      </p>
      {children}
    </section>
  );
}
