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
import { Switch } from "@/components/ui/switch";
import type { Vehicle } from "@/data/types";

const schema = z.object({
  license_plate: z.string().min(1, "Verplicht"),
  brand: z.string().min(1, "Verplicht"),
  model: z.string().min(1, "Verplicht"),
  year: z.coerce.number().int().min(1900).max(2100).nullable(),
  vin: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  fuel_type: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  mileage: z.coerce.number().int().min(0).nullable(),
  inspection_date: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  insurance_company: z.string().optional().nullable(),
  insurance_policy_nr: z.string().optional().nullable(),
  driver_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
}

const FUEL_TYPES = ["benzine", "diesel", "elektrisch", "hybride", "lpg", "cng"];
const CATEGORIES = ["personenwagen", "bestelwagen", "vrachtwagen", "aanhangwagen", "motorfiets", "andere"];

export function VehicleFormDialog({ open, onOpenChange, vehicle }: Props) {
  const { addVehicle, updateVehicle, drivers } = useAppStore();
  const activeDrivers = drivers.filter((d) => d.active);
  const isEdit = !!vehicle;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { active: true, year: null, mileage: null },
  });

  useEffect(() => {
    if (open) {
      reset(vehicle ? {
        license_plate: vehicle.license_plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        color: vehicle.color,
        fuel_type: vehicle.fuel_type,
        category: vehicle.category,
        mileage: vehicle.mileage,
        inspection_date: vehicle.inspection_date,
        insurance_expiry: vehicle.insurance_expiry,
        insurance_company: vehicle.insurance_company,
        insurance_policy_nr: vehicle.insurance_policy_nr,
        driver_id: vehicle.driver_id,
        notes: vehicle.notes,
        active: vehicle.active,
      } : { active: true, year: null, mileage: null });
    }
  }, [open, vehicle, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, driver_id: data.driver_id === "none" ? null : (data.driver_id || null) };
    if (isEdit) {
      await updateVehicle(vehicle.id, payload);
    } else {
      await addVehicle(payload as Omit<Vehicle, "id" | "created_at" | "updated_at">);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Voertuig bewerken" : "Voertuig toevoegen"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nummerplaat *</Label>
              <Input {...register("license_plate")} placeholder="1-ABC-123" className="uppercase" />
              {errors.license_plate && <p className="text-xs text-destructive">{errors.license_plate.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>VIN / Chassisnummer</Label>
              <Input {...register("vin")} />
            </div>
            <div className="space-y-1">
              <Label>Merk *</Label>
              <Input {...register("brand")} placeholder="Mercedes" />
              {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Model *</Label>
              <Input {...register("model")} placeholder="Sprinter" />
              {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Jaar</Label>
              <Input {...register("year")} type="number" placeholder="2022" />
            </div>
            <div className="space-y-1">
              <Label>Kleur</Label>
              <Input {...register("color")} placeholder="Wit" />
            </div>
            <div className="space-y-1">
              <Label>Categorie</Label>
              <Select value={watch("category") ?? ""} onValueChange={(v) => setValue("category", v || null)}>
                <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Brandstof</Label>
              <Select value={watch("fuel_type") ?? ""} onValueChange={(v) => setValue("fuel_type", v || null)}>
                <SelectTrigger><SelectValue placeholder="Kies brandstof" /></SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Kilometerstand</Label>
              <Input {...register("mileage")} type="number" placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Chauffeur</Label>
              <Select value={watch("driver_id") ?? ""} onValueChange={(v) => setValue("driver_id", v || null)}>
                <SelectTrigger><SelectValue placeholder="Kies chauffeur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen chauffeur</SelectItem>
                  {activeDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.first_name} {d.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <hr />
          <p className="text-sm font-medium">Keuring & Verzekering</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Keuringsdatum</Label>
              <Input {...register("inspection_date")} type="date" />
            </div>
            <div className="space-y-1">
              <Label>Verzekering vervaldatum</Label>
              <Input {...register("insurance_expiry")} type="date" />
            </div>
            <div className="space-y-1">
              <Label>Verzekeringsmaatschappij</Label>
              <Input {...register("insurance_company")} />
            </div>
            <div className="space-y-1">
              <Label>Polisnummer</Label>
              <Input {...register("insurance_policy_nr")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notities</Label>
            <Textarea {...register("notes")} rows={3} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={watch("active")} onCheckedChange={(v) => setValue("active", v)} />
            <Label>Actief</Label>
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
