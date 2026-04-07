import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { Pencil, Loader2 } from "lucide-react";
import { INSTALLATION_STATUSES, INSTALLATION_TYPES } from "@/data/constants";
import { useAppStore } from "@/store/AppStore";
import type { Installation } from "@/data/types";

interface Props {
  inst: Installation;
}

export function OverviewTab({ inst }: Props) {
  const store = useAppStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({ ...inst });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await store.updateInstallation(inst.id, {
        code: String(form.code ?? ""),
        name: String(form.name ?? ""),
        description: String(form.description ?? ""),
        type: String(form.type ?? "mobile") as Installation["type"],
        power_kva: Number(form.power_kva ?? 0),
        battery_kwh: Number(form.battery_kwh ?? 0),
        status: String(form.status ?? "planned") as Installation["status"],
        installation_date: form.installation_date ? String(form.installation_date) : "",
        next_maintenance_date: form.next_maintenance_date ? String(form.next_maintenance_date) : "",
        notes: String(form.notes ?? ""),
        chassis_nr: String(form.chassis_nr ?? ""),
        nummerplaat: String(form.nummerplaat ?? ""),
        chassis_nr_generator: String(form.chassis_nr_generator ?? ""),
        volledig_nazicht_date: form.volledig_nazicht_date ? String(form.volledig_nazicht_date) : null,
        tracing_placed: Boolean(form.tracing_placed),
        verhuurklaar: Boolean(form.verhuurklaar),
        arei_keuring_notes: String(form.arei_keuring_notes ?? ""),
        map_in_orde: Boolean(form.map_in_orde),
        arei_schema_in_sg: Boolean(form.arei_schema_in_sg),
        vervaldag_autokeuring: form.vervaldag_autokeuring ? String(form.vervaldag_autokeuring) : null,
        nieuwe_keuring_date: form.nieuwe_keuring_date ? String(form.nieuwe_keuring_date) : null,
        verzekering_maatschappij: String(form.verzekering_maatschappij ?? ""),
        verzekering_vervaldatum: form.verzekering_vervaldatum ? String(form.verzekering_vervaldatum) : null,
      });
      setEditing(false);
    } catch {
      // handled by store
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Algemene gegevens</h3>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Bewerken
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" disabled={saving} onClick={save}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Opslaan
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Annuleren</Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          {editing ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs">Code</label>
                  <Input value={String(form.code ?? "")} onChange={(e) => set("code", e.target.value)} />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Naam</label>
                  <Input value={String(form.name ?? "")} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Beschrijving</label>
                  <Input value={String(form.description ?? "")} onChange={(e) => set("description", e.target.value)} />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Type</label>
                  <Select value={String(form.type ?? "mobile")} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INSTALLATION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Power (kVA)</label>
                  <Input type="number" value={String(form.power_kva ?? 0)} onChange={(e) => set("power_kva", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Battery (kWh)</label>
                  <Input type="number" value={String(form.battery_kwh ?? 0)} onChange={(e) => set("battery_kwh", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Status</label>
                  <Select value={String(form.status ?? "planned")} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INSTALLATION_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Installatiedatum</label>
                  <Input type="date" value={String(form.installation_date ?? "")} onChange={(e) => set("installation_date", e.target.value)} />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Volgende onderhoud</label>
                  <Input type="date" value={String(form.next_maintenance_date ?? "")} onChange={(e) => set("next_maintenance_date", e.target.value)} />
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-3">Voertuig & Keuring</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground text-xs">Chassisnr remorque</label>
                    <Input value={String(form.chassis_nr ?? "")} onChange={(e) => set("chassis_nr", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">Nummerplaat</label>
                    <Input value={String(form.nummerplaat ?? "")} onChange={(e) => set("nummerplaat", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">Chassisnr generator</label>
                    <Input value={String(form.chassis_nr_generator ?? "")} onChange={(e) => set("chassis_nr_generator", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">Volledig nazicht op</label>
                    <Input type="date" value={String(form.volledig_nazicht_date ?? "")} onChange={(e) => set("volledig_nazicht_date", e.target.value || null)} />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">Vervaldag autokeuring</label>
                    <Input type="date" value={String(form.vervaldag_autokeuring ?? "")} onChange={(e) => set("vervaldag_autokeuring", e.target.value || null)} />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">Nieuwe keuring</label>
                    <Input type="date" value={String(form.nieuwe_keuring_date ?? "")} onChange={(e) => set("nieuwe_keuring_date", e.target.value || null)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 mt-3">
                  {(["tracing_placed", "verhuurklaar", "map_in_orde", "arei_schema_in_sg"] as const).map((field) => (
                    <label key={field} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={Boolean(form[field])} onCheckedChange={(c) => set(field, Boolean(c))} />
                      {field === "tracing_placed" ? "Tracing geplaatst" :
                       field === "verhuurklaar" ? "Verhuurklaar" :
                       field === "map_in_orde" ? "Map in orde" : "AREI schema in SG"}
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="text-muted-foreground text-xs">AREI keuring opmerkingen</label>
                  <Textarea value={String(form.arei_keuring_notes ?? "")} onChange={(e) => set("arei_keuring_notes", e.target.value)} rows={2} />
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-3">Verzekering</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground text-xs">Maatschappij</label>
                    <Input value={String(form.verzekering_maatschappij ?? "")} onChange={(e) => set("verzekering_maatschappij", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">Vervaldatum</label>
                    <Input type="date" value={String(form.verzekering_vervaldatum ?? "")} onChange={(e) => set("verzekering_vervaldatum", e.target.value || null)} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <label className="text-muted-foreground text-xs">Notities</label>
                <Textarea value={String(form.notes ?? "")} onChange={(e) => set("notes", e.target.value)} rows={3} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-muted-foreground">Naam</span><p className="font-medium">{inst.name}</p></div>
                <div><span className="text-muted-foreground">Code</span><p className="font-medium">{inst.code}</p></div>
                <div><span className="text-muted-foreground">Beschrijving</span><p className="font-medium">{inst.description || "—"}</p></div>
                <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{inst.type}</p></div>
                <div><span className="text-muted-foreground">Power</span><p className="font-medium">{inst.power_kva} kVA</p></div>
                <div><span className="text-muted-foreground">Battery</span><p className="font-medium">{inst.battery_kwh} kWh</p></div>
                <div><span className="text-muted-foreground">Status</span><p><StatusBadge status={inst.status} /></p></div>
                <div><span className="text-muted-foreground">Installatiedatum</span><p className="font-medium">{inst.installation_date || "—"}</p></div>
                <div><span className="text-muted-foreground">Volgende onderhoud</span><p className="font-medium">{inst.next_maintenance_date || "—"}</p></div>
              </div>

              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-3">Voertuig & Keuring</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Chassisnr remorque</span><p className="font-medium">{inst.chassis_nr || "—"}</p></div>
                  <div><span className="text-muted-foreground">Nummerplaat</span><p className="font-medium">{inst.nummerplaat || "—"}</p></div>
                  <div><span className="text-muted-foreground">Chassisnr generator</span><p className="font-medium">{inst.chassis_nr_generator || "—"}</p></div>
                  <div><span className="text-muted-foreground">Volledig nazicht op</span><p className="font-medium">{inst.volledig_nazicht_date || "—"}</p></div>
                  <div><span className="text-muted-foreground">Vervaldag autokeuring</span><p className="font-medium">{inst.vervaldag_autokeuring || "—"}</p></div>
                  <div><span className="text-muted-foreground">Nieuwe keuring</span><p className="font-medium">{inst.nieuwe_keuring_date || "—"}</p></div>
                  <div className="flex gap-4">
                    {(["tracing_placed", "verhuurklaar", "map_in_orde", "arei_schema_in_sg"] as const).map((field) => (
                      <span key={field} className={`inline-flex items-center gap-1 text-xs ${inst[field] ? "text-green-600" : "text-muted-foreground"}`}>
                        {inst[field] ? "✓" : "✗"} {field === "tracing_placed" ? "Tracing" : field === "verhuurklaar" ? "Verhuurklaar" : field === "map_in_orde" ? "Map" : "AREI schema"}
                      </span>
                    ))}
                  </div>
                </div>
                {inst.arei_keuring_notes && (
                  <div className="text-sm pt-2 mt-2 border-t">
                    <span className="text-muted-foreground">AREI keuring</span>
                    <p className="mt-1">{inst.arei_keuring_notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-3">Verzekering</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Maatschappij</span><p className="font-medium">{inst.verzekering_maatschappij || "—"}</p></div>
                  <div><span className="text-muted-foreground">Vervaldatum</span><p className="font-medium">{inst.verzekering_vervaldatum || "—"}</p></div>
                </div>
              </div>

              {inst.notes && (
                <div className="text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Notities</span>
                  <p className="mt-1">{inst.notes}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
