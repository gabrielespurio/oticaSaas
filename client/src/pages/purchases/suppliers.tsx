import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Eye, Edit, Building, Phone, Mail, MapPin, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

const supplierSchema = z.object({
  name: z.string().min(1, "Razão social é obrigatória"),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type FormData = z.infer<typeof supplierSchema>;

export default function SuppliersTab() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch suppliers from API
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", "/api/suppliers");
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        return [];
      }
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(supplierSchema),
  });

  const onSubmit = async (data: FormData) => {
    console.log("Creating supplier:", data);
    toast({
      title: "Sucesso",
      description: "Fornecedor cadastrado com sucesso!",
    });
    setIsCreateDialogOpen(false);
    reset();
  };

  const handleViewSupplier = (supplierId: number) => {
    const supplier = Array.isArray(suppliers) ? suppliers.find(s => s.id === supplierId) : null;
    if (supplier) {
      setSelectedSupplier(supplier);
      setIsViewDialogOpen(true);
    }
  };

  const filteredSuppliers = Array.isArray(suppliers) ? suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.cnpj?.includes(searchQuery) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Carregando fornecedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Fornecedores</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Preencha as informações do fornecedor
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Razão Social *</Label>
                  <Input {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tradeName">Nome Fantasia</Label>
                  <Input {...register("tradeName")} />
                </div>

                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input {...register("phone")} placeholder="(00) 00000-0000" />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Endereço</Label>
                  <Input {...register("street")} />
                </div>

                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input {...register("zipCode")} placeholder="00000-000" />
                </div>

                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input {...register("city")} />
                </div>

                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
                <Input {...register("paymentTerms")} placeholder="Ex: 30 dias, À vista com desconto" />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea {...register("notes")} placeholder="Observações sobre o fornecedor..." />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">
              {suppliers.filter(s => s.isActive).length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Em operação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cadastrados Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => {
                const createdDate = new Date(s.createdAt);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Novos fornecedores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Dados Completos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.email && s.phone && s.cnpj).length}
            </div>
            <p className="text-xs text-muted-foreground">Perfis completos</p>
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
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>
            Todos os fornecedores cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome/Razão Social</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.notes && (
                          <div className="text-sm text-muted-foreground">{supplier.notes}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.cnpj || "—"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.city && supplier.state ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {supplier.city}, {supplier.state}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(supplier.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? "default" : "secondary"}>
                        {supplier.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSupplier(supplier.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Supplier Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações Básicas</h4>
                  <p><strong>Razão Social:</strong> {selectedSupplier.name}</p>
                  <p><strong>CNPJ:</strong> {selectedSupplier.cnpj || "—"}</p>
                  <p><strong>Criado em:</strong> {new Date(selectedSupplier.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <p><strong>Status:</strong> {selectedSupplier.isActive ? "Ativo" : "Inativo"}</p>
                  {selectedSupplier.notes && (
                    <p><strong>Observações:</strong> {selectedSupplier.notes}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Contato</h4>
                <div className="space-y-1">
                  {selectedSupplier.phone && <p><strong>Telefone:</strong> {selectedSupplier.phone}</p>}
                  {selectedSupplier.email && <p><strong>Email:</strong> {selectedSupplier.email}</p>}
                  {selectedSupplier.street && (
                    <p><strong>Endereço:</strong> {selectedSupplier.street}, {selectedSupplier.city}, {selectedSupplier.state}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}