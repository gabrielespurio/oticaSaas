import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, FileText, Search, Edit, DollarSign, CheckCircle, XCircle, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FinancialAccount } from "@shared/schema";

const editPayableSchema = z.object({
  status: z.string().min(1, "Status é obrigatório"),
});

const newPayableSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
});

type EditPayableData = z.infer<typeof editPayableSchema>;
type NewPayableData = z.infer<typeof newPayableSchema>;

export default function PayablesPage() {
  const [selectedPayable, setSelectedPayable] = useState<FinancialAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewPayableDialogOpen, setIsNewPayableDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payables = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/accounts-payable"],
  });

  const editForm = useForm<EditPayableData>({
    resolver: zodResolver(editPayableSchema),
    defaultValues: {
      status: "",
    },
  });

  const newPayableForm = useForm<NewPayableData>({
    resolver: zodResolver(newPayableSchema),
    defaultValues: {
      description: "",
      amount: "",
      dueDate: "",
    },
  });

  const editPayableMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditPayableData }) => 
      apiRequest("PATCH", `/api/accounts-payable/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      setIsEditDialogOpen(false);
      setSelectedPayable(null);
      editForm.reset();
      toast({
        title: "Conta atualizada",
        description: "A conta a pagar foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar a conta a pagar.",
        variant: "destructive",
      });
    },
  });

  const createPayableMutation = useMutation({
    mutationFn: (data: NewPayableData) => 
      apiRequest("POST", "/api/accounts-payable", {
        ...data,
        status: "pending",
        totalAmount: parseFloat(data.amount),
        remainingAmount: parseFloat(data.amount),
        paidAmount: 0,
        dueDate: new Date(data.dueDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      setIsNewPayableDialogOpen(false);
      newPayableForm.reset();
      toast({
        title: "Conta criada",
        description: "A conta a pagar foi criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar a conta a pagar.",
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

  const handleEditPayable = (payable: FinancialAccount) => {
    setSelectedPayable(payable);
    editForm.reset({
      status: payable.status || "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (data: EditPayableData) => {
    if (selectedPayable) {
      editPayableMutation.mutate({ id: selectedPayable.id, data });
    }
  };

  const onNewPayableSubmit = (data: NewPayableData) => {
    createPayableMutation.mutate(data);
  };

  const filteredPayables = payables.filter((payable: any) => {
    const matchesSearch = payable.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || payable.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <AppLayout title="Contas a Pagar" subtitle="Gerencie contas a pagar">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contas a Pagar</h1>
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
    <AppLayout title="Contas a Pagar" subtitle="Gerencie contas a pagar">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contas a Pagar</h1>
          <Dialog open={isNewPayableDialogOpen} onOpenChange={setIsNewPayableDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta a Pagar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Conta a Pagar</DialogTitle>
              </DialogHeader>
              <Form {...newPayableForm}>
                <form onSubmit={newPayableForm.handleSubmit(onNewPayableSubmit)} className="space-y-4">
                  <FormField
                    control={newPayableForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Descrição da conta a pagar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={newPayableForm.control}
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
                      control={newPayableForm.control}
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
                    <Button type="button" variant="outline" onClick={() => setIsNewPayableDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createPayableMutation.isPending}>
                      {createPayableMutation.isPending ? "Criando..." : "Criar Conta"}
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
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {filteredPayables.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0).toFixed(2)}
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
                {filteredPayables.filter((item: any) => item.status === "pending").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredPayables.filter((item: any) => item.status === "overdue" || isOverdue(item.dueDate, item.status)).length}
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
                {filteredPayables.filter((item: any) => item.status === "paid").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Contas */}
        <div className="grid gap-4">
          {filteredPayables.map((payable: any) => (
            <Card key={payable.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {payable.description}
                      </h3>
                      <Badge className={getStatusColor(payable.status)}>
                        {getStatusText(payable.status)}
                      </Badge>
                      {isOverdue(payable.dueDate, payable.status) && (
                        <Badge variant="destructive">Vencido</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p><strong>Valor:</strong> R$ {parseFloat(payable.amount).toFixed(2)}</p>
                      <p><strong>Vencimento:</strong> {format(new Date(payable.dueDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPayable(payable)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayable(payable)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes da Conta a Pagar</DialogTitle>
                        </DialogHeader>
                        {selectedPayable && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Informações da Conta</h4>
                                <p><strong>Descrição:</strong> {selectedPayable.description}</p>
                                <p><strong>Status:</strong> {getStatusText(selectedPayable.status)}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Detalhes Financeiros</h4>
                                <p><strong>Valor:</strong> R$ {parseFloat(selectedPayable.amount).toFixed(2)}</p>
                                <p><strong>Vencimento:</strong> {format(new Date(selectedPayable.dueDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPayables.length === 0 && !searchTerm && filterStatus === "all" && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma conta a pagar
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece criando sua primeira conta a pagar.
                </p>
              </CardContent>
            </Card>
          )}

          {filteredPayables.length === 0 && (searchTerm || filterStatus !== "all") && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tente ajustar os filtros de busca.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Payable Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Conta a Pagar</DialogTitle>
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
                  <Button type="submit" disabled={editPayableMutation.isPending}>
                    {editPayableMutation.isPending ? "Salvando..." : "Salvar Alterações"}
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