import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ShieldAlert } from "lucide-react";

const ADMIN_EMAIL = "guus@pulltheplug.be";

interface ManagedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function UserManagement() {
  const { session } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      toast.error(error.message);
    } else {
      setUsers((data as ManagedUser[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
    else setLoading(false);
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <ShieldAlert className="h-10 w-10 opacity-50" />
        <p className="text-sm">Je hebt geen toegang tot deze pagina.</p>
      </div>
    );
  }

  const handleAdd = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Vul e-mail en wachtwoord in");
      return;
    }
    if (password.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 tekens zijn");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("admin_create_user", {
      p_email: email.trim().toLowerCase(),
      p_password: password,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Gebruiker ${email} aangemaakt`);
      setAddOpen(false);
      setEmail("");
      setPassword("");
      loadUsers();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.rpc("admin_delete_user", {
      p_user_id: deleting.id,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Gebruiker ${deleting.email} verwijderd`);
      setDeleting(null);
      loadUsers();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Gebruikersbeheer</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Gebruiker toevoegen
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <Card key={u.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium break-all">{u.email}</p>
                        {u.email === ADMIN_EMAIL && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aangemaakt: {new Date(u.created_at).toLocaleDateString("nl-BE")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Laatste login: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("nl-BE") : "Nooit"}
                      </p>
                    </div>
                    {u.email !== ADMIN_EMAIL && (
                      <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setDeleting(u)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Geen gebruikers gevonden.</p>
            )}
          </div>

          {/* Desktop table layout */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Aangemaakt</TableHead>
                    <TableHead>Laatste login</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-sm">
                        {u.email}
                        {u.email === ADMIN_EMAIL && (
                          <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Admin</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("nl-BE")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("nl-BE") : "Nooit"}
                      </TableCell>
                      <TableCell>
                        {u.email !== ADMIN_EMAIL && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(u)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                        Geen gebruikers gevonden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add user dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gebruiker toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">E-mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@voorbeeld.be" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Wachtwoord</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 tekens" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuleren</Button>
            <Button disabled={saving || !email.trim() || !password.trim()} onClick={handleAdd}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Gebruiker verwijderen"
        description={`Weet je zeker dat je "${deleting?.email}" wilt verwijderen? Deze gebruiker kan dan niet meer inloggen.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
