import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import type { FuelLog } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  installationId: string;
  log: FuelLog | null;
}

export function FuelLogFormDialog({ open, onOpenChange, installationId, log }: Props) {
  const { addFuelLog, updateFuelLog } = useAppStore();
  const [date, setDate] = useState("");
  const [liters, setLiters] = useState("");
  const [hoursCounter, setHoursCounter] = useState("");
  const [cost, setCost] = useState("");
  const [filledBy, setFilledBy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(log?.date ?? new Date().toISOString().slice(0, 10));
      setLiters(log?.liters != null ? String(log.liters) : "");
      setHoursCounter(log?.hours_counter != null ? String(log.hours_counter) : "");
      setCost(log?.cost != null ? String(log.cost) : "");
      setFilledBy(log?.filled_by ?? "");
      setNotes(log?.notes ?? "");
    }
  }, [open, log]);

  const valid = date && liters && Number(liters) > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const payload = {
        installation_id: installationId,
        date,
        liters: Number(liters),
        hours_counter: hoursCounter ? Number(hoursCounter) : null,
        cost: cost ? Number(cost) : null,
        filled_by: filledBy.trim(),
        notes: notes.trim(),
      };
      if (log) {
        await updateFuelLog(log.id, payload);
      } else {
        await addFuelLog(payload);
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
          <DialogTitle>{log ? "Tankbeurt bewerken" : "Tankbeurt registreren"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Datum *</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Liters *</label>
              <Input type="number" min={0.1} step="0.1" value={liters} onChange={(e) => setLiters(e.target.value)} placeholder="0.0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Urenteller (uren)</label>
              <Input type="number" min={0} step="0.1" value={hoursCounter} onChange={(e) => setHoursCounter(e.target.value)} placeholder="bv. 1250.5" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Kostprijs (€)</label>
              <Input type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Gevuld door</label>
            <Input value={filledBy} onChange={(e) => setFilledBy(e.target.value)} placeholder="Naam" />
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
            {log ? "Opslaan" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
