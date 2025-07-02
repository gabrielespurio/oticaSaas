import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Customer, Product, InsertSale } from "@shared/schema";

const saleFormSchema = z.object({
  customerId: z.number().min(1, "Selecione um cliente"),
  paymentMethod: z.string().min(1, "Selecione a forma de pagamento"),
  discountAmount: z.number().min(0).optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

interface SaleItem {
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
}

export default function SaleFormPage() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerId: 0,
      paymentMethod: "",
      discountAmount: 0,
    },
  });

  // Buscar clientes
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", customerSearch],
    enabled: customerSearchOpen && customerSearch.length > 0,
  });

  // Buscar produtos
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", productSearch],
    enabled: productSearchOpen && productSearch.length > 0,
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: { sale: InsertSale; items: any[] }) => {
      return apiRequest("/api/sales", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Venda registrada",
        description: "A venda foi registrada com sucesso.",
      });
      setLocation("/sales");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar venda.",
        variant: "destructive",
      });
    },
  });

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = form.watch("discountAmount") || 0;
  const finalAmount = subtotal - discountAmount;

  const addItem = (product: Product) => {
    const existingItem = items.find(item => item.productId === product.id);
    if (existingItem) {
      setItems(items.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: parseFloat(product.salePrice),
      }]);
    }
    setProductSearchOpen(false);
    setProductSearch("");
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(items.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const updateItemPrice = (productId: number, unitPrice: number) => {
    setItems(items.map(item =>
      item.productId === productId
        ? { ...item, unitPrice }
        : item
    ));
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setValue("customerId", customer.id);
    setCustomerSearchOpen(false);
    setCustomerSearch("");
  };

  const onSubmit = (data: SaleFormData) => {
    if (items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à venda.",
        variant: "destructive",
      });
      return;
    }

    const sale: InsertSale = {
      customerId: data.customerId,
      userId: 1, // TODO: Get from auth context
      saleNumber: `VEN${Date.now()}`,
      totalAmount: subtotal.toString(),
      discountAmount: discountAmount.toString(),
      finalAmount: finalAmount.toString(),
      paymentMethod: data.paymentMethod,
      paymentStatus: "paid",
      status: "active",
    };

    const saleItems = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: (item.quantity * item.unitPrice).toString(),
    }));

    createSaleMutation.mutate({ sale, items: saleItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/sales")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova Venda</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Seleção de Cliente */}
                <div className="space-y-2">
                  <FormLabel>Cliente</FormLabel>
                  <div className="flex gap-2">
                    {selectedCustomer ? (
                      <div className="flex-1 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                        <p className="font-medium">{selectedCustomer.fullName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.phone}</p>
                      </div>
                    ) : (
                      <div className="flex-1 p-3 border rounded-md border-dashed">
                        <p className="text-gray-500 dark:text-gray-400">Nenhum cliente selecionado</p>
                      </div>
                    )}
                    <Dialog open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline">
                          <Search className="w-4 h-4 mr-2" />
                          Buscar Cliente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Selecionar Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Digite o nome do cliente..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                          />
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {customers.map((customer) => (
                              <Button
                                key={customer.id}
                                variant="outline"
                                className="w-full justify-start h-auto p-3"
                                onClick={() => selectCustomer(customer)}
                              >
                                <div className="text-left">
                                  <p className="font-medium">{customer.fullName}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>
                                </div>
                              </Button>
                            ))}
                            {customerSearch.length > 0 && customers.length === 0 && (
                              <p className="text-center text-gray-500 py-4">Nenhum cliente encontrado</p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {form.formState.errors.customerId && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.customerId.message}
                    </p>
                  )}
                </div>

                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={subtotal}
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total:</span>
                <span>R$ {finalAmount.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={createSaleMutation.isPending || items.length === 0 || !selectedCustomer}
              className="w-full"
            >
              {createSaleMutation.isPending ? "Registrando..." : "Registrar Venda"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Itens da Venda</CardTitle>
            <Dialog open={productSearchOpen} onOpenChange={setProductSearchOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Selecionar Produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Digite o nome do produto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {products.map((product) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        className="w-full justify-between h-auto p-3"
                        onClick={() => addItem(product)}
                      >
                        <div className="text-left">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            SKU: {product.sku} | Estoque: {product.stockQuantity}
                          </p>
                        </div>
                        <p className="font-semibold">R$ {parseFloat(product.salePrice).toFixed(2)}</p>
                      </Button>
                    ))}
                    {productSearch.length > 0 && products.length === 0 && (
                      <p className="text-center text-gray-500 py-4">Nenhum produto encontrado</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Nenhum item adicionado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {item.product.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                    <span className="text-sm text-gray-500">x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                      className="w-24 text-center"
                    />
                  </div>
                  <div className="font-semibold min-w-[80px] text-right">
                    R$ {(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}