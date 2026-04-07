import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/AppStore";
import { INSTALLATION_STATUSES, INSTALLATION_TYPES } from "@/data/constants";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { InstallationStatus, InstallationType } from "@/data/types";

const empty = {
  code: "", name: "", description: "", type: "mobile" as InstallationType, power_kva: 0, battery_kwh: 0,
  status: "planned" as InstallationStatus, installation_date: "", next_maintenance_date: "", notes: "",
  chassis_nr: "", nummerplaat: "", chassis_nr_generator: "",
  volledig_nazicht_date: null as string | null, tracing_placed: false, verhuurklaar: false,
  arei_keuring_notes: "", map_in_orde: false, arei_schema_in_sg: false,
  vervaldag_autokeuring: null as string | null, nieuwe_keuring_date: null as string | null,
  verzekering_maatschappij: "", verzekering_vervaldatum: null as string | null,
};

export default function NewInstallation() {
  const navigate = useNavigate();
  const store = useAppStore();
  const { addInstallation, addInstallationMaterial, upsertFinancial, installationTemplates, templateMaterials } = store;
  const [form, setForm] = useState({ ...empty });
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | number | boolean | null) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = installationTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setForm((f) => ({ ...f, type: tpl.type, power_kva: tpl.power_kva, battery_kwh: tpl.battery_kwh }));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "Code is required";
    if (!form.name.trim()) e.name = "Name is required";
    if (form.power_kva < 0) e.power_kva = "Cannot be negative";
    if (form.battery_kwh < 0) e.battery_kwh = "Cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const newId = await addInstallation(form);
      const tpl = installationTemplates.find((t) => t.id === selectedTemplate);
      if (tpl && newId) {
        const tms = templateMaterials.filter((tm) => tm.template_id === tpl.id);
        for (const dm of tms) {
          await addInstallationMaterial({ installation_id: newId, material_id: dm.material_id, quantity: dm.quantity });
        }
        if (tpl.default_labour_cost) {
          await upsertFinancial({
            installation_id: newId,
            labour_cost: tpl.default_labour_cost,
            depreciation_years: 5,
            annual_rental_income: 0,
            residual_value: 0,
            cash_amount: 0,
            loan_amount: 0,
            loan_interest_rate: 0,
            loan_term_years: 5,
          });
        }
      }
      navigate(`/installations/${newId}`);
    } catch {
      // error toast handled in store
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/installations")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">New Installation</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">General</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Template (optional)</label>
            <Select value={selectedTemplate} onValueChange={applyTemplate}>
              <SelectTrigger><SelectValue placeholder="Create from scratch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Create from scratch</SelectItem>
                {installationTemplates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Code *</label>
            <Input value={form.code} onChange={(e) => set("code", e.target.value)} className={errors.code ? "border-destructive" : ""} />
            {errors.code && <p className="text-xs text-destructive mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Name *</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className={errors.name ? "border-destructive" : ""} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Beschrijving</label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="bv. Klein duifke" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Type</label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INSTALLATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INSTALLATION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Power (kVA)</label>
            <Input type="number" min={0} value={form.power_kva} onChange={(e) => set("power_kva", Number(e.target.value))} className={errors.power_kva ? "border-destructive" : ""} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Battery (kWh)</label>
            <Input type="number" min={0} value={form.battery_kwh} onChange={(e) => set("battery_kwh", Number(e.target.value))} className={errors.battery_kwh ? "border-destructive" : ""} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Installation Date</label>
            <Input type="date" value={form.installation_date} onChange={(e) => set("installation_date", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Next Maintenance</label>
            <Input type="date" value={form.next_maintenance_date} onChange={(e) => set("next_maintenance_date", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Notes</label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voertuig & Keuring</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Chassisnr remorque</label>
            <Input value={form.chassis_nr} onChange={(e) => set("chassis_nr", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nummerplaat</label>
            <Input value={form.nummerplaat} onChange={(e) => set("nummerplaat", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Chassisnr generator</label>
            <Input value={form.chassis_nr_generator} onChange={(e) => set("chassis_nr_generator", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Volledig nazicht op</label>
            <Input type="date" value={form.volledig_nazicht_date ?? ""} onChange={(e) => set("volledig_nazicht_date", e.target.value || null)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Vervaldag autokeuring</label>
            <Input type="date" value={form.vervaldag_autokeuring ?? ""} onChange={(e) => set("vervaldag_autokeuring", e.target.value || null)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nieuwe keuring ingepland</label>
            <Input type="date" value={form.nieuwe_keuring_date ?? ""} onChange={(e) => set("nieuwe_keuring_date", e.target.value || null)} />
          </div>
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">AREI keuring opmerkingen</label>
            <Textarea value={form.arei_keuring_notes} onChange={(e) => set("arei_keuring_notes", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-6 col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.tracing_placed} onChange={(e) => set("tracing_placed", e.target.checked)} className="rounded" />
              Tracing geplaatst
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.verhuurklaar} onChange={(e) => set("verhuurklaar", e.target.checked)} className="rounded" />
              Verhuurklaar
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.map_in_orde} onChange={(e) => set("map_in_orde", e.target.checked)} className="rounded" />
              Map in orde
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.arei_schema_in_sg} onChange={(e) => set("arei_schema_in_sg", e.target.checked)} className="rounded" />
              AREI schema in SG
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verzekering</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Maatschappij</label>
            <Input value={form.verzekering_maatschappij} onChange={(e) => set("verzekering_maatschappij", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Vervaldatum</label>
            <Input type="date" value={form.verzekering_vervaldatum ?? ""} onChange={(e) => set("verzekering_vervaldatum", e.target.value || null)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate("/installations")}>Cancel</Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {saving ? "Creating…" : "Create Installation"}
        </Button>
      </div>
    </div>
  );
}