import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  ChartLine, 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Calendar, 
  FileText, 
  BarChart3, 
  Glasses,
  Moon,
  Sun,
  FileEdit
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Produtos & Estoque", href: "/products", icon: Package },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Orçamentos", href: "/quotes", icon: FileEdit },
  { name: "Vendas", href: "/sales", icon: ShoppingCart },
  { name: "Financeiro", href: "/financial", icon: DollarSign },
  { name: "Agendamentos", href: "/appointments", icon: Calendar },
  { name: "Prescrições", href: "/prescriptions", icon: FileText },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo and Brand */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
          <Glasses className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-xl font-semibold text-sidebar-foreground">ÓticaManager</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "text-sidebar-primary bg-sidebar-accent"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.fullName || "Usuário"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.role === "admin" ? "Administrador" : "Usuário"}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
