import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Loader2, AlertTriangle, Copy, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAppStore } from "@/store/AppStore";
import {
  getInstallationMaterialRows, getInstallationMaterialCost,
  getInstallationMaintenance, getInstallationTasks, getInstallationFinancial,
  getDataQualityWarnings,
} from "@/data/helpers";
import { OverviewTab } from "@/components/installation-tabs/OverviewTab";
import { MaterialsTab } from "@/components/installation-tabs/MaterialsTab";
import { MaintenanceTab } from "@/components/installation-tabs/MaintenanceTab";
import { PlanningTab } from "@/components/installation-tabs/PlanningTab";
import { FinancialTab } from "@/components/installation-tabs/FinancialTab";
import { ConfigTab } from "@/components/installation-tabs/ConfigTab";
import { GeneratorMaintenanceTab } from "@/components/GeneratorMaintenanceTab";
import { CostsTab } from "@/components/installation-tabs/CostsTab";
import { DocumentsTab } from "@/components/installation-tabs/DocumentsTab";
import { FuelTab } from "@/components/installation-tabs/FuelTab";
import { InstallationFormDialog } from "@/components/dialogs/InstallationFormDialog";

export default function InstallationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useAppStore();

  const [editOpen, setEditOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneCode, setCloneCode] = useState("");
  const [cloneName, setCloneName] = useState("");
  const [cloning, setCloning] = useState(false);

  if (store.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const inst = store.installations.find((i) => i.id === id);

  if (!inst) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Installatie niet gevonden.</p>
        <Button variant="outline" onClick={() => navigate("/installations")}>Terug</Button>
      </div>
    );
  }

  const matRows = getInstallationMaterialRows(inst.id, store.installationMaterials, store.materials);
  const totalMatCost = getInstallationMaterialCost(inst.id, store.installationMaterials, store.materials);
  const maint = getInstallationMaintenance(inst.id, store.maintenanceRecords);
  const instTasks = getInstallationTasks(inst.id, store.tasks);
  const fin = getInstallationFinancial(inst.id, store.financials, store.installationMaterials, store.materials);
  const instConfigs = store.installationConfigs.filter((c) => c.installation_id === inst.id);
  const warnings = getDataQualityWarnings([inst], store.installationMaterials, store.maintenanceRecords, store.tasks, store.financials);

  const allInstallations = [...store.installations].sort((a, b) => {
    const numA = parseInt(a.code.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.code.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`${inst.name} (${inst.code})`, 14, 18);
      doc.setFontSize(9);
      doc.text(`Status: ${inst.status} | Type: ${inst.type} | ${inst.power_kva} kVA / ${inst.battery_kwh} kWh`, 14, 25);
      doc.text(`Geëxporteerd op ${new Date().toLocaleDateString("nl-BE")}`, 14, 30);

      const overviewData = [
        ["Chassisnr remorque", inst.chassis_nr || "—"],
        ["Nummerplaat", inst.nummerplaat || "—"],
        ["Chassisnr generator", inst.chassis_nr_generator || "—"],
        ["Installatiedatum", inst.installation_date || "—"],
        ["Volgende onderhoud", inst.next_maintenance_date || "—"],
        ["Volledig nazicht", inst.volledig_nazicht_date || "—"],
        ["Tracing geplaatst", inst.tracing_placed ? "Ja" : "Nee"],
        ["Verhuurklaar", inst.verhuurklaar ? "Ja" : "Nee"],
        ["Map in orde", inst.map_in_orde ? "Ja" : "Nee"],
        ["AREI schema in SG", inst.arei_schema_in_sg ? "Ja" : "Nee"],
        ["Vervaldag autokeuring", inst.vervaldag_autokeuring || "—"],
        ["Verzekering", inst.verzekering_maatschappij || "—"],
        ["Verzekering vervaldag", inst.verzekering_vervaldatum || "—"],
      ];
      autoTable(doc, { startY: 38, head: [["Veld", "Waarde"]], body: overviewData, styles: { fontSize: 8 }, headStyles: { fillColor: [41, 128, 185] } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let y = (doc as any).lastAutoTable?.finalY ?? 120;
      y += 8;

      if (matRows.length > 0) {
        doc.setFontSize(11);
        doc.text("Stuklijst", 14, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          head: [["Materiaal", "Aantal", "Eenheidsprijs", "Totaal"]],
          body: matRows.map((r) => [r.name, String(r.quantity), `€${r.unit_price.toLocaleString()}`, `€${(r.quantity * r.unit_price).toLocaleString()}`]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable?.finalY ?? y + 40;
        y += 4;
        doc.setFontSize(8);
        doc.text(`Totaal materiaal: €${totalMatCost.toLocaleString()}`, 14, y);
        y += 8;
      }

      if (fin) {
        doc.setFontSize(11);
        doc.text("Financieel", 14, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Waarde"]],
          body: [
            ["Arbeidskost", `€${fin.labour_cost.toLocaleString()}`],
            ["Afschrijving (jaren)", String(fin.depreciation_years)],
            ["Jaarlijkse huurinkomsten", `€${fin.annual_rental_income.toLocaleString()}`],
            ["Restwaarde", `€${fin.residual_value.toLocaleString()}`],
            ["WACC", `${(fin.wacc * 100).toFixed(2)}%`],
            ["IRR", fin.irr !== null ? `${(fin.irr * 100).toFixed(2)}%` : "—"],
          ],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] },
        });
      }

      doc.save(`${inst.code}_${inst.name}.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
      toast.error("PDF export mislukt");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/installations")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Button>
          <Select value={inst.id} onValueChange={(val) => navigate(`/installations/${val}`)}>
            <SelectTrigger className="h-auto border-none shadow-none p-0 gap-2 text-2xl font-semibold text-foreground [&>svg]:h-5 [&>svg]:w-5 w-auto max-w-[260px] sm:max-w-[400px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allInstallations.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name} ({i.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <StatusBadge status={inst.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCloneCode(""); setCloneName(""); setCloneOpen(true); }}>
            <Copy className="h-4 w-4 mr-1" /> Klonen
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileDown className="h-4 w-4 mr-1" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Bewerken</Button>
          <InstallationFormDialog installation={inst} open={editOpen} onOpenChange={setEditOpen} />
        </div>
      </div>

      {/* Clone dialog */}
      <Dialog open={cloneOpen} onOpenChange={setCloneOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Installatie klonen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Code *</label>
              <Input value={cloneCode} onChange={(e) => setCloneCode(e.target.value)} placeholder="bv. SG-26" autoFocus />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Naam *</label>
              <Input value={cloneName} onChange={(e) => setCloneName(e.target.value)} placeholder="bv. SolGen 26" />
            </div>
            <p className="text-xs text-muted-foreground">Stuklijst, financiële data en firmware configuratie worden mee gekloond.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneOpen(false)}>Annuleren</Button>
            <Button disabled={cloning || !cloneCode.trim() || !cloneName.trim()} onClick={async () => {
              setCloning(true);
              try {
                const newId = await store.cloneInstallation(inst.id, cloneCode.trim(), cloneName.trim());
                setCloneOpen(false);
                navigate(`/installations/${newId}`);
              } catch { /* handled */ } finally { setCloning(false); }
            }}>
              {cloning && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {cloning ? "Klonen…" : "Klonen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data warnings */}
      {warnings.length > 0 && (
        <Card className="border-warning/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <p key={i} className="text-sm text-warning">{w.message}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
        <TabsList className="w-max">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="materials">Materialen ({matRows.length})</TabsTrigger>
          <TabsTrigger value="maintenance">Onderhoud ({maint.length})</TabsTrigger>
          <TabsTrigger value="planning">Planning ({instTasks.length})</TabsTrigger>
          <TabsTrigger value="financial">Financieel</TabsTrigger>
          <TabsTrigger value="config">Firmware ({instConfigs.length})</TabsTrigger>
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="costs">Kosten</TabsTrigger>
          <TabsTrigger value="documents">Documenten</TabsTrigger>
          <TabsTrigger value="fuel">Brandstof</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="overview"><OverviewTab inst={inst} /></TabsContent>
        <TabsContent value="materials"><MaterialsTab installationId={inst.id} /></TabsContent>
        <TabsContent value="maintenance"><MaintenanceTab installationId={inst.id} /></TabsContent>
        <TabsContent value="planning"><PlanningTab installationId={inst.id} /></TabsContent>
        <TabsContent value="financial"><FinancialTab installationId={inst.id} /></TabsContent>
        <TabsContent value="config"><ConfigTab installationId={inst.id} /></TabsContent>
        <TabsContent value="generator"><GeneratorMaintenanceTab installationId={inst.id} /></TabsContent>
        <TabsContent value="costs"><CostsTab installationId={inst.id} /></TabsContent>
        <TabsContent value="documents"><DocumentsTab installationId={inst.id} /></TabsContent>
        <TabsContent value="fuel"><FuelTab installationId={inst.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
