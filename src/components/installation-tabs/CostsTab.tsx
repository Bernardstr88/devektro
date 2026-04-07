import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { CostFormDialog } from "@/components/dialogs/CostFormDialog";
import { COST_CATEGORIES } from "@/data/constants";
import type { InstallationCost } from "@/data/types";

interface Props {
  installationId: string;
}

function categoryLabel(cat: string) {
  return COST_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function CostsTab({ installationId }: Props) {
  const store = useAppStore();
  const costs = store.installationCosts
    .filter((c) => c.installation_id === installationId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstallationCost | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: InstallationCost) => { setEditing(c); setDialogOpen(true); };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await store.deleteInstallationCost(id); } finally { setDeletingId(null); }
  };

  const total = costs.reduce((s, c) => s + Number(c.amount), 0);

  // Group by category for summary
  const byCategory = COST_CATEGORIES.map((cat) => {
    const catCosts = costs.filter((c) => c.category === cat.value);
    return { label: cat.label, value: cat.value, total: catCosts.reduce((s, c) => s + Number(c.amount), 0), count: catCosts.length };
  }).filter((c) => c.count > 0);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Operationele Kosten</h3>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Kost toevoegen
        </Button>
      </div>

      {costs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nog geen kosten — klik "Kost toevoegen" om te starten.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary by category */}
          {byCategory.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {byCategory.map((cat) => (
                <div key={cat.value} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">{cat.label}</span>
                  <span className="text-sm font-semibold">€{Math.round(cat.total).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-3 py-1.5 ml-auto">
                <span className="text-xs text-muted-foreground">Totaal</span>
                <span className="text-sm font-semibold">€{Math.round(total).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {costs.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{c.description}</span>
                        <Badge variant="secondary" className="text-xs">{categoryLabel(c.category)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.date}{c.supplier ? ` · ${c.supplier}` : ""}{c.invoice_ref ? ` · ${c.invoice_ref}` : ""}</p>
                      {c.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{c.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">€{Number(c.amount).toLocaleString("nl-BE", { minimumFractionDigits: 2 })}</p>
                      <div className="flex gap-1 mt-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" disabled={deletingId === c.id} onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
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
                  <TableHead>Categorie</TableHead>
                  <TableHead>Beschrijving</TableHead>
                  <TableHead>Leverancier</TableHead>
                  <TableHead>Factuur ref.</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.date}</TableCell>
                    <TableCell><Badge variant="secondary">{categoryLabel(c.category)}</Badge></TableCell>
                    <TableCell className="text-sm">{c.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.supplier || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.invoice_ref || "—"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">€{Number(c.amount).toLocaleString("nl-BE", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={deletingId === c.id} onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} className="font-medium text-right text-sm">Totaal</TableCell>
                  <TableCell className="text-right font-semibold">€{Math.round(total).toLocaleString()}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <CostFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        installationId={installationId}
        cost={editing}
      />
    </>
  );
}
