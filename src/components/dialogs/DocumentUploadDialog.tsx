import { useState, useRef } from "react";
import { useAppStore } from "@/store/AppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const DOC_TYPES = ["verzekering", "gelijkvormigheidsattest", "keuring", "inschrijving", "andere"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
}

export function DocumentUploadDialog({ open, onOpenChange, vehicleId }: Props) {
  const { addVehicleDocument } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setName("");
    setType("");
    setExpiryDate("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !name) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Selecteer een bestand"); return; }
    if (!type) { toast.error("Kies een documenttype"); return; }
    if (!name.trim()) { toast.error("Geef een naam op"); return; }

    setUploading(true);
    try {
      await addVehicleDocument(vehicleId, file, {
        type,
        name: name.trim(),
        expiry_date: expiryDate || null,
      });
      reset();
      onOpenChange(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Document uploaden</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Bestand *</Label>
            <div
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              {file ? (
                <p className="text-sm font-medium truncate max-w-full px-2">{file.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Klik om een bestand te kiezen (PDF, afbeelding)</p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-1">
            <Label>Naam *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="bv. Verzekeringspolis 2025" />
          </div>

          <div className="space-y-1">
            <Label>Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Kies documenttype" /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Vervaldatum (optioneel)</Label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Annuleren
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Uploaden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
