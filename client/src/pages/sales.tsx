import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, FileText, Search, Edit, Save, X, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Sale, Customer, SaleItem, Product, Quote, QuoteItem } from "@shared/schema";

interface SaleWithDetails extends Sale {
  customer: Customer;
  items: (SaleItem & { product: Product })[];
}

interface QuoteWithDetails extends Quote {
  customer: Customer;
  items: (QuoteItem & { product: Product })[];
}

const editSaleSchema = z.object({
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  paymentStatus: z.string().min(1, "Status de pagamento é obrigatório"),
  notes: z.string().optional(),
});

// Schema para criação de venda direta
const newSaleSchema = z.object({
  saleType: z.enum(["direct", "from_quote"]),
  customerId: z.number({ required_error: "Selecione um cliente" }),
  quoteId: z.number().optional(),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  paymentStatus: z.string().default("completed"),
  installments: z.number().min(1).max(12).optional().default(1),
  notes: z.string().optional(),
});

interface SaleItemForm {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface NewSaleFormData {
  saleType: "direct" | "from_quote";
  customerId: number;
  quoteId?: number;
  paymentMethod: string;
  paymentStatus: string;
  installments?: number;
  notes?: string;
}

type EditSaleData = z.infer<typeof editSaleSchema>;

export default function Sales() {
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItemForm[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithDetails | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sales = [], isLoading } = useQuery<SaleWithDetails[]>({
    queryKey: ["/api/sales"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: quotes = [] } = useQuery<QuoteWithDetails[]>({
    queryKey: ["/api/quotes"],
    select: (data) => data.filter(quote => quote.status === "pending"),
  });

  const editForm = useForm<EditSaleData>({
    resolver: zodResolver(editSaleSchema),
    defaultValues: {
      paymentMethod: "",
      paymentStatus: "",
      notes: "",
    },
  });

  const newSaleForm = useForm<NewSaleFormData>({
    resolver: zodResolver(newSaleSchema),
    defaultValues: {
      saleType: "direct",
      paymentMethod: "",
      paymentStatus: "completed",
      installments: 1,
      notes: "",
    },
  });

  const editSaleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditSaleData }) => 
      apiRequest("PATCH", `/api/sales/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setIsEditDialogOpen(false);
      setSelectedSale(null);
      editForm.reset();
      toast({
        title: "Venda atualizada",
        description: "As informações da venda foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar a venda.",
        variant: "destructive",
      });
    },
  });

  const createDirectSaleMutation = useMutation({
    mutationFn: (data: { sale: any; items: SaleItemForm[] }) => 
      apiRequest("POST", "/api/sales", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setIsNewSaleDialogOpen(false);
      newSaleForm.reset();
      setSaleItems([]);
      toast({
        title: "Venda criada",
        description: "A venda foi registrada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar a venda.",
        variant: "destructive",
      });
    },
  });

  const convertQuoteToSaleMutation = useMutation({
    mutationFn: ({ id, paymentData }: { id: number; paymentData: any }) => 
      apiRequest("POST", `/api/quotes/${id}/convert-to-sale`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setIsNewSaleDialogOpen(false);
      newSaleForm.reset();
      toast({
        title: "Venda criada",
        description: "O orçamento foi convertido em venda com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao converter orçamento em venda.",
        variant: "destructive",
      });
    },
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

  // Funções auxiliares para itens da venda
  const addSaleItem = () => {
    setSaleItems([...saleItems, { productId: 0, quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const updateSaleItem = (index: number, field: keyof SaleItemForm, value: number) => {
    const newItems = [...saleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unitPrice = parseFloat(product.salePrice);
        newItems[index].totalPrice = newItems[index].quantity * parseFloat(product.salePrice);
      }
    } else if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setSaleItems(newItems);
  };

  const getTotalAmount = () => {
    return saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // Função para carregar dados do orçamento selecionado
  const loadQuoteData = async (quoteId: number) => {
    try {
      const quote = await apiRequest("GET", `/api/quotes/${quoteId}`);
      setSelectedQuote(quote);
      setSaleItems(quote.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice),
      })));
      newSaleForm.setValue('customerId', quote.customerId);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do orçamento.",
        variant: "destructive",
      });
    }
  };

  const handleEditSale = (sale: SaleWithDetails) => {
    setSelectedSale(sale);
    editForm.reset({
      paymentMethod: sale.paymentMethod || "",
      paymentStatus: sale.paymentStatus || "",
      notes: sale.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (data: EditSaleData) => {
    if (selectedSale) {
      editSaleMutation.mutate({ id: selectedSale.id, data });
    }
  };

  const onNewSaleSubmit = (data: NewSaleFormData) => {
    if (data.saleType === "from_quote" && data.quoteId) {
      // Converter orçamento em venda
      convertQuoteToSaleMutation.mutate({
        id: data.quoteId,
        paymentData: {
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          installments: data.installments,
        }
      });
    } else if (data.saleType === "direct") {
      // Criar venda direta
      if (saleItems.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um item à venda.",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = getTotalAmount();
      const saleData = {
        customerId: data.customerId,
        totalAmount: totalAmount.toString(),
        discountAmount: "0",
        finalAmount: totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        notes: data.notes || "",
      };

      createDirectSaleMutation.mutate({ sale: saleData, items: saleItems });
    }
  };

  const filteredSales = sales.filter(sale =>
    (sale.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
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
          <Dialog open={isNewSaleDialogOpen} onOpenChange={setIsNewSaleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nova Venda</DialogTitle>
              </DialogHeader>
              <Form {...newSaleForm}>
                <form onSubmit={newSaleForm.handleSubmit(onNewSaleSubmit)} className="space-y-6">
                  {/* Tipo de Venda */}
                  <FormField
                    control={newSaleForm.control}
                    name="saleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Venda</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "direct") {
                            setSaleItems([]);
                            setSelectedQuote(null);
                            newSaleForm.setValue('quoteId', undefined);
                          }
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de venda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="direct">Venda Direta</SelectItem>
                            <SelectItem value="from_quote">Converter Orçamento</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seleção de Orçamento (quando tipo = from_quote) */}
                  {newSaleForm.watch("saleType") === "from_quote" && (
                    <FormField
                      control={newSaleForm.control}
                      name="quoteId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orçamento</FormLabel>
                          <Select onValueChange={(value) => {
                            const quoteId = parseInt(value);
                            field.onChange(quoteId);
                            loadQuoteData(quoteId);
                          }} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um orçamento pendente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {quotes.map((quote) => (
                                <SelectItem key={quote.id} value={quote.id.toString()}>
                                  #{quote.quoteNumber} - {quote.customer.fullName} - R$ {parseFloat(quote.finalAmount).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Cliente (para vendas diretas ou automaticamente preenchido para orçamentos) */}
                  <FormField
                    control={newSaleForm.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                          disabled={Boolean(newSaleForm.watch("saleType") === "from_quote" && selectedQuote)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.fullName} - {customer.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Itens da Venda (somente para vendas diretas) */}
                  {newSaleForm.watch("saleType") === "direct" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Itens da Venda</h3>
                        <Button type="button" onClick={addSaleItem} variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Item
                        </Button>
                      </div>
                      
                      {saleItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                          <div className="col-span-4">
                            <label className="text-sm font-medium">Produto</label>
                            <Select 
                              onValueChange={(value) => updateSaleItem(index, 'productId', parseInt(value))}
                              value={item.productId.toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - R$ {parseFloat(product.salePrice).toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Quantidade</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Preço Unit.</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateSaleItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Total</label>
                            <Input
                              type="text"
                              value={`R$ ${item.totalPrice.toFixed(2)}`}
                              disabled
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeSaleItem(index)}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {saleItems.length > 0 && (
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            Total da Venda: R$ {getTotalAmount().toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resumo do Orçamento (quando convertendo) */}
                  {newSaleForm.watch("saleType") === "from_quote" && selectedQuote && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <h3 className="text-lg font-semibold">Resumo do Orçamento #{selectedQuote.quoteNumber}</h3>
                      <div className="space-y-2">
                        {selectedQuote.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span>{item.product.name} x {item.quantity}</span>
                            <span>R$ {parseFloat(item.totalPrice).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>R$ {parseFloat(selectedQuote.finalAmount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informações de Pagamento */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={newSaleForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Dinheiro</SelectItem>
                              <SelectItem value="card">Cartão</SelectItem>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="installment">Crediário</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newSaleForm.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status do Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="completed">Pago</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="partial">Parcial</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {newSaleForm.watch("paymentMethod") === "installment" && (
                      <FormField
                        control={newSaleForm.control}
                        name="installments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parcelas</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Quantidade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}x
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Observações */}
                  <FormField
                    control={newSaleForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações sobre a venda..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsNewSaleDialogOpen(false);
                      newSaleForm.reset();
                      setSaleItems([]);
                      setSelectedQuote(null);
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createDirectSaleMutation.isPending || convertQuoteToSaleMutation.isPending}>
                      {(createDirectSaleMutation.isPending || convertQuoteToSaleMutation.isPending) ? "Processando..." : "Registrar Venda"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
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
                      Cliente: {sale.customer?.fullName || "Cliente não identificado"}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSale(sale)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
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
                                <p>{selectedSale.customer?.fullName || "Nome não disponível"}</p>
                                <p>{selectedSale.customer?.email || "Email não disponível"}</p>
                                <p>{selectedSale.customer?.phone || "Telefone não disponível"}</p>
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
                                {selectedSale.items?.length ? (
                                  selectedSale.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                      <div>
                                        <p className="font-medium">{item.product?.name || 'Produto não encontrado'}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Quantidade: {item.quantity} x R$ {parseFloat(item.unitPrice).toFixed(2)}
                                        </p>
                                      </div>
                                      <p className="font-semibold">R$ {parseFloat(item.totalPrice).toFixed(2)}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500 text-center py-4">Nenhum item encontrado</p>
                                )}
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

        {/* Edit Sale Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Venda #{selectedSale?.saleNumber}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="card">Cartão</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="installment">Crediário</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Input placeholder="Observações sobre a venda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={editSaleMutation.isPending}>
                    {editSaleMutation.isPending ? "Salvando..." : "Salvar Alterações"}
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
