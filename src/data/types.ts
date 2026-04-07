export type FuelType = "benzine" | "diesel" | "elektrisch" | "hybride" | "lpg" | "cng";
export type VehicleCategory = "personenwagen" | "bestelwagen" | "vrachtwagen" | "aanhangwagen" | "motorfiets" | "andere";
export type PlannedEventType = "keuring" | "onderhoud" | "verzekering" | "andere";

export interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  color: string | null;
  fuel_type: string | null;
  category: string | null;
  mileage: number | null;
  inspection_date: string | null;
  insurance_expiry: string | null;
  insurance_company: string | null;
  insurance_policy_nr: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  date: string;
  type: string;
  description: string | null;
  mileage_at_service: number | null;
  cost: number | null;
  provider: string | null;
  next_maintenance_date: string | null;
  next_maintenance_mileage: number | null;
  created_at: string;
}

export interface PlannedEvent {
  id: string;
  vehicle_id: string;
  title: string;
  event_date: string;
  type: string;
  notes: string | null;
  completed: boolean;
  created_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  type: string;
  name: string;
  file_url: string;
  expiry_date: string | null;
  created_at: string;
}
