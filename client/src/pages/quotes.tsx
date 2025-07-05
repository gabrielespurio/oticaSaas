import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, FileText, ShoppingCart, Trash2, Search, Minus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/layout/app-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Quote, Customer, QuoteItem as SchemaQuoteItem, Product } from "@shared/schema";

interface QuoteWithDetails extends Quote {
  customer: Customer;
  items: (SchemaQuoteItem & { product: Product })[];
}

// Schema para criação de orçamento
const quoteFormSchema = z.object({
  customerId: z.number({ required_error: "Selecione um cliente" }),
  validUntil: z.string().min(1, "Data de validade é obrigatória"),
  notes: z.string().optional(),
});

// Schema para conversão em venda
const saleConversionSchema = z.object({
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  paymentStatus: z.string().default("completed"),
  installments: z.number().min(1).max(12).optional().default(1),
});

interface QuoteFormData {
  customerId: number;
  validUntil: string;
  notes?: string;
}

interface SaleConversionData {
  paymentMethod: string;
  paymentStatus: string;
  installments?: number;
}

interface QuoteItemForm {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function QuotesPage() {
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithDetails | null>(null);
  const [isNewQuoteDialogOpen, setIsNewQuoteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [quoteToConvert, setQuoteToConvert] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItemForm[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Queries
  const { data: quotes = [], isLoading } = useQuery<QuoteWithDetails[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Forms
  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      notes: "",
    },
  });

  const paymentForm = useForm<SaleConversionData>({
    resolver: zodResolver(saleConversionSchema),
    defaultValues: {
      paymentMethod: "",
      paymentStatus: "completed",
      installments: 1,
    },
  });

  // Function to fetch quote details with items
  const fetchQuoteDetails = async (quoteId: number): Promise<QuoteWithDetails> => {
    return apiRequest("GET", `/api/quotes/${quoteId}`);
  };

  // Function to handle viewing quote details
  const handleViewQuote = async (quote: QuoteWithDetails) => {
    try {
      const quoteDetails = await fetchQuoteDetails(quote.id);
      setSelectedQuote(quoteDetails);
    } catch (error) {
      console.error("Error fetching quote details:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do orçamento.",
        variant: "destructive",
      });
    }
  };

  // Mutations
  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData & { items: QuoteItemForm[] }) => {
      const { items, ...quote } = data;
      
      // Calcular total amount
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      const payload = {
        quote: {
          ...quote,
          totalAmount: totalAmount.toString(),
        },
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        }))
      };
      
      return apiRequest("POST", "/api/quotes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Orçamento criado",
        description: "O orçamento foi criado com sucesso.",
      });
      setIsNewQuoteDialogOpen(false);
      form.reset();
      setQuoteItems([]);
    },
    onError: (error: any) => {
      console.error("Erro ao criar orçamento:", error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao criar orçamento.",
        variant: "destructive",
      });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/quotes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir orçamento.",
        variant: "destructive",
      });
    },
  });

  const convertToSaleMutation = useMutation({
    mutationFn: ({ id, paymentData }: { id: number; paymentData: SaleConversionData }) => 
      apiRequest("POST", `/api/quotes/${id}/convert-to-sale`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setIsPaymentDialogOpen(false);
      setQuoteToConvert(null);
      paymentForm.reset();
      toast({
        title: "Venda criada",
        description: "O orçamento foi convertido para venda com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao converter orçamento para venda.",
        variant: "destructive",
      });
    },
  });

  const downloadPDFMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/quotes/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orcamento-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "PDF gerado",
        description: "O PDF do orçamento foi baixado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do orçamento.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const addQuoteItem = () => {
    setQuoteItems([...quoteItems, { productId: 0, quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const getTotalAmount = () => {
    return quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const removeQuoteItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const handleConvertToSale = (quoteId: number) => {
    setQuoteToConvert(quoteId);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = (data: SaleConversionData) => {
    if (quoteToConvert) {
      convertToSaleMutation.mutate({ id: quoteToConvert, paymentData: data });
    }
  };

  const updateQuoteItem = (index: number, field: keyof QuoteItemForm, value: number) => {
    const updatedItems = [...quoteItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Se selecionou um produto, preencher o preço automaticamente
    if (field === 'productId') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItems[index].unitPrice = parseFloat(selectedProduct.salePrice);
      }
    }
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'productId') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setQuoteItems(updatedItems);
  };

  const onSubmit = (data: QuoteFormData) => {
    if (quoteItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto ao orçamento.",
        variant: "destructive",
      });
      return;
    }

    // Validar se todos os produtos estão selecionados
    const invalidItems = quoteItems.filter(item => 
      !item.productId || item.quantity <= 0 || item.unitPrice <= 0
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos dos produtos corretamente.",
        variant: "destructive",
      });
      return;
    }

    createQuoteMutation.mutate({ ...data, items: quoteItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "converted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      case "converted":
        return "Convertido em Venda";
      default:
        return status;
    }
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.id.toString().includes(searchTerm)
  );

  const totalAmount = quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (isLoading) {
    return (
      <AppLayout title="Orçamentos" subtitle="Gerencie orçamentos e propostas">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
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
    <AppLayout title="Orçamentos" subtitle="Gerencie orçamentos e propostas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
          <Dialog open={isNewQuoteDialogOpen} onOpenChange={setIsNewQuoteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Orçamento</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
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
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Válido até</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Produtos</h3>
                      <Button type="button" onClick={addQuoteItem} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Produto
                      </Button>
                    </div>

                    {quoteItems.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Preço Unit.</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quoteItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Select onValueChange={(value) => updateQuoteItem(index, 'productId', Number(value))}>
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
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuoteItem(index, 'quantity', Number(e.target.value))}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateQuoteItem(index, 'unitPrice', Number(e.target.value))}
                                />
                              </TableCell>
                              <TableCell>
                                R$ {item.totalPrice.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeQuoteItem(index)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    {quoteItems.length > 0 && getTotalAmount() > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total:</span>
                          <span>R$ {getTotalAmount().toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Observações sobre o orçamento..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewQuoteDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createQuoteMutation.isPending}
                    >
                      {createQuoteMutation.isPending ? "Criando..." : "Criar Orçamento"}
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
              placeholder="Buscar por cliente ou número do orçamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Orçamento #{quote.id}
                      </h3>
                      <Badge className={getStatusColor(quote.status)}>
                        {getStatusText(quote.status)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Cliente: {quote.customer.fullName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Data: {format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Validade: {format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      Total: R$ {parseFloat(quote.totalAmount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQuote(quote)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Orçamento #{selectedQuote?.id}</DialogTitle>
                        </DialogHeader>
                        {selectedQuote && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Cliente</h4>
                                <p>{selectedQuote.customer.fullName}</p>
                                <p>{selectedQuote.customer.email}</p>
                                <p>{selectedQuote.customer.phone}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Informações</h4>
                                <p>Status: {getStatusText(selectedQuote.status)}</p>
                                <p>Data: {format(new Date(selectedQuote.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                                <p>Válido até: {format(new Date(selectedQuote.validUntil), "dd/MM/yyyy", { locale: ptBR })}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Itens</h4>
                              <div className="space-y-2">
                                {selectedQuote.items && selectedQuote.items.length > 0 ? (
                                  selectedQuote.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                                      <div>
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Quantidade: {item.quantity}
                                        </p>
                                      </div>
                                      <p className="font-semibold">R$ {parseFloat(item.unitPrice.toString()).toFixed(2)}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400">Nenhum item encontrado</p>
                                )}
                              </div>
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-lg font-semibold text-right">
                                  Total: R$ {parseFloat(selectedQuote.totalAmount).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            {selectedQuote.notes && (
                              <div>
                                <h4 className="font-semibold mb-2">Observações</h4>
                                <p className="text-gray-600 dark:text-gray-400">{selectedQuote.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadPDFMutation.mutate(quote.id)}
                      disabled={downloadPDFMutation.isPending}
                      title="Baixar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    {quote.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleConvertToSale(quote.id)}
                        disabled={convertToSaleMutation.isPending}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteQuoteMutation.mutate(quote.id)}
                            disabled={deleteQuoteMutation.isPending}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredQuotes.length === 0 && searchTerm && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum orçamento encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tente ajustar os termos de busca.
                </p>
              </CardContent>
            </Card>
          )}

          {quotes.length === 0 && !searchTerm && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum orçamento encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece criando seu primeiro orçamento.
                </p>
                <Button onClick={() => setIsNewQuoteDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Orçamento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Method Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Converter para Venda</DialogTitle>
            </DialogHeader>
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
                <FormField
                  control={paymentForm.control}
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
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                          <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="crediario">Crediário</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
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

                {(paymentForm.watch("paymentMethod") === "cartao_credito" || paymentForm.watch("paymentMethod") === "crediario") && (
                  <FormField
                    control={paymentForm.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Parcelas</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o número de parcelas" />
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

                {/* Resumo do parcelamento */}
                {(paymentForm.watch("paymentMethod") === "cartao_credito" || paymentForm.watch("paymentMethod") === "crediario") && 
                 paymentForm.watch("installments") && quoteToConvert && (
                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium text-blue-900 dark:text-blue-100">
                        {(() => {
                          const quote = quotes.find(q => q.id === quoteToConvert);
                          const installments = paymentForm.watch("installments") || 1;
                          const totalValue = quote ? parseFloat(quote.finalAmount) : 0;
                          const installmentValue = totalValue > 0 ? (totalValue / installments).toFixed(2) : "0,00";
                          return `${installments}x de R$ ${installmentValue}`;
                        })()}
                      </div>
                      <div className="text-blue-700 dark:text-blue-300">
                        Total: R$ {(() => {
                          const quote = quotes.find(q => q.id === quoteToConvert);
                          return quote ? parseFloat(quote.finalAmount).toFixed(2) : "0,00";
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={convertToSaleMutation.isPending}>
                    {convertToSaleMutation.isPending ? "Convertendo..." : "Converter para Venda"}
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