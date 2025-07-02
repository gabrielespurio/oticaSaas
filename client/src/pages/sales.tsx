import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/app-layout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Sale, Customer, SaleItem, Product } from "@shared/schema";

interface SaleWithDetails extends Sale {
  customer: Customer;
  items: (SaleItem & { product: Product })[];
}

export default function Sales() {
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sales = [], isLoading } = useQuery<SaleWithDetails[]>({
    queryKey: ["/api/sales"],
  });

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "Dinheiro";
      case "card":
        return "Cartão";
      case "pix":
        return "PIX";
      case "installment":
        return "Crediário";
      default:
        return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "returned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "cancelled":
        return "Cancelada";
      case "returned":
        return "Devolvida";
      default:
        return status;
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AppLayout title="Vendas" subtitle="Gerencie vendas realizadas">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendas</h1>
          </div>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Vendas" subtitle="Gerencie vendas realizadas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendas</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nova Venda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Para criar uma nova venda, vá até o módulo de Orçamentos e converta um orçamento aprovado em venda.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por cliente ou número da venda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Venda #{sale.saleNumber}
                      </h3>
                      <Badge className={getStatusColor(sale.status)}>
                        {getStatusText(sale.status)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Cliente: {sale.customer.fullName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Data: {format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Pagamento: {getPaymentMethodText(sale.paymentMethod)}
                    </p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      Total: R$ {parseFloat(sale.finalAmount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes da Venda #{selectedSale?.saleNumber}</DialogTitle>
                        </DialogHeader>
                        {selectedSale && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Cliente</h4>
                                <p>{selectedSale.customer.fullName}</p>
                                <p>{selectedSale.customer.email}</p>
                                <p>{selectedSale.customer.phone}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Informações da Venda</h4>
                                <p>Status: {getStatusText(selectedSale.status)}</p>
                                <p>Data: {format(new Date(selectedSale.saleDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                                <p>Pagamento: {getPaymentMethodText(selectedSale.paymentMethod)}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Itens</h4>
                              <div className="space-y-2">
                                {selectedSale.items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                      <p className="font-medium">{item.product.name}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Quantidade: {item.quantity} x R$ {parseFloat(item.unitPrice).toFixed(2)}
                                      </p>
                                    </div>
                                    <p className="font-semibold">R$ {parseFloat(item.totalPrice).toFixed(2)}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 pt-4 border-t space-y-1">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>R$ {parseFloat(selectedSale.totalAmount).toFixed(2)}</span>
                                </div>
                                {parseFloat(selectedSale.discountAmount || "0") > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Desconto:</span>
                                    <span>- R$ {parseFloat(selectedSale.discountAmount || "0").toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                  <span>Total:</span>
                                  <span>R$ {parseFloat(selectedSale.finalAmount).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredSales.length === 0 && searchTerm && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma venda encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tente ajustar os termos de busca.
                </p>
              </CardContent>
            </Card>
          )}

          {sales.length === 0 && !searchTerm && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma venda registrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece registrando sua primeira venda.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Registrar Nova Venda</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Para criar uma nova venda, vá até o módulo de Orçamentos e converta um orçamento aprovado em venda.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
