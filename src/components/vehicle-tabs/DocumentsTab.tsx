import { useState, useMemo } from "react";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, FileText, Eye, Loader2, X } from "lucide-react";
import { DocumentUploadDialog } from "@/components/dialogs/DocumentUploadDialog";
import { DocumentPreviewDialog } from "@/components/dialogs/DocumentPreviewDialog";
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
  const [preview, setPreview] = useState<{ doc: VehicleDocument; url: string | null } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const docs = vehicleDocuments
    .filter((d) => d.vehicle_id === vehicleId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const allTags = useMemo(() => {
    const set = new Set<string>();
    docs.forEach((d) => d.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [docs]);

  const filtered = activeTag ? docs.filter((d) => d.tags?.includes(activeTag)) : docs;

  const handlePreview = async (doc: VehicleDocument) => {
    setLoadingPreview(doc.id);
    setPreview({ doc, url: null });
    try {
      const url = await getDocumentSignedUrl(doc.file_url);
      setPreview({ doc, url });
    } catch {
      toast.error("Kan document niet laden");
      setPreview(null);
    } finally {
      setLoadingPreview(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "outline"}
              className="cursor-pointer gap-1"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
              {activeTag === tag && <X className="h-3 w-3" />}
            </Badge>
          ))}
        </div>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Document uploaden
        </Button>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {activeTag ? `Geen documenten met tag "${activeTag}".` : "Nog geen documenten geüpload."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="pt-4 pb-4 flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{doc.type}</Badge>
                    {doc.expiry_date && (
                      <span className="text-xs text-muted-foreground">Geldig tot {doc.expiry_date}</span>
                    )}
                  </div>
                  {doc.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs px-1.5 py-0 cursor-pointer"
                          onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.created_at.slice(0, 10)}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handlePreview(doc)} disabled={loadingPreview === doc.id}>
                  {loadingPreview === doc.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Eye className="h-3.5 w-3.5" />
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
      <DocumentPreviewDialog
        open={!!preview}
        onOpenChange={(o) => { if (!o) setPreview(null); }}
        name={preview?.doc.name ?? ""}
        url={preview?.url ?? null}
      />
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
