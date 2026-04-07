import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAppStore } from "@/store/AppStore";
import { getInstallationMaterialCost, getInstallationName, getInstallationFinancial, getDataQualityWarnings } from "@/data/helpers";
import {
  Zap, Wrench, HardHat, DollarSign, Activity, Calendar, AlertTriangle,
  Loader2, Settings2, Shield, Droplets, FileCheck, TrendingUp,
} from "lucide-react";
import type { DashboardThresholds, DashboardWidgets } from "@/data/types";

const DEFAULT_THRESHOLDS: DashboardThresholds = { maintenance_days: 30, keuring_days: 60, insurance_days: 60, generator_days: 30 };
const DEFAULT_WIDGETS: DashboardWidgets = {
  kpis: true, expiring_maintenance: true, expiring_keuring: true,
  expiring_insurance: true, generator_due: true, upcoming_tasks: true, data_warnings: true,
  fleet_financials: true,
};
const DEFAULT_ORDER = ["kpis", "fleet_financials", "expiring_maintenance", "expiring_keuring", "expiring_insurance", "generator_due", "upcoming_tasks", "data_warnings"];

const WIDGET_LABELS: Record<string, string> = {
  kpis: "KPI's",
  fleet_financials: "Financieel vlootoverzicht",
  expiring_maintenance: "Onderhoud & vervaldatums",
  expiring_keuring: "Keuringen die vervallen",
  expiring_insurance: "Verzekeringen die vervallen",
  generator_due: "Generator onderhoud",
  upcoming_tasks: "Geplande taken",
  data_warnings: "Data kwaliteit waarschuwingen",
};

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "text-destructive font-semibold";
  if (days <= 7) return "text-destructive";
  if (days <= 30) return "text-warning";
  return "text-muted-foreground";
}

function urgencyBadge(days: number) {
  if (days < 0) return <Badge variant="destructive">Verlopen ({Math.abs(days)}d)</Badge>;
  if (days <= 7) return <Badge variant="destructive">Nog {days}d</Badge>;
  if (days <= 30) return <Badge className="bg-warning text-warning-foreground">Nog {days}d</Badge>;
  return <Badge variant="secondary">Nog {days}d</Badge>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const store = useAppStore();
  const { installations, materials, installationMaterials, maintenanceRecords, tasks, financials, generatorMaintenance, dashboardSettings } = store;
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (store.isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  // Parse settings
  const thresholdsSetting = dashboardSettings.find((s) => s.key === "thresholds");
  const widgetsSetting = dashboardSettings.find((s) => s.key === "widgets");
  const orderSetting = dashboardSettings.find((s) => s.key === "widget_order");

  const thresholds: DashboardThresholds = { ...DEFAULT_THRESHOLDS, ...(thresholdsSetting?.value as Partial<DashboardThresholds> ?? {}) };
  const widgets: DashboardWidgets = { ...DEFAULT_WIDGETS, ...((widgetsSetting?.value ?? {}) as Record<string, boolean>) };
  const widgetOrder: string[] = (orderSetting?.value as unknown as string[]) ?? DEFAULT_ORDER;

  const today = new Date().toISOString().slice(0, 10);
  const activeInstallations = installations.filter((i) => i.status !== "inactive");

  // KPI data
  const totalInstallations = installations.length;
  const inBuild = installations.filter((i) => i.status === "in_build").length;
  const active = installations.filter((i) => i.status === "active").length;
  const maintenanceDue = installations.filter((i) => i.status === "maintenance").length;
  const totalMaterialCost = installations.reduce((sum, i) => sum + getInstallationMaterialCost(i.id, installationMaterials, materials), 0);

  // Expiring maintenance (next_maintenance_date within threshold)
  const cutoffMaint = addDays(new Date(), thresholds.maintenance_days);
  const expiringMaintenance = activeInstallations
    .filter((i) => i.next_maintenance_date && i.next_maintenance_date <= cutoffMaint)
    .map((i) => ({ ...i, daysLeft: daysUntil(i.next_maintenance_date) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Expiring keuring (vervaldag_autokeuring or nieuwe_keuring_date)
  const cutoffKeuring = addDays(new Date(), thresholds.keuring_days);
  const expiringKeuring = activeInstallations
    .filter((i) => i.vervaldag_autokeuring && i.vervaldag_autokeuring <= cutoffKeuring)
    .map((i) => ({ ...i, daysLeft: daysUntil(i.vervaldag_autokeuring!), type: "Autokeuring" as const }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Expiring insurance
  const cutoffInsurance = addDays(new Date(), thresholds.insurance_days);
  const expiringInsurance = activeInstallations
    .filter((i) => i.verzekering_vervaldatum && i.verzekering_vervaldatum <= cutoffInsurance)
    .map((i) => ({ ...i, daysLeft: daysUntil(i.verzekering_vervaldatum!) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Generator maintenance due
  const cutoffGen = addDays(new Date(), thresholds.generator_days);
  const generatorDue = generatorMaintenance
    .filter((gm) => gm.next_due_date && gm.next_due_date <= cutoffGen)
    .map((gm) => ({
      ...gm,
      installationName: getInstallationName(gm.installation_id, installations),
      daysLeft: daysUntil(gm.next_due_date!),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Upcoming tasks
  const upcomingTasks = tasks
    .filter((t) => t.status !== "done" && t.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  // Warnings
  const warnings = getDataQualityWarnings(installations, installationMaterials, maintenanceRecords, tasks, financials);

  // Fleet financial overview
  const fleetFinancials = installations.map((inst) => {
    const fin = getInstallationFinancial(inst.id, financials, installationMaterials, materials);
    return fin ? { name: inst.name, code: inst.code, id: inst.id, ...fin } : null;
  }).filter(Boolean) as Array<{ name: string; code: string; id: string; total_investment: number; annual_rental_income: number; annual_net_income: number; wacc: number; irr: number | null }>;

  const fleetTotalInvestment = fleetFinancials.reduce((s, f) => s + f.total_investment, 0);
  const fleetTotalRentalIncome = fleetFinancials.reduce((s, f) => s + f.annual_rental_income, 0);
  const fleetTotalNetIncome = fleetFinancials.reduce((s, f) => s + f.annual_net_income, 0);
  const fleetAvgWacc = fleetFinancials.length > 0 ? fleetFinancials.reduce((s, f) => s + f.wacc, 0) / fleetFinancials.length : 0;
  const fleetIrrs = fleetFinancials.filter((f) => f.irr !== null);
  const fleetAvgIrr = fleetIrrs.length > 0 ? fleetIrrs.reduce((s, f) => s + (f.irr ?? 0), 0) / fleetIrrs.length : null;

  const kpis = [
    { label: "Installaties", value: totalInstallations, icon: Zap },
    { label: "In opbouw", value: inBuild, icon: HardHat },
    { label: "Actief", value: active, icon: Activity },
    { label: "Onderhoud", value: maintenanceDue, icon: Wrench },
    { label: "Materiaalkosten", value: `€${totalMaterialCost.toLocaleString()}`, icon: DollarSign },
  ];

  // Widget renderers
  const widgetRenderers: Record<string, () => React.ReactNode> = {
    kpis: () => (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-3">
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-semibold text-foreground">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ),
    fleet_financials: () => fleetFinancials.length > 0 ? (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Financieel vlootoverzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Totale investering</p>
              <p className="text-lg font-semibold">€{fleetTotalInvestment.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jaarlijkse verhuur</p>
              <p className="text-lg font-semibold">€{fleetTotalRentalIncome.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Netto jaarlijks</p>
              <p className={`text-lg font-semibold ${fleetTotalNetIncome >= 0 ? "text-green-600" : "text-destructive"}`}>
                €{Math.round(fleetTotalNetIncome).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gem. WACC</p>
              <p className="text-lg font-semibold">{(fleetAvgWacc * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gem. IRR</p>
              <p className={`text-lg font-semibold ${fleetAvgIrr !== null && fleetAvgIrr > fleetAvgWacc ? "text-green-600" : "text-destructive"}`}>
                {fleetAvgIrr !== null ? `${(fleetAvgIrr * 100).toFixed(2)}%` : "—"}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto"><Table><TableBody>
            {fleetFinancials.map((f) => (
              <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/installations/${f.id}`)}>
                <TableCell className="text-sm py-2 font-medium">{f.name}</TableCell>
                <TableCell className="text-sm py-2 text-right">€{f.total_investment.toLocaleString()}</TableCell>
                <TableCell className="text-sm py-2 text-right">€{f.annual_rental_income.toLocaleString()}/j</TableCell>
                <TableCell className="text-sm py-2 text-right">{(f.wacc * 100).toFixed(1)}%</TableCell>
                <TableCell className={`text-sm py-2 text-right font-medium ${f.irr !== null && f.irr > f.wacc ? "text-green-600" : "text-destructive"}`}>
                  {f.irr !== null ? `${(f.irr * 100).toFixed(1)}%` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table></div>
        </CardContent>
      </Card>
    ) : null,
    expiring_maintenance: () => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" /> Onderhoud ({expiringMaintenance.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringMaintenance.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen onderhoud binnen {thresholds.maintenance_days} dagen.</p>
          ) : (
            <div className="overflow-x-auto"><Table><TableBody>
              {expiringMaintenance.map((i) => (
                <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/installations/${i.id}`)}>
                  <TableCell className="text-sm py-2 font-medium">{i.name}</TableCell>
                  <TableCell className="text-sm py-2 text-muted-foreground">{i.next_maintenance_date}</TableCell>
                  <TableCell className="py-2 text-right">{urgencyBadge(i.daysLeft)}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>
    ),
    expiring_keuring: () => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" /> Keuringen ({expiringKeuring.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringKeuring.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen keuringen binnen {thresholds.keuring_days} dagen.</p>
          ) : (
            <div className="overflow-x-auto"><Table><TableBody>
              {expiringKeuring.map((i) => (
                <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/installations/${i.id}`)}>
                  <TableCell className="text-sm py-2 font-medium">{i.name}</TableCell>
                  <TableCell className="text-sm py-2 text-muted-foreground">{i.type}</TableCell>
                  <TableCell className="text-sm py-2 text-muted-foreground">{i.vervaldag_autokeuring}</TableCell>
                  <TableCell className="py-2 text-right">{urgencyBadge(i.daysLeft)}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>
    ),
    expiring_insurance: () => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Verzekeringen ({expiringInsurance.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringInsurance.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen verzekeringen binnen {thresholds.insurance_days} dagen.</p>
          ) : (
            <div className="overflow-x-auto"><Table><TableBody>
              {expiringInsurance.map((i) => (
                <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/installations/${i.id}`)}>
                  <TableCell className="text-sm py-2 font-medium">{i.name}</TableCell>
                  <TableCell className="text-sm py-2 text-muted-foreground">{i.verzekering_maatschappij || "—"}</TableCell>
                  <TableCell className="text-sm py-2 text-muted-foreground">{i.verzekering_vervaldatum}</TableCell>
                  <TableCell className="py-2 text-right">{urgencyBadge(i.daysLeft)}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>
    ),
    generator_due: () => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" /> Generator onderhoud ({generatorDue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generatorDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen generator onderhoud binnen {thresholds.generator_days} dagen.</p>
          ) : (
            <div className="overflow-x-auto"><Table><TableBody>
              {generatorDue.map((gm) => (
                <TableRow key={gm.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/installations/${gm.installation_id}`)}>
                  <TableCell className="text-sm py-2 font-medium">{gm.installationName}</TableCell>
                  <TableCell className="text-sm py-2 capitalize">{gm.component.replace("_", " ")}</TableCell>
                  <TableCell className="text-sm py-2 text-muted-foreground">{gm.next_due_date}</TableCell>
                  <TableCell className="py-2 text-right">{urgencyBadge(gm.daysLeft)}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>
    ),
    upcoming_tasks: () => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Geplande taken ({upcomingTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen openstaande taken.</p>
          ) : (
            <div className="overflow-x-auto"><Table><TableBody>
              {upcomingTasks.map((t) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/installations/${t.installation_id}`)}>
                  <TableCell className="text-sm py-2">{t.task}</TableCell>
                  <TableCell className="text-sm py-2 text-muted-foreground">{getInstallationName(t.installation_id, installations)}</TableCell>
                  <TableCell className="text-sm py-2 text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="py-2"><StatusBadge status={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>
    ),
    data_warnings: () => warnings.length > 0 ? (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Waarschuwingen ({warnings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {warnings.slice(0, 15).map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5" onClick={() => navigate(`/installations/${w.installationId}`)}>
                <span className="font-medium">{w.installationName}</span>
                <span className="text-muted-foreground">—</span>
                <span className="text-muted-foreground">{w.message}</span>
              </div>
            ))}
            {warnings.length > 15 && <p className="text-xs text-muted-foreground">+{warnings.length - 15} meer…</p>}
          </div>
        </CardContent>
      </Card>
    ) : null,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="h-4 w-4 mr-1" /> Instellingen
        </Button>
      </div>

      {widgetOrder.filter((w) => widgets[w as keyof DashboardWidgets] !== false).map((widgetKey) => {
        const renderer = widgetRenderers[widgetKey];
        if (!renderer) return null;
        const content = renderer();
        if (!content) return null;
        return <div key={widgetKey}>{content}</div>;
      })}

      <DashboardSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        thresholds={thresholds}
        widgets={widgets}
        widgetOrder={widgetOrder}
        onSave={async (newThresholds, newWidgets, newOrder) => {
          await store.updateDashboardSetting("thresholds", newThresholds as unknown as Record<string, unknown>);
          await store.updateDashboardSetting("widgets", newWidgets as unknown as Record<string, unknown>);
          await store.updateDashboardSetting("widget_order", newOrder as unknown as Record<string, unknown>);
        }}
      />
    </div>
  );
}

// --- Settings Dialog ---
interface SettingsProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  thresholds: DashboardThresholds;
  widgets: DashboardWidgets;
  widgetOrder: string[];
  onSave: (t: DashboardThresholds, w: DashboardWidgets, o: string[]) => Promise<void>;
}

function DashboardSettingsDialog({ open, onOpenChange, thresholds, widgets, widgetOrder, onSave }: SettingsProps) {
  const [t, setT] = useState(thresholds);
  const [w, setW] = useState(widgets);
  const [order, setOrder] = useState(widgetOrder);
  const [saving, setSaving] = useState(false);
  const dragKey = useRef<string | null>(null);
  const dragOverKey = useRef<string | null>(null);

  // Sync state when dialog opens with fresh props
  useEffect(() => {
    if (open) {
      setT(thresholds);
      setW(widgets);
      setOrder(widgetOrder);
    }
  }, [open, thresholds, widgets, widgetOrder]);

  const moveWidget = (key: string, dir: -1 | 1) => {
    setOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const handleDragStart = (key: string) => { dragKey.current = key; };
  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    dragOverKey.current = key;
  };
  const handleDrop = () => {
    const from = dragKey.current;
    const to = dragOverKey.current;
    if (!from || !to || from === to) return;
    setOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(from);
      const toIdx = next.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, from);
      return next;
    });
    dragKey.current = null;
    dragOverKey.current = null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard instellingen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Waarschuwingsdrempels (dagen vooraf)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Onderhoud</label>
                <Input type="number" min={1} value={t.maintenance_days} onChange={(e) => setT((p) => ({ ...p, maintenance_days: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Keuring</label>
                <Input type="number" min={1} value={t.keuring_days} onChange={(e) => setT((p) => ({ ...p, keuring_days: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Verzekering</label>
                <Input type="number" min={1} value={t.insurance_days} onChange={(e) => setT((p) => ({ ...p, insurance_days: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Generator</label>
                <Input type="number" min={1} value={t.generator_days} onChange={(e) => setT((p) => ({ ...p, generator_days: Number(e.target.value) }))} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Widgets tonen & volgorde</p>
            <p className="text-xs text-muted-foreground mb-2">Sleep een widget om de volgorde aan te passen.</p>
            <div className="space-y-1.5">
              {order.map((key, idx) => (
                <div
                  key={key}
                  draggable
                  onDragStart={() => handleDragStart(key)}
                  onDragOver={(e) => handleDragOver(e, key)}
                  onDrop={handleDrop}
                  className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">⠿</span>
                    <Switch
                      checked={w[key as keyof DashboardWidgets] ?? true}
                      onCheckedChange={(checked) => setW((p) => ({ ...p, [key]: checked }))}
                    />
                    <span className="text-sm">{WIDGET_LABELS[key] ?? key}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => moveWidget(key, -1)}>↑</Button>
                    <Button variant="ghost" size="sm" disabled={idx === order.length - 1} onClick={() => moveWidget(key, 1)}>↓</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button disabled={saving} onClick={async () => {
            setSaving(true);
            try {
              await onSave(t, w, order);
              onOpenChange(false);
            } catch { /* handled */ } finally { setSaving(false); }
          }}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}