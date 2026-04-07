import { describe, it, expect } from "vitest";
import {
  calculateIRR,
  getInstallationMaterialCost,
  getInstallationMaterialRows,
  getInstallationFinancial,
  getDataQualityWarnings,
  getMaterial,
} from "@/data/helpers";
import type { Material, InstallationMaterial, Financial, Installation, Task, MaintenanceRecord } from "@/data/types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mat1: Material = {
  id: "m1", category: "zonnepanelen", supplier: "Victron", article_number: "VP-100",
  name: "Zonnepaneel 400W", unit_price: 200, weight: 20, remarks: "",
};

const mat2: Material = {
  id: "m2", category: "batterij", supplier: "Pylontech", article_number: "PT-2000",
  name: "Batterij 5kWh", unit_price: 1500, weight: 60, remarks: "",
};

const im1: InstallationMaterial = { id: "im1", installation_id: "inst1", material_id: "m1", quantity: 10, unit_price_at_time: 200 };
const im2: InstallationMaterial = { id: "im2", installation_id: "inst1", material_id: "m2", quantity: 2, unit_price_at_time: 1500 };
const im3: InstallationMaterial = { id: "im3", installation_id: "inst2", material_id: "m1", quantity: 5 };

const fin1: Financial = {
  installation_id: "inst1",
  labour_cost: 5000,
  depreciation_years: 10,
  annual_rental_income: 8000,
  residual_value: 5000,
  cash_amount: 20000,
  loan_amount: 10000,
  loan_interest_rate: 5,
  loan_term_years: 5,
};

const baseInstallation: Installation = {
  id: "inst1",
  code: "SG-01",
  name: "SolGen 1",
  description: "",
  type: "mobile",
  power_kva: 30,
  battery_kwh: 30,
  status: "active",
  installation_date: "2024-01-01",
  next_maintenance_date: "2024-06-01",
  notes: "",
  chassis_nr: "",
  nummerplaat: "",
  chassis_nr_generator: "",
  volledig_nazicht_date: null,
  tracing_placed: false,
  verhuurklaar: false,
  arei_keuring_notes: "",
  map_in_orde: false,
  arei_schema_in_sg: false,
  vervaldag_autokeuring: null,
  nieuwe_keuring_date: null,
  verzekering_maatschappij: "",
  verzekering_vervaldatum: null,
};

// ── getMaterial ───────────────────────────────────────────────────────────────

describe("getMaterial", () => {
  it("finds a material by id", () => {
    expect(getMaterial("m1", [mat1, mat2])).toEqual(mat1);
  });

  it("returns undefined for unknown id", () => {
    expect(getMaterial("unknown", [mat1, mat2])).toBeUndefined();
  });
});

// ── getInstallationMaterialRows ───────────────────────────────────────────────

describe("getInstallationMaterialRows", () => {
  it("returns enriched rows for an installation", () => {
    const rows = getInstallationMaterialRows("inst1", [im1, im2, im3], [mat1, mat2]);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Zonnepaneel 400W");
    expect(rows[0].quantity).toBe(10);
    expect(rows[0].total).toBe(2000);
    expect(rows[1].name).toBe("Batterij 5kWh");
    expect(rows[1].total).toBe(3000);
  });

  it("uses unit_price_at_time over catalog price", () => {
    const imWithOldPrice: InstallationMaterial = { ...im1, unit_price_at_time: 150 };
    const rows = getInstallationMaterialRows("inst1", [imWithOldPrice], [mat1]);
    expect(rows[0].unit_price).toBe(150);
    expect(rows[0].total).toBe(1500);
  });

  it("falls back to catalog price when unit_price_at_time is null", () => {
    const rows = getInstallationMaterialRows("inst2", [im3], [mat1]);
    expect(rows[0].unit_price).toBe(200);
  });

  it("returns empty array for unknown installation", () => {
    expect(getInstallationMaterialRows("unknown", [im1], [mat1])).toHaveLength(0);
  });
});

// ── getInstallationMaterialCost ───────────────────────────────────────────────

describe("getInstallationMaterialCost", () => {
  it("sums material costs correctly", () => {
    // 10 * 200 + 2 * 1500 = 2000 + 3000 = 5000
    expect(getInstallationMaterialCost("inst1", [im1, im2], [mat1, mat2])).toBe(5000);
  });

  it("returns 0 for installation with no materials", () => {
    expect(getInstallationMaterialCost("unknown", [im1, im2], [mat1, mat2])).toBe(0);
  });
});

// ── calculateIRR ─────────────────────────────────────────────────────────────

describe("calculateIRR", () => {
  it("returns null for zero investment", () => {
    expect(calculateIRR(0, 1000, 0, 5)).toBeNull();
  });

  it("returns null for zero income", () => {
    expect(calculateIRR(10000, 0, 0, 5)).toBeNull();
  });

  it("returns null for zero years", () => {
    expect(calculateIRR(10000, 2000, 0, 0)).toBeNull();
  });

  it("calculates a positive IRR for profitable investment", () => {
    // Investment 10000, annual income 3000, residual 2000, over 5 years → IRR ~23%
    const irr = calculateIRR(10000, 3000, 2000, 5);
    expect(irr).not.toBeNull();
    expect(irr!).toBeGreaterThan(0.1);
    expect(irr!).toBeLessThan(0.5);
  });

  it("returns a value close to 10% for a textbook 10% scenario", () => {
    // NPV = 0 at 10%: invest 1000, get 100/yr for 10yr + 1000 residual
    // That's basically a bond: price = face value when coupon rate = discount rate
    const irr = calculateIRR(1000, 100, 1000, 10);
    expect(irr).not.toBeNull();
    expect(Math.abs(irr! - 0.1)).toBeLessThan(0.001);
  });

  it("converges for large investments", () => {
    const irr = calculateIRR(150000, 25000, 30000, 8);
    expect(irr).not.toBeNull();
    expect(irr!).toBeGreaterThan(0);
  });
});

// ── getInstallationFinancial ──────────────────────────────────────────────────

describe("getInstallationFinancial", () => {
  it("returns null when no financial record exists", () => {
    expect(getInstallationFinancial("inst1", [], [], [])).toBeNull();
  });

  it("calculates total investment as material cost + labour cost", () => {
    const result = getInstallationFinancial("inst1", [fin1], [im1, im2], [mat1, mat2]);
    expect(result).not.toBeNull();
    // materials: 5000, labour: 5000 → total: 10000
    expect(result!.material_cost).toBe(5000);
    expect(result!.labour_cost).toBe(5000);
    expect(result!.total_investment).toBe(10000);
  });

  it("calculates annual depreciation correctly", () => {
    const result = getInstallationFinancial("inst1", [fin1], [im1, im2], [mat1, mat2]);
    // (10000 - 5000) / 10 = 500
    expect(result!.annual_depreciation).toBeCloseTo(500, 2);
  });

  it("calculates WACC with 8% equity cost", () => {
    const result = getInstallationFinancial("inst1", [fin1], [im1, im2], [mat1, mat2]);
    // cash: 20000, loan: 10000, total: 30000
    // WACC = (20000/30000)*0.08 + (10000/30000)*0.05
    //      = 0.05333 + 0.01667 = 0.07
    expect(result!.wacc).toBeCloseTo(0.07, 3);
  });

  it("calculates annual net income correctly", () => {
    const result = getInstallationFinancial("inst1", [fin1], [im1, im2], [mat1, mat2]);
    // 8000 - 500 = 7500
    expect(result!.annual_net_income).toBeCloseTo(7500, 1);
  });

  it("returns a valid IRR", () => {
    const result = getInstallationFinancial("inst1", [fin1], [im1, im2], [mat1, mat2]);
    expect(result!.irr).not.toBeNull();
    expect(result!.irr!).toBeGreaterThan(0);
  });
});

// ── getDataQualityWarnings ────────────────────────────────────────────────────

describe("getDataQualityWarnings", () => {
  const today = new Date().toISOString().slice(0, 10);
  const pastDate = "2020-01-01";
  const futureDate = "2099-01-01";

  const inst = { ...baseInstallation };
  const task: Task = {
    id: "t1", installation_id: "inst1", task: "Build", date: today,
    status: "planned", assigned_to: "", task_type: "build",
  };
  const maint: MaintenanceRecord = {
    id: "mr1", installation_id: "inst1", date: today, type: "preventive",
    description: "Checkup", cost: 0, status: "planned",
  };

  it("warns when no materials linked", () => {
    const warnings = getDataQualityWarnings([inst], [], [maint], [task], [fin1]);
    expect(warnings.some((w) => w.type === "no_materials")).toBe(true);
  });

  it("warns when no financial data", () => {
    const warnings = getDataQualityWarnings([inst], [im1], [maint], [task], []);
    expect(warnings.some((w) => w.type === "no_financial")).toBe(true);
  });

  it("warns when maintenance is overdue", () => {
    const overdueInst = { ...inst, next_maintenance_date: pastDate, status: "active" as const };
    const warnings = getDataQualityWarnings([overdueInst], [im1], [], [], [fin1]);
    expect(warnings.some((w) => w.type === "overdue_maintenance")).toBe(true);
  });

  it("does not warn about overdue maintenance for inactive installations", () => {
    const inactiveInst = { ...inst, next_maintenance_date: pastDate, status: "inactive" as const };
    const warnings = getDataQualityWarnings([inactiveInst], [im1], [], [], [fin1]);
    expect(warnings.some((w) => w.type === "overdue_maintenance")).toBe(false);
  });

  it("does not warn about overdue maintenance when date is in future", () => {
    const okInst = { ...inst, next_maintenance_date: futureDate };
    const warnings = getDataQualityWarnings([okInst], [im1], [], [task], [fin1]);
    expect(warnings.some((w) => w.type === "overdue_maintenance")).toBe(false);
  });

  it("warns when installation is in_build without active tasks", () => {
    const inBuild = { ...inst, status: "in_build" as const };
    const warnings = getDataQualityWarnings([inBuild], [im1], [], [], [fin1]);
    expect(warnings.some((w) => w.type === "no_tasks_in_build")).toBe(true);
  });

  it("does not warn about tasks when in_build has active tasks", () => {
    const inBuild = { ...inst, status: "in_build" as const };
    const warnings = getDataQualityWarnings([inBuild], [im1], [], [task], [fin1]);
    expect(warnings.some((w) => w.type === "no_tasks_in_build")).toBe(false);
  });

  it("returns no warnings for a fully configured installation", () => {
    const okInst = { ...inst, next_maintenance_date: futureDate };
    const warnings = getDataQualityWarnings([okInst], [im1], [], [task], [fin1]);
    expect(warnings).toHaveLength(0);
  });
});
