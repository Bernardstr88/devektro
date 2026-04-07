import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "status" | "task_type" | "maintenance_type";
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Installation status
  active: "bg-success/10 text-success",
  in_build: "bg-primary/10 text-primary",
  planned: "bg-warning/10 text-warning",
  maintenance: "bg-destructive/10 text-destructive",
  inactive: "bg-muted text-muted-foreground",
  // Task status
  in_progress: "bg-primary/10 text-primary",
  done: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  // Maintenance status
  completed: "bg-success/10 text-success",
  follow_up_needed: "bg-warning/10 text-warning",
};

const typeStyles: Record<string, string> = {
  // Task types
  build: "bg-primary/10 text-primary",
  delivery: "bg-accent text-accent-foreground",
  inspection: "bg-warning/10 text-warning",
  // Maintenance types
  preventive: "bg-primary/10 text-primary",
  corrective: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  in_build: "In Build",
  planned: "Planned",
  maintenance: "Maintenance",
  inactive: "Inactive",
  in_progress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
  completed: "Completed",
  follow_up_needed: "Follow-up Needed",
  // Types
  build: "Build",
  delivery: "Delivery",
  inspection: "Inspection",
  preventive: "Preventive",
  corrective: "Corrective",
};

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const isType = type === "task_type" || type === "maintenance_type";
  const styles = isType ? typeStyles : statusStyles;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
