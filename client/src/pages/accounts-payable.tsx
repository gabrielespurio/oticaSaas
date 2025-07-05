import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountPayableSchema } from "@shared/schema";
import { z } from "zod";
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Calendar,
  Edit,
  Trash2,
  Eye,
  CreditCard,
  Building,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";

interface AccountPayable {
  id: number;
  supplierId?: number;
  categoryId?: number;
  description: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  dueDate: string;
  paidDate?: string;
  status: string;
  paymentMethod?: string;
  installments: number;
  isRecurring: boolean;
  supplier?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
    color: string;
  };
}

interface Supplier {
  id: number;
  name: string;
  cnpj?: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
  color: string;
}

const formSchema = insertAccountPayableSchema.extend({
  dueDate: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function AccountsPayablePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["/api/accounts-payable"],
    queryFn: () => apiRequest("GET", "/api/accounts-payable"),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: () => apiRequest("GET", "/api/suppliers"),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/expense-categories"],
    queryFn: () => apiRequest("GET", "/api/expense-categories"),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/accounts-payable/stats"],
    queryFn: () => apiRequest("GET", "/api/accounts-payable/stats"),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/accounts-payable", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable/stats"] });
      setIsCreateDialogOpen(false);
      reset();
      toast({
        title: "Sucesso",
        description: "Conta a pagar criada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar conta a pagar",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/accounts-payable/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable/stats"] });
      toast({
        title: "Sucesso",
        description: "Conta a pagar excluída com sucesso!",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      installments: 1,
      isRecurring: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    // If installments > 1, create multiple accounts
    const installments = data.installments || 1;
    if (installments > 1) {
      const installmentAmount = parseFloat(data.totalAmount) / installments;
      const baseDate = new Date(data.dueDate);
      
      for (let i = 1; i <= installments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
        
        const installmentData = {
          ...data,
          description: `${data.description} - Parcela ${i}/${installments}`,
          totalAmount: installmentAmount.toFixed(2),
          dueDate: installmentDate.toISOString().split('T')[0],
          currentInstallment: i,
          parentId: i > 1 ? undefined : undefined, // Will be handled by backend
        };
        
        await createMutation.mutateAsync(installmentData);
      }
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleViewAccount = async (accountId: number) => {
    try {
      const account = await apiRequest("GET", `/api/accounts-payable/${accountId}`);
      setSelectedAccount(account);
      setIsViewDialogOpen(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar detalhes da conta",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500">Pago</Badge>;
      case "overdue":
        return <Badge variant="destructive">Vencido</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (account: AccountPayable) => {
    if (account.status === "paid") return "border-green-200";
    if (account.status === "overdue" || new Date(account.dueDate) < new Date()) {
      return "border-red-200 bg-red-50";
    }
    return "";
  };

  const filteredAccounts = accounts.filter((account: AccountPayable) => {
    const matchesSearch = account.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const installmentsField = watch("installments");

  return (
    <AppLayout title="Contas a Pagar" subtitle="Gerencie pagamentos a fornecedores e despesas da empresa">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
            <p className="text-muted-foreground">
              Gerencie pagamentos a fornecedores e despesas da empresa
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {parseFloat(stats.totalPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {parseFloat(stats.totalOverdue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pago Este Mês</CardTitle>
              <CreditCard className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {parseFloat(stats.totalPaidThisMonth).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Vencimentos</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.upcomingPayments}
              </div>
              <p className="text-xs text-muted-foreground">
                próximos 7 dias
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou fornecedor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            Lista de todas as contas a pagar cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Nenhuma conta a pagar encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account: AccountPayable) => (
                    <TableRow key={account.id} className={getStatusColor(account)}>
                      <TableCell className="font-medium">
                        {account.description}
                        {account.installments > 1 && (
                          <div className="text-xs text-muted-foreground">
                            {account.installments}x parcelas
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.supplier ? (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {account.supplier.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sem fornecedor</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.category ? (
                          <Badge 
                            variant="outline" 
                            style={{ backgroundColor: account.category.color + '20', borderColor: account.category.color }}
                          >
                            {account.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Sem categoria</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            R$ {parseFloat(account.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {parseFloat(account.paidAmount || '0') > 0 && (
                            <div className="text-xs text-green-600">
                              Pago: R$ {parseFloat(account.paidAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {new Date(account.dueDate) < new Date() && account.status === 'pending' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {formatDate(account.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(account.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAccount(account.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Conta a Pagar</DialogTitle>
            <DialogDescription>
              Cadastre uma nova conta a pagar ou despesa
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Ex: Aluguel Janeiro/2025"
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Valor Total *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  {...register("totalAmount")}
                  placeholder="0,00"
                />
                {errors.totalAmount && (
                  <p className="text-sm text-red-500">{errors.totalAmount.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Fornecedor</Label>
                <Select onValueChange={(value) => setValue("supplierId", parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: Supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <Select onValueChange={(value) => setValue("categoryId", parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: ExpenseCategory) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register("dueDate")}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  max="36"
                  {...register("installments", { valueAsNumber: true })}
                />
                {(installmentsField || 1) > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Será criada 1 parcela por mês, totalizando {installmentsField || 1} contas
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Informações adicionais sobre a conta"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta a Pagar</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm">{selectedAccount.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fornecedor</Label>
                  <p className="text-sm">{selectedAccount.supplier?.name || "Sem fornecedor"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Valor Total</Label>
                  <p className="text-sm font-mono">
                    R$ {parseFloat(selectedAccount.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor Pago</Label>
                  <p className="text-sm font-mono text-green-600">
                    R$ {parseFloat(selectedAccount.paidAmount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor Restante</Label>
                  <p className="text-sm font-mono text-red-600">
                    R$ {parseFloat(selectedAccount.remainingAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Vencimento</Label>
                  <p className="text-sm">
                    {formatDate(selectedAccount.dueDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedAccount.status)}
                  </div>
                </div>
              </div>

              {selectedAccount.paymentMethod && (
                <div>
                  <Label className="text-sm font-medium">Forma de Pagamento</Label>
                  <p className="text-sm">{selectedAccount.paymentMethod}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}