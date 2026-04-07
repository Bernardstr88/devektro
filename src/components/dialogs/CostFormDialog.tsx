import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { COST_CATEGORIES } from "@/data/constants";
import type { InstallationCost, CostCategory } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  installationId: string;
  cost: InstallationCost | null;
}

export function CostFormDialog({ open, onOpenChange, installationId, cost }: Props) {
  const { addInstallationCost, updateInstallationCost } = useAppStore();
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<CostCategory>("varia");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(cost?.date ?? new Date().toISOString().slice(0, 10));
      setCategory((cost?.category as CostCategory) ?? "varia");
      setDescription(cost?.description ?? "");
      setAmount(cost?.amount != null ? String(cost.amount) : "");
      setSupplier(cost?.supplier ?? "");
      setInvoiceRef(cost?.invoice_ref ?? "");
      setNotes(cost?.notes ?? "");
    }
  }, [open, cost]);

  const valid = date && description.trim() && amount && Number(amount) >= 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const payload = {
        installation_id: installationId,
        date,
        category,
        description: description.trim(),
        amount: Number(amount),
        supplier: supplier.trim(),
        invoice_ref: invoiceRef.trim(),
        notes: notes.trim(),
      };
      if (cost) {
        await updateInstallationCost(cost.id, payload);
      } else {
        await addInstallationCost(payload);
      }
      onOpenChange(false);
    } catch { /* handled by store */ } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cost ? "Kost bewerken" : "Kost toevoegen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Datum *</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Bedrag (€) *</label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Categorie</label>
            <Select value={category} onValueChange={(v) => setCategory(v as CostCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COST_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Beschrijving *</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Omschrijving van de kost" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Leverancier</label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Naam leverancier" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Factuur ref.</label>
              <Input value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="Factuur nr." />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Notities</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button disabled={saving || !valid} onClick={handleSave}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {cost ? "Opslaan" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
