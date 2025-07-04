import { useState } from "react";
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
  FileEdit,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Receipt,
  Truck,
  ShoppingBag,
  Boxes,
  Building2
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Produtos & Estoque", href: "/products", icon: Package },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Orçamentos", href: "/quotes", icon: FileEdit },
  { name: "Vendas", href: "/sales", icon: ShoppingCart },
  { 
    name: "Compras", 
    href: "/purchases", 
    icon: Truck,
    subItems: [
      { name: "Pedidos de Compra", href: "/purchases/orders", icon: ShoppingBag },
      { name: "Recebimentos", href: "/purchases/receipts", icon: Boxes },
      { name: "Fornecedores", href: "/purchases/suppliers", icon: Building2 },
      { name: "Relatórios", href: "/purchases/reports", icon: BarChart3 },
    ]
  },
  { 
    name: "Financeiro", 
    href: "/financial", 
    icon: DollarSign,
    subItems: [
      { name: "Contas a Receber", href: "/financial/receivables", icon: Receipt },
      { name: "Contas a Pagar", href: "/accounts-payable", icon: CreditCard },
    ]
  },
  { name: "Agendamentos", href: "/appointments", icon: Calendar },
  { name: "Prescrições", href: "/prescriptions", icon: FileText },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo and Brand */}
      <div className="flex items-center gap-3 p-6">
        <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
          <Glasses className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-xl font-semibold text-sidebar-foreground">ÓticaManager</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems.includes(item.name);
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <div key={item.name}>
              {hasSubItems ? (
                <div>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "text-sidebar-primary bg-sidebar-accent"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={() => toggleExpanded(item.name)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const subIsActive = location === subItem.href;
                        const SubIcon = subItem.icon;
                        
                        return (
                          <Link key={subItem.name} href={subItem.href}>
                            <div
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                                subIsActive
                                  ? "text-sidebar-primary bg-sidebar-accent"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <SubIcon className="w-4 h-4" />
                              {subItem.name}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link href={item.href}>
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
              )}
            </div>
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
