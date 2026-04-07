import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { useState } from "react";
import { ConfigFormDialog } from "@/components/dialogs/ConfigFormDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import type { InstallationConfig } from "@/data/types";

export default function FirmwareSettings() {
  const { installations, installationConfigs, isLoading, deleteInstallationConfig } = useAppStore();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InstallationConfig | null>(null);
  const [deleting, setDeleting] = useState<InstallationConfig | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const latestConfigs = installations.map((inst) => {
    const configs = installationConfigs
      .filter((c) => c.installation_id === inst.id)
      .sort((a, b) => b.valid_from.localeCompare(a.valid_from));
    return { installation: inst, config: configs[0] ?? null };
  }).sort((a, b) => {
    const numA = parseInt(a.installation.code.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.installation.code.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Firmware & Settings</h1>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Config
        </Button>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {latestConfigs.map(({ installation, config }) => (
          <Card
            key={installation.id}
            className="cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => navigate(`/installations/${installation.id}`)}
          >
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{installation.code}</span>
                    {config?.firmware_version && (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {config.firmware_version}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{installation.name}</p>
                </div>
                {config && (
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(config); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(config)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>

              {config ? (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Omvormer</p>
                      <p>{config.inverter || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Generator</p>
                      <p>{config.generator || "—"}</p>
                    </div>
                    {config.product_id && (
                      <div>
                        <p className="text-xs text-muted-foreground">Product ID</p>
                        <p className="text-muted-foreground">{config.product_id}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Geldig vanaf</p>
                      <p>{config.valid_from}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-1 border-t text-xs">
                    <span className={config.weak_ac ? "text-green-600" : "text-muted-foreground"}>
                      Weak AC: {config.weak_ac ? "Aan" : "Uit"}
                    </span>
                    <span className={config.power_ass ? "text-green-600" : "text-muted-foreground"}>
                      Power ASS: {config.power_ass ? "Aan" : "Uit"}
                    </span>
                  </div>
                  {config.remarks && (
                    <p className="text-xs text-muted-foreground border-t pt-1 line-clamp-2">{config.remarks}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Geen configuratie</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table layout */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Installatie</TableHead>
                  <TableHead>Omvormer</TableHead>
                  <TableHead>Generator</TableHead>
                  <TableHead>Produkt ID</TableHead>
                  <TableHead>Firmware</TableHead>
                  <TableHead>Weak AC</TableHead>
                  <TableHead>Power ASS</TableHead>
                  <TableHead>Bemerking</TableHead>
                  <TableHead>Geldig vanaf</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestConfigs.map(({ installation, config }) => (
                  <TableRow
                    key={installation.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/installations/${installation.id}`)}
                  >
                    <TableCell className="font-medium">{installation.code}</TableCell>
                    <TableCell>{config?.inverter || "—"}</TableCell>
                    <TableCell>{config?.generator || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{config?.product_id || "—"}</TableCell>
                    <TableCell>
                      {config?.firmware_version ? (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {config.firmware_version}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {config ? (
                        <span className={`text-xs font-medium ${config.weak_ac ? "text-success" : "text-muted-foreground"}`}>
                          {config.weak_ac ? "Aan" : "Uit"}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {config ? (
                        <span className={`text-xs font-medium ${config.power_ass ? "text-success" : "text-muted-foreground"}`}>
                          {config.power_ass ? "Aan" : "Uit"}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{config?.remarks || "—"}</TableCell>
                    <TableCell>{config?.valid_from || "—"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {config && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(config); setFormOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(config)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfigFormDialog open={formOpen} onOpenChange={setFormOpen} config={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete Config"
        description="Delete this firmware configuration record?"
        onConfirm={() => { if (deleting) { deleteInstallationConfig(deleting.id); setDeleting(null); } }}
      />
    </div>
  );
}
