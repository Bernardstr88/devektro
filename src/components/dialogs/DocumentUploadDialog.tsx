import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, File, Image } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { DOCUMENT_CATEGORIES } from "@/data/constants";
import type { DocumentCategory } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  installationId: string;
}

interface PendingFile {
  file: File;
  preview: string | null;
}

export function DocumentUploadDialog({ open, onOpenChange, installationId }: Props) {
  const { addInstallationDocument } = useAppStore();
  const [category, setCategory] = useState<DocumentCategory>("algemeen");
  const [description, setDescription] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: PendingFile[] = Array.from(files).map((f) => ({
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setPending((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setPending((prev) => {
      const item = prev[index];
      if (item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const reset = () => {
    pending.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview); });
    setPending([]);
    setCategory("algemeen");
    setDescription("");
    setUploadedBy("");
    setProgress(0);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleUpload = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    setProgress(0);
    try {
      for (let i = 0; i < pending.length; i++) {
        await addInstallationDocument(installationId, pending[i].file, {
          category,
          description: description.trim(),
          uploaded_by: uploadedBy.trim(),
        });
        setProgress(Math.round(((i + 1) / pending.length) * 100));
      }
      handleClose(false);
    } catch { /* handled by store */ } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Document uploaden</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Klik of sleep bestanden hier</p>
            <p className="text-xs text-muted-foreground mt-1">Afbeeldingen, PDF — max 20 MB per bestand</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Pending file list */}
          {pending.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pending.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/40 rounded p-2">
                  {p.preview ? (
                    <img src={p.preview} alt="" className="h-8 w-8 object-cover rounded" />
                  ) : (
                    <File className="h-8 w-8 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(p.file.size)}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => removeFile(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-sm text-muted-foreground">Categorie</label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Beschrijving</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optioneel" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Geüpload door</label>
            <Input value={uploadedBy} onChange={(e) => setUploadedBy(e.target.value)} placeholder="Naam" />
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-right">{progress}%</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={uploading}>Annuleren</Button>
          <Button disabled={uploading || pending.length === 0} onClick={handleUpload}>
            {uploading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {uploading ? "Uploaden…" : `Uploaden (${pending.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
