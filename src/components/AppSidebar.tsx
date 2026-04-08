import { useMemo } from "react";
import { LayoutDashboard, Truck, Users, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { daysUntil, WARN_DAYS } from "@/lib/formatDate";
import logoSrc from "@/assets/logo-devektro.svg";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { vehicles } = useAppStore();

  const alertCount = useMemo(() => {
    const active = vehicles.filter((v) => v.active);
    let count = 0;
    for (const v of active) {
      const kd = daysUntil(v.inspection_date);
      if (kd !== null && kd <= WARN_DAYS) count++;
      const id = daysUntil(v.insurance_expiry);
      if (id !== null && id <= WARN_DAYS) count++;
    }
    return count;
  }, [vehicles]);

  const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, badge: 0 },
    { title: "Voertuigen", url: "/vehicles", icon: Truck, badge: alertCount },
    { title: "Gebruikers", url: "/users", icon: Users, badge: 0 },
  ];

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider py-4 px-2">
            {!collapsed ? (
              <img src={logoSrc} alt="Devektro" className="h-6 brightness-0 invert" />
            ) : (
              <span className="text-sm font-bold text-sidebar-foreground">D</span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.badge > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0 min-w-[1.25rem] justify-center">
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <LogoutButton collapsed={collapsed} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuth();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
      onClick={signOut}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {!collapsed && "Uitloggen"}
    </Button>
  );
}
