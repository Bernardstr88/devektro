import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAppStore } from "@/store/AppStore";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MATERIAL_CATEGORIES } from "@/data/constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: string;
  existing: { id: string; material_id: string; quantity: number } | null;
}

export function InstallationMaterialFormDialog({ open, onOpenChange, installationId, existing }: Props) {
  const { materials, addInstallationMaterial, updateInstallationMaterial } = useAppStore();
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [comboOpen, setComboOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setMaterialId(existing?.material_id ?? "");
      setQuantity(existing?.quantity ?? 1);
      setErrors({});
    }
  }, [open, existing]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!materialId) e.materialId = "Select a material";
    if (quantity < 1) e.quantity = "Quantity must be at least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (existing) {
        await updateInstallationMaterial(existing.id, { material_id: materialId, quantity });
      } else {
        await addInstallationMaterial({ installation_id: installationId, material_id: materialId, quantity });
      }
      onOpenChange(false);
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const selectedLabel = selectedMaterial
    ? `${selectedMaterial.name} (${selectedMaterial.supplier})`
    : "Zoek materiaal…";

  const unitPrice = selectedMaterial?.unit_price ?? 0;
  const lineTotal = unitPrice * quantity;

  // Group materials by category
  const grouped = MATERIAL_CATEGORIES.map((cat) => ({
    ...cat,
    items: materials.filter((m) => m.category === cat.value),
  })).filter((g) => g.items.length > 0);
  const fmtEur = (v: number) => `€${v.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Hoeveelheid wijzigen" : "Materiaal toevoegen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Materiaal *</label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  disabled={!!existing}
                  className={cn(
                    "w-full justify-between font-normal h-10 overflow-hidden",
                    !materialId && "text-muted-foreground",
                    errors.materialId && "border-destructive"
                  )}
                >
                  <span className="truncate block max-w-[calc(100%-2rem)]">{selectedLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Zoek op naam, leverancier, artikelnr…" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>Geen materialen gevonden.</CommandEmpty>
                    {grouped.map((group) => (
                      <CommandGroup key={group.value} heading={group.label}>
                        {group.items.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={`${m.name} ${m.supplier} ${m.article_number}`}
                            onSelect={() => {
                              setMaterialId(m.id);
                              setErrors((e) => ({ ...e, materialId: "" }));
                              setComboOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", materialId === m.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span className="text-sm">{m.name}</span>
                              <span className="text-xs text-muted-foreground">{m.supplier}{m.article_number ? ` · ${m.article_number}` : ""}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.materialId && <p className="text-xs text-destructive mt-1">{errors.materialId}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Aantal *</label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              value={quantity}
              onChange={(e) => { setQuantity(Number(e.target.value)); setErrors((er) => ({ ...er, quantity: "" })); }}
              className={cn("w-full", errors.quantity && "border-destructive")}
            />
            {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity}</p>}
          </div>

          {/* Detail info */}
          {selectedMaterial && (
            <table className="w-full rounded-md border border-border bg-muted/40 text-sm overflow-hidden">
              <tbody>
                <tr>
                  <td className="px-3 py-1.5 text-muted-foreground">Eenheidsprijs</td>
                  <td className="px-3 py-1.5 text-right font-medium">{fmtEur(unitPrice)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 text-muted-foreground">Categorie</td>
                  <td className="px-3 py-1.5 text-right">{MATERIAL_CATEGORIES.find(c => c.value === selectedMaterial.category)?.label ?? selectedMaterial.category}</td>
                </tr>
                {selectedMaterial.article_number && (
                  <tr>
                    <td className="px-3 py-1.5 text-muted-foreground">Artikelnr</td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs">{selectedMaterial.article_number}</td>
                  </tr>
                )}
                <tr className="border-t border-border font-semibold">
                  <td className="px-3 py-1.5">Totaal</td>
                  <td className="px-3 py-1.5 text-right">{fmtEur(lineTotal)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {saving ? "Opslaan…" : existing ? "Opslaan" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
