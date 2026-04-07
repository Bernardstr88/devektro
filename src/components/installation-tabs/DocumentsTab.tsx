import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, ExternalLink, Image } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { DocumentUploadDialog } from "@/components/dialogs/DocumentUploadDialog";
import { DOCUMENT_CATEGORIES } from "@/data/constants";
import type { DocumentCategory } from "@/data/types";

interface Props {
  installationId: string;
}

function categoryLabel(cat: string) {
  return DOCUMENT_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function DocumentsTab({ installationId }: Props) {
  const store = useAppStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [catFilter, setCatFilter] = useState<"all" | DocumentCategory>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  const docs = store.installationDocuments
    .filter((d) => d.installation_id === installationId)
    .filter((d) => catFilter === "all" || d.category === catFilter)
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));

  const handleOpen = async (storagePath: string, id: string) => {
    setLoadingUrl(id);
    try {
      const url = await store.getDocumentSignedUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoadingUrl(null);
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    setDeletingId(id);
    try { await store.deleteInstallationDocument(id, storagePath); } finally { setDeletingId(null); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Documenten & Foto's</h3>
          <Select value={catFilter} onValueChange={(v) => setCatFilter(v as "all" | DocumentCategory)}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              {DOCUMENT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Document uploaden
        </Button>
      </div>

      {docs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {catFilter === "all"
              ? "Nog geen documenten — klik \"Document uploaden\" om te starten."
              : "Geen documenten in deze categorie."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {docs.map((doc) => {
            const isImage = doc.file_type === "image";
            return (
              <Card key={doc.id} className="group overflow-hidden">
                {/* Thumbnail / icon area */}
                <div
                  className="relative bg-muted flex items-center justify-center cursor-pointer h-28 overflow-hidden"
                  onClick={() => handleOpen(doc.storage_path, doc.id)}
                >
                  {isImage ? (
                    <Image className="h-12 w-12 text-muted-foreground/50" />
                  ) : (
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                  )}
                  {loadingUrl === doc.id && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate" title={doc.file_name}>{doc.file_name}</p>
                  <div className="flex items-center justify-between mt-1 gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">{categoryLabel(doc.category)}</Badge>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(doc.file_size)}</span>
                  </div>
                  {doc.description && <p className="text-[10px] text-muted-foreground mt-1 truncate">{doc.description}</p>}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{doc.uploaded_at.slice(0, 10)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc.id, doc.storage_path)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        installationId={installationId}
      />
    </>
  );
}
