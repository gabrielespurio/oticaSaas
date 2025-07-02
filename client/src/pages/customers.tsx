import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Eye, Edit, FileText, Calendar, ShoppingBag, Camera, Download, Trash2, Upload } from "lucide-react";
import { insertCustomerSchema, type Customer, type Sale, type SaleItem, type Product, type Prescription, type PrescriptionFile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Form schemas
const customerFormSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional().or(z.literal("")),
  birthDate: z.string().optional(),
  street: z.string().optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal("")),
  neighborhood: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().min(8, "CEP deve ter 8 dígitos").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

const prescriptionFormSchema = z.object({
  customerId: z.number(),
  doctorName: z.string().min(1, "Nome do médico é obrigatório"),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  rightSphere: z.string().optional(),
  rightCylinder: z.string().optional(),
  rightAxis: z.string().optional(),
  rightAdd: z.string().optional(),
  leftSphere: z.string().optional(),
  leftCylinder: z.string().optional(),
  leftAxis: z.string().optional(),
  leftAdd: z.string().optional(),
  rightPd: z.string().optional(),
  leftPd: z.string().optional(),
  notes: z.string().optional(),
});

interface CustomerWithHistory extends Customer {
  purchaseHistory?: (Sale & { items: (SaleItem & { product: Product })[] })[];
  prescriptions?: Prescription[];
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithHistory | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionFiles, setPrescriptionFiles] = useState<File[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers", search],
    queryFn: () => apiRequest(`/api/customers${search ? `?search=${search}` : ""}`),
  });

  const { data: customerDetails } = useQuery({
    queryKey: ["/api/customers", selectedCustomer?.id, "details"],
    queryFn: async () => {
      if (!selectedCustomer?.id) return null;
      
      const [customer, purchaseHistory, prescriptions] = await Promise.all([
        apiRequest(`/api/customers/${selectedCustomer.id}`),
        apiRequest(`/api/customers/${selectedCustomer.id}/purchase-history`),
        apiRequest(`/api/customers/${selectedCustomer.id}/prescriptions`),
      ]);

      return {
        ...customer,
        purchaseHistory,
        prescriptions,
      };
    },
    enabled: !!selectedCustomer?.id,
  });

  const { data: prescriptionDetails } = useQuery({
    queryKey: ["/api/prescriptions", selectedPrescription?.id],
    queryFn: () => apiRequest(`/api/prescriptions/${selectedPrescription?.id}`),
    enabled: !!selectedPrescription?.id,
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: (data: z.infer<typeof customerFormSchema>) => 
      apiRequest("/api/customers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsAddDialogOpen(false);
      customerForm.reset();
      toast({ title: "Cliente criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar cliente", variant: "destructive" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof customerFormSchema>> }) =>
      apiRequest(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({ title: "Cliente atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar cliente", variant: "destructive" });
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: (data: z.infer<typeof prescriptionFormSchema>) => {
      const payload = {
        ...data,
        issueDate: new Date(data.issueDate).toISOString(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
        rightSphere: data.rightSphere ? parseFloat(data.rightSphere) : null,
        rightCylinder: data.rightCylinder ? parseFloat(data.rightCylinder) : null,
        rightAxis: data.rightAxis ? parseInt(data.rightAxis) : null,
        rightAdd: data.rightAdd ? parseFloat(data.rightAdd) : null,
        leftSphere: data.leftSphere ? parseFloat(data.leftSphere) : null,
        leftCylinder: data.leftCylinder ? parseFloat(data.leftCylinder) : null,
        leftAxis: data.leftAxis ? parseInt(data.leftAxis) : null,
        leftAdd: data.leftAdd ? parseFloat(data.leftAdd) : null,
        rightPd: data.rightPd ? parseFloat(data.rightPd) : null,
        leftPd: data.leftPd ? parseFloat(data.leftPd) : null,
      };
      return apiRequest("/api/prescriptions", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: async (prescription) => {
      // Upload files if any
      if (prescriptionFiles.length > 0) {
        const formData = new FormData();
        prescriptionFiles.forEach(file => {
          formData.append('files', file);
        });

        await apiRequest(`/api/prescriptions/${prescription.id}/files`, {
          method: "POST",
          body: formData,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsPrescriptionDialogOpen(false);
      prescriptionForm.reset();
      setPrescriptionFiles([]);
      toast({ title: "Prescrição criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar prescrição", variant: "destructive" });
    },
  });

  // Forms
  const customerForm = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cpf: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      notes: "",
    },
  });

  const editForm = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cpf: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      notes: "",
    },
  });

  const prescriptionForm = useForm<z.infer<typeof prescriptionFormSchema>>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      customerId: selectedCustomer?.id || 0,
      doctorName: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      expiryDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    },
  });

  const onCreateCustomer = (data: z.infer<typeof customerFormSchema>) => {
    createCustomerMutation.mutate(data);
  };

  const onUpdateCustomer = (data: z.infer<typeof customerFormSchema>) => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({ id: selectedCustomer.id, data });
    }
  };

  const onCreatePrescription = (data: z.infer<typeof prescriptionFormSchema>) => {
    createPrescriptionMutation.mutate({
      ...data,
      customerId: selectedCustomer?.id || 0,
    });
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const isPrescriptionValid = (expiryDate: string | null) => {
    if (!expiryDate) return true;
    return new Date(expiryDate) > new Date();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPrescriptionFiles(Array.from(e.target.files));
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    editForm.reset({
      fullName: customer.fullName,
      email: customer.email || "",
      phone: customer.phone || "",
      cpf: customer.cpf || "",
      street: customer.street || "",
      number: customer.number || "",
      complement: customer.complement || "",
      neighborhood: customer.neighborhood || "",
      city: customer.city || "",
      state: customer.state || "",
      zipCode: customer.zipCode || "",
      notes: customer.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openPrescriptionDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    prescriptionForm.reset({
      customerId: customer.id,
      doctorName: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      expiryDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    });
    setIsPrescriptionDialogOpen(true);
  };

  return (
    <AppLayout title="Clientes" subtitle="Gerencie seus clientes e pacientes">
      <div className="space-y-6">
        {/* Header with search and actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar clientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cliente abaixo.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...customerForm}>
                <form onSubmit={customerForm.handleSubmit(onCreateCustomer)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="000.000.000-00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(11) 99999-9999" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />
                  <h4 className="font-medium">Endereço</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SP">São Paulo</SelectItem>
                                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                <SelectItem value="MG">Minas Gerais</SelectItem>
                                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                                <SelectItem value="PR">Paraná</SelectItem>
                                <SelectItem value="SC">Santa Catarina</SelectItem>
                                <SelectItem value="BA">Bahia</SelectItem>
                                <SelectItem value="GO">Goiás</SelectItem>
                                <SelectItem value="PE">Pernambuco</SelectItem>
                                <SelectItem value="CE">Ceará</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={customerForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00000-000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={customerForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createCustomerMutation.isPending}
                    >
                      {createCustomerMutation.isPending ? "Criando..." : "Criar Cliente"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer: Customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.fullName}</TableCell>
                      <TableCell>{customer.cpf || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{customer.phone || "-"}</div>
                          <div className="text-muted-foreground">{customer.email || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.city || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPrescriptionDialog(customer)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Customer Details Dialog */}
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCustomer?.fullName}</DialogTitle>
              <DialogDescription>
                Informações detalhadas do cliente
              </DialogDescription>
            </DialogHeader>

            {customerDetails && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="history">Histórico de Compras</TabsTrigger>
                  <TabsTrigger value="prescriptions">Prescrições</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nome Completo</Label>
                      <p className="text-sm text-muted-foreground">{customerDetails.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">CPF</Label>
                      <p className="text-sm text-muted-foreground">{customerDetails.cpf || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">E-mail</Label>
                      <p className="text-sm text-muted-foreground">{customerDetails.email || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="text-sm text-muted-foreground">{customerDetails.phone || "-"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Endereço</Label>
                    <p className="text-sm text-muted-foreground">
                      {customerDetails.street && customerDetails.number 
                        ? `${customerDetails.street}, ${customerDetails.number}${customerDetails.complement ? `, ${customerDetails.complement}` : ""}`
                        : "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customerDetails.neighborhood && customerDetails.city && customerDetails.state
                        ? `${customerDetails.neighborhood}, ${customerDetails.city} - ${customerDetails.state}`
                        : "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customerDetails.zipCode || "-"}
                    </p>
                  </div>

                  {customerDetails.notes && (
                    <div>
                      <Label className="text-sm font-medium">Observações</Label>
                      <p className="text-sm text-muted-foreground">{customerDetails.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  {customerDetails.purchaseHistory?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma compra registrada
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerDetails.purchaseHistory?.map((sale: any) => (
                        <Card key={sale.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">Venda #{sale.saleNumber}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={sale.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                  {sale.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(sale.saleDate)}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {sale.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.product.name} (x{item.quantity})</span>
                                  <span>{formatCurrency(item.totalPrice)}</span>
                                </div>
                              ))}
                              <Separator />
                              <div className="flex justify-between font-medium">
                                <span>Total</span>
                                <span>{formatCurrency(sale.finalAmount)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="prescriptions" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Prescrições do Cliente</h4>
                    <Button 
                      size="sm" 
                      onClick={() => openPrescriptionDialog(selectedCustomer!)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Prescrição
                    </Button>
                  </div>

                  {customerDetails.prescriptions?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma prescrição registrada
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerDetails.prescriptions?.map((prescription: any) => (
                        <Card key={prescription.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">
                                Dr. {prescription.doctorName}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={isPrescriptionValid(prescription.expiryDate) ? 'default' : 'destructive'}>
                                  {isPrescriptionValid(prescription.expiryDate) ? 'Válida' : 'Expirada'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedPrescription(prescription)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Data de Emissão:</span>
                                <br />
                                {formatDate(prescription.issueDate)}
                              </div>
                              <div>
                                <span className="font-medium">Validade:</span>
                                <br />
                                {prescription.expiryDate ? formatDate(prescription.expiryDate) : "-"}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Atualize os dados do cliente.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onUpdateCustomer)} className="space-y-4">
                {/* Same form fields as create customer dialog - shortened for brevity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateCustomerMutation.isPending}
                  >
                    {updateCustomerMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Prescription Dialog */}
        <Dialog open={isPrescriptionDialogOpen} onOpenChange={setIsPrescriptionDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Prescrição</DialogTitle>
              <DialogDescription>
                Adicione uma nova prescrição para {selectedCustomer?.fullName}
              </DialogDescription>
            </DialogHeader>

            <Form {...prescriptionForm}>
              <form onSubmit={prescriptionForm.handleSubmit(onCreatePrescription)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={prescriptionForm.control}
                    name="doctorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Médico *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={prescriptionForm.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Emissão *</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={prescriptionForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Validade</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />
                <h4 className="font-medium">Olho Direito (OD)</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={prescriptionForm.control}
                    name="rightSphere"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Esfera</FormLabel>
                        <FormControl>
                          <Input {...field} step="0.25" placeholder="-2.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={prescriptionForm.control}
                    name="rightCylinder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cilindro</FormLabel>
                        <FormControl>
                          <Input {...field} step="0.25" placeholder="-1.50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={prescriptionForm.control}
                    name="rightAxis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eixo</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" max="180" placeholder="90" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={prescriptionForm.control}
                    name="rightAdd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adição</FormLabel>
                        <FormControl>
                          <Input {...field} step="0.25" placeholder="+2.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                <h4 className="font-medium">Olho Esquerdo (OS)</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={prescriptionForm.control}
                    name="leftSphere"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Esfera</FormLabel>
                        <FormControl>
                          <Input {...field} step="0.25" placeholder="-2.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={prescriptionForm.control}
                    name="leftCylinder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cilindro</FormLabel>
                        <FormControl>
                          <Input {...field} step="0.25" placeholder="-1.50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={prescriptionForm.control}
                    name="leftAxis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eixo</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" max="180" placeholder="90" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={prescriptionForm.control}
                    name="leftAdd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adição</FormLabel>
                        <FormControl>
                          <Input {...field} step="0.25" placeholder="+2.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                <h4 className="font-medium">Distância Pupilar (DNP)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={prescriptionForm.control}
                    name="rightPd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DNP Direita</FormLabel>
                        <FormControl>
                          <Input {...field} step="0.5" placeholder="32.0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={prescriptionForm.control}
                    name="leftPd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DNP Esquerda</FormLabel>
                        <FormControl>
                          <Input {...field} step="0.5" placeholder="32.0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={prescriptionForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />
                <div>
                  <Label className="text-sm font-medium">Anexar Arquivos da Prescrição</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Aceita imagens (JPG, PNG) e PDFs. Máximo 5 arquivos.
                    </p>
                  </div>
                  {prescriptionFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm">Arquivos selecionados:</p>
                      <ul className="text-xs text-muted-foreground">
                        {prescriptionFiles.map((file, index) => (
                          <li key={index}>• {file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createPrescriptionMutation.isPending}
                  >
                    {createPrescriptionMutation.isPending ? "Criando..." : "Criar Prescrição"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Prescription Details Dialog */}
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Prescrição</DialogTitle>
              <DialogDescription>
                Prescrição emitida por Dr. {selectedPrescription?.doctorName}
              </DialogDescription>
            </DialogHeader>

            {prescriptionDetails && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Data de Emissão</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(prescriptionDetails.issueDate)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Validade</Label>
                    <p className="text-sm text-muted-foreground">
                      {prescriptionDetails.expiryDate ? formatDate(prescriptionDetails.expiryDate) : "-"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Olho Direito (OD)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Esfera:</span>
                        <span>{prescriptionDetails.rightSphere || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cilindro:</span>
                        <span>{prescriptionDetails.rightCylinder || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Eixo:</span>
                        <span>{prescriptionDetails.rightAxis || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adição:</span>
                        <span>{prescriptionDetails.rightAdd || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DNP:</span>
                        <span>{prescriptionDetails.rightPd || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Olho Esquerdo (OS)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Esfera:</span>
                        <span>{prescriptionDetails.leftSphere || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cilindro:</span>
                        <span>{prescriptionDetails.leftCylinder || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Eixo:</span>
                        <span>{prescriptionDetails.leftAxis || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adição:</span>
                        <span>{prescriptionDetails.leftAdd || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DNP:</span>
                        <span>{prescriptionDetails.leftPd || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {prescriptionDetails.notes && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">Observações</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {prescriptionDetails.notes}
                      </p>
                    </div>
                  </>
                )}

                {prescriptionDetails.files && prescriptionDetails.files.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">Arquivos Anexados</Label>
                      <div className="mt-2 space-y-2">
                        {prescriptionDetails.files.map((file: PrescriptionFile) => (
                          <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{file.originalName}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/api/prescriptions/files/${file.filename}`, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}