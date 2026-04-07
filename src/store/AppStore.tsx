import React, { createContext, useCallback, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  Installation, Material, InstallationMaterial, MaintenanceRecord, Task, Financial, InstallationConfig, GeneratorMaintenance,
  DashboardSettings, InstallationTemplate, TemplateMaterial, InstallationCost, InstallationDocument, FuelLog,
} from "@/data/types";

interface AppState {
  installations: Installation[];
  materials: Material[];
  installationMaterials: InstallationMaterial[];
  maintenanceRecords: MaintenanceRecord[];
  tasks: Task[];
  financials: Financial[];
  installationConfigs: InstallationConfig[];
  generatorMaintenance: GeneratorMaintenance[];
  dashboardSettings: DashboardSettings[];
  installationTemplates: InstallationTemplate[];
  templateMaterials: TemplateMaterial[];
  installationCosts: InstallationCost[];
  installationDocuments: InstallationDocument[];
  fuelLogs: FuelLog[];
  isLoading: boolean;

  addInstallation: (i: Omit<Installation, "id">) => Promise<string>;
  updateInstallation: (id: string, i: Partial<Installation>) => Promise<void>;
  deleteInstallation: (id: string) => Promise<void>;

  addMaterial: (m: Omit<Material, "id">) => Promise<void>;
  updateMaterial: (id: string, m: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;

  addInstallationMaterial: (im: Omit<InstallationMaterial, "id">) => Promise<void>;
  updateInstallationMaterial: (id: string, im: Partial<InstallationMaterial>) => Promise<void>;
  deleteInstallationMaterial: (id: string) => Promise<void>;

  addMaintenanceRecord: (m: Omit<MaintenanceRecord, "id">) => Promise<void>;
  updateMaintenanceRecord: (id: string, m: Partial<MaintenanceRecord>) => Promise<void>;
  deleteMaintenanceRecord: (id: string) => Promise<void>;

  addTask: (t: Omit<Task, "id">) => Promise<void>;
  updateTask: (id: string, t: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  upsertFinancial: (f: Financial) => Promise<void>;

  addInstallationConfig: (c: Omit<InstallationConfig, "id" | "created_at">) => Promise<void>;
  updateInstallationConfig: (id: string, c: Partial<InstallationConfig>) => Promise<void>;
  deleteInstallationConfig: (id: string) => Promise<void>;

  upsertGeneratorMaintenance: (gm: Omit<GeneratorMaintenance, "id">) => Promise<void>;
  cloneInstallation: (sourceId: string, newCode: string, newName: string) => Promise<string>;
  updateDashboardSetting: (key: string, value: Record<string, unknown>) => Promise<void>;

  addInstallationTemplate: (t: Omit<InstallationTemplate, "id" | "created_at">) => Promise<string>;
  updateInstallationTemplate: (id: string, t: Partial<InstallationTemplate>) => Promise<void>;
  deleteInstallationTemplate: (id: string) => Promise<void>;
  addTemplateMaterial: (tm: Omit<TemplateMaterial, "id">) => Promise<void>;
  deleteTemplateMaterial: (id: string) => Promise<void>;

  addInstallationCost: (c: Omit<InstallationCost, "id" | "created_at">) => Promise<void>;
  updateInstallationCost: (id: string, c: Partial<InstallationCost>) => Promise<void>;
  deleteInstallationCost: (id: string) => Promise<void>;

  addInstallationDocument: (installationId: string, file: File, meta: { category: string; description: string; uploaded_by: string }) => Promise<void>;
  deleteInstallationDocument: (id: string, storagePath: string) => Promise<void>;
  getDocumentSignedUrl: (storagePath: string) => Promise<string>;

  addFuelLog: (f: Omit<FuelLog, "id" | "created_at">) => Promise<void>;
  updateFuelLog: (id: string, f: Partial<FuelLog>) => Promise<void>;
  deleteFuelLog: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);
const TABLE_QUERY_KEYS = [
  "installations",
  "materials",
  "installation_materials",
  "maintenance_records",
  "tasks",
  "financials",
  "installation_configs",
  "generator_maintenance",
  "dashboard_settings",
  "installation_templates",
  "template_materials",
  "installation_costs",
  "installation_documents",
  "fuel_logs",
] as const;
const defaultTableQueryOptions = {
  refetchOnMount: "always" as const,
  refetchOnReconnect: true,
  refetchOnWindowFocus: true,
};

async function fetchTable<T>(table: string): Promise<T[]> {
  // Supabase defaults to 1000 rows; paginate to fetch all
  const pageSize = 1000;
  let allData: T[] = [];
  let from = 0;
  let done = false;
  while (!done) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    allData = allData.concat(rows);
    if (rows.length < pageSize) {
      done = true;
    } else {
      from += pageSize;
    }
  }
  return allData;
}

function useTableQuery<T>(table: (typeof TABLE_QUERY_KEYS)[number]) {
  return useQuery({
    queryKey: [table],
    queryFn: () => fetchTable<T>(table),
    ...defaultTableQueryOptions,
  });
}

function parseSupabaseError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: string }).message;
    if (msg.includes("duplicate key") || msg.includes("unique")) return "A record with this value already exists.";
    if (msg.includes("violates check constraint")) return "Invalid value provided.";
    if (msg.includes("violates foreign key")) return "Referenced record does not exist.";
    return msg;
  }
  return "An unexpected error occurred.";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data: installations = [], isLoading: l1 } = useTableQuery<Installation>("installations");
  const { data: materials = [], isLoading: l2 } = useTableQuery<Material>("materials");
  const { data: installationMaterials = [], isLoading: l3 } = useTableQuery<InstallationMaterial>("installation_materials");
  const { data: maintenanceRecords = [], isLoading: l4 } = useTableQuery<MaintenanceRecord>("maintenance_records");
  const { data: tasks = [], isLoading: l5 } = useTableQuery<Task>("tasks");
  const { data: financials = [], isLoading: l6 } = useTableQuery<Financial>("financials");
  const { data: installationConfigs = [], isLoading: l7 } = useTableQuery<InstallationConfig>("installation_configs");
  const { data: generatorMaintenance = [], isLoading: l8 } = useTableQuery<GeneratorMaintenance>("generator_maintenance");
  const { data: dashboardSettings = [], isLoading: l9 } = useTableQuery<DashboardSettings>("dashboard_settings");
  const { data: installationTemplates = [], isLoading: l10 } = useTableQuery<InstallationTemplate>("installation_templates");
  const { data: templateMaterials = [], isLoading: l11 } = useTableQuery<TemplateMaterial>("template_materials");
  const { data: installationCosts = [], isLoading: l12 } = useTableQuery<InstallationCost>("installation_costs");
  const { data: installationDocuments = [], isLoading: l13 } = useTableQuery<InstallationDocument>("installation_documents");
  const { data: fuelLogs = [] } = useTableQuery<FuelLog>("fuel_logs");

  const isLoading = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11].some(Boolean);

  useEffect(() => {
    void qc.refetchQueries({ type: "active" });

    const channel = supabase.channel("app-store-sync");

    TABLE_QUERY_KEYS.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: [table] });
      });
    });

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  // --- Installations ---
  const addInstallation = useCallback(async (i: Omit<Installation, "id">): Promise<string> => {
    const { data, error } = await supabase.from("installations").insert(i).select("id").single();
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installations"] });
    toast.success("Installation created");
    return data.id;
  }, [qc]);

  const updateInstallation = useCallback(async (id: string, i: Partial<Installation>) => {
    const { error } = await supabase.from("installations").update(i).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installations"] });
    toast.success("Installation updated");
  }, [qc]);

  const deleteInstallation = useCallback(async (id: string) => {
    await supabase.from("installation_materials").delete().eq("installation_id", id);
    await supabase.from("maintenance_records").delete().eq("installation_id", id);
    await supabase.from("tasks").delete().eq("installation_id", id);
    await supabase.from("financials").delete().eq("installation_id", id);
    await supabase.from("installation_costs").delete().eq("installation_id", id);
    // Delete storage files for documents
    const { data: docs } = await supabase.from("installation_documents").select("storage_path").eq("installation_id", id);
    if (docs && docs.length > 0) {
      await supabase.storage.from("installation-files").remove(docs.map((d) => d.storage_path));
    }
    await supabase.from("installation_documents").delete().eq("installation_id", id);
    const { error } = await supabase.from("installations").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries();
    toast.success("Installation deleted");
  }, [qc]);

  // --- Materials ---
  const addMaterial = useCallback(async (m: Omit<Material, "id">) => {
    const { error } = await supabase.from("materials").insert(m);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["materials"] });
    toast.success("Material created");
  }, [qc]);

  const updateMaterial = useCallback(async (id: string, m: Partial<Material>) => {
    const { error } = await supabase.from("materials").update(m).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["materials"] });
    toast.success("Material updated");
  }, [qc]);

  const deleteMaterial = useCallback(async (id: string) => {
    await supabase.from("installation_materials").delete().eq("material_id", id);
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["materials"] });
    qc.invalidateQueries({ queryKey: ["installation_materials"] });
    toast.success("Material deleted");
  }, [qc]);

  // --- Installation Materials ---
  const addInstallationMaterial = useCallback(async (im: Omit<InstallationMaterial, "id">) => {
    // Auto-capture current material price if not provided
    const payload = { ...im };
    if (payload.unit_price_at_time == null) {
      const mat = materials.find(m => m.id === im.material_id);
      if (mat) payload.unit_price_at_time = mat.unit_price;
    }
    const { error } = await supabase.from("installation_materials").insert(payload);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_materials"] });
    toast.success("Material added to installation");
  }, [qc, materials]);

  const updateInstallationMaterial = useCallback(async (id: string, im: Partial<InstallationMaterial>) => {
    const { error } = await supabase.from("installation_materials").update(im).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_materials"] });
    toast.success("Quantity updated");
  }, [qc]);

  const deleteInstallationMaterial = useCallback(async (id: string) => {
    const { error } = await supabase.from("installation_materials").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_materials"] });
    toast.success("Material removed");
  }, [qc]);

  // --- Maintenance ---
  const addMaintenanceRecord = useCallback(async (m: Omit<MaintenanceRecord, "id">) => {
    const { error } = await supabase.from("maintenance_records").insert(m);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["maintenance_records"] });
    toast.success("Maintenance record added");
  }, [qc]);

  const updateMaintenanceRecord = useCallback(async (id: string, m: Partial<MaintenanceRecord>) => {
    const { error } = await supabase.from("maintenance_records").update(m).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["maintenance_records"] });
    toast.success("Maintenance record updated");
  }, [qc]);

  const deleteMaintenanceRecord = useCallback(async (id: string) => {
    const { error } = await supabase.from("maintenance_records").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["maintenance_records"] });
    toast.success("Maintenance record deleted");
  }, [qc]);

  // --- Tasks ---
  const addTask = useCallback(async (t: Omit<Task, "id">) => {
    const { error } = await supabase.from("tasks").insert(t);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Task added");
  }, [qc]);

  const updateTask = useCallback(async (id: string, t: Partial<Task>) => {
    const { error } = await supabase.from("tasks").update(t).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Task updated");
  }, [qc]);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Task deleted");
  }, [qc]);

  // --- Financials ---
  const upsertFinancial = useCallback(async (f: Financial) => {
    const { error } = await supabase.from("financials").upsert(f, { onConflict: "installation_id" });
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["financials"] });
    toast.success("Financial data saved");
  }, [qc]);

  // --- Installation Configs ---
  const addInstallationConfig = useCallback(async (c: Omit<InstallationConfig, "id" | "created_at">) => {
    const { error } = await supabase.from("installation_configs").insert(c);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_configs"] });
    toast.success("Configuration added");
  }, [qc]);

  const updateInstallationConfig = useCallback(async (id: string, c: Partial<InstallationConfig>) => {
    const { error } = await supabase.from("installation_configs").update(c).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_configs"] });
    toast.success("Configuration updated");
  }, [qc]);

  const deleteInstallationConfig = useCallback(async (id: string) => {
    const { error } = await supabase.from("installation_configs").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_configs"] });
    toast.success("Configuration deleted");
  }, [qc]);

  // --- Generator Maintenance ---
  const upsertGeneratorMaintenance = useCallback(async (gm: Omit<GeneratorMaintenance, "id">) => {
    const { error } = await supabase.from("generator_maintenance").upsert(gm, { onConflict: "installation_id,component" });
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["generator_maintenance"] });
    toast.success("Generator maintenance updated");
  }, [qc]);

  // --- Clone Installation ---
  const cloneInstallation = useCallback(async (sourceId: string, newCode: string, newName: string): Promise<string> => {
    const source = installations.find((i) => i.id === sourceId);
    if (!source) throw new Error("Source installation not found");

    // Clone base installation
    const { id: _, ...rest } = source;
    const newInst = { ...rest, code: newCode, name: newName, status: "planned" as const };
    const { data, error } = await supabase.from("installations").insert(newInst).select("id").single();
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    const newId = data.id;

    // Clone BOM
    const sourceIMs = installationMaterials.filter((im) => im.installation_id === sourceId);
    if (sourceIMs.length > 0) {
      const imRows = sourceIMs.map(({ id: _, ...r }) => ({ ...r, installation_id: newId }));
      const { error: imErr } = await supabase.from("installation_materials").insert(imRows);
      if (imErr) toast.error("BOM clone partial: " + parseSupabaseError(imErr));
    }

    // Clone financial
    const sourceFin = financials.find((f) => f.installation_id === sourceId);
    if (sourceFin) {
      const { error: finErr } = await supabase.from("financials").insert({ ...sourceFin, installation_id: newId });
      if (finErr) toast.error("Financial clone: " + parseSupabaseError(finErr));
    }

    // Clone configs
    const sourceConfigs = installationConfigs.filter((c) => c.installation_id === sourceId);
    if (sourceConfigs.length > 0) {
      const cfgRows = sourceConfigs.map(({ id: _, created_at: __, ...r }) => ({ ...r, installation_id: newId }));
      const { error: cfgErr } = await supabase.from("installation_configs").insert(cfgRows);
      if (cfgErr) toast.error("Config clone: " + parseSupabaseError(cfgErr));
    }

    qc.invalidateQueries();
    toast.success(`${newName} gekloond vanuit ${source.name}`);
    return newId;
  }, [qc, installations, installationMaterials, financials, installationConfigs]);

  // --- Dashboard Settings ---
  const updateDashboardSetting = useCallback(async (key: string, value: Record<string, unknown>) => {
    const { error } = await supabase.from("dashboard_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["dashboard_settings"] });
    toast.success("Dashboard instelling opgeslagen");
  }, [qc]);

  // --- Installation Templates ---
  const addInstallationTemplate = useCallback(async (t: Omit<InstallationTemplate, "id" | "created_at">): Promise<string> => {
    const { data, error } = await supabase.from("installation_templates").insert(t).select("id").single();
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_templates"] });
    toast.success("Template aangemaakt");
    return data.id;
  }, [qc]);

  const updateInstallationTemplate = useCallback(async (id: string, t: Partial<InstallationTemplate>) => {
    const { error } = await supabase.from("installation_templates").update(t).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_templates"] });
    toast.success("Template bijgewerkt");
  }, [qc]);

  const deleteInstallationTemplate = useCallback(async (id: string) => {
    await supabase.from("template_materials").delete().eq("template_id", id);
    const { error } = await supabase.from("installation_templates").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_templates"] });
    qc.invalidateQueries({ queryKey: ["template_materials"] });
    toast.success("Template verwijderd");
  }, [qc]);

  const addTemplateMaterial = useCallback(async (tm: Omit<TemplateMaterial, "id">) => {
    const { error } = await supabase.from("template_materials").insert(tm);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["template_materials"] });
    toast.success("Materiaal toegevoegd aan template");
  }, [qc]);

  const deleteTemplateMaterial = useCallback(async (id: string) => {
    const { error } = await supabase.from("template_materials").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["template_materials"] });
    toast.success("Materiaal verwijderd uit template");
  }, [qc]);

  // --- Installation Costs ---
  const addInstallationCost = useCallback(async (c: Omit<InstallationCost, "id" | "created_at">) => {
    const { error } = await supabase.from("installation_costs").insert(c);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_costs"] });
    toast.success("Kost toegevoegd");
  }, [qc]);

  const updateInstallationCost = useCallback(async (id: string, c: Partial<InstallationCost>) => {
    const { error } = await supabase.from("installation_costs").update(c).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_costs"] });
    toast.success("Kost bijgewerkt");
  }, [qc]);

  const deleteInstallationCost = useCallback(async (id: string) => {
    const { error } = await supabase.from("installation_costs").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_costs"] });
    toast.success("Kost verwijderd");
  }, [qc]);

  // --- Installation Documents ---
  const addInstallationDocument = useCallback(async (
    installationId: string,
    file: File,
    meta: { category: string; description: string; uploaded_by: string },
  ) => {
    const ext = file.name.split(".").pop() ?? "";
    const storagePath = `${installationId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const fileType = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "other";

    const { error: uploadError } = await supabase.storage.from("installation-files").upload(storagePath, file);
    if (uploadError) { toast.error(parseSupabaseError(uploadError)); throw uploadError; }

    const { error: dbError } = await supabase.from("installation_documents").insert({
      installation_id: installationId,
      file_name: file.name,
      file_type: fileType,
      mime_type: file.type,
      storage_path: storagePath,
      file_size: file.size,
      category: meta.category,
      description: meta.description,
      uploaded_by: meta.uploaded_by,
    });
    if (dbError) {
      await supabase.storage.from("installation-files").remove([storagePath]);
      toast.error(parseSupabaseError(dbError)); throw dbError;
    }
    qc.invalidateQueries({ queryKey: ["installation_documents"] });
    toast.success("Document geüpload");
    void ext; // suppress unused warning
  }, [qc]);

  const deleteInstallationDocument = useCallback(async (id: string, storagePath: string) => {
    await supabase.storage.from("installation-files").remove([storagePath]);
    const { error } = await supabase.from("installation_documents").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["installation_documents"] });
    toast.success("Document verwijderd");
  }, [qc]);

  const getDocumentSignedUrl = useCallback(async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage.from("installation-files").createSignedUrl(storagePath, 3600);
    if (error || !data?.signedUrl) throw error ?? new Error("Could not create signed URL");
    return data.signedUrl;
  }, []);

  // --- Fuel Logs ---
  const addFuelLog = useCallback(async (f: Omit<FuelLog, "id" | "created_at">) => {
    const { error } = await supabase.from("fuel_logs").insert(f);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    toast.success("Tankbeurt toegevoegd");
  }, [qc]);

  const updateFuelLog = useCallback(async (id: string, f: Partial<FuelLog>) => {
    const { error } = await supabase.from("fuel_logs").update(f).eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    toast.success("Tankbeurt bijgewerkt");
  }, [qc]);

  const deleteFuelLog = useCallback(async (id: string) => {
    const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
    if (error) { toast.error(parseSupabaseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    toast.success("Tankbeurt verwijderd");
  }, [qc]);

  return (
    <AppContext.Provider
      value={{
        installations, materials, installationMaterials, maintenanceRecords, tasks, financials, installationConfigs, generatorMaintenance, dashboardSettings, installationTemplates, templateMaterials, installationCosts, installationDocuments, fuelLogs,
        isLoading,
        addInstallation, updateInstallation, deleteInstallation,
        addMaterial, updateMaterial, deleteMaterial,
        addInstallationMaterial, updateInstallationMaterial, deleteInstallationMaterial,
        addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
        addTask, updateTask, deleteTask,
        upsertFinancial,
        addInstallationConfig, updateInstallationConfig, deleteInstallationConfig,
        upsertGeneratorMaintenance,
        cloneInstallation,
        updateDashboardSetting,
        addInstallationTemplate, updateInstallationTemplate, deleteInstallationTemplate,
        addTemplateMaterial, deleteTemplateMaterial,
        addInstallationCost, updateInstallationCost, deleteInstallationCost,
        addInstallationDocument, deleteInstallationDocument, getDocumentSignedUrl,
        addFuelLog, updateFuelLog, deleteFuelLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
