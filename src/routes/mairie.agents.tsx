import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

export const Route = createFileRoute("/mairie/agents")({
  component: () => (
    <div className="flex-1 p-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-2">Agents</h1>
      <p className="text-sm text-muted-foreground">Gestion des agents municipaux.</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        <Users className="mx-auto h-8 w-8 mb-2" />
        Module de gestion des agents bientôt disponible. En attendant, vous pouvez assigner un nom d'agent libre depuis le tableau de bord.
      </div>
    </div>
  ),
});
