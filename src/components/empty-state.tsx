import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-64 text-muted-foreground", className)}>
      <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="size-6 opacity-60" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs mt-1 text-muted-foreground/70">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
