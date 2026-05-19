import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STATUSES, type Status } from "@/lib/categories";

/**
 * Subscribe to changes on the current user's reports and notify on status change.
 * Uses Supabase realtime + sonner toast + browser Notification API when permitted.
 */
export function useReportNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const askedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Ask for browser notification permission once after sign-in
    if (
      !askedRef.current &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      askedRef.current = true;
      // Slight delay so it doesn't fire instantly on page load
      const t = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`reports-user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reports",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const oldRow = payload.old ?? {};
          const newRow = payload.new ?? {};
          if (oldRow.status !== newRow.status) {
            const label = STATUSES[newRow.status as Status]?.label ?? newRow.status;
            const msg = `Signalement #${newRow.reference} : ${label}`;
            toast.success(msg, {
              description: newRow.message_mairie ?? undefined,
            });
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification("Ma Ville", { body: msg, icon: "/icon-512.png" });
              } catch {
                /* ignore */
              }
            }
            qc.invalidateQueries({ queryKey: ["my-reports"] });
            qc.invalidateQueries({ queryKey: ["report", newRow.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);
}
