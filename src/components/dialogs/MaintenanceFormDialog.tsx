import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppStore } from "@/store/AppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MaintenanceRecord } from "@/data/types";

const TYPES = ["olieverversing", "banden", "remmen", "airco", "distributieriem", "filters", "algemeen", "andere"];

const schema = z.object({
  date: z.string().min(1, "Verplicht"),
  type: z.string().min(1, "Verplicht"),
  description: z.string().optional().nullable(),
  mileage_at_service: z.coerce.number().int().min(0).nullable(),
  cost: z.coerce.number().min(0).nullable(),
  provider: z.string().optional().nullable(),
  next_maintenance_date: z.string().optional().nullable(),
  next_maintenance_mileage: z.coerce.number().int().min(0).nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  record?: MaintenanceRecord | null;
}

export function MaintenanceFormDialog({ open, onOpenChange, vehicleId, record }: Props) {
  const { addMaintenanceRecord, updateMaintenanceRecord } = useAppStore();
  const isEdit = !!record;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mileage_at_service: null, cost: null, next_maintenance_mileage: null },
  });

  useEffect(() => {
    if (open) {
      reset(record ? {
        date: record.date,
        type: record.type,
        description: record.description,
        mileage_at_service: record.mileage_at_service,
        cost: record.cost,
        provider: record.provider,
        next_maintenance_date: record.next_maintenance_date,
        next_maintenance_mileage: record.next_maintenance_mileage,
      } : { mileage_at_service: null, cost: null, next_maintenance_mileage: null });
    }
  }, [open, record, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      await updateMaintenanceRecord(record.id, data);
    } else {
      await addMaintenanceRecord({ ...data, vehicle_id: vehicleId });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Onderhoud bewerken" : "Onderhoud toevoegen"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Datum *</Label>
              <Input {...register("date")} type="date" />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select value={watch("type") ?? ""} onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger><SelectValue placeholder="Kies type" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Omschrijving</Label>
              <Textarea {...register("description")} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Km-stand</Label>
              <Input {...register("mileage_at_service")} type="number" placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Kost (€)</Label>
              <Input {...register("cost")} type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Garage / Provider</Label>
              <Input {...register("provider")} />
            </div>
            <div className="space-y-1">
              <Label>Volgend onderhoud (datum)</Label>
              <Input {...register("next_maintenance_date")} type="date" />
            </div>
            <div className="space-y-1">
              <Label>Volgend onderhoud (km)</Label>
              <Input {...register("next_maintenance_mileage")} type="number" placeholder="0" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Opslaan" : "Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
