import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, FileText, Search, Edit, DollarSign, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FinancialAccount, Customer, Sale } from "@shared/schema";

const editReceivableSchema = z.object({
  status: z.string().min(1, "Status é obrigatório"),
});

const newReceivableSchema = z.object({
  customerId: z.number({ required_error: "Selecione um cliente" }),
  saleId: z.number().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
});

type EditReceivableData = z.infer<typeof editReceivableSchema>;
type NewReceivableData = z.infer<typeof newReceivableSchema>;

export default function ReceivablesPage() {
  const [selectedReceivable, setSelectedReceivable] = useState<FinancialAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewReceivableDialogOpen, setIsNewReceivableDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: receivables = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/financial/accounts"],
    select: (data: any[]) => data.filter((account: any) => account.type === "receivable"),
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const editForm = useForm<EditReceivableData>({
    resolver: zodResolver(editReceivableSchema),
    defaultValues: {
      status: "",
    },
  });

  const newReceivableForm = useForm<NewReceivableData>({
    resolver: zodResolver(newReceivableSchema),
    defaultValues: {
      description: "",
      amount: "",
      dueDate: "",
    },
  });

  const editReceivableMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditReceivableData }) => 
      apiRequest("PATCH", `/api/financial/accounts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/accounts"] });
      setIsEditDialogOpen(false);
      setSelectedReceivable(null);
      editForm.reset();
      toast({
        title: "Conta atualizada",
        description: "A conta a receber foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar a conta a receber.",
        variant: "destructive",
      });
    },
  });

  const createReceivableMutation = useMutation({
    mutationFn: (data: NewReceivableData) => 
      apiRequest("POST", "/api/financial/accounts", {
        ...data,
        type: "receivable",
        status: "pending",
        amount: parseFloat(data.amount),
        dueDate: new Date(data.dueDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/accounts"] });
      setIsNewReceivableDialogOpen(false);
      newReceivableForm.reset();
      toast({
        title: "Conta criada",
        description: "A conta a receber foi criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar a conta a receber.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Vencido";
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== "paid";
  };

  const handleEditReceivable = (receivable: FinancialAccount) => {
    setSelectedReceivable(receivable);
    editForm.reset({
      status: receivable.status || "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (data: EditReceivableData) => {
    if (selectedReceivable) {
      editReceivableMutation.mutate({ id: selectedReceivable.id, data });
    }
  };

  const onNewReceivableSubmit = (data: NewReceivableData) => {
    createReceivableMutation.mutate(data);
  };

  const filteredReceivables = receivables.filter((receivable: any) => {
    const matchesSearch = receivable.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || receivable.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <AppLayout title="Contas a Receber" subtitle="Gerencie contas a receber">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contas a Receber</h1>
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
    <AppLayout title="Contas a Receber" subtitle="Gerencie contas a receber">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contas a Receber</h1>
          <Dialog open={isNewReceivableDialogOpen} onOpenChange={setIsNewReceivableDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta a Receber
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Conta a Receber</DialogTitle>
              </DialogHeader>
              <Form {...newReceivableForm}>
                <form onSubmit={newReceivableForm.handleSubmit(onNewReceivableSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={newReceivableForm.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newReceivableForm.control}
                      name="saleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venda (Opcional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma venda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Nenhuma venda</SelectItem>
                              {sales.map((sale) => (
                                <SelectItem key={sale.id} value={sale.id.toString()}>
                                  {sale.saleNumber} - R$ {parseFloat(sale.finalAmount).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={newReceivableForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Descrição da conta a receber" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={newReceivableForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newReceivableForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsNewReceivableDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createReceivableMutation.isPending}>
                      {createReceivableMutation.isPending ? "Criando..." : "Criar Conta"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {filteredReceivables.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Pendentes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredReceivables.filter((item: any) => item.status === "pending").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Vencidas</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredReceivables.filter((item: any) => item.status === "overdue" || isOverdue(item.dueDate, item.status)).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Pagas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredReceivables.filter((item: any) => item.status === "paid").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Contas */}
        <Card>
          <CardHeader>
            <CardTitle>Contas a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReceivables.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map((receivable: any) => {
                    const customer = customers.find(c => c.id === receivable.customerId);
                    const isDue = isOverdue(receivable.dueDate, receivable.status);
                    
                    return (
                      <TableRow key={receivable.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="font-medium">{receivable.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {customer?.fullName || 'Cliente não encontrado'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-medium">
                            R$ {parseFloat(receivable.amount).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm ${isDue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                            {format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge className={getStatusColor(receivable.status)}>
                              {getStatusText(receivable.status)}
                            </Badge>
                            {isDue && (
                              <Badge variant="destructive">Vencido</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditReceivable(receivable)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedReceivable(receivable)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalhes da Conta a Receber</DialogTitle>
                                </DialogHeader>
                                {selectedReceivable && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-semibold mb-2">Informações da Conta</h4>
                                        <p><strong>Descrição:</strong> {selectedReceivable.description}</p>
                                        <p><strong>Status:</strong> {getStatusText(selectedReceivable.status)}</p>
                                        <p><strong>Cliente:</strong> {customers.find(c => c.id === selectedReceivable.customerId)?.fullName}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold mb-2">Detalhes Financeiros</h4>
                                        <p><strong>Valor:</strong> R$ {parseFloat(selectedReceivable.amount).toFixed(2)}</p>
                                        <p><strong>Vencimento:</strong> {format(new Date(selectedReceivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                                        {selectedReceivable.saleId && (
                                          <p><strong>Venda:</strong> #{sales.find(s => s.id === selectedReceivable.saleId)?.saleNumber}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center">
                {!searchTerm && filterStatus === "all" ? (
                  <>
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Nenhuma conta a receber
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Comece criando sua primeira conta a receber.
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Nenhuma conta encontrada
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Tente ajustar os filtros de busca.
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Receivable Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Conta a Receber</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={editReceivableMutation.isPending}>
                    {editReceivableMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}