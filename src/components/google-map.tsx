import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __maInitMap?: () => void;
    __maMapsReady?: Promise<void>;
  }
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const CHANNEL = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google?.maps) return Promise.resolve();
  if (window.__maMapsReady) return window.__maMapsReady;
  window.__maMapsReady = new Promise<void>((resolve, reject) => {
    if (!BROWSER_KEY) {
      reject(new Error("Clé Google Maps manquante"));
      return;
    }
    window.__maInitMap = () => resolve();
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__maInitMap",
      libraries: "marker",
    });
    if (CHANNEL) params.set("channel", CHANNEL);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Échec chargement Google Maps"));
    document.head.appendChild(s);
  });
  return window.__maMapsReady;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  title?: string;
  onClick?: () => void;
}

interface Props {
  markers: MapMarker[];
  className?: string;
  fallbackCenter?: { lat: number; lng: number };
}

export function GoogleMap({ markers, className, fallbackCenter = { lat: 47.357, lng: 1.738 } }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current) return;
        mapRef.current = new window.google.maps.Map(ref.current, {
          center: fallbackCenter,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    // Clear
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (!markers.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    for (const m of markers) {
      const marker = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: mapRef.current,
        title: m.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: m.color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
        },
      });
      if (m.onClick) marker.addListener("click", m.onClick);
      markersRef.current.push(marker);
      bounds.extend({ lat: m.lat, lng: m.lng });
    }
    if (markers.length === 1) {
      mapRef.current.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
      mapRef.current.setZoom(15);
    } else {
      mapRef.current.fitBounds(bounds, 48);
    }
  }, [markers]);

  if (error) {
    return (
      <div className={className}>
        <div className="flex h-full w-full items-center justify-center text-center text-sm text-muted-foreground p-4">
          Carte indisponible : {error}
        </div>
      </div>
    );
  }
  return <div ref={ref} className={className} />;
}
