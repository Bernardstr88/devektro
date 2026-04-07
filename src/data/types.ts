export type GeneratorComponent = "olie" | "oliefilter" | "brandstoffilter" | "luchtfilter" | "v_riem";

export type CostCategory = "reparatie" | "transport" | "verzekering" | "brandstof" | "keuring" | "arbeid" | "varia";

export type DocumentCategory = "algemeen" | "keuring" | "verzekering" | "arei" | "factuur" | "foto" | "varia";
export type DocumentFileType = "image" | "pdf" | "other";

export interface InstallationCost {
  id: string;
  installation_id: string;
  date: string;
  category: CostCategory;
  description: string;
  amount: number;
  supplier: string;
  invoice_ref: string;
  notes: string;
  created_at: string;
}

export interface InstallationDocument {
  id: string;
  installation_id: string;
  file_name: string;
  file_type: DocumentFileType;
  mime_type: string;
  storage_path: string;
  file_size: number;
  category: DocumentCategory;
  description: string;
  uploaded_at: string;
  uploaded_by: string;
}

export type InstallationStatus = "planned" | "in_build" | "active" | "maintenance" | "inactive";
export type InstallationType = "mobile" | "fixed" | "hybrid";
export type TaskType = "build" | "maintenance" | "inspection" | "delivery";
export type TaskStatus = "planned" | "in_progress" | "done" | "cancelled";
export type MaintenanceType = "preventive" | "corrective" | "inspection";
export type MaintenanceStatus = "planned" | "completed" | "follow_up_needed";
export type MaterialCategory = "aanhangwagen" | "interieur" | "zonnepanelen" | "kabelgoot" | "victron" | "kabel" | "batterij" | "communicatie" | "utp" | "generator" | "cee_stekkers" | "varia_elektro" | "zekeringkast" | "zekeringen" | "varia";

export interface Installation {
  id: string;
  code: string;
  name: string;
  description: string;
  type: InstallationType;
  power_kva: number;
  battery_kwh: number;
  status: InstallationStatus;
  installation_date: string;
  next_maintenance_date: string;
  notes: string;
  chassis_nr: string;
  nummerplaat: string;
  chassis_nr_generator: string;
  volledig_nazicht_date: string | null;
  tracing_placed: boolean;
  verhuurklaar: boolean;
  arei_keuring_notes: string;
  map_in_orde: boolean;
  arei_schema_in_sg: boolean;
  vervaldag_autokeuring: string | null;
  nieuwe_keuring_date: string | null;
  verzekering_maatschappij: string;
  verzekering_vervaldatum: string | null;
}

export interface Material {
  id: string;
  category: MaterialCategory;
  supplier: string;
  article_number: string;
  name: string;
  unit_price: number;
  weight: number;
  remarks: string;
}

export interface DashboardSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface DashboardThresholds {
  maintenance_days: number;
  keuring_days: number;
  insurance_days: number;
  generator_days: number;
}

export interface DashboardWidgets {
  [key: string]: boolean;
  kpis: boolean;
  expiring_maintenance: boolean;
  expiring_keuring: boolean;
  expiring_insurance: boolean;
  generator_due: boolean;
  upcoming_tasks: boolean;
  data_warnings: boolean;
}

export interface InstallationTemplate {
  id: string;
  name: string;
  type: InstallationType;
  power_kva: number;
  battery_kwh: number;
  default_labour_cost: number;
  default_estimated_sale_price: number;
  created_at?: string;
}

export interface TemplateMaterial {
  id: string;
  template_id: string;
  material_id: string;
  quantity: number;
}

export interface InstallationMaterial {
  id: string;
  installation_id: string;
  material_id: string;
  quantity: number;
  unit_price_at_time?: number | null;
}

export interface MaintenanceRecord {
  id: string;
  installation_id: string;
  date: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  status: MaintenanceStatus;
}

export interface Task {
  id: string;
  installation_id: string;
  task: string;
  date: string;
  status: TaskStatus;
  assigned_to: string;
  task_type: TaskType;
}

export interface Financial {
  installation_id: string;
  labour_cost: number;
  depreciation_years: number;
  annual_rental_income: number;
  residual_value: number;
  cash_amount: number;
  loan_amount: number;
  loan_interest_rate: number;
  loan_term_years: number;
}

export interface MaterialPrice {
  id: string;
  material_id: string;
  price: number;
  valid_from: string;
  notes: string;
  created_at: string;
}

export interface InstallationConfig {
  id: string;
  installation_id: string;
  inverter: string;
  generator: string;
  product_id: string;
  firmware_version: string;
  weak_ac: boolean;
  power_ass: boolean;
  remarks: string;
  valid_from: string;
  created_at: string;
}

export interface FuelLog {
  id: string;
  installation_id: string;
  date: string;
  liters: number;
  hours_counter: number | null;
  cost: number | null;
  filled_by: string;
  notes: string;
  created_at: string;
}

export interface GeneratorMaintenance {
  id: string;
  installation_id: string;
  component: GeneratorComponent;
  checked_date: string | null;
  replaced_date: string | null;
  next_due_date: string | null;
  remarks: string;
}
