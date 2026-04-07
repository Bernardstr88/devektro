import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppStore } from "@/store/AppStore";
import { getInstallationName } from "@/data/helpers";
import { TASK_STATUSES, MAINTENANCE_STATUSES } from "@/data/constants";
import { Loader2 } from "lucide-react";

export default function Operations() {
  const { installations, tasks, maintenanceRecords, isLoading } = useAppStore();
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("active");
  const [maintStatusFilter, setMaintStatusFilter] = useState<string>("active");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const buildTasks = tasks
    .filter((t) => t.task_type === "build" || t.task_type === "delivery")
    .filter((t) => taskStatusFilter === "active" ? (t.status !== "done" && t.status !== "cancelled") : taskStatusFilter === "all" ? true : t.status === taskStatusFilter)
    .sort((a, b) => a.date.localeCompare(b.date));

  const maintenancePlan = maintenanceRecords
    .filter((m) => maintStatusFilter === "active" ? m.status !== "completed" : maintStatusFilter === "all" ? true : m.status === maintStatusFilter)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Operations</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Build Planning</CardTitle>
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Installation</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildTasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{getInstallationName(t.installation_id, installations)}</TableCell>
                    <TableCell>{t.task}</TableCell>
                    <TableCell><StatusBadge status={t.task_type} type="task_type" /></TableCell>
                    <TableCell className="text-muted-foreground">{t.date}</TableCell>
                    <TableCell>{t.assigned_to || "—"}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                  </TableRow>
                ))}
                {buildTasks.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No tasks match current filter.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Maintenance Planning</CardTitle>
              <Select value={maintStatusFilter} onValueChange={setMaintStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                  {MAINTENANCE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Installation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenancePlan.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{getInstallationName(m.installation_id, installations)}</TableCell>
                    <TableCell><StatusBadge status={m.type} type="maintenance_type" /></TableCell>
                    <TableCell className="text-muted-foreground">{m.date}</TableCell>
                    <TableCell>€{m.cost.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                  </TableRow>
                ))}
                {maintenancePlan.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No records match current filter.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
