import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  Package, 
  Clock,
  Plus,
  UserPlus,
  Package2,
  CalendarPlus,
  ChartLine,
  TriangleAlert,
  MoreHorizontal
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentSales, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-sales"],
  });

  const { data: lowStockProducts, isLoading: stockLoading } = useQuery({
    queryKey: ["/api/dashboard/low-stock"],
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/dashboard/today-appointments"],
  });

  const statsCards = [
    {
      title: "Vendas Hoje",
      value: stats ? formatCurrency(stats.salesToday) : "R$ 0,00",
      icon: ChartLine,
      trend: "+12%",
      trendLabel: "vs ontem",
      trendColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Clientes Ativos",
      value: stats?.activeCustomers || 0,
      icon: Users,
      trend: "+8%",
      trendLabel: "este mês",
      trendColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Produtos em Estoque",
      value: stats?.productsInStock || 0,
      icon: Package,
      trend: `${stats?.lowStockCount || 0} baixos`,
      trendLabel: "alertas",
      trendColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-violet-100 dark:bg-violet-900/20",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      title: "Contas a Receber",
      value: stats ? formatCurrency(stats.accountsReceivable) : "R$ 0,00",
      icon: Clock,
      trend: `${stats?.overdueCount || 0} vencidas`,
      trendLabel: "contas",
      trendColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const quickActions = [
    { label: "Nova Venda", icon: Plus, href: "/sales/new" },
    { label: "Cadastrar Cliente", icon: UserPlus, href: "/customers/new" },
    { label: "Adicionar Produto", icon: Package2, href: "/products/new" },
    { label: "Agendar Consulta", icon: CalendarPlus, href: "/appointments/new" },
  ];

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do seu negócio">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24 mt-2" />
                    ) : (
                      <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                    )}
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`text-lg ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-sm ${stat.trendColor}`}>
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </span>
                  <span className="text-sm text-muted-foreground">{stat.trendLabel}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendas Recentes</CardTitle>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentSales?.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sale.customer.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{formatCurrency(sale.finalAmount)}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(sale.saleDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma venda recente</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto p-3"
                    >
                      <Icon className="w-4 h-4 text-primary" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alertas de Estoque</CardTitle>
                <Badge variant="destructive">
                  {lowStockProducts?.length || 0} itens
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : lowStockProducts?.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 3).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          {product.stockQuantity} unid.
                        </span>
                        <p className="text-xs text-muted-foreground">mín: {product.minStockLevel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum alerta de estoque</p>
              )}
              {lowStockProducts?.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full mt-4">
                  Ver todos os alertas
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointments Today */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Agendamentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : todayAppointments?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAppointments.map((appointment: any) => (
                <div key={appointment.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{appointment.customer.fullName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.title}</p>
                    <p className="text-sm text-primary">
                      {new Date(appointment.appointmentDate).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum agendamento para hoje</p>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
