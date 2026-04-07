import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppStore } from "@/store/AppStore";
import { getInstallationMaterialCost } from "@/data/helpers";
import { INSTALLATION_STATUSES, INSTALLATION_TYPES } from "@/data/constants";
import { Plus, Loader2, FileDown, Search } from "lucide-react";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { InstallationFormDialog } from "@/components/dialogs/InstallationFormDialog";
import { exportToCSV } from "@/lib/csv";
import type { Installation } from "@/data/types";

const PAGE_SIZE = 25;
type SortKey = "code" | "name" | "status" | "power_kva";

export default function Installations() {
  const navigate = useNavigate();
  const { installations, materials, installationMaterials, deleteInstallation, isLoading } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Installation | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Installation | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("code");
  const [page, setPage] = useState(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtered = installations
    .filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q) ||
          (i.nummerplaat ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "power_kva") return b.power_kva - a.power_kva;
      return String(a[sortBy]).localeCompare(String(b[sortBy]));
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleExportCSV = () => {
    exportToCSV(
      `installaties_${new Date().toISOString().slice(0, 10)}`,
      ["Code", "Naam", "Type", "kVA", "kWh", "Status", "Volgend onderhoud", "Materiaalkosten (€)"],
      filtered.map((i) => [
        i.code,
        i.name,
        i.type,
        i.power_kva,
        i.battery_kwh,
        i.status,
        i.next_maintenance_date ?? "",
        getInstallationMaterialCost(i.id, installationMaterials, materials),
      ]),
    );
  };

  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} van {filtered.length}
      </span>
      <div className="flex gap-1 items-center">
        <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>←</Button>
        <span className="px-2">{safePage} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>→</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Installaties</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileDown className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => navigate("/installations/new")}>
            <Plus className="h-4 w-4 mr-1" /> New Installation
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, code, nummerplaat…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            {INSTALLATION_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            {INSTALLATION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sorteren op" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="name">Naam</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="power_kva">Vermogen (kVA)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {paginated.map((inst) => (
          <Card
            key={inst.id}
            className="cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => navigate(`/installations/${inst.id}`)}
          >
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-sm font-semibold shrink-0">{inst.code}</span>
                  <span className="font-medium text-sm truncate">{inst.name}</span>
                </div>
                <StatusBadge status={inst.status} />
              </div>
              <p className="text-xs text-muted-foreground capitalize">{inst.type} · {inst.power_kva} kVA · {inst.battery_kwh} kWh</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">
                  Onderhoud: <span className="text-foreground">{inst.next_maintenance_date || "—"}</span>
                </span>
                <span className="text-xs font-medium">
                  €{getInstallationMaterialCost(inst.id, installationMaterials, materials).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Geen installaties gevonden.</p>
        )}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">kVA</TableHead>
              <TableHead className="text-right">kWh</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Volgend onderhoud</TableHead>
              <TableHead className="text-right">Materiaalkosten</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((inst) => (
              <TableRow key={inst.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/installations/${inst.id}`)}>
                <TableCell className="font-medium">{inst.code}</TableCell>
                <TableCell>{inst.name}</TableCell>
                <TableCell className="capitalize">{inst.type}</TableCell>
                <TableCell className="text-right">{inst.power_kva}</TableCell>
                <TableCell className="text-right">{inst.battery_kwh}</TableCell>
                <TableCell><StatusBadge status={inst.status} /></TableCell>
                <TableCell className="text-muted-foreground">{inst.next_maintenance_date || "—"}</TableCell>
                <TableCell className="text-right">€{getInstallationMaterialCost(inst.id, installationMaterials, materials).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Geen installaties gevonden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination}

      <InstallationFormDialog open={editFormOpen} onOpenChange={setEditFormOpen} installation={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Installatie verwijderen"
        description={`Weet je zeker dat je "${deleting?.name}" wil verwijderen? Alle gekoppelde materialen, taken, onderhoudsdossiers en financiële data worden verwijderd.`}
        onConfirm={() => { if (deleting) { void deleteInstallation(deleting.id); setDeleting(null); } }}
      />
    </div>
  );
}
