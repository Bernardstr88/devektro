import type { InstallationStatus, InstallationType, GeneratorComponent, CostCategory, DocumentCategory } from "./types";

// ── Generator Components ───────────────────────────────────────
export const GENERATOR_COMPONENTS: { value: GeneratorComponent; label: string }[] = [
  { value: "olie", label: "Olie" },
  { value: "oliefilter", label: "Oliefilter" },
  { value: "brandstoffilter", label: "Brandstoffilter" },
  { value: "luchtfilter", label: "Luchtfilter" },
  { value: "v_riem", label: "V-riem" },
];

// ── Installation Status ────────────────────────────────────────
export const INSTALLATION_STATUSES: { value: InstallationStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_build", label: "In Build" },
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactive" },
];

// ── Installation Type ──────────────────────────────────────────
export const INSTALLATION_TYPES: { value: InstallationType; label: string }[] = [
  { value: "mobile", label: "Mobile" },
  { value: "fixed", label: "Fixed" },
  { value: "hybrid", label: "Hybrid" },
];

// ── Task Type ──────────────────────────────────────────────────
export const TASK_TYPES = [
  { value: "build", label: "Build" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inspection", label: "Inspection" },
  { value: "delivery", label: "Delivery" },
] as const;

// ── Task Status ────────────────────────────────────────────────
export const TASK_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
] as const;

// ── Maintenance Type ───────────────────────────────────────────
export const MAINTENANCE_TYPES = [
  { value: "preventive", label: "Preventive" },
  { value: "corrective", label: "Corrective" },
  { value: "inspection", label: "Inspection" },
] as const;

// ── Maintenance Status ─────────────────────────────────────────
export const MAINTENANCE_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Completed" },
  { value: "follow_up_needed", label: "Follow-up Needed" },
] as const;

// ── Material Category ──────────────────────────────────────────
export const MATERIAL_CATEGORIES = [
  { value: "aanhangwagen", label: "Aanhangwagen" },
  { value: "interieur", label: "Interieur" },
  { value: "zonnepanelen", label: "Zonnepanelen" },
  { value: "kabelgoot", label: "Kabelgoot" },
  { value: "victron", label: "Victron" },
  { value: "kabel", label: "Kabel & Kabelschoenen" },
  { value: "batterij", label: "Batterij & BMS" },
  { value: "communicatie", label: "Communicatie" },
  { value: "utp", label: "UTP" },
  { value: "generator", label: "Generator & Accessoires" },
  { value: "cee_stekkers", label: "CEE Stekkers" },
  { value: "varia_elektro", label: "Varia Elektro" },
  { value: "zekeringkast", label: "Zekeringkast" },
  { value: "zekeringen", label: "Zekeringen" },
  { value: "varia", label: "Varia" },
] as const;

// ── Cost Categories ────────────────────────────────────────────
export const COST_CATEGORIES: { value: CostCategory; label: string }[] = [
  { value: "reparatie", label: "Reparatie" },
  { value: "transport", label: "Transport" },
  { value: "verzekering", label: "Verzekering" },
  { value: "brandstof", label: "Brandstof" },
  { value: "keuring", label: "Keuring" },
  { value: "arbeid", label: "Arbeid" },
  { value: "varia", label: "Varia" },
];

// ── Document Categories ────────────────────────────────────────
export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "algemeen", label: "Algemeen" },
  { value: "keuring", label: "Keuring" },
  { value: "verzekering", label: "Verzekering" },
  { value: "arei", label: "AREI Schema" },
  { value: "factuur", label: "Factuur" },
  { value: "foto", label: "Foto's" },
  { value: "varia", label: "Varia" },
];

// ── Installation Templates ─────────────────────────────────────
export interface InstallationTemplate {
  id: string;
  name: string;
  type: InstallationType;
  power_kva: number;
  battery_kwh: number;
  default_materials: { material_id: string; quantity: number }[];
  default_labour_cost?: number;
  default_estimated_sale_price?: number;
}

export const INSTALLATION_TEMPLATES: InstallationTemplate[] = [
  {
    id: "tpl-30-50",
    name: "30kVA + 50kWh",
    type: "mobile",
    power_kva: 30,
    battery_kwh: 50,
    default_materials: [],
    default_labour_cost: 7500,
    default_estimated_sale_price: 64000,
  },
  {
    id: "tpl-15-40",
    name: "15kVA + 40kWh",
    type: "mobile",
    power_kva: 15,
    battery_kwh: 40,
    default_materials: [],
    default_labour_cost: 6000,
    default_estimated_sale_price: 52000,
  },
  {
    id: "tpl-8-10",
    name: "8kVA + 10kWh",
    type: "mobile",
    power_kva: 8,
    battery_kwh: 10,
    default_materials: [],
    default_labour_cost: 3750,
    default_estimated_sale_price: 26000,
  },
];
