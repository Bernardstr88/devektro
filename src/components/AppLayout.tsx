import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAppStore } from "@/store/AppStore";
import { ChevronRight, Search } from "lucide-react";

function GlobalSearch() {
  const { vehicles } = useAppStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = query.length >= 2
    ? vehicles.filter((v) => {
        const q = query.toLowerCase();
        return (
          v.license_plate.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative hidden sm:block ml-4 flex-1 max-w-xs">
      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
      <input
        type="text"
        placeholder="Zoek voertuig..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {open && results.length > 0 && (
        <div className="absolute top-9 left-0 w-full bg-background border rounded-md shadow-lg z-50">
          {results.map((v) => (
            <button
              key={v.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between"
              onClick={() => { navigate(`/vehicles/${v.id}`); setQuery(""); setOpen(false); }}
            >
              <span className="font-mono font-semibold">{v.license_plate}</span>
              <span className="text-muted-foreground text-xs">{v.brand} {v.model}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMenuTab() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      className="sm:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center bg-[#1B2A4A] border-0 rounded-r-lg shadow-md h-14 w-4 text-white active:bg-[#243560]"
      aria-label="Menu openen"
    >
      <ChevronRight className="h-3 w-3" />
    </button>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="hidden sm:flex h-12 items-center border-b px-4 bg-background">
            <SidebarTrigger />
            <GlobalSearch />
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
        <MobileMenuTab />
      </div>
    </SidebarProvider>
  );
}
