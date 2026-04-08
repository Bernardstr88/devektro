import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, AlertTriangle, ArrowUpDown, X } from "lucide-react";
import { VehicleFormDialog } from "@/components/dialogs/VehicleFormDialog";
import { formatDate, daysUntil } from "@/lib/formatDate";
import type { Vehicle } from "@/data/types";

function DateBadge({ dateStr }: { dateStr: string | null }) {
  const days = daysUntil(dateStr);
  if (!dateStr) return <span className="text-muted-foreground text-xs">—</span>;
  if (days === null) return <span className="text-xs">{formatDate(dateStr)}</span>;
  if (days < 0) return <Badge variant="destructive">{formatDate(dateStr)}</Badge>;
  if (days <= 30) return <Badge variant="outline" className="border-orange-400 text-orange-600">{formatDate(dateStr)}</Badge>;
  return <span className="text-xs">{formatDate(dateStr)}</span>;
}

type SortKey = "license_plate" | "brand" | "category" | "fuel_type" | "inspection_date" | "insurance_expiry" | "active";
type SortDir = "asc" | "desc";

function sortVehicles(list: Vehicle[], key: SortKey, dir: SortDir): Vehicle[] {
  return [...list].sort((a, b) => {
    let av: string | number | boolean | null;
    let bv: string | number | boolean | null;
    if (key === "brand") {
      av = `${a.brand} ${a.model}`.toLowerCase();
      bv = `${b.brand} ${b.model}`.toLowerCase();
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

export default function Vehicles() {
  const { vehicles, isLoading } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("license_plate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterFuel, setFilterFuel] = useState<string>("all");

  const categories = useMemo(() => [...new Set(vehicles.map((v) => v.category).filter(Boolean))].sort(), [vehicles]);
  const fuelTypes = useMemo(() => [...new Set(vehicles.map((v) => v.fuel_type).filter(Boolean))].sort(), [vehicles]);
  const hasFilters = filterStatus !== "all" || filterCategory !== "all" || filterFuel !== "all";

  const filtered = useMemo(() => {
    let list = vehicles;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.license_plate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.vin ?? "").toLowerCase().includes(q)
      );
    }

    // Filters
    if (filterStatus === "active") list = list.filter((v) => v.active);
    if (filterStatus === "inactive") list = list.filter((v) => !v.active);
    if (filterCategory !== "all") list = list.filter((v) => v.category === filterCategory);
    if (filterFuel !== "all") list = list.filter((v) => v.fuel_type === filterFuel);

    // Sort
    return sortVehicles(list, sortKey, sortDir);
  }, [vehicles, search, filterStatus, filterCategory, filterFuel, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterFuel("all");
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
        <h1 className="text-2xl font-semibold">Voertuigen</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Voertuig toevoegen
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op nummerplaat, merk, model..."
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
        {categories.length > 1 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize"
          >
            <option value="all">Alle categorieën</option>
            {categories.map((c) => <option key={c} value={c!} className="capitalize">{c}</option>)}
          </select>
        )}
        {fuelTypes.length > 1 && (
          <select
            value={filterFuel}
            onChange={(e) => setFilterFuel(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize"
          >
            <option value="all">Alle brandstoffen</option>
            {fuelTypes.map((f) => <option key={f} value={f!} className="capitalize">{f}</option>)}
          </select>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-3.5 w-3.5 mr-1" /> Wis filters
          </Button>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((v) => (
          <Card
            key={v.id}
            className="cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => navigate(`/vehicles/${v.id}`)}
          >
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold">{v.license_plate}</span>
                {!v.active && <Badge variant="secondary">Inactief</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{v.brand} {v.model} {v.year ? `(${v.year})` : ""}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Keuring</p>
                  <DateBadge dateStr={v.inspection_date} />
                </div>
                <div>
                  <p className="text-muted-foreground">Verzekering</p>
                  <DateBadge dateStr={v.insurance_expiry} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Geen voertuigen gevonden.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {([
                ["license_plate", "Nummerplaat"],
                ["brand", "Merk / Model"],
                ["category", "Categorie"],
                ["fuel_type", "Brandstof"],
                ["inspection_date", "Keuring"],
                ["insurance_expiry", "Verzekering"],
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => {
              const kDays = daysUntil(v.inspection_date);
              const iDays = daysUntil(v.insurance_expiry);
              const hasAlert = (kDays !== null && kDays <= 30) || (iDays !== null && iDays <= 30);
              return (
                <TableRow
                  key={v.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => navigate(`/vehicles/${v.id}`)}
                >
                  <TableCell className="font-mono font-semibold flex items-center gap-1">
                    {hasAlert && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                    {v.license_plate}
                  </TableCell>
                  <TableCell>{v.brand} {v.model} {v.year ? `(${v.year})` : ""}</TableCell>
                  <TableCell className="capitalize">{v.category ?? "—"}</TableCell>
                  <TableCell className="capitalize">{v.fuel_type ?? "—"}</TableCell>
                  <TableCell><DateBadge dateStr={v.inspection_date} /></TableCell>
                  <TableCell><DateBadge dateStr={v.insurance_expiry} /></TableCell>
                  <TableCell>
                    {v.active
                      ? <Badge variant="outline" className="border-green-500 text-green-600">Actief</Badge>
                      : <Badge variant="secondary">Inactief</Badge>
                    }
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Geen voertuigen gevonden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <VehicleFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
