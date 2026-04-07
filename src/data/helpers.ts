import type { Installation, Material, InstallationMaterial, MaintenanceRecord, Task, Financial, InstallationCost } from "./types";

/** Resolve a material by id */
export function getMaterial(materialId: string, materials: Material[]): Material | undefined {
  return materials.find((m) => m.id === materialId);
}

/** Get enriched material rows for an installation */
export function getInstallationMaterialRows(
  installationId: string,
  installationMaterials: InstallationMaterial[],
  materials: Material[],
) {
  return installationMaterials
    .filter((im) => im.installation_id === installationId)
    .map((im) => {
      const mat = getMaterial(im.material_id, materials);
      const price = im.unit_price_at_time ?? mat?.unit_price ?? 0;
      return {
        id: im.id,
        material_id: im.material_id,
        category: mat?.category ?? "",
        name: mat?.name ?? "",
        supplier: mat?.supplier ?? "",
        unit_price: price,
        quantity: im.quantity,
        total: price * im.quantity,
      };
    });
}

/** Total material cost for an installation */
export function getInstallationMaterialCost(
  installationId: string,
  installationMaterials: InstallationMaterial[],
  materials: Material[],
): number {
  return getInstallationMaterialRows(installationId, installationMaterials, materials).reduce(
    (sum, r) => sum + r.total,
    0,
  );
}

/** Get installation name by id */
export function getInstallationName(installationId: string, installations: Installation[]): string {
  return installations.find((i) => i.id === installationId)?.name ?? installationId;
}

/** Get maintenance records for an installation */
export function getInstallationMaintenance(installationId: string, maintenanceRecords: MaintenanceRecord[]) {
  return maintenanceRecords.filter((m) => m.installation_id === installationId);
}

/** Get tasks for an installation */
export function getInstallationTasks(installationId: string, tasks: Task[]) {
  return tasks.filter((t) => t.installation_id === installationId);
}

/** Get financial record for an installation with rental model calculations */
export function getInstallationFinancial(
  installationId: string,
  financials: Financial[],
  installationMaterials: InstallationMaterial[],
  materials: Material[],
  installationCosts: InstallationCost[] = [],
) {
  const fin = financials.find((f) => f.installation_id === installationId);
  if (!fin) return null;
  const materialCost = getInstallationMaterialCost(installationId, installationMaterials, materials);
  const totalInvestment = materialCost + fin.labour_cost;
  const annualDepreciation = fin.depreciation_years > 0
    ? (totalInvestment - fin.residual_value) / fin.depreciation_years
    : 0;

  // WACC calculation
  const totalFinancing = fin.cash_amount + fin.loan_amount;
  const costOfEquity = 0.08;
  const wacc = totalFinancing > 0
    ? ((fin.cash_amount / totalFinancing) * costOfEquity +
       (fin.loan_amount / totalFinancing) * (fin.loan_interest_rate / 100))
    : 0;

  // Operational costs
  const costs = installationCosts.filter((c) => c.installation_id === installationId);
  const totalOperationalCosts = costs.reduce((s, c) => s + Number(c.amount), 0);
  const years = costs.map((c) => new Date(c.date).getFullYear());
  const uniqueYears = new Set(years).size;
  const annualOpCost = uniqueYears > 0 ? totalOperationalCosts / uniqueYears : 0;

  const annualNetIncome = fin.annual_rental_income - annualDepreciation - annualOpCost;
  const irr = calculateIRR(totalInvestment, fin.annual_rental_income, fin.residual_value, fin.depreciation_years, annualOpCost);

  return {
    material_cost: materialCost,
    labour_cost: fin.labour_cost,
    total_investment: totalInvestment,
    depreciation_years: fin.depreciation_years,
    annual_depreciation: annualDepreciation,
    annual_rental_income: fin.annual_rental_income,
    annual_net_income: annualNetIncome,
    total_operational_costs: totalOperationalCosts,
    annual_op_cost: annualOpCost,
    residual_value: fin.residual_value,
    cash_amount: fin.cash_amount,
    loan_amount: fin.loan_amount,
    loan_interest_rate: fin.loan_interest_rate,
    loan_term_years: fin.loan_term_years,
    wacc,
    irr,
  };
}

/** Calculate IRR using Newton's method */
export function calculateIRR(
  investment: number,
  annualIncome: number,
  residualValue: number,
  years: number,
  annualOpCost = 0,
): number | null {
  if (investment <= 0 || annualIncome <= 0 || years <= 0) return null;
  const netAnnual = annualIncome - annualOpCost;
  if (netAnnual <= 0) return null;

  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = -investment;
    let dnpv = 0;
    for (let t = 1; t <= years; t++) {
      const cf = t === years ? netAnnual + residualValue : netAnnual;
      npv += cf / Math.pow(1 + rate, t);
      dnpv -= t * cf / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-7) { rate = newRate; break; }
    rate = newRate;
  }
  if (isNaN(rate) || !isFinite(rate) || rate < -1) return null;
  return rate;
}

// ── Data quality helpers ───────────────────────────────────────

export interface DataQualityWarning {
  installationId: string;
  installationName: string;
  type: "no_materials" | "no_financial" | "overdue_maintenance" | "no_tasks_in_build";
  message: string;
}

export function getDataQualityWarnings(
  installations: Installation[],
  installationMaterials: InstallationMaterial[],
  maintenanceRecords: MaintenanceRecord[],
  tasks: Task[],
  financials: Financial[],
): DataQualityWarning[] {
  const today = new Date().toISOString().slice(0, 10);
  const warnings: DataQualityWarning[] = [];

  for (const inst of installations) {
    const hasMaterials = installationMaterials.some((im) => im.installation_id === inst.id);
    if (!hasMaterials) {
      warnings.push({ installationId: inst.id, installationName: inst.name, type: "no_materials", message: "No materials linked" });
    }

    const hasFinancial = financials.some((f) => f.installation_id === inst.id);
    if (!hasFinancial) {
      warnings.push({ installationId: inst.id, installationName: inst.name, type: "no_financial", message: "No financial data" });
    }

    if (inst.next_maintenance_date && inst.next_maintenance_date < today && inst.status !== "inactive") {
      warnings.push({ installationId: inst.id, installationName: inst.name, type: "overdue_maintenance", message: "Overdue maintenance" });
    }

    if (inst.status === "in_build") {
      const hasTasks = tasks.some((t) => t.installation_id === inst.id && t.status !== "done" && t.status !== "cancelled");
      if (!hasTasks) {
        warnings.push({ installationId: inst.id, installationName: inst.name, type: "no_tasks_in_build", message: "In build but no active tasks" });
      }
    }
  }

  return warnings;
}
