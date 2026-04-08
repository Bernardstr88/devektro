import { useState, useMemo } from "react";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, Pencil, Trash2, ArrowUpDown, X, AlertTriangle } from "lucide-react";
import { DriverFormDialog } from "@/components/dialogs/DriverFormDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { formatDate, daysUntil } from "@/lib/formatDate";
import type { Driver } from "@/data/types";

function LicenseBadge({ dateStr }: { dateStr: string | null }) {
  const days = daysUntil(dateStr);
  if (!dateStr) return <span className="text-muted-foreground text-xs">—</span>;
  if (days === null) return <span className="text-xs">{formatDate(dateStr)}</span>;
  if (days < 0) return <Badge variant="destructive">{formatDate(dateStr)}</Badge>;
  if (days <= 30) return <Badge variant="outline" className="border-orange-400 text-orange-600">{formatDate(dateStr)}</Badge>;
  return <span className="text-xs">{formatDate(dateStr)}</span>;
}

type SortKey = "name" | "phone" | "email" | "license_expiry" | "active";
type SortDir = "asc" | "desc";

function sortDrivers(list: Driver[], key: SortKey, dir: SortDir): Driver[] {
  return [...list].sort((a, b) => {
    let av: string | number | boolean | null;
    let bv: string | number | boolean | null;
    if (key === "name") {
      av = `${a.last_name} ${a.first_name}`.toLowerCase();
      bv = `${b.last_name} ${b.first_name}`.toLowerCase();
    } else if (key === "phone") {
      av = a.phone;
      bv = b.phone;
    } else if (key === "email") {
      av = a.email;
      bv = b.email;
    } else {
      av = a[key];
      bv = b[key];
    }
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === "boolean") { av = av ? 1 : 0; bv = (bv as boolean) ? 1 : 0; }
    if (typeof av === "string") return dir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return dir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });
}

export default function Drivers() {
  const { drivers, vehicles, isLoading, deleteDriver } = useAppStore();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const hasFilters = filterStatus !== "all";

  const filtered = useMemo(() => {
    let list = drivers;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.first_name.toLowerCase().includes(q) ||
        d.last_name.toLowerCase().includes(q) ||
        (d.email ?? "").toLowerCase().includes(q) ||
        (d.phone ?? "").toLowerCase().includes(q) ||
        (d.license_number ?? "").toLowerCase().includes(q)
      );
    }

    if (filterStatus === "active") list = list.filter((d) => d.active);
    if (filterStatus === "inactive") list = list.filter((d) => !d.active);

    return sortDrivers(list, sortKey, sortDir);
  }, [drivers, search, filterStatus, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getAssignedVehicles = (driverId: string) =>
    vehicles.filter((v) => v.driver_id === driverId && v.active);

  const handleEdit = (d: Driver, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditDriver(d);
    setFormOpen(true);
  };

  const handleDeleteClick = (d: Driver, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(d);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) await deleteDriver(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditDriver(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Chauffeurs</h1>
        <Button size="sm" onClick={() => { setEditDriver(undefined); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Chauffeur toevoegen
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, e-mail, telefoon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Alle statussen</option>
          <option value="active">Actief</option>
          <option value="inactive">Inactief</option>
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus("all")} className="text-muted-foreground">
            <X className="h-3.5 w-3.5 mr-1" /> Wis filters
          </Button>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((d) => {
          const assignedVehicles = getAssignedVehicles(d.id);
          const licDays = daysUntil(d.license_expiry);
          return (
            <Card key={d.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {licDays !== null && licDays <= 30 && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                    <span className="font-semibold">{d.first_name} {d.last_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!d.active && <Badge variant="secondary">Inactief</Badge>}
                    <Button variant="ghost" size="sm" onClick={(e) => handleEdit(d, e)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={(e) => handleDeleteClick(d, e)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {d.phone && <p className="text-sm text-muted-foreground">{d.phone}</p>}
                {d.email && <p className="text-sm text-muted-foreground">{d.email}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Rijbewijs verloopt</p>
                    <LicenseBadge dateStr={d.license_expiry} />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Voertuigen</p>
                    <p className="text-sm">{assignedVehicles.length > 0 ? assignedVehicles.map((v) => v.license_plate).join(", ") : "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Geen chauffeurs gevonden.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {([
                ["name", "Naam"],
                ["phone", "Telefoon"],
                ["email", "E-mail"],
                ["license_expiry", "Rijbewijs verloopt"],
                ["active", "Status"],
              ] as [SortKey, string][]).map(([key, label]) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort(key)}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {sortKey === key
                      ? <span className="text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>
                      : <ArrowUpDown className="h-3 w-3 opacity-30" />
                    }
                  </span>
                </TableHead>
              ))}
              <TableHead>Voertuigen</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => {
              const assignedVehicles = getAssignedVehicles(d.id);
              const licDays = daysUntil(d.license_expiry);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-semibold flex items-center gap-1">
                    {licDays !== null && licDays <= 30 && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                    {d.first_name} {d.last_name}
                  </TableCell>
                  <TableCell>{d.phone ?? "—"}</TableCell>
                  <TableCell>{d.email ?? "—"}</TableCell>
                  <TableCell><LicenseBadge dateStr={d.license_expiry} /></TableCell>
                  <TableCell>
                    {d.active
                      ? <Badge variant="outline" className="border-green-500 text-green-600">Actief</Badge>
                      : <Badge variant="secondary">Inactief</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    {assignedVehicles.length > 0
                      ? assignedVehicles.map((v) => (
                          <Badge key={v.id} variant="outline" className="mr-1 font-mono text-xs">{v.license_plate}</Badge>
                        ))
                      : <span className="text-muted-foreground text-xs">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => handleEdit(d, e)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleDeleteClick(d, e)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Geen chauffeurs gevonden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DriverFormDialog open={formOpen} onOpenChange={handleFormClose} driver={editDriver} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Chauffeur verwijderen?"
        description={deleteTarget ? `${deleteTarget.first_name} ${deleteTarget.last_name} wordt permanent verwijderd. Voertuigen die aan deze chauffeur gekoppeld zijn worden ontkoppeld.` : ""}
        onConfirm={handleDelete}
      />
    </div>
  );
}
