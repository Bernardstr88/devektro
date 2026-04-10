import { useState } from "react";
import type { Vehicle } from "@/data/types";
import { useAppStore } from "@/store/AppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, daysUntil } from "@/lib/formatDate";
import { differenceInYears, differenceInMonths, parseISO, isValid } from "date-fns";

function vehicleAge(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (!isValid(d)) return null;
  const now = new Date();
  const years = differenceInYears(now, d);
  const months = differenceInMonths(now, d) % 12;
  if (years === 0) return `${months} maand${months !== 1 ? "en" : ""}`;
  if (months === 0) return `${years} jaar`;
  return `${years} jaar, ${months} maand${months !== 1 ? "en" : ""}`;
}
import { ShieldCheck, ClipboardCheck } from "lucide-react";

interface Props {
  vehicle: Vehicle;
}

function Field({ label, value, breakAll, copyable }: { label: string; value: string | number | null | undefined; breakAll?: boolean; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {copyable && value ? (
        <button
          onClick={handleCopy}
          className={`text-sm text-left ${breakAll ? "break-all" : ""} hover:text-primary transition-colors cursor-copy`}
          title="Klik om te kopiëren"
        >
          {copied ? <span className="text-green-600 text-xs font-medium">Gekopieerd!</span> : String(value)}
        </button>
      ) : (
        <p className={`text-sm ${breakAll ? "break-all" : ""}`}>{value ?? "—"}</p>
      )}
    </div>
  );
}

function ExpiryField({ label, dateStr }: { label: string; dateStr: string | null }) {
  const days = daysUntil(dateStr);
  let badge = null;
  if (dateStr && days !== null) {
    if (days < 0) badge = <Badge variant="destructive">Verlopen</Badge>;
    else if (days <= 30) badge = <Badge variant="outline" className="border-orange-400 text-orange-600">{days}d</Badge>;
    else badge = <Badge variant="outline" className="border-green-500 text-green-700">In orde</Badge>;
  }
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <p className="text-sm">{formatDate(dateStr)}</p>
        {badge}
      </div>
    </div>
  );
}

export function OverviewTab({ vehicle }: Props) {
  const { drivers } = useAppStore();
  const driver = vehicle.driver_id ? drivers.find((d) => d.id === vehicle.driver_id) : null;

  return (
    <div className="space-y-4">
      {/* Algemeen */}
      <Card>
        <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Nummerplaat" value={vehicle.license_plate} copyable />
          <Field label="Merk" value={vehicle.brand} />
          <Field label="Model" value={vehicle.model} />
          <Field label="Jaar" value={vehicle.year} />
          <Field label="Kleur" value={vehicle.color} />
          <Field label="Categorie" value={vehicle.category} />
          <Field label="Brandstof" value={vehicle.fuel_type} />
          <Field label="Kilometerstand" value={vehicle.mileage !== null ? `${vehicle.mileage.toLocaleString("nl-BE")} km` : null} />
          <Field label="VIN / Chassisnummer" value={vehicle.vin} breakAll copyable />
          <Field label="Eerste ingebruikname" value={formatDate(vehicle.first_registration_date)} />
          <Field label="Leeftijd voertuig" value={vehicleAge(vehicle.first_registration_date)} />
          <Field label="Chauffeur" value={driver ? `${driver.first_name} ${driver.last_name}` : null} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Keuring */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
              Keuring
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Datum laatste keuring" value={formatDate(vehicle.last_inspection_date)} />
            <ExpiryField label="Geldig tot" dateStr={vehicle.inspection_date} />
          </CardContent>
        </Card>

        {/* Verzekering */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Verzekering
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Maatschappij" value={vehicle.insurance_company} />
            <ExpiryField label="Vervaldatum" dateStr={vehicle.insurance_expiry} />
            <Field label="Polisnummer" value={vehicle.insurance_policy_nr} />
          </CardContent>
        </Card>
      </div>

      {vehicle.notes && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Notities</p>
            <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
