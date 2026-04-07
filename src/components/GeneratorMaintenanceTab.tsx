import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { GENERATOR_COMPONENTS } from "@/data/constants";
import type { GeneratorMaintenance, GeneratorComponent } from "@/data/types";

interface Props {
  installationId: string;
}

export function GeneratorMaintenanceTab({ installationId }: Props) {
  const { generatorMaintenance, upsertGeneratorMaintenance } = useAppStore();
  const [editing, setEditing] = useState<GeneratorComponent | null>(null);
  const [form, setForm] = useState({ checked_date: "", replaced_date: "", next_due_date: "", remarks: "" });
  const [saving, setSaving] = useState(false);

  const records = generatorMaintenance.filter((gm) => gm.installation_id === installationId);

  const getRecord = (component: GeneratorComponent): GeneratorMaintenance | undefined =>
    records.find((r) => r.component === component);

  const startEdit = (component: GeneratorComponent) => {
    const rec = getRecord(component);
    setForm({
      checked_date: rec?.checked_date ?? "",
      replaced_date: rec?.replaced_date ?? "",
      next_due_date: rec?.next_due_date ?? "",
      remarks: rec?.remarks ?? "",
    });
    setEditing(component);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await upsertGeneratorMaintenance({
        installation_id: installationId,
        component: editing,
        checked_date: form.checked_date || null,
        replaced_date: form.replaced_date || null,
        next_due_date: form.next_due_date || null,
        remarks: form.remarks,
      });
      setEditing(null);
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Generator Onderhoud</h3>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Onderdeel</TableHead>
                <TableHead>Nagekeken</TableHead>
                <TableHead>Vervangen</TableHead>
                <TableHead>Volgende beurt</TableHead>
                <TableHead>Opmerkingen</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GENERATOR_COMPONENTS.map(({ value, label }) => {
                const rec = getRecord(value);
                const isEditing = editing === value;
                const overdue = rec?.next_due_date && rec.next_due_date < today;

                if (isEditing) {
                  return (
                    <TableRow key={value}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell>
                        <Input type="date" value={form.checked_date} onChange={(e) => setForm((f) => ({ ...f, checked_date: e.target.value }))} className="h-8 w-[140px]" />
                      </TableCell>
                      <TableCell>
                        <Input type="date" value={form.replaced_date} onChange={(e) => setForm((f) => ({ ...f, replaced_date: e.target.value }))} className="h-8 w-[140px]" />
                      </TableCell>
                      <TableCell>
                        <Input type="date" value={form.next_due_date} onChange={(e) => setForm((f) => ({ ...f, next_due_date: e.target.value }))} className="h-8 w-[140px]" />
                      </TableCell>
                      <TableCell>
                        <Textarea value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} rows={1} className="min-h-[32px] text-sm" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={save} disabled={saving}>
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-success" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={value} className={overdue ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className="text-muted-foreground">{rec?.checked_date || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{rec?.replaced_date || "—"}</TableCell>
                    <TableCell>
                      {rec?.next_due_date ? (
                        <span className={overdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {rec.next_due_date} {overdue && "⚠️"}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{rec?.remarks || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(value)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
