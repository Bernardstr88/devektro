import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/AppStore";
import { MATERIAL_CATEGORIES } from "@/data/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { MaterialPrice } from "@/data/types";

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { materials, isLoading: storeLoading } = useAppStore();
  const material = materials.find((m) => m.id === id);

  const { data: prices = [], isLoading: pricesLoading } = useQuery({
    queryKey: ["material_prices", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_prices")
        .select("*")
        .eq("material_id", id!)
        .order("valid_from", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MaterialPrice[];
    },
    enabled: !!id,
  });

  const [newPrice, setNewPrice] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (storeLoading || pricesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/materials")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Terug
        </Button>
        <p className="text-muted-foreground">Materiaal niet gevonden.</p>
      </div>
    );
  }

  const categoryLabel = MATERIAL_CATEGORIES.find((c) => c.value === material.category)?.label ?? material.category;
  const currentPrice = prices.length > 0 ? prices[0].price : material.unit_price;

  const addPrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Voer een geldige prijs in");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("material_prices").insert({
        material_id: material.id,
        price,
        valid_from: newDate,
        notes: newNotes,
      });
      if (error) throw error;

      // Update current unit_price on material
      const { error: updateErr } = await supabase
        .from("materials")
        .update({ unit_price: price })
        .eq("id", material.id);
      if (updateErr) throw updateErr;

      qc.invalidateQueries({ queryKey: ["material_prices", id] });
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Prijs toegevoegd");
      setNewPrice("");
      setNewNotes("");
    } catch (e: any) {
      toast.error(e.message || "Fout bij opslaan");
    } finally {
      setSaving(false);
    }
  };

  const deletePrice = async (priceId: string) => {
    const { error } = await supabase.from("material_prices").delete().eq("id", priceId);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["material_prices", id] });
    toast.success("Prijsregel verwijderd");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/materials")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Terug
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{material.name}</h1>
      </div>

      {/* Material info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Categorie</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{categoryLabel}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Leverancier</CardTitle>
          </CardHeader>
          <CardContent className="font-medium">{material.supplier || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Artikelnr</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-sm">{material.article_number || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Huidige prijs</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">€{currentPrice.toLocaleString("nl-BE", { minimumFractionDigits: 2 })}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gewicht</CardTitle>
          </CardHeader>
          <CardContent>{material.weight} kg</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Opmerkingen</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">{material.remarks || "—"}</CardContent>
        </Card>
      </div>

      {/* Add new price */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nieuwe prijs toevoegen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-sm text-muted-foreground">Prijs (€)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-32"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Geldig vanaf</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-muted-foreground">Notitie</label>
              <Input
                placeholder="bijv. prijsverhoging leverancier"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <Button onClick={addPrice} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Price history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prijshistoriek</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Geldig vanaf</TableHead>
                  <TableHead className="text-right">Prijs</TableHead>
                  <TableHead>Notitie</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {format(new Date(p.valid_from), "d MMM yyyy", { locale: nl })}
                      {idx === 0 && <Badge variant="default" className="ml-2 text-xs">Huidig</Badge>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      €{Number(p.price).toLocaleString("nl-BE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.notes || "—"}</TableCell>
                    <TableCell>
                      {idx !== 0 && (
                        <Button variant="ghost" size="sm" onClick={() => deletePrice(p.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {prices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nog geen prijshistoriek.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
