import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, AlertTriangle } from "lucide-react";
import { VehicleFormDialog } from "@/components/dialogs/VehicleFormDialog";
import { formatDate, daysUntil } from "@/lib/formatDate";

function DateBadge({ dateStr }: { dateStr: string | null }) {
  const days = daysUntil(dateStr);
  if (!dateStr) return <span className="text-muted-foreground text-xs">—</span>;
  if (days === null) return <span className="text-xs">{formatDate(dateStr)}</span>;
  if (days < 0) return <Badge variant="destructive">{formatDate(dateStr)}</Badge>;
  if (days <= 30) return <Badge variant="outline" className="border-orange-400 text-orange-600">{formatDate(dateStr)}</Badge>;
  return <span className="text-xs">{formatDate(dateStr)}</span>;
}

export default function Vehicles() {
  const { vehicles, isLoading } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.license_plate.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.vin ?? "").toLowerCase().includes(q)
    );
  });

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

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op nummerplaat, merk, model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
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
              <TableHead>Nummerplaat</TableHead>
              <TableHead>Merk / Model</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Brandstof</TableHead>
              <TableHead>Keuring</TableHead>
              <TableHead>Verzekering</TableHead>
              <TableHead>Status</TableHead>
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
