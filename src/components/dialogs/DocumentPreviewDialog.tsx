import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  url: string | null;
}

function isPdf(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

export function DocumentPreviewDialog({ open, onOpenChange, name, url }: Props) {
  const pdf = isPdf(name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-sm font-medium truncate pr-4">{name}</DialogTitle>
          {url && (
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" /> Openen
              </a>
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-muted/30">
          {!url ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pdf ? (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={name}
            />
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={url}
                alt={name}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
