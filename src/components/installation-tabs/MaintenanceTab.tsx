import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppStore } from "@/store/AppStore";
import { getInstallationMaintenance } from "@/data/helpers";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { MaintenanceFormDialog } from "@/components/dialogs/MaintenanceFormDialog";
import type { MaintenanceRecord } from "@/data/types";

interface Props {
  installationId: string;
}

export function MaintenanceTab({ installationId }: Props) {
  const store = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [deleting, setDeleting] = useState<MaintenanceRecord | null>(null);

  const records = getInstallationMaintenance(installationId, store.maintenanceRecords);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Onderhoudshistoriek</h3>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Record
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Beschrijving</TableHead>
              <TableHead className="text-right">Kost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.date}</TableCell>
                <TableCell><StatusBadge status={m.type} type="maintenance_type" /></TableCell>
                <TableCell>{m.description}</TableCell>
                <TableCell className="text-right">€{m.cost.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={m.status} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(m); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(m)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen onderhoudsdossiers.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <MaintenanceFormDialog open={formOpen} onOpenChange={setFormOpen} installationId={installationId} record={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Onderhoudsdossier verwijderen"
        description={`Dossier "${deleting?.description}" verwijderen?`}
        onConfirm={() => { if (deleting) { void store.deleteMaintenanceRecord(deleting.id); setDeleting(null); } }}
      />
    </>
  );
}
