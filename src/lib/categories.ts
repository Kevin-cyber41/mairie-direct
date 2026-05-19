import { Construction, Lightbulb, Sign, Trash2, Sofa, Trees, HelpCircle, type LucideIcon } from "lucide-react";

export type Category = "voirie" | "eclairage" | "panneaux" | "dechets" | "mobilier" | "espaces_verts" | "autres";
export type Status = "recu" | "en_cours" | "resolu";

export const CATEGORIES: { id: Category; label: string; icon: LucideIcon; color: string }[] = [
  { id: "voirie", label: "Voirie", icon: Construction, color: "var(--cat-voirie)" },
  { id: "eclairage", label: "Éclairage", icon: Lightbulb, color: "var(--cat-eclairage)" },
  { id: "panneaux", label: "Panneaux", icon: Sign, color: "var(--cat-panneaux)" },
  { id: "dechets", label: "Déchets", icon: Trash2, color: "var(--cat-dechets)" },
  { id: "mobilier", label: "Mobilier", icon: Sofa, color: "var(--cat-mobilier)" },
  { id: "espaces_verts", label: "Espaces verts", icon: Trees, color: "var(--cat-verts)" },
  { id: "autres", label: "Autres", icon: HelpCircle, color: "var(--cat-autres)" },
];

export const STATUSES: Record<Status, { label: string; color: string; dot: string }> = {
  recu: { label: "Reçu", color: "bg-[oklch(0.65_0.16_245)]/15 text-[oklch(0.45_0.16_245)]", dot: "bg-[oklch(0.65_0.16_245)]" },
  en_cours: { label: "En cours", color: "bg-[oklch(0.78_0.15_75)]/15 text-[oklch(0.5_0.15_75)]", dot: "bg-[oklch(0.78_0.15_75)]" },
  resolu: { label: "Résolu", color: "bg-primary/15 text-primary-dark", dot: "bg-primary" },
};

export function getCategory(id: Category) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[6];
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
