import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { getInstallationMaterialRows, getInstallationMaterialCost } from "@/data/helpers";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { InstallationMaterialFormDialog } from "@/components/dialogs/InstallationMaterialFormDialog";

interface Props {
  installationId: string;
}

export function MaterialsTab({ installationId }: Props) {
  const store = useAppStore();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; material_id: string; quantity: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const matRows = getInstallationMaterialRows(installationId, store.installationMaterials, store.materials);
  const totalMatCost = getInstallationMaterialCost(installationId, store.installationMaterials, store.materials);

  const enriched = matRows.map((r) => {
    const catalogMat = store.materials.find((m) => m.id === r.material_id);
    const currentPrice = catalogMat?.unit_price ?? r.unit_price;
    return { ...r, currentPrice, priceOutdated: currentPrice !== r.unit_price };
  });

  const visible = enriched.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Bill of Materials</h3>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Material
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op naam, categorie, leverancier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categorie</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Leverancier</TableHead>
              <TableHead className="text-right">Eenheidsprijs</TableHead>
              <TableHead className="text-right">Aantal</TableHead>
              <TableHead className="text-right">Totaal</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="capitalize">{r.category}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.supplier}</TableCell>
                <TableCell className="text-right">
                  <span>€{r.unit_price.toLocaleString()}</span>
                  {r.priceOutdated && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="ml-1.5 text-xs text-primary hover:underline cursor-pointer"
                          onClick={() => void store.updateInstallationMaterial(r.id, { unit_price_at_time: r.currentPrice })}
                        >
                          → €{r.currentPrice.toLocaleString()}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Klik om prijs bij te werken naar huidige catalogusprijs</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell className="text-right">{r.quantity}</TableCell>
                <TableCell className="text-right font-medium">€{r.total.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing({ id: r.id, material_id: r.material_id, quantity: r.quantity }); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingId(r.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {matRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nog geen materialen — klik "Add Material" om te starten.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {matRows.length > 0 && (
        <div className="text-right text-sm font-semibold mt-3 text-foreground">
          Totale materiaalkosten: €{totalMatCost.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}

      <InstallationMaterialFormDialog open={formOpen} onOpenChange={setFormOpen} installationId={installationId} existing={editing} />
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Materiaal verwijderen"
        description="Dit materiaal verwijderen uit de installatie?"
        onConfirm={() => { if (deletingId) { void store.deleteInstallationMaterial(deletingId); setDeletingId(null); } }}
      />
    </>
  );
}
