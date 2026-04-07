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
import type { PlannedEvent } from "@/data/types";

const TYPES = ["keuring", "onderhoud", "verzekering", "andere"];

const schema = z.object({
  title: z.string().min(1, "Verplicht"),
  event_date: z.string().min(1, "Verplicht"),
  type: z.string().min(1, "Verplicht"),
  notes: z.string().optional().nullable(),
  completed: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  event?: PlannedEvent | null;
}

export function PlannedEventFormDialog({ open, onOpenChange, vehicleId, event }: Props) {
  const { addPlannedEvent, updatePlannedEvent } = useAppStore();
  const isEdit = !!event;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { completed: false },
  });

  useEffect(() => {
    if (open) {
      reset(event ? {
        title: event.title,
        event_date: event.event_date,
        type: event.type,
        notes: event.notes,
        completed: event.completed,
      } : { completed: false });
    }
  }, [open, event, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      await updatePlannedEvent(event.id, data);
    } else {
      await addPlannedEvent({ ...data, vehicle_id: vehicleId });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Afspraak bewerken" : "Afspraak toevoegen"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Titel *</Label>
            <Input {...register("title")} placeholder="bv. Periodieke keuring" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Datum *</Label>
              <Input {...register("event_date")} type="date" />
              {errors.event_date && <p className="text-xs text-destructive">{errors.event_date.message}</p>}
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
          </div>
          <div className="space-y-1">
            <Label>Notities</Label>
            <Textarea {...register("notes")} rows={2} />
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
