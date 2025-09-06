import { useAuth } from "../../hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Plus, Search, Settings } from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      show: true,
    },
    {
      href: "/report",
      label: "Report Issue",
      icon: Plus,
      show: true,
    },
    {
      href: "/track",
      label: "Track Issues",
      icon: Search,
      show: true,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Settings,
      show: user?.role !== 'CITIZEN',
    },
  ];

  return (
    <nav className="flex space-x-6">
      {navItems
        .filter(item => item.show)
        .map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
    </nav>
  );
}
