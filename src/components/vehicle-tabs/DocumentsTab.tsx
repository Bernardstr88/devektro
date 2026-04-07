import { useState } from "react";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, FileText, ExternalLink, Loader2 } from "lucide-react";
import { DocumentUploadDialog } from "@/components/dialogs/DocumentUploadDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import type { VehicleDocument } from "@/data/types";
import { toast } from "sonner";

interface Props {
  vehicleId: string;
}

export function DocumentsTab({ vehicleId }: Props) {
  const { vehicleDocuments, deleteVehicleDocument, getDocumentSignedUrl } = useAppStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<VehicleDocument | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const docs = vehicleDocuments
    .filter((d) => d.vehicle_id === vehicleId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const handleOpen = async (doc: VehicleDocument) => {
    setOpening(doc.id);
    try {
      const url = await getDocumentSignedUrl(doc.file_url);
      window.open(url, "_blank");
    } catch {
      toast.error("Kan document niet openen");
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Document uploaden
        </Button>
      </div>

      {docs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nog geen documenten geüpload.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="pt-4 pb-4 flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{doc.type}</Badge>
                    {doc.expiry_date && (
                      <span className="text-xs text-muted-foreground">Geldig tot {doc.expiry_date}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.created_at.slice(0, 10)}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleOpen(doc)} disabled={opening === doc.id}>
                  {opening === doc.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ExternalLink className="h-3.5 w-3.5" />
                  }
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(doc)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DocumentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} vehicleId={vehicleId} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Document verwijderen?"
        description={`"${deleting?.name}" wordt permanent verwijderd.`}
        onConfirm={async () => {
          if (deleting) {
            await deleteVehicleDocument(deleting.id, deleting.file_url);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
