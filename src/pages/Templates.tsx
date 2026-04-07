import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAppStore } from "@/store/AppStore";
import { INSTALLATION_TYPES, MATERIAL_CATEGORIES } from "@/data/constants";
import { Plus, Pencil, Trash2, Loader2, Check, ChevronsUpDown, Package, ArrowLeft } from "lucide-react";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { InstallationTemplate, InstallationType } from "@/data/types";

export default function Templates() {
  const store = useAppStore();
  const { installationTemplates } = store;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InstallationTemplate | null>(null);
  const [deleting, setDeleting] = useState<InstallationTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InstallationTemplate | null>(null);

  if (store.isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const sorted = [...installationTemplates].sort((a, b) => a.name.localeCompare(b.name));

  const templateList = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Templates ({sorted.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.map((tpl) => (
          <div
            key={tpl.id}
            className={cn(
              "flex items-center justify-between px-4 py-3 cursor-pointer border-b last:border-b-0 hover:bg-muted/50",
              selectedTemplate?.id === tpl.id && "bg-muted"
            )}
            onClick={() => setSelectedTemplate(tpl)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{tpl.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{tpl.type} · {tpl.power_kva} kVA · {tpl.battery_kwh} kWh</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(tpl); setFormOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleting(tpl); }}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nog geen templates. Maak er een aan.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Installatie Templates</h1>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nieuwe template
        </Button>
      </div>

      {/* Mobile layout: show list OR detail, not both */}
      <div className="lg:hidden">
        {selectedTemplate ? (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Terug naar lijst
            </Button>
            <TemplateMaterialsPanel template={selectedTemplate} />
          </div>
        ) : (
          templateList
        )}
      </div>

      {/* Desktop layout: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">{templateList}</div>
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <TemplateMaterialsPanel template={selectedTemplate} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecteer een template om de materialen te beheren.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TemplateFormDialog open={formOpen} onOpenChange={setFormOpen} template={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Template verwijderen"
        description={`Weet je zeker dat je "${deleting?.name}" wilt verwijderen? Alle gekoppelde materialen worden ook verwijderd.`}
        onConfirm={async () => {
          if (deleting) {
            await store.deleteInstallationTemplate(deleting.id);
            if (selectedTemplate?.id === deleting.id) setSelectedTemplate(null);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}

// --- Template Form Dialog ---
function TemplateFormDialog({ open, onOpenChange, template }: { open: boolean; onOpenChange: (o: boolean) => void; template: InstallationTemplate | null }) {
  const { addInstallationTemplate, updateInstallationTemplate } = useAppStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<InstallationType>("mobile");
  const [powerKva, setPowerKva] = useState(0);
  const [batteryKwh, setBatteryKwh] = useState(0);
  const [labourCost, setLabourCost] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [saving, setSaving] = useState(false);

  useState(() => {
    if (template) {
      setName(template.name); setType(template.type); setPowerKva(template.power_kva);
      setBatteryKwh(template.battery_kwh); setLabourCost(template.default_labour_cost); setSalePrice(template.default_estimated_sale_price);
    } else {
      setName(""); setType("mobile"); setPowerKva(0); setBatteryKwh(0); setLabourCost(0); setSalePrice(0);
    }
  });

  const handleOpen = (o: boolean) => {
    if (o && template) {
      setName(template.name); setType(template.type); setPowerKva(template.power_kva);
      setBatteryKwh(template.battery_kwh); setLabourCost(template.default_labour_cost); setSalePrice(template.default_estimated_sale_price);
    } else if (o) {
      setName(""); setType("mobile"); setPowerKva(0); setBatteryKwh(0); setLabourCost(0); setSalePrice(0);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{template ? "Template bewerken" : "Nieuwe template"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Naam *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as InstallationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INSTALLATION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Power (kVA)</label>
            <Input type="number" min={0} value={powerKva} onChange={(e) => setPowerKva(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Battery (kWh)</label>
            <Input type="number" min={0} value={batteryKwh} onChange={(e) => setBatteryKwh(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Arbeidskost</label>
            <Input type="number" min={0} value={labourCost} onChange={(e) => setLabourCost(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Geschatte verkoopprijs</label>
            <Input type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpen(false)}>Annuleren</Button>
          <Button disabled={saving || !name.trim()} onClick={async () => {
            setSaving(true);
            try {
              const payload = { name: name.trim(), type, power_kva: powerKva, battery_kwh: batteryKwh, default_labour_cost: labourCost, default_estimated_sale_price: salePrice };
              if (template) await updateInstallationTemplate(template.id, payload);
              else await addInstallationTemplate(payload);
              handleOpen(false);
            } catch { /* handled */ } finally { setSaving(false); }
          }}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {template ? "Opslaan" : "Aanmaken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Template Materials Panel ---
function TemplateMaterialsPanel({ template }: { template: InstallationTemplate }) {
  const store = useAppStore();
  const { templateMaterials, materials } = store;
  const [addOpen, setAddOpen] = useState(false);
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [comboOpen, setComboOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tms = templateMaterials.filter((tm) => tm.template_id === template.id);
  const rows = tms.map((tm) => {
    const mat = materials.find((m) => m.id === tm.material_id);
    return { ...tm, name: mat?.name ?? "?", supplier: mat?.supplier ?? "", category: mat?.category ?? "", unit_price: mat?.unit_price ?? 0 };
  }).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const totalCost = rows.reduce((s, r) => s + r.unit_price * r.quantity, 0);

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const grouped = MATERIAL_CATEGORIES.map((cat) => ({
    ...cat,
    items: materials.filter((m) => m.category === cat.value),
  })).filter((g) => g.items.length > 0);

  const handleAdd = async () => {
    if (!materialId) return;
    setSaving(true);
    try {
      await store.addTemplateMaterial({ template_id: template.id, material_id: materialId, quantity });
      setAddOpen(false);
      setMaterialId("");
      setQuantity(1);
    } catch { /* handled */ } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">{template.name} — Materialen ({rows.length})</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Materiaal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categorie</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Leverancier</TableHead>
                <TableHead className="text-right">Prijs</TableHead>
                <TableHead className="text-right">Aantal</TableHead>
                <TableHead className="text-right">Totaal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="capitalize text-sm">{r.category}</TableCell>
                  <TableCell className="text-sm">{r.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.supplier}</TableCell>
                  <TableCell className="text-right text-sm">€{r.unit_price.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm">{r.quantity}</TableCell>
                  <TableCell className="text-right text-sm font-medium">€{(r.unit_price * r.quantity).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingId(r.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Geen materialen. Voeg er toe.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {rows.length > 0 && (
          <div className="text-right text-sm font-semibold mt-3">Totaal: €{totalCost.toLocaleString()}</div>
        )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Materiaal toevoegen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Materiaal</label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className="truncate">{selectedMaterial ? `${selectedMaterial.name} (${selectedMaterial.supplier})` : "Zoek materiaal…"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Zoek op naam, leverancier, artikelnr…" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Geen materialen gevonden.</CommandEmpty>
                      {grouped.map((group) => (
                        <CommandGroup key={group.value} heading={group.label}>
                          {group.items.map((m) => (
                            <CommandItem key={m.id} value={`${m.name} ${m.supplier} ${m.article_number}`} onSelect={() => { setMaterialId(m.id); setComboOpen(false); }}>
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
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Aantal</label>
              <Input type="number" min={0.01} step="0.01" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuleren</Button>
            <Button disabled={saving || !materialId} onClick={handleAdd}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Materiaal verwijderen"
        description="Dit materiaal verwijderen uit de template?"
        onConfirm={async () => { if (deletingId) { await store.deleteTemplateMaterial(deletingId); setDeletingId(null); } }}
      />
    </Card>
  );
}
