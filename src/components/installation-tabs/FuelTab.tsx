import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Fuel, Clock, Euro } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { FuelLogFormDialog } from "@/components/dialogs/FuelLogFormDialog";
import type { FuelLog } from "@/data/types";

interface Props {
  installationId: string;
}

export function FuelTab({ installationId }: Props) {
  const store = useAppStore();
  const logs = store.fuelLogs
    .filter((f) => f.installation_id === installationId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FuelLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (f: FuelLog) => { setEditing(f); setDialogOpen(true); };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await store.deleteFuelLog(id); } finally { setDeletingId(null); }
  };

  // Summary stats
  const totalLiters = logs.reduce((s, f) => s + Number(f.liters), 0);
  const totalCost = logs.filter((f) => f.cost != null).reduce((s, f) => s + Number(f.cost), 0);
  const hasCost = logs.some((f) => f.cost != null);

  // Consumption: l/hour between consecutive entries with hours_counter
  const withHours = [...logs].filter((f) => f.hours_counter != null).sort((a, b) => a.date.localeCompare(b.date));
  let avgConsumption: number | null = null;
  if (withHours.length >= 2) {
    let totalL = 0, totalH = 0;
    for (let i = 1; i < withHours.length; i++) {
      const deltaH = Number(withHours[i].hours_counter) - Number(withHours[i - 1].hours_counter);
      if (deltaH > 0) {
        totalL += Number(withHours[i].liters);
        totalH += deltaH;
      }
    }
    if (totalH > 0) avgConsumption = totalL / totalH;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Brandstofverbruik</h3>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Tankbeurt registreren
        </Button>
      </div>

      {/* Summary cards */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="pt-3 pb-3 flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Totaal getankt</p>
                <p className="text-lg font-semibold">{totalLiters.toLocaleString("nl-BE", { maximumFractionDigits: 1 })} L</p>
              </div>
            </CardContent>
          </Card>
          {hasCost && (
            <Card>
              <CardContent className="pt-3 pb-3 flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Totale brandstofkost</p>
                  <p className="text-lg font-semibold">€{totalCost.toLocaleString("nl-BE", { maximumFractionDigits: 0 })}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {avgConsumption !== null && (
            <Card>
              <CardContent className="pt-3 pb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Gem. verbruik</p>
                  <p className="text-lg font-semibold">{avgConsumption.toFixed(2)} L/uur</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nog geen tankbeurten — klik "Tankbeurt registreren" om te starten.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {logs.map((f) => (
              <Card key={f.id}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold">{Number(f.liters).toLocaleString("nl-BE", { maximumFractionDigits: 1 })} L</span>
                        {f.cost != null && <span className="text-sm text-muted-foreground">€{Number(f.cost).toLocaleString("nl-BE", { minimumFractionDigits: 2 })}</span>}
                        {f.hours_counter != null && <span className="text-xs text-muted-foreground">{Number(f.hours_counter).toLocaleString()} uur</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.date}{f.filled_by ? ` · ${f.filled_by}` : ""}</p>
                      {f.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{f.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(f)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" disabled={deletingId === f.id} onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Liters</TableHead>
                  <TableHead className="text-right">Urenteller</TableHead>
                  <TableHead className="text-right">Kostprijs</TableHead>
                  <TableHead>Gevuld door</TableHead>
                  <TableHead>Notities</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((f, i) => {
                  // Calculate delta hours vs next entry (sorted desc, so compare with i+1)
                  const prev = logs[i + 1];
                  const deltaH = f.hours_counter != null && prev?.hours_counter != null
                    ? Number(f.hours_counter) - Number(prev.hours_counter)
                    : null;
                  const lph = deltaH != null && deltaH > 0 ? Number(f.liters) / deltaH : null;

                  return (
                    <TableRow key={f.id}>
                      <TableCell className="text-sm">{f.date}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{Number(f.liters).toLocaleString("nl-BE", { maximumFractionDigits: 1 })} L</TableCell>
                      <TableCell className="text-right text-sm">
                        {f.hours_counter != null ? (
                          <span>
                            {Number(f.hours_counter).toLocaleString()}
                            {lph !== null && <span className="text-muted-foreground ml-1">({lph.toFixed(2)} L/u)</span>}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {f.cost != null ? `€${Number(f.cost).toLocaleString("nl-BE", { minimumFractionDigits: 2 })}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.filled_by || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.notes || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(f)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={deletingId === f.id} onClick={() => handleDelete(f.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-medium text-sm">Totaal</TableCell>
                  <TableCell className="text-right font-semibold">{totalLiters.toLocaleString("nl-BE", { maximumFractionDigits: 1 })} L</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold">{hasCost ? `€${totalCost.toLocaleString("nl-BE", { maximumFractionDigits: 0 })}` : "—"}</TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <FuelLogFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        installationId={installationId}
        log={editing}
      />
    </>
  );
}
