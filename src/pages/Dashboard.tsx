import { useMemo } from "react";
import { useAppStore } from "@/store/AppStore";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, AlertTriangle, CalendarClock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { formatDate, daysUntil, WARN_DAYS } from "@/lib/formatDate";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function urgencyBadge(days: number | null) {
  if (days === null) return null;
  if (days < 0) return <Badge variant="destructive">Verlopen</Badge>;
  if (days <= 7) return <Badge variant="destructive">{days}d</Badge>;
  if (days <= WARN_DAYS) return <Badge variant="outline" className="border-orange-400 text-orange-600">{days}d</Badge>;
  return null;
}

export default function Dashboard() {
  const { vehicles, plannedEvents, maintenanceRecords, isLoading } = useAppStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const active = vehicles.filter((v) => v.active);
    const keuringAlert = active.filter((v) => {
      const d = daysUntil(v.inspection_date);
      return d !== null && d <= WARN_DAYS;
    });
    const insuranceAlert = active.filter((v) => {
      const d = daysUntil(v.insurance_expiry);
      return d !== null && d <= WARN_DAYS;
    });
    return { total: active.length, keuringAlert, insuranceAlert };
  }, [vehicles]);

  const upcomingEvents = useMemo(() => {
    return plannedEvents
      .filter((e) => !e.completed)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 10);
  }, [plannedEvents]);

  const monthlyCosts = useMemo(() => {
    const now = new Date();
    const months: { name: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yy", { locale: nl });
      const total = maintenanceRecords
        .filter((r) => r.date.startsWith(key) && r.cost !== null)
        .reduce((sum, r) => sum + Number(r.cost), 0);
      months.push({ name: label, total: Math.round(total * 100) / 100 });
    }
    return months;
  }, [maintenanceRecords]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actieve voertuigen</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className={stats.keuringAlert.length > 0 ? "border-orange-300 bg-orange-50" : "border-green-300 bg-green-50"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Keuring verloopt binnenkort</CardTitle>
            {stats.keuringAlert.length > 0
              ? <AlertTriangle className="h-4 w-4 text-orange-500" />
              : <CheckCircle2 className="h-4 w-4 text-green-600" />
            }
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${stats.keuringAlert.length > 0 ? "text-orange-500" : "text-green-600"}`}>
              {stats.keuringAlert.length}
            </p>
          </CardContent>
        </Card>
        <Card className={stats.insuranceAlert.length > 0 ? "border-orange-300 bg-orange-50" : "border-green-300 bg-green-50"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verzekering verloopt binnenkort</CardTitle>
            {stats.insuranceAlert.length > 0
              ? <ShieldAlert className="h-4 w-4 text-orange-500" />
              : <CheckCircle2 className="h-4 w-4 text-green-600" />
            }
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${stats.insuranceAlert.length > 0 ? "text-orange-500" : "text-green-600"}`}>
              {stats.insuranceAlert.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Keuring verloopt (&le;{WARN_DAYS} dagen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.keuringAlert.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Alle keuringen zijn in orde.
              </div>
            ) : (
              <div className="space-y-1">
                {stats.keuringAlert
                  .sort((a, b) => (a.inspection_date ?? "").localeCompare(b.inspection_date ?? ""))
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/40 rounded p-2 transition-colors"
                      onClick={() => navigate(`/vehicles/${v.id}`)}
                    >
                      <div>
                        <span className="font-mono text-sm font-semibold">{v.license_plate}</span>
                        <span className="text-sm text-muted-foreground ml-2">{v.brand} {v.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDate(v.inspection_date)}</span>
                        {urgencyBadge(daysUntil(v.inspection_date))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-500" />
              Verzekering verloopt (&le;{WARN_DAYS} dagen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.insuranceAlert.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Alle verzekeringen zijn in orde.
              </div>
            ) : (
              <div className="space-y-1">
                {stats.insuranceAlert
                  .sort((a, b) => (a.insurance_expiry ?? "").localeCompare(b.insurance_expiry ?? ""))
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/40 rounded p-2 transition-colors"
                      onClick={() => navigate(`/vehicles/${v.id}`)}
                    >
                      <div>
                        <span className="font-mono text-sm font-semibold">{v.license_plate}</span>
                        <span className="text-sm text-muted-foreground ml-2">{v.brand} {v.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDate(v.insurance_expiry)}</span>
                        {urgencyBadge(daysUntil(v.insurance_expiry))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Openstaande afspraken
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Geen openstaande afspraken.
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingEvents.map((e) => {
                  const vehicle = vehicles.find((v) => v.id === e.vehicle_id);
                  return (
                    <div
                      key={e.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/40 rounded p-2 transition-colors"
                      onClick={() => vehicle && navigate(`/vehicles/${vehicle.id}`)}
                    >
                      <div>
                        <span className="text-sm font-medium">{e.title}</span>
                        {vehicle && (
                          <span className="text-xs text-muted-foreground ml-2 font-mono">{vehicle.license_plate}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDate(e.event_date)}</span>
                        {urgencyBadge(daysUntil(e.event_date))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Onderhoudskosten (6 maanden)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyCosts.every((m) => m.total === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">Geen kostendata beschikbaar.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyCosts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} width={60} />
                  <Tooltip formatter={(value: number) => [`€ ${value.toFixed(2)}`, "Kosten"]} />
                  <Bar dataKey="total" fill="hsl(215 80% 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
