import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CashflowProjectionChart } from "@/components/CashflowProjectionChart";
import { useAppStore } from "@/store/AppStore";
import { getInstallationFinancial } from "@/data/helpers";

interface Props {
  installationId: string;
}

type FinForm = {
  labour_cost: string;
  depreciation_years: string;
  annual_rental_income: string;
  residual_value: string;
  cash_amount: string;
  loan_amount: string;
  loan_interest_rate: string;
  loan_term_years: string;
};

export function FinancialTab({ installationId }: Props) {
  const store = useAppStore();
  const fin = getInstallationFinancial(installationId, store.financials, store.installationMaterials, store.materials, store.installationCosts);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FinForm>({
    labour_cost: "0", depreciation_years: "5", annual_rental_income: "0",
    residual_value: "0", cash_amount: "0", loan_amount: "0",
    loan_interest_rate: "0", loan_term_years: "5",
  });

  const startEdit = () => {
    setForm({
      labour_cost: String(fin?.labour_cost ?? 0),
      depreciation_years: String(fin?.depreciation_years ?? 5),
      annual_rental_income: String(fin?.annual_rental_income ?? 0),
      residual_value: String(fin?.residual_value ?? 0),
      cash_amount: String(fin?.cash_amount ?? 0),
      loan_amount: String(fin?.loan_amount ?? 0),
      loan_interest_rate: String(fin?.loan_interest_rate ?? 0),
      loan_term_years: String(fin?.loan_term_years ?? 5),
    });
    setEditing(true);
  };

  const save = async () => {
    const vals = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)]));
    if (Object.values(vals).some((v) => isNaN(v) || v < 0)) {
      toast.error("Alle waarden moeten geldig en niet-negatief zijn");
      return;
    }
    setSaving(true);
    try {
      await store.upsertFinancial({
        installation_id: installationId,
        labour_cost: vals.labour_cost,
        depreciation_years: vals.depreciation_years,
        annual_rental_income: vals.annual_rental_income,
        residual_value: vals.residual_value,
        cash_amount: vals.cash_amount,
        loan_amount: vals.loan_amount,
        loan_interest_rate: vals.loan_interest_rate,
        loan_term_years: vals.loan_term_years,
      });
      setEditing(false);
    } catch {
      // handled by store
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof FinForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Financieel Overzicht (Verhuurmodel)</h3>
        {!editing && (
          <Button size="sm" variant="outline" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> {fin ? "Bewerken" : "Data toevoegen"}
          </Button>
        )}
      </div>

      {editing ? (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {([
                ["labour_cost", "Werkuren kost (€)"],
                ["depreciation_years", "Afschrijving (jaren)"],
                ["annual_rental_income", "Jaarlijkse verhuurinkomsten (€)"],
                ["residual_value", "Restwaarde (€)"],
                ["cash_amount", "Cash investering (€)"],
                ["loan_amount", "Lening bedrag (€)"],
                ["loan_interest_rate", "Rente lening (%)"],
                ["loan_term_years", "Looptijd lening (jaren)"],
              ] as [keyof FinForm, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="text-sm text-muted-foreground">{label}</label>
                  <Input
                    type="number"
                    min={0}
                    step={key === "loan_interest_rate" ? "0.1" : "1"}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
              <div className="col-span-full flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {saving ? "Opslaan…" : "Opslaan"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Annuleren</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : fin ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              ["Materiaalkost", `€${fin.material_cost.toLocaleString()}`],
              ["Werkuren kost", `€${fin.labour_cost.toLocaleString()}`],
              ["Totale investering", `€${fin.total_investment.toLocaleString()}`],
              ["Jaarlijkse afschrijving", `€${Math.round(fin.annual_depreciation).toLocaleString()}`],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {(fin.total_operational_costs > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Totale operationele kosten</p>
                  <p className="text-xl font-semibold text-destructive">€{Math.round(fin.total_operational_costs).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Gem. jaarlijkse kosten</p>
                  <p className="text-xl font-semibold text-destructive">€{Math.round(fin.annual_op_cost).toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Jaarlijkse verhuurinkomsten</p>
                <p className="text-xl font-semibold">€{fin.annual_rental_income.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Netto jaarlijks inkomen</p>
                <p className={`text-xl font-semibold ${fin.annual_net_income >= 0 ? "text-green-600" : "text-destructive"}`}>
                  €{Math.round(fin.annual_net_income).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Restwaarde</p>
                <p className="text-xl font-semibold">€{fin.residual_value.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Terugverdientijd</p>
                <p className="text-xl font-semibold">
                  {fin.annual_rental_income > 0 ? `${(fin.total_investment / fin.annual_rental_income).toFixed(1)} jaar` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Cash</p>
                <p className="text-xl font-semibold">€{fin.cash_amount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Lening</p>
                <p className="text-xl font-semibold">€{fin.loan_amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{fin.loan_interest_rate}% · {fin.loan_term_years}j</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">WACC</p>
                <p className="text-xl font-semibold">{(fin.wacc * 100).toFixed(2)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">IRR</p>
                <p className={`text-xl font-semibold ${fin.irr !== null && fin.irr > fin.wacc ? "text-green-600" : "text-destructive"}`}>
                  {fin.irr !== null ? `${(fin.irr * 100).toFixed(2)}%` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cashflow Projectie</CardTitle>
            </CardHeader>
            <CardContent>
              <CashflowProjectionChart
                totalInvestment={fin.total_investment}
                annualRentalIncome={fin.annual_rental_income}
                annualDepreciation={fin.annual_depreciation}
                residualValue={fin.residual_value}
                depreciationYears={fin.depreciation_years}
                loanAmount={fin.loan_amount}
                loanInterestRate={fin.loan_interest_rate}
                loanTermYears={fin.loan_term_years}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Geen financiële data — klik "Data toevoegen" om te starten.
          </CardContent>
        </Card>
      )}
    </>
  );
}
