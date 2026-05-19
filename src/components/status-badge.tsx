import { cn } from "@/lib/utils";
import { STATUSES, type Status } from "@/lib/categories";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const s = STATUSES[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", s.color, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
