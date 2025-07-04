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
import { Plus, Search, Eye, Package, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">+2 desde ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Recebidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Pedidos aguardando</p>
          </CardContent>
        </Card>
      </div>

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
                        {format(new Date(receipt.receiptDate), "dd/MM/yyyy", { locale: ptBR })}
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