import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/AppStore";
import { MATERIAL_CATEGORIES } from "@/data/constants";
import { Plus, Pencil, Trash2, Loader2, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MaterialFormDialog } from "@/components/dialogs/MaterialFormDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { exportToCSV } from "@/lib/csv";
import type { Material } from "@/data/types";

const PAGE_SIZE = 30;
type SortKey = "name" | "category" | "supplier" | "unit_price";

export default function Materials() {
  const { materials, deleteMaterial, isLoading } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [page, setPage] = useState(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtered = materials
    .filter((m) => {
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.supplier.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "unit_price") return b.unit_price - a.unit_price;
      return String(a[sortBy]).localeCompare(String(b[sortBy]));
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleExportCSV = () => {
    exportToCSV(
      `materiaallijst_${new Date().toISOString().slice(0, 10)}`,
      ["Categorie", "Leverancier", "Artikel #", "Naam", "Eenheidsprijs (€)", "Gewicht (kg)", "Opmerkingen"],
      filtered.map((m) => [
        m.category.replace(/_/g, " "),
        m.supplier,
        m.article_number,
        m.name,
        m.unit_price,
        m.weight,
        m.remarks,
      ]),
    );
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Materiaallijst", 14, 18);
    doc.setFontSize(9);
    doc.text(`Geëxporteerd op ${new Date().toLocaleDateString("nl-BE")}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [["Categorie", "Leverancier", "Artikel #", "Naam", "Eenheidsprijs", "Gewicht (kg)", "Opmerkingen"]],
      body: filtered.map((m) => [
        m.category.replace("_", " "),
        m.supplier,
        m.article_number,
        m.name,
        `€${m.unit_price.toLocaleString()}`,
        String(m.weight),
        m.remarks,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("materiaallijst.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Materiaallijst</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileDown className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf}>
            <FileDown className="h-4 w-4 mr-1" /> Export PDF
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New Material
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Zoek op naam, leverancier…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {MATERIAL_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
            <SelectItem value="unit_price">Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Article #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((m) => (
              <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate(`/materials/${m.id}`)}>
                <TableCell className="capitalize">{m.category.replace("_", " ")}</TableCell>
                <TableCell>{m.supplier}</TableCell>
                <TableCell className="font-mono text-xs">{m.article_number}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell className="text-right">€{m.unit_price.toLocaleString()}</TableCell>
                <TableCell className="text-right">{m.weight}</TableCell>
                <TableCell className="text-muted-foreground">{m.remarks}</TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(m); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(m)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No materials found.</TableCell></TableRow>
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

      <MaterialFormDialog open={formOpen} onOpenChange={setFormOpen} material={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete Material"
        description={`Are you sure you want to delete "${deleting?.name}"? It will be removed from all installations.`}
        onConfirm={() => { if (deleting) { deleteMaterial(deleting.id); setDeleting(null); } }}
      />
    </div>
  );
}
