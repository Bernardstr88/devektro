import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppStore } from "@/store/AppStore";
import type { Vehicle } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/formatDate";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";

const schema = z.object({
  date: z.string().min(1, "Verplicht"),
  mileage: z.coerce.number().int().min(0, "Verplicht"),
  notes: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  vehicle: Vehicle;
}

export function MileageTab({ vehicle }: Props) {
  const { mileageRecords, addMileageRecord, deleteMileageRecord } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const records = mileageRecords
    .filter((r) => r.vehicle_id === vehicle.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  const onSubmit = async (data: FormData) => {
    await addMileageRecord({ vehicle_id: vehicle.id, date: data.date, mileage: data.mileage, notes: data.notes ?? null });
    reset({ date: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const remaining = records.filter((r) => r.id !== deleteId);
    const newLatest = remaining.length > 0 ? remaining[0].mileage : null;
    await deleteMileageRecord(deleteId, vehicle.id, newLatest);
    setDeleteId(null);
  };

  // Stats
  const latest = records[0];
  const oldest = records[records.length - 1];
  let avgPerMonth: string | null = null;
  if (records.length >= 2 && latest && oldest) {
    const daysDiff = (new Date(latest.date).getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0) {
      const kmPerMonth = ((latest.mileage - oldest.mileage) / daysDiff) * 30;
      avgPerMonth = `${Math.round(kmPerMonth).toLocaleString("nl-BE")} km/maand`;
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {records.length >= 2 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Huidige stand</p>
              <p className="text-lg font-semibold">{latest.mileage.toLocaleString("nl-BE")} km</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Totaal gereden</p>
              <p className="text-lg font-semibold">{(latest.mileage - oldest.mileage).toLocaleString("nl-BE")} km</p>
            </CardContent>
          </Card>
          {avgPerMonth && (
            <Card>
              <CardContent className="pt-4 flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Gemiddeld</p>
                  <p className="text-lg font-semibold">{avgPerMonth}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Historiek</h3>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Toevoegen
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nieuwe kilometerstand</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <Label>Datum *</Label>
                <Input {...register("date")} type="date" />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Kilometerstand *</Label>
                <Input {...register("mileage")} type="number" placeholder="0" />
                {errors.mileage && <p className="text-xs text-destructive">{errors.mileage.message}</p>}
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Notitie</Label>
                <Textarea {...register("notes")} rows={1} placeholder="Optioneel" />
              </div>
              <div className="flex gap-2 md:col-span-4 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuleren</Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>Opslaan</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nog geen kilometerstanden geregistreerd.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Kilometerstand</TableHead>
                <TableHead>Verschil</TableHead>
                <TableHead>Notitie</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r, i) => {
                const prev = records[i + 1];
                const diff = prev ? r.mileage - prev.mileage : null;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
                    <TableCell className="text-sm font-mono">{r.mileage.toLocaleString("nl-BE")} km</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {diff !== null ? `+${diff.toLocaleString("nl-BE")} km` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.notes ?? "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Record verwijderen?"
        description="Dit verwijdert de kilometerstand. De huidige stand op het voertuig wordt aangepast naar het vorige record."
        onConfirm={handleDelete}
      />
    </div>
  );
}
