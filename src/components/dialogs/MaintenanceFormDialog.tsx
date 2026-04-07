import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/AppStore";
import { MAINTENANCE_TYPES, MAINTENANCE_STATUSES } from "@/data/constants";
import { Loader2 } from "lucide-react";
import type { MaintenanceRecord, MaintenanceType, MaintenanceStatus } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: string;
  record: MaintenanceRecord | null;
}

export function MaintenanceFormDialog({ open, onOpenChange, installationId, record }: Props) {
  const { addMaintenanceRecord, updateMaintenanceRecord } = useAppStore();
  const [form, setForm] = useState({
    date: "", type: "preventive" as MaintenanceType, description: "", cost: 0, status: "planned" as MaintenanceStatus,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(record
        ? { date: record.date, type: record.type, description: record.description, cost: record.cost, status: record.status }
        : { date: "", type: "preventive", description: "", cost: 0, status: "planned" },
      );
      setErrors({});
    }
  }, [open, record]);

  const set = (k: string, v: string | number) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.date) e.date = "Date is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.cost < 0) e.cost = "Cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (record) {
        await updateMaintenanceRecord(record.id, { ...form, installation_id: installationId });
      } else {
        await addMaintenanceRecord({ ...form, installation_id: installationId });
      }
      onOpenChange(false);
    } catch { /* handled */ } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Maintenance Record" : "Add Maintenance Record"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Date *</label>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={errors.date ? "border-destructive" : ""} />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Type</label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Description *</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={errors.description ? "border-destructive" : ""} />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Cost (€)</label>
            <Input type="number" min={0} value={form.cost} onChange={(e) => set("cost", Number(e.target.value))} className={errors.cost ? "border-destructive" : ""} />
            {errors.cost && <p className="text-xs text-destructive mt-1">{errors.cost}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MAINTENANCE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {saving ? "Saving…" : record ? "Save Changes" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
