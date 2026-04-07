import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/AppStore";
import { Loader2 } from "lucide-react";
import type { InstallationConfig } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: InstallationConfig | null;
  installationId?: string;
}

const empty = {
  installation_id: "",
  inverter: "",
  generator: "",
  product_id: "",
  firmware_version: "",
  weak_ac: false,
  power_ass: false,
  remarks: "",
  valid_from: new Date().toISOString().slice(0, 10),
};

export function ConfigFormDialog({ open, onOpenChange, config, installationId }: Props) {
  const { installations, addInstallationConfig, updateInstallationConfig } = useAppStore();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (config) {
        setForm({
          installation_id: config.installation_id,
          inverter: config.inverter,
          generator: config.generator,
          product_id: config.product_id,
          firmware_version: config.firmware_version,
          weak_ac: config.weak_ac,
          power_ass: config.power_ass,
          remarks: config.remarks,
          valid_from: config.valid_from,
        });
      } else {
        setForm({ ...empty, installation_id: installationId || "" });
      }
    }
  }, [open, config, installationId]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.installation_id) return;
    setSaving(true);
    try {
      if (config) {
        await updateInstallationConfig(config.id, form);
      } else {
        await addInstallationConfig(form);
      }
      onOpenChange(false);
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const sorted = [...installations].sort((a, b) => {
    const numA = parseInt(a.code.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.code.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{config ? "Edit Configuration" : "New Configuration"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Installation *</label>
            <Select value={form.installation_id} onValueChange={(v) => set("installation_id", v)} disabled={!!installationId}>
              <SelectTrigger><SelectValue placeholder="Select installation" /></SelectTrigger>
              <SelectContent>
                {sorted.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>{inst.code} — {inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Omvormer</label>
            <Input value={form.inverter} onChange={(e) => set("inverter", e.target.value)} placeholder="bv. 3x MP II 48/10000" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Generator</label>
            <Input value={form.generator} onChange={(e) => set("generator", e.target.value)} placeholder="bv. HIM 35" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Produkt ID</label>
            <Input value={form.product_id} onChange={(e) => set("product_id", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Firmware versie</label>
            <Input value={form.firmware_version} onChange={(e) => set("firmware_version", e.target.value)} placeholder="bv. V 556" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Geldig vanaf</label>
            <Input type="date" value={form.valid_from} onChange={(e) => set("valid_from", e.target.value)} />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.weak_ac} onChange={(e) => set("weak_ac", e.target.checked)} className="rounded" />
              Weak AC
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.power_ass} onChange={(e) => set("power_ass", e.target.checked)} className="rounded" />
              Power ASS
            </label>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Bemerkingen</label>
            <Textarea value={form.remarks} onChange={(e) => set("remarks", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.installation_id}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {saving ? "Saving…" : config ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
