import { LayoutDashboard, Zap, Package, Settings, LogOut, LayoutTemplate, ChevronDown, Users, ClipboardList } from "lucide-react";
import logoPtp from "@/assets/logo-ptp.png";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const topItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const fleetSubItems = [
  { title: "Overzicht", url: "/fleet" },
  { title: "Detail", url: "/installations" },
  { title: "Firmware · Instellingen", url: "/firmware" },
];

const bottomItems = [
  { title: "Materiaallijst", url: "/materials", icon: Package },
  { title: "Operations", url: "/operations", icon: Settings },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Gebruikers", url: "/users", icon: Users },
  { title: "Audit Log", url: "/audit", icon: ClipboardList },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isFleetActive = location.pathname.startsWith("/fleet") || location.pathname.startsWith("/installations") || location.pathname.startsWith("/firmware");

  const renderItem = (item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }) => (
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
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider py-3">
            {!collapsed ? (
              <img src={logoPtp} alt="Pull The Plug" className="h-[1.84rem] w-auto" />
            ) : (
              <img src={logoPtp} alt="Pull The Plug" className="h-[1.31rem] w-auto" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {topItems.map(renderItem)}

              {/* Fleet submenu */}
              <Collapsible defaultOpen={isFleetActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="hover:bg-sidebar-accent">
                      <Zap className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">Vloot</span>
                          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {fleetSubItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink
                              to={sub.url}
                              className="hover:bg-sidebar-accent"
                              activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                            >
                              {sub.title}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {bottomItems.map(renderItem)}
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
    <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={signOut}>
      <LogOut className="h-4 w-4 mr-2" />
      {!collapsed && "Uitloggen"}
    </Button>
  );
}
