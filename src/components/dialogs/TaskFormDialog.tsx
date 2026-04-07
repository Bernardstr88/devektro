import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/AppStore";
import { TASK_TYPES, TASK_STATUSES } from "@/data/constants";
import { Loader2 } from "lucide-react";
import type { Task, TaskType, TaskStatus } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: string;
  task: Task | null;
}

export function TaskFormDialog({ open, onOpenChange, installationId, task }: Props) {
  const { addTask, updateTask } = useAppStore();
  const [form, setForm] = useState({
    task: "", date: "", status: "planned" as TaskStatus,
    assigned_to: "", task_type: "build" as TaskType,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(task
        ? { task: task.task, date: task.date, status: task.status, assigned_to: task.assigned_to, task_type: task.task_type }
        : { task: "", date: "", status: "planned" as TaskStatus, assigned_to: "", task_type: "build" as TaskType },
      );
      setErrors({});
    }
  }, [open, task]);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.task.trim()) e.task = "Task description is required";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (task) {
        await updateTask(task.id, { ...form, installation_id: installationId });
      } else {
        await addTask({ ...form, installation_id: installationId });
      }
      onOpenChange(false);
    } catch { /* handled */ } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Task *</label>
            <Input value={form.task} onChange={(e) => set("task", e.target.value)} className={errors.task ? "border-destructive" : ""} />
            {errors.task && <p className="text-xs text-destructive mt-1">{errors.task}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Date *</label>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={errors.date ? "border-destructive" : ""} />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Assigned To</label>
            <Input value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Task Type</label>
            <Select value={form.task_type} onValueChange={(v) => set("task_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {saving ? "Saving…" : task ? "Save Changes" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
