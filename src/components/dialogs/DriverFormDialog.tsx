import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppStore } from "@/store/AppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { Driver } from "@/data/types";

const LICENSE_CATEGORIES = ["A", "B", "BE", "C", "CE"] as const;

const schema = z.object({
  first_name: z.string().min(1, "Verplicht"),
  last_name: z.string().min(1, "Verplicht"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")).nullable(),
  license_number: z.string().optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  license_categories: z.array(z.string()).nullable(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver;
}

export function DriverFormDialog({ open, onOpenChange, driver }: Props) {
  const { addDriver, updateDriver } = useAppStore();
  const isEdit = !!driver;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { active: true },
  });

  useEffect(() => {
    if (open) {
      reset(driver ? {
        first_name: driver.first_name,
        last_name: driver.last_name,
        phone: driver.phone,
        email: driver.email,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        license_categories: driver.license_categories ?? [],
        active: driver.active,
        notes: driver.notes,
      } : { active: true, license_categories: [] });
    }
  }, [open, driver, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      license_number: data.license_number || null,
      license_expiry: data.license_expiry || null,
      license_categories: data.license_categories?.length ? data.license_categories : null,
      notes: data.notes || null,
    };
    if (isEdit) {
      await updateDriver(driver.id, payload);
    } else {
      await addDriver(payload as Omit<Driver, "id" | "created_at" | "updated_at">);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chauffeur bewerken" : "Chauffeur toevoegen"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Voornaam *</Label>
              <Input {...register("first_name")} placeholder="Jan" />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Achternaam *</Label>
              <Input {...register("last_name")} placeholder="Janssen" />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Telefoon</Label>
              <Input {...register("phone")} placeholder="+32 ..." />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input {...register("email")} type="email" placeholder="jan@voorbeeld.be" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Rijbewijsnummer</Label>
              <Input {...register("license_number")} />
            </div>
            <div className="space-y-1">
              <Label>Rijbewijs vervaldatum</Label>
              <Input {...register("license_expiry")} type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rijbewijscategorieën</Label>
            <div className="flex flex-wrap gap-3">
              {LICENSE_CATEGORIES.map((cat) => {
                const current = watch("license_categories") ?? [];
                const checked = current.includes(cat);
                return (
                  <label key={cat} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = v
                          ? [...current, cat]
                          : current.filter((c) => c !== cat);
                        setValue("license_categories", next);
                      }}
                    />
                    <span className="text-sm font-medium">{cat}</span>
                  </label>
                );
              })}
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
