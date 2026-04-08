import type { Vehicle } from "@/data/types";
import { useAppStore } from "@/store/AppStore";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/formatDate";

interface Props {
  vehicle: Vehicle;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? "—"}</p>
    </div>
  );
}

export function OverviewTab({ vehicle }: Props) {
  const { drivers } = useAppStore();
  const driver = vehicle.driver_id ? drivers.find((d) => d.id === vehicle.driver_id) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Nummerplaat" value={vehicle.license_plate} />
          <Field label="Merk" value={vehicle.brand} />
          <Field label="Model" value={vehicle.model} />
          <Field label="Jaar" value={vehicle.year} />
          <Field label="Kleur" value={vehicle.color} />
          <Field label="Categorie" value={vehicle.category} />
          <Field label="Brandstof" value={vehicle.fuel_type} />
          <Field label="Kilometerstand" value={vehicle.mileage !== null ? `${vehicle.mileage.toLocaleString("nl-BE")} km` : null} />
          <Field label="VIN / Chassisnummer" value={vehicle.vin} />
          <Field label="Chauffeur" value={driver ? `${driver.first_name} ${driver.last_name}` : null} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Keuringsdatum" value={formatDate(vehicle.inspection_date)} />
          <Field label="Verzekering vervaldatum" value={formatDate(vehicle.insurance_expiry)} />
          <Field label="Verzekeringsmaatschappij" value={vehicle.insurance_company} />
          <Field label="Polisnummer" value={vehicle.insurance_policy_nr} />
        </CardContent>
      </Card>

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
