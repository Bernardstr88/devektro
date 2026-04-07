import { useState } from "react";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MaintenanceFormDialog } from "@/components/dialogs/MaintenanceFormDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import type { MaintenanceRecord } from "@/data/types";

interface Props {
  vehicleId: string;
}

export function MaintenanceTab({ vehicleId }: Props) {
  const { maintenanceRecords, deleteMaintenanceRecord } = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [deleting, setDeleting] = useState<MaintenanceRecord | null>(null);

  const records = maintenanceRecords
    .filter((r) => r.vehicle_id === vehicleId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Onderhoud toevoegen
        </Button>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {records.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-4 pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{r.type}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(r)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{r.date}{r.mileage_at_service ? ` · ${r.mileage_at_service.toLocaleString("nl-BE")} km` : ""}</p>
              {r.description && <p className="text-sm">{r.description}</p>}
              {r.provider && <p className="text-xs text-muted-foreground">{r.provider}</p>}
              {r.cost !== null && <p className="text-sm font-medium">€ {Number(r.cost).toFixed(2)}</p>}
              {r.next_maintenance_date && <p className="text-xs text-muted-foreground">Volgend: {r.next_maintenance_date}</p>}
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nog geen onderhoudsrecords.</p>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Km-stand</TableHead>
              <TableHead>Garage</TableHead>
              <TableHead>Kost</TableHead>
              <TableHead>Volgend</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{r.date}</TableCell>
                <TableCell className="text-sm">{r.type}</TableCell>
                <TableCell className="text-sm">{r.description ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.mileage_at_service !== null ? `${r.mileage_at_service.toLocaleString("nl-BE")} km` : "—"}</TableCell>
                <TableCell className="text-sm">{r.provider ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.cost !== null ? `€ ${Number(r.cost).toFixed(2)}` : "—"}</TableCell>
                <TableCell className="text-sm">{r.next_maintenance_date ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nog geen onderhoudsrecords.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <MaintenanceFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        vehicleId={vehicleId}
        record={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Onderhoudsrecord verwijderen?"
        description="Dit record wordt permanent verwijderd."
        onConfirm={async () => { if (deleting) { await deleteMaintenanceRecord(deleting.id); setDeleting(null); } }}
      />
    </div>
  );
}
