import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { ConfigFormDialog } from "@/components/dialogs/ConfigFormDialog";
import type { InstallationConfig } from "@/data/types";

interface Props {
  installationId: string;
}

export function ConfigTab({ installationId }: Props) {
  const store = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InstallationConfig | null>(null);
  const [deleting, setDeleting] = useState<InstallationConfig | null>(null);

  const configs = store.installationConfigs
    .filter((c) => c.installation_id === installationId)
    .sort((a, b) => b.valid_from.localeCompare(a.valid_from));

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Firmware & Instellingen historiek</h3>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Config
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Geldig vanaf</TableHead>
              <TableHead>Omvormer</TableHead>
              <TableHead>Generator</TableHead>
              <TableHead>Firmware</TableHead>
              <TableHead>Weak AC</TableHead>
              <TableHead>Power ASS</TableHead>
              <TableHead>Bemerkingen</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.valid_from}</TableCell>
                <TableCell>{c.inverter || "—"}</TableCell>
                <TableCell>{c.generator || "—"}</TableCell>
                <TableCell>
                  {c.firmware_version ? (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {c.firmware_version}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${c.weak_ac ? "text-green-600" : "text-muted-foreground"}`}>
                    {c.weak_ac ? "Aan" : "Uit"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${c.power_ass ? "text-green-600" : "text-muted-foreground"}`}>
                    {c.power_ass ? "Aan" : "Uit"}
                  </span>
                </TableCell>
                <TableCell className="max-w-[250px] text-xs text-muted-foreground">{c.remarks || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(c)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {configs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nog geen firmware configuraties.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfigFormDialog open={formOpen} onOpenChange={setFormOpen} config={editing} installationId={installationId} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Configuratie verwijderen"
        description="Deze firmware configuratie verwijderen?"
        onConfirm={() => { if (deleting) { void store.deleteInstallationConfig(deleting.id); setDeleting(null); } }}
      />
    </>
  );
}
