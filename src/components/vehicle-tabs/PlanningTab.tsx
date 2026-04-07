import { useState } from "react";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PlannedEventFormDialog } from "@/components/dialogs/PlannedEventFormDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import type { PlannedEvent } from "@/data/types";
import { differenceInDays, parseISO, isValid } from "date-fns";

interface Props {
  vehicleId: string;
}

function daysUntil(dateStr: string): number | null {
  const d = parseISO(dateStr);
  if (!isValid(d)) return null;
  return differenceInDays(d, new Date());
}

export function PlanningTab({ vehicleId }: Props) {
  const { plannedEvents, updatePlannedEvent, deletePlannedEvent } = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlannedEvent | null>(null);
  const [deleting, setDeleting] = useState<PlannedEvent | null>(null);

  const events = plannedEvents
    .filter((e) => e.vehicle_id === vehicleId)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const open = events.filter((e) => !e.completed);
  const done = events.filter((e) => e.completed);

  const renderEvent = (e: PlannedEvent) => {
    const days = daysUntil(e.event_date);
    return (
      <Card key={e.id} className={e.completed ? "opacity-60" : ""}>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={e.completed}
                onCheckedChange={(checked) => updatePlannedEvent(e.id, { completed: !!checked })}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">{e.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{e.event_date}</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">{e.type}</Badge>
                  {!e.completed && days !== null && days <= 7 && (
                    <Badge variant="destructive" className="text-xs">{days < 0 ? "Verlopen" : `${days}d`}</Badge>
                  )}
                  {!e.completed && days !== null && days > 7 && days <= 30 && (
                    <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">{days}d</Badge>
                  )}
                </div>
                {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(e); setFormOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(e)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Afspraak toevoegen
        </Button>
      </div>

      {open.length === 0 && done.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nog geen afspraken gepland.</p>
      )}

      {open.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Openstaand</p>
          {open.map(renderEvent)}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Afgerond</p>
          {done.map(renderEvent)}
        </div>
      )}

      <PlannedEventFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        vehicleId={vehicleId}
        event={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Afspraak verwijderen?"
        description="Deze afspraak wordt permanent verwijderd."
        onConfirm={async () => { if (deleting) { await deletePlannedEvent(deleting.id); setDeleting(null); } }}
      />
    </div>
  );
}
