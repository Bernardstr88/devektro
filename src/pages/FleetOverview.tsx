import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppStore } from "@/store/AppStore";
import { Loader2, Check, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function BoolIcon({ value }: { value: boolean | undefined | null }) {
  if (value) return <Check className="h-4 w-4 text-green-600 mx-auto" />;
  return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
}

function BoolInline({ value, label }: { value: boolean | undefined | null; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${value ? "text-green-600" : "text-muted-foreground"}`}>
      {value ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {label}
    </span>
  );
}

function DateCell({ date, warnDays = 60 }: { date: string | null | undefined; warnDays?: number }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const color = diff < 0 ? "text-destructive font-semibold" : diff <= warnDays ? "text-warning font-medium" : "text-foreground";
  return <span className={color}>{date}</span>;
}

export default function FleetOverview() {
  const navigate = useNavigate();
  const store = useAppStore();
  const { installations } = store;

  if (store.isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const sorted = [...installations].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Vlootoverzicht</h1>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {sorted.map((inst) => (
          <Card
            key={inst.id}
            className="cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => navigate(`/installations/${inst.id}`)}
          >
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{inst.code}</span>
                    <StatusBadge status={inst.status} />
                  </div>
                  <p className="font-medium text-sm mt-0.5">{inst.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{inst.type} · {inst.power_kva} kVA · {inst.battery_kwh} kWh</p>
                </div>
                {inst.nummerplaat && (
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded shrink-0">{inst.nummerplaat}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Volledig nazicht</p>
                  <DateCell date={inst.volledig_nazicht_date} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vervaldag keuring</p>
                  <DateCell date={inst.vervaldag_autokeuring} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nieuwe keuring</p>
                  <DateCell date={inst.nieuwe_keuring_date} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verz. vervaldatum</p>
                  <DateCell date={inst.verzekering_vervaldatum} />
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t">
                <BoolInline value={inst.tracing_placed} label="Tracing" />
                <BoolInline value={inst.verhuurklaar} label="Verhuurklaar" />
                <BoolInline value={inst.map_in_orde} label="Map OK" />
                <BoolInline value={inst.arei_schema_in_sg} label="Schema in SG" />
              </div>

              {inst.arei_keuring_notes && (
                <p className="text-xs text-muted-foreground border-t pt-2 line-clamp-2">{inst.arei_keuring_notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Geen installaties gevonden.</p>
        )}
      </div>

      {/* Desktop table layout */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-12rem)]">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="hover:bg-card">
                  <TableHead className="sticky top-0 left-0 z-30 bg-card min-w-[60px]">Code</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[140px]">Benaming</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card">Status</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[110px]">Volledig nazicht</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card text-center">Tracing</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card text-center">Verhuurklaar</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[180px]">AREI keuring</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[120px]">Chassis remorque</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[100px]">Nummerplaat</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[120px]">Chassis generator</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card text-center">Map OK</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card text-center">Schema in SG</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[120px]">Vervaldag keuring</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[120px]">Nieuwe keuring</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[120px]">Verzekering</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-card min-w-[120px]">Verz. vervaldatum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((inst) => (
                  <TableRow
                    key={inst.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/installations/${inst.id}`)}
                  >
                    <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm">{inst.code}</TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <span className="font-medium">{inst.name}</span>
                        <span className="text-xs text-muted-foreground ml-1 capitalize">{inst.type} · {inst.power_kva}kVA · {inst.battery_kwh}kWh</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={inst.status} /></TableCell>
                    <TableCell className="text-sm"><DateCell date={inst.volledig_nazicht_date} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={inst.tracing_placed} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={inst.verhuurklaar} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {inst.arei_keuring_notes ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate block">{inst.arei_keuring_notes}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] whitespace-pre-wrap">{inst.arei_keuring_notes}</TooltipContent>
                        </Tooltip>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inst.chassis_nr || "—"}</TableCell>
                    <TableCell className="text-sm font-mono">{inst.nummerplaat || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inst.chassis_nr_generator || "—"}</TableCell>
                    <TableCell className="text-center"><BoolIcon value={inst.map_in_orde} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={inst.arei_schema_in_sg} /></TableCell>
                    <TableCell className="text-sm"><DateCell date={inst.vervaldag_autokeuring} /></TableCell>
                    <TableCell className="text-sm"><DateCell date={inst.nieuwe_keuring_date} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inst.verzekering_maatschappij || "—"}</TableCell>
                    <TableCell className="text-sm"><DateCell date={inst.verzekering_vervaldatum} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
