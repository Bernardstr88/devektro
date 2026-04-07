import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/AppStore";
import { MATERIAL_CATEGORIES } from "@/data/constants";
import { Loader2 } from "lucide-react";
import type { Material, MaterialCategory } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
}

const empty = {
  category: "trailer" as MaterialCategory, supplier: "", article_number: "", name: "", unit_price: 0, weight: 0, remarks: "",
};

export function MaterialFormDialog({ open, onOpenChange, material }: Props) {
  const { addMaterial, updateMaterial } = useAppStore();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) { setForm(material ? { ...material } : { ...empty }); setErrors({}); }
  }, [open, material]);

  const set = (k: string, v: string | number) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.supplier.trim()) e.supplier = "Supplier is required";
    if (form.unit_price < 0) e.unit_price = "Cannot be negative";
    if (form.weight < 0) e.weight = "Cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (material) { await updateMaterial(material.id, form); } else { await addMaterial(form); }
      onOpenChange(false);
    } catch { /* handled */ } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{material ? "Edit Material" : "New Material"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground">Name *</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className={errors.name ? "border-destructive" : ""} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Category</label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MATERIAL_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Supplier *</label>
            <Input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} className={errors.supplier ? "border-destructive" : ""} />
            {errors.supplier && <p className="text-xs text-destructive mt-1">{errors.supplier}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Article Number</label>
            <Input value={form.article_number} onChange={(e) => set("article_number", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Unit Price (€) *</label>
            <Input type="number" min={0} value={form.unit_price} onChange={(e) => set("unit_price", Number(e.target.value))} className={errors.unit_price ? "border-destructive" : ""} />
            {errors.unit_price && <p className="text-xs text-destructive mt-1">{errors.unit_price}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Weight (kg)</label>
            <Input type="number" min={0} value={form.weight} onChange={(e) => set("weight", Number(e.target.value))} className={errors.weight ? "border-destructive" : ""} />
            {errors.weight && <p className="text-xs text-destructive mt-1">{errors.weight}</p>}
          </div>
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Remarks</label>
            <Textarea value={form.remarks} onChange={(e) => set("remarks", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {saving ? "Saving…" : material ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
