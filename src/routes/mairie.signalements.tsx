import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mairie/signalements")({
  component: () => (
    <div className="flex-1 p-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-2">Tous les signalements</h1>
      <p className="text-sm text-muted-foreground">Utilisez le tableau de bord pour la vue complète avec filtres et assignation.</p>
    </div>
  ),
});
