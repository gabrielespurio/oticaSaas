import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Eye, Package, Calendar, TrendingUp, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form validation schema
const receiptSchema = z.object({
  purchaseOrderId: z.number().min(1, "Selecione um pedido de compra"),
  receiptDate: z.string().min(1, "Data do recebimento é obrigatória"),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface Receipt {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  purchaseOrderId: number;
  userId: number;
  notes?: string;
  createdAt: string;
  purchaseOrder: {
    id: number;
    orderNumber: string;
    supplier: {
      name: string;
    };
  };
}

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  totalAmount: number;
  status: string;
  notes?: string;
  supplier: {
    name: string;
  };
}

export default function ReceiptsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch purchase receipts from API
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ["/api/purchase-receipts"],
    queryFn: () => apiRequest("GET", "/api/purchase-receipts"),
  });

  // Fetch purchase orders for the dropdown (only pending orders)
  const { data: purchaseOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/purchase-orders", "pending"],
    queryFn: () => apiRequest("GET", "/api/purchase-orders?onlyPending=true"),
  });

  // Fetch all pending orders to show upcoming deliveries
  const { data: allPendingOrders = [], isLoading: allPendingLoading } = useQuery({
    queryKey: ["/api/purchase-orders", "all-pending"],
    queryFn: () => apiRequest("GET", "/api/purchase-orders?status=pending"),
  });

  // Create receipt mutation
  const createReceiptMutation = useMutation({
    mutationFn: (data: ReceiptFormData) => 
      apiRequest("POST", "/api/purchase-receipts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      toast({
        title: "Sucesso",
        description: "Recebimento registrado com sucesso!",
      });
      setIsCreateDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar recebimento",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: ReceiptFormData) => {
    createReceiptMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completo</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Parcial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReceipts = receipts.filter((receipt: Receipt) =>
    receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    receipt.purchaseOrder.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    receipt.purchaseOrder.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter and sort pending orders by delivery date proximity
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const pendingOrdersForToday = allPendingOrders.filter((order: PurchaseOrder) => {
    if (!order.expectedDeliveryDate) return false;
    return order.expectedDeliveryDate === todayStr;
  });

  const upcomingOrders = allPendingOrders
    .filter((order: PurchaseOrder) => {
      if (!order.expectedDeliveryDate) return false;
      return order.expectedDeliveryDate >= todayStr;
    })
    .sort((a: PurchaseOrder, b: PurchaseOrder) => {
      if (!a.expectedDeliveryDate || !b.expectedDeliveryDate) return 0;
      return new Date(a.expectedDeliveryDate).getTime() - new Date(b.expectedDeliveryDate).getTime();
    });

  const getDeliveryStatusBadge = (order: PurchaseOrder) => {
    if (!order.expectedDeliveryDate) return null;
    
    const deliveryDate = new Date(order.expectedDeliveryDate);
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Atrasado</Badge>;
    } else if (diffDays === 0) {
      return <Badge className="bg-blue-500 gap-1"><Clock className="h-3 w-3" />Hoje</Badge>;
    } else if (diffDays <= 3) {
      return <Badge className="bg-yellow-500 gap-1"><Clock className="h-3 w-3" />Próximo</Badge>;
    } else {
      return <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" />Agendado</Badge>;
    }
  };

  // Calculate stats from real data
  const receiptsToday = receipts.filter((receipt: Receipt) => {
    const receiptDate = new Date(receipt.receiptDate);
    return receiptDate.toDateString() === today.toDateString();
  }).length;

  const totalItemsReceived = receipts.length; // Simplified for now - could be enhanced with actual item count

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Recebimentos</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Recebimento</DialogTitle>
              <DialogDescription>
                Registre a chegada de produtos de um pedido de compra
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="purchaseOrder">Pedido de Compra</Label>
                <Select 
                  onValueChange={(value) => setValue("purchaseOrderId", parseInt(value))}
                  disabled={ordersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ordersLoading ? "Carregando..." : "Selecione um pedido"} />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((order: PurchaseOrder) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        {order.orderNumber} - {order.supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.purchaseOrderId && (
                  <p className="text-sm text-red-500">{errors.purchaseOrderId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="receiptDate">Data do Recebimento</Label>
                <Input 
                  type="date" 
                  {...register("receiptDate")}
                />
                {errors.receiptDate && (
                  <p className="text-sm text-red-500">{errors.receiptDate.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registrando..." : "Registrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebimentos Hoje</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receiptsToday}</div>
            <p className="text-xs text-muted-foreground">Recebimentos de hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Recebidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsReceived}</div>
            <p className="text-xs text-muted-foreground">Total de recebimentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Pedidos aguardando</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders for Receipt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pedidos Próximos para Recebimento
          </CardTitle>
          <CardDescription>
            Pedidos ordenados por proximidade da data de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPendingLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando pedidos pendentes...
            </div>
          ) : upcomingOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pedido pendente para recebimento
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data do Pedido</TableHead>
                    <TableHead>Entrega Prevista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingOrders.map((order: PurchaseOrder) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>{order.supplier.name}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        {order.expectedDeliveryDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.expectedDeliveryDate)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Não definida</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getDeliveryStatusBadge(order)}
                      </TableCell>
                      <TableCell>
                        R$ {order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setValue("purchaseOrderId", order.id);
                            setIsCreateDialogOpen(true);
                          }}
                          className="gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Receber
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número do recebimento, pedido ou fornecedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Recebimentos</CardTitle>
          <CardDescription>
            Todos os recebimentos de produtos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {receiptsLoading ? "Carregando recebimentos..." : "Nenhum recebimento encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceipts.map((receipt: Receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        {receipt.receiptNumber}
                      </TableCell>
                      <TableCell>{receipt.purchaseOrder.orderNumber}</TableCell>
                      <TableCell>{receipt.purchaseOrder.supplier.name}</TableCell>
                      <TableCell>
                        {formatDate(receipt.receiptDate)}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Recebido</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}