import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { VehicleFormDialog } from "@/components/dialogs/VehicleFormDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { OverviewTab } from "@/components/vehicle-tabs/OverviewTab";
import { MaintenanceTab } from "@/components/vehicle-tabs/MaintenanceTab";
import { DocumentsTab } from "@/components/vehicle-tabs/DocumentsTab";
import { PlanningTab } from "@/components/vehicle-tabs/PlanningTab";

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, isLoading, deleteVehicle } = useAppStore();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const vehicle = vehicles.find((v) => v.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Voertuig niet gevonden.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/vehicles")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Terug
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteVehicle(vehicle.id);
    navigate("/vehicles");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/vehicles")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono">{vehicle.license_plate}</h1>
              {vehicle.active
                ? <Badge variant="outline" className="border-green-500 text-green-600">Actief</Badge>
                : <Badge variant="secondary">Inactief</Badge>
              }
            </div>
            <p className="text-muted-foreground text-sm">{vehicle.brand} {vehicle.model}{vehicle.year ? ` · ${vehicle.year}` : ""}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Bewerken
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Verwijderen
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="maintenance">Onderhoud</TabsTrigger>
          <TabsTrigger value="documents">Documenten</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab vehicle={vehicle} />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          <MaintenanceTab vehicleId={vehicle.id} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab vehicleId={vehicle.id} />
        </TabsContent>
        <TabsContent value="planning" className="mt-4">
          <PlanningTab vehicleId={vehicle.id} />
        </TabsContent>
      </Tabs>

      <VehicleFormDialog open={editOpen} onOpenChange={setEditOpen} vehicle={vehicle} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Voertuig verwijderen?"
        description={`${vehicle.license_plate} — ${vehicle.brand} ${vehicle.model} wordt permanent verwijderd, inclusief alle documenten en onderhoudsrecords.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
