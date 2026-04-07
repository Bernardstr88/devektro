import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppStore } from "@/store/AppStore";
import { getInstallationTasks } from "@/data/helpers";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { TaskFormDialog } from "@/components/dialogs/TaskFormDialog";
import type { Task } from "@/data/types";

interface Props {
  installationId: string;
}

export function PlanningTab({ installationId }: Props) {
  const store = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const tasks = getInstallationTasks(installationId, store.tasks);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Taken & Planning</h3>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Taak</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Toegewezen aan</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.task}</TableCell>
                <TableCell><StatusBadge status={t.task_type} type="task_type" /></TableCell>
                <TableCell className="text-muted-foreground">{t.date}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell>{t.assigned_to || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(t)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen taken ingepland.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} installationId={installationId} task={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Taak verwijderen"
        description={`Taak "${deleting?.task}" verwijderen?`}
        onConfirm={() => { if (deleting) { void store.deleteTask(deleting.id); setDeleting(null); } }}
      />
    </>
  );
}
