import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Home, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/confirmation/$id")({
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["report-ref", id],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("reference,address").eq("id", id).single();
      return data;
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-soft px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-in zoom-in duration-500">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-primary-dark">Signalement envoyé !</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Merci, votre signalement a été transmis aux services techniques de la mairie.
      </p>
      {data && (
        <div className="mt-6 rounded-2xl bg-card border border-border px-5 py-4 text-left">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Référence</p>
          <p className="text-lg font-mono font-bold text-primary-dark">#{data.reference}</p>
          {data.address && <p className="mt-2 text-sm text-foreground">{data.address}</p>}
        </div>
      )}
      <div className="mt-8 w-full max-w-xs space-y-2">
        <Link to="/signalement/$id" params={{ id }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground">
          <FileText className="h-5 w-5" /> Suivre mon signalement
        </Link>
        <Link to="/" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card py-3 text-base font-semibold text-primary">
          <Home className="h-5 w-5" /> Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
