import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string | null;
  operation: string;
  changed_by_email: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

const PAGE_SIZE = 50;

const OPERATION_COLORS: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const TABLES = [
  "installations", "materials", "maintenance_records", "tasks",
  "financials", "installation_configs", "generator_maintenance",
];

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [opFilter, setOpFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-destructive">
          Audit log tabel niet gevonden. Voer eerst <code>migration_audit_log.sql</code> uit in Supabase.
        </p>
      </div>
    );
  }

  const filtered = logs.filter((l) => {
    if (tableFilter !== "all" && l.table_name !== tableFilter) return false;
    if (opFilter !== "all" && l.operation !== opFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (l.changed_by_email ?? "").toLowerCase().includes(q) ||
        (l.record_id ?? "").toLowerCase().includes(q) ||
        l.table_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("nl-BE", { dateStyle: "short", timeStyle: "short" });

  const diffSummary = (entry: AuditLogEntry): string => {
    if (entry.operation === "INSERT") return "Nieuw record aangemaakt";
    if (entry.operation === "DELETE") return "Record verwijderd";
    if (!entry.old_data || !entry.new_data) return "";
    const changed = Object.keys(entry.new_data).filter(
      (k) => JSON.stringify(entry.old_data![k]) !== JSON.stringify(entry.new_data![k]),
    );
    return changed.length > 0 ? `Gewijzigd: ${changed.join(", ")}` : "Geen wijzigingen";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} events</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op gebruiker, record ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tabel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle tabellen</SelectItem>
            {TABLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={opFilter} onValueChange={(v) => { setOpFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Operatie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tijdstip</TableHead>
              <TableHead>Tabel</TableHead>
              <TableHead>Actie</TableHead>
              <TableHead>Gebruiker</TableHead>
              <TableHead>Samenvatting</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((entry) => (
              <>
                <TableRow
                  key={entry.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{entry.table_name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${OPERATION_COLORS[entry.operation] ?? ""}`}>
                      {entry.operation}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{entry.changed_by_email ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{diffSummary(entry)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{expandedId === entry.id ? "▲" : "▼"}</TableCell>
                </TableRow>
                {expandedId === entry.id && (
                  <TableRow key={`${entry.id}-detail`}>
                    <TableCell colSpan={6} className="bg-muted/30 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {entry.old_data && (
                          <div>
                            <p className="font-semibold mb-1 text-muted-foreground">Voor</p>
                            <pre className="bg-background rounded p-2 overflow-auto max-h-48 text-foreground">
                              {JSON.stringify(entry.old_data, null, 2)}
                            </pre>
                          </div>
                        )}
                        {entry.new_data && (
                          <div>
                            <p className="font-semibold mb-1 text-muted-foreground">Na</p>
                            <pre className="bg-background rounded p-2 overflow-auto max-h-48 text-foreground">
                              {JSON.stringify(entry.new_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Geen audit events gevonden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
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
      )}
    </div>
  );
}
