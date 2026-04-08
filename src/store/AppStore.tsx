import React, { createContext, useCallback, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Vehicle, MaintenanceRecord, PlannedEvent, VehicleDocument, Driver } from "@/data/types";

interface AppState {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenanceRecords: MaintenanceRecord[];
  plannedEvents: PlannedEvent[];
  vehicleDocuments: VehicleDocument[];
  isLoading: boolean;

  addVehicle: (v: Omit<Vehicle, "id" | "created_at" | "updated_at">) => Promise<string>;
  updateVehicle: (id: string, v: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  addDriver: (d: Omit<Driver, "id" | "created_at" | "updated_at">) => Promise<string>;
  updateDriver: (id: string, d: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  addMaintenanceRecord: (m: Omit<MaintenanceRecord, "id" | "created_at">) => Promise<void>;
  updateMaintenanceRecord: (id: string, m: Partial<MaintenanceRecord>) => Promise<void>;
  deleteMaintenanceRecord: (id: string) => Promise<void>;

  addPlannedEvent: (e: Omit<PlannedEvent, "id" | "created_at">) => Promise<void>;
  updatePlannedEvent: (id: string, e: Partial<PlannedEvent>) => Promise<void>;
  deletePlannedEvent: (id: string) => Promise<void>;

  addVehicleDocument: (vehicleId: string, file: File, meta: { type: string; name: string; expiry_date: string | null }) => Promise<void>;
  deleteVehicleDocument: (id: string, filePath: string) => Promise<void>;
  getDocumentSignedUrl: (filePath: string) => Promise<string>;
}

const AppContext = createContext<AppState | null>(null);

const TABLES = ["vehicles", "drivers", "maintenance_records", "planned_events", "vehicle_documents"] as const;

const defaultQueryOptions = {
  refetchOnMount: "always" as const,
  refetchOnReconnect: true,
  refetchOnWindowFocus: true,
};

async function fetchTable<T>(table: string): Promise<T[]> {
  const pageSize = 1000;
  let all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    all = all.concat(rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function useTableQuery<T>(table: (typeof TABLES)[number]) {
  return useQuery({
    queryKey: [table],
    queryFn: () => fetchTable<T>(table),
    ...defaultQueryOptions,
  });
}

function parseError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: string }).message;
    if (msg.includes("duplicate key") || msg.includes("unique")) return "Er bestaat al een record met deze waarde.";
    if (msg.includes("violates foreign key")) return "Gekoppeld record bestaat niet.";
    return msg;
  }
  return "Er is een onverwachte fout opgetreden.";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data: vehicles = [], isLoading: l1 } = useTableQuery<Vehicle>("vehicles");
  const { data: drivers = [], isLoading: l2 } = useTableQuery<Driver>("drivers");
  const { data: maintenanceRecords = [], isLoading: l3 } = useTableQuery<MaintenanceRecord>("maintenance_records");
  const { data: plannedEvents = [], isLoading: l4 } = useTableQuery<PlannedEvent>("planned_events");
  const { data: vehicleDocuments = [], isLoading: l5 } = useTableQuery<VehicleDocument>("vehicle_documents");

  const isLoading = l1 || l2 || l3 || l4 || l5;

  useEffect(() => {
    void qc.refetchQueries({ type: "active" });
    const channel = supabase.channel("devektro-sync");
    TABLES.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: [table] });
      });
    });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc]);

  // --- Vehicles ---
  const addVehicle = useCallback(async (v: Omit<Vehicle, "id" | "created_at" | "updated_at">): Promise<string> => {
    const { data, error } = await supabase.from("vehicles").insert(v).select("id").single();
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    toast.success("Voertuig toegevoegd");
    return data.id;
  }, [qc]);

  const updateVehicle = useCallback(async (id: string, v: Partial<Vehicle>) => {
    const { error } = await supabase.from("vehicles").update(v).eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    toast.success("Voertuig bijgewerkt");
  }, [qc]);

  const deleteVehicle = useCallback(async (id: string) => {
    // Delete storage files first
    const docs = vehicleDocuments.filter((d) => d.vehicle_id === id);
    if (docs.length > 0) {
      await supabase.storage.from("vehicle-documents").remove(docs.map((d) => d.file_url));
    }
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries();
    toast.success("Voertuig verwijderd");
  }, [qc, vehicleDocuments]);

  // --- Drivers ---
  const addDriver = useCallback(async (d: Omit<Driver, "id" | "created_at" | "updated_at">): Promise<string> => {
    const { data, error } = await supabase.from("drivers").insert(d).select("id").single();
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["drivers"] });
    toast.success("Chauffeur toegevoegd");
    return data.id;
  }, [qc]);

  const updateDriver = useCallback(async (id: string, d: Partial<Driver>) => {
    const { error } = await supabase.from("drivers").update(d).eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["drivers"] });
    toast.success("Chauffeur bijgewerkt");
  }, [qc]);

  const deleteDriver = useCallback(async (id: string) => {
    // Unassign driver from all vehicles first
    const { error: unassignError } = await supabase.from("vehicles").update({ driver_id: null }).eq("driver_id", id);
    if (unassignError) { toast.error(parseError(unassignError)); throw unassignError; }
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["drivers"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    toast.success("Chauffeur verwijderd");
  }, [qc]);

  // --- Maintenance ---
  const addMaintenanceRecord = useCallback(async (m: Omit<MaintenanceRecord, "id" | "created_at">) => {
    const { error } = await supabase.from("maintenance_records").insert(m);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["maintenance_records"] });
    toast.success("Onderhoudsrecord toegevoegd");
  }, [qc]);

  const updateMaintenanceRecord = useCallback(async (id: string, m: Partial<MaintenanceRecord>) => {
    const { error } = await supabase.from("maintenance_records").update(m).eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["maintenance_records"] });
    toast.success("Onderhoudsrecord bijgewerkt");
  }, [qc]);

  const deleteMaintenanceRecord = useCallback(async (id: string) => {
    const { error } = await supabase.from("maintenance_records").delete().eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["maintenance_records"] });
    toast.success("Onderhoudsrecord verwijderd");
  }, [qc]);

  // --- Planned Events ---
  const addPlannedEvent = useCallback(async (e: Omit<PlannedEvent, "id" | "created_at">) => {
    const { error } = await supabase.from("planned_events").insert(e);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["planned_events"] });
    toast.success("Afspraak ingepland");
  }, [qc]);

  const updatePlannedEvent = useCallback(async (id: string, e: Partial<PlannedEvent>) => {
    const { error } = await supabase.from("planned_events").update(e).eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["planned_events"] });
    toast.success("Afspraak bijgewerkt");
  }, [qc]);

  const deletePlannedEvent = useCallback(async (id: string) => {
    const { error } = await supabase.from("planned_events").delete().eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["planned_events"] });
    toast.success("Afspraak verwijderd");
  }, [qc]);

  // --- Documents ---
  const addVehicleDocument = useCallback(async (
    vehicleId: string,
    file: File,
    meta: { type: string; name: string; expiry_date: string | null },
  ) => {
    const storagePath = `${vehicleId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from("vehicle-documents").upload(storagePath, file);
    if (uploadError) { toast.error(parseError(uploadError)); throw uploadError; }

    const { error: dbError } = await supabase.from("vehicle_documents").insert({
      vehicle_id: vehicleId,
      type: meta.type,
      name: meta.name,
      file_url: storagePath,
      expiry_date: meta.expiry_date || null,
    });
    if (dbError) {
      await supabase.storage.from("vehicle-documents").remove([storagePath]);
      toast.error(parseError(dbError)); throw dbError;
    }
    qc.invalidateQueries({ queryKey: ["vehicle_documents"] });
    toast.success("Document geüpload");
  }, [qc]);

  const deleteVehicleDocument = useCallback(async (id: string, filePath: string) => {
    await supabase.storage.from("vehicle-documents").remove([filePath]);
    const { error } = await supabase.from("vehicle_documents").delete().eq("id", id);
    if (error) { toast.error(parseError(error)); throw error; }
    qc.invalidateQueries({ queryKey: ["vehicle_documents"] });
    toast.success("Document verwijderd");
  }, [qc]);

  const getDocumentSignedUrl = useCallback(async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage.from("vehicle-documents").createSignedUrl(filePath, 3600);
    if (error || !data?.signedUrl) throw error ?? new Error("Kan geen signed URL aanmaken");
    return data.signedUrl;
  }, []);

  return (
    <AppContext.Provider value={{
      vehicles, drivers, maintenanceRecords, plannedEvents, vehicleDocuments,
      isLoading,
      addVehicle, updateVehicle, deleteVehicle,
      addDriver, updateDriver, deleteDriver,
      addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
      addPlannedEvent, updatePlannedEvent, deletePlannedEvent,
      addVehicleDocument, deleteVehicleDocument, getDocumentSignedUrl,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
