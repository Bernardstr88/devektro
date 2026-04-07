/**
 * Domain-specific hooks that wrap useAppStore.
 * Import these instead of useAppStore to limit component coupling
 * to only the data/actions they actually need.
 */
import { useAppStore } from "./AppStore";

export function useInstallations() {
  const store = useAppStore();
  return {
    installations: store.installations,
    isLoading: store.isLoading,
    addInstallation: store.addInstallation,
    updateInstallation: store.updateInstallation,
    deleteInstallation: store.deleteInstallation,
    cloneInstallation: store.cloneInstallation,
  };
}

export function useMaterials() {
  const store = useAppStore();
  return {
    materials: store.materials,
    isLoading: store.isLoading,
    addMaterial: store.addMaterial,
    updateMaterial: store.updateMaterial,
    deleteMaterial: store.deleteMaterial,
  };
}

export function useInstallationMaterials() {
  const store = useAppStore();
  return {
    installationMaterials: store.installationMaterials,
    addInstallationMaterial: store.addInstallationMaterial,
    updateInstallationMaterial: store.updateInstallationMaterial,
    deleteInstallationMaterial: store.deleteInstallationMaterial,
  };
}

export function useMaintenance() {
  const store = useAppStore();
  return {
    maintenanceRecords: store.maintenanceRecords,
    addMaintenanceRecord: store.addMaintenanceRecord,
    updateMaintenanceRecord: store.updateMaintenanceRecord,
    deleteMaintenanceRecord: store.deleteMaintenanceRecord,
  };
}

export function useTasks() {
  const store = useAppStore();
  return {
    tasks: store.tasks,
    addTask: store.addTask,
    updateTask: store.updateTask,
    deleteTask: store.deleteTask,
  };
}

export function useFinancials() {
  const store = useAppStore();
  return {
    financials: store.financials,
    upsertFinancial: store.upsertFinancial,
  };
}

export function useConfigs() {
  const store = useAppStore();
  return {
    installationConfigs: store.installationConfigs,
    addInstallationConfig: store.addInstallationConfig,
    updateInstallationConfig: store.updateInstallationConfig,
    deleteInstallationConfig: store.deleteInstallationConfig,
  };
}

export function useGeneratorMaintenance() {
  const store = useAppStore();
  return {
    generatorMaintenance: store.generatorMaintenance,
    upsertGeneratorMaintenance: store.upsertGeneratorMaintenance,
  };
}

export function useDashboard() {
  const store = useAppStore();
  return {
    dashboardSettings: store.dashboardSettings,
    updateDashboardSetting: store.updateDashboardSetting,
  };
}

export function useTemplates() {
  const store = useAppStore();
  return {
    installationTemplates: store.installationTemplates,
    templateMaterials: store.templateMaterials,
    addInstallationTemplate: store.addInstallationTemplate,
    updateInstallationTemplate: store.updateInstallationTemplate,
    deleteInstallationTemplate: store.deleteInstallationTemplate,
    addTemplateMaterial: store.addTemplateMaterial,
    deleteTemplateMaterial: store.deleteTemplateMaterial,
  };
}
