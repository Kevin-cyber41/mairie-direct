import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/mairie/carte")({
  component: () => (
    <div className="flex-1 p-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-2">Carte mairie</h1>
      <p className="text-sm text-muted-foreground">Vue géographique des signalements actifs.</p>
      <div className="mt-6 flex aspect-video items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground">
        <div className="text-center">
          <Construction className="mx-auto h-10 w-10" />
          <p className="mt-2 text-sm">Vue carte avancée bientôt disponible.</p>
          <p className="text-xs">La carte simplifiée est dispo dans l'app citoyen.</p>
        </div>
      </div>
    </div>
  ),
});
