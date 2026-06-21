import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Home, Target, BarChart2, Users, Calculator } from "lucide-react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading mission control...</div>;
  }

  if (!user) {
    return null; // Will redirect in protected route
  }

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/calculator", label: "Calculator", icon: Calculator },
    { href: "/simulator", label: "Climate Twin", icon: BarChart2 },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/community", label: "Community", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border bg-card">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-mono uppercase">Zerofy</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground truncate w-32">{user.name}</span>
              <span className="text-xs text-muted-foreground font-mono">OP-{user.id.toString().padStart(4, '0')}</span>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background/50">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
