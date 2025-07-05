import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Eye, Package, Calendar, TrendingUp, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const receiptSchema = z.object({
  purchaseOrderId: z.number().min(1, "Selecione um pedido de compra"),
  receiptDate: z.string().min(1, "Data do recebimento é obrigatória"),
  notes: z.string().optional(),
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
    totalAmount: string;
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
  const [pendingOrdersFilter, setPendingOrdersFilter] = useState("");
  const [receiptsFilter, setReceiptsFilter] = useState("");
  const [receivingOrderId, setReceivingOrderId] = useState<number | null>(null);

  // Fetch purchase receipts from API
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ["/api/purchase-receipts"],
  });

  // Fetch all pending purchase orders
  const { data: allPendingOrders = [], isLoading: allPendingLoading } = useQuery({
    queryKey: ["/api/purchase-orders", { onlyPending: true }],
  });

  // Fetch purchase orders for dropdown
  const { data: purchaseOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptDate: new Date().toISOString().split("T")[0],
    },
  });

  const createReceiptMutation = useMutation({
    mutationFn: (data: ReceiptFormData) => 
      apiRequest("/api/purchase-receipts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setIsCreateDialogOpen(false);
      reset();
      toast({
        title: "Sucesso",
        description: "Recebimento registrado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar recebimento",
        variant: "destructive",
      });
    },
  });

  // Auto-receive order mutation
  const autoReceiveMutation = useMutation({
    mutationFn: (orderId: number) => 
      apiRequest("/api/purchase-receipts", "POST", {
        purchaseOrderId: orderId,
        receiptDate: new Date().toISOString().split("T")[0],
        notes: "Recebimento automático"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setReceivingOrderId(null);
      toast({
        title: "Sucesso",
        description: "Pedido recebido com sucesso",
      });
    },
    onError: (error: any) => {
      setReceivingOrderId(null);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar recebimento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ReceiptFormData) => {
    createReceiptMutation.mutate(data);
  };

  const handleReceiveOrder = (orderId: number) => {
    setReceivingOrderId(orderId);
    autoReceiveMutation.mutate(orderId);
  };

  const getDeliveryStatusBadge = (order: PurchaseOrder) => {
    if (!order.expectedDeliveryDate) return null;
    
    const today = new Date();
    const deliveryDate = new Date(order.expectedDeliveryDate);
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge className="bg-red-500">Atrasado</Badge>;
    } else if (diffDays === 0) {
      return <Badge className="bg-orange-500">Hoje</Badge>;
    } else if (diffDays <= 3) {
      return <Badge className="bg-yellow-500">Próximo</Badge>;
    } else {
      return <Badge className="bg-blue-500">Agendado</Badge>;
    }
  };

  const filteredReceipts = receipts.filter((receipt: Receipt) =>
    receipt.receiptNumber.toLowerCase().includes(receiptsFilter.toLowerCase()) ||
    receipt.purchaseOrder.orderNumber.toLowerCase().includes(receiptsFilter.toLowerCase()) ||
    receipt.purchaseOrder.supplier.name.toLowerCase().includes(receiptsFilter.toLowerCase())
  );

  // Filter and sort pending orders by delivery date proximity
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const upcomingOrders = allPendingOrders
    .filter((order: PurchaseOrder) => {
      if (!order.expectedDeliveryDate) return false;
      return order.expectedDeliveryDate >= todayStr;
    })
    .sort((a: PurchaseOrder, b: PurchaseOrder) => {
      if (!a.expectedDeliveryDate || !b.expectedDeliveryDate) return 0;
      return new Date(a.expectedDeliveryDate).getTime() - new Date(b.expectedDeliveryDate).getTime();
    });

  const filteredPendingOrders = upcomingOrders.filter((order: PurchaseOrder) =>
    order.orderNumber.toLowerCase().includes(pendingOrdersFilter.toLowerCase()) ||
    order.supplier.name.toLowerCase().includes(pendingOrdersFilter.toLowerCase())
  );

  // Calculate stats
  const receiptsToday = receipts.filter((receipt: Receipt) => {
    const receiptDate = new Date(receipt.receiptDate).toISOString().split('T')[0];
    return receiptDate === todayStr;
  }).length;

  const totalItemsReceived = receipts.length;
  const pendingOrdersCount = allPendingOrders.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recebimentos</h2>
          <p className="text-muted-foreground">
            Gerencie os recebimentos de produtos dos seus fornecedores
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrdersCount}</div>
            <p className="text-xs text-muted-foreground">Pedidos pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different tables */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pedidos Pendentes</TabsTrigger>
          <TabsTrigger value="history">Histórico de Recebimentos</TabsTrigger>
        </TabsList>

        {/* Pending Orders Tab */}
        <TabsContent value="pending" className="space-y-4">
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
            <CardContent className="space-y-4">
              {/* Filter for pending orders */}
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por número do pedido ou fornecedor..."
                  value={pendingOrdersFilter}
                  onChange={(e) => setPendingOrdersFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {allPendingLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando pedidos pendentes...
                </div>
              ) : filteredPendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {pendingOrdersFilter ? "Nenhum pedido encontrado com esse filtro" : "Nenhum pedido pendente para recebimento"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Data Prevista</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingOrders.map((order: PurchaseOrder) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.supplier.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {order.expectedDeliveryDate && formatDate(order.expectedDeliveryDate)}
                              {getDeliveryStatusBadge(order)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            R$ {order.totalAmount ? Number(order.totalAmount).toFixed(2) : '0.00'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleReceiveOrder(order.id)}
                              disabled={receivingOrderId === order.id}
                            >
                              {receivingOrderId === order.id ? "Processando..." : "Receber"}
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
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Histórico de Recebimentos
              </CardTitle>
              <CardDescription>
                Todos os recebimentos de produtos registrados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter for receipts */}
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por número do recebimento, pedido ou fornecedor..."
                  value={receiptsFilter}
                  onChange={(e) => setReceiptsFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          {receiptsLoading ? "Carregando recebimentos..." : receiptsFilter ? "Nenhum recebimento encontrado com esse filtro" : "Nenhum recebimento encontrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReceipts.map((receipt: Receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell className="font-medium">{receipt.purchaseOrder.orderNumber}</TableCell>
                          <TableCell>{receipt.purchaseOrder.supplier.name}</TableCell>
                          <TableCell>
                            {formatDate(receipt.receiptDate)}
                          </TableCell>
                          <TableCell>
                            R$ {receipt.purchaseOrder.totalAmount ? Number(receipt.purchaseOrder.totalAmount).toFixed(2) : '0.00'}
                          </TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}