import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Eye, FileText, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Quote, Customer, QuoteItem, Product } from "@shared/schema";

interface QuoteWithDetails extends Quote {
  customer: Customer;
  items: (QuoteItem & { product: Product })[];
}

export default function QuotesPage() {
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithDetails | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quotes = [], isLoading } = useQuery<QuoteWithDetails[]>({
    queryKey: ["/api/quotes"],
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/quotes/${id}`, "DELETE"),
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
    mutationFn: (id: number) => apiRequest(`/api/quotes/${id}/convert-to-sale`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
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
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
        <Link to="/quotes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {quotes.map((quote) => (
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
                        onClick={() => setSelectedQuote(quote)}
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
                              {selectedQuote.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                  <div>
                                    <p className="font-medium">{item.product.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Quantidade: {item.quantity}
                                    </p>
                                  </div>
                                  <p className="font-semibold">R$ {parseFloat(item.unitPrice).toFixed(2)}</p>
                                </div>
                              ))}
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

                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4" />
                  </Button>

                  {quote.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => convertToSaleMutation.mutate(quote.id)}
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

        {quotes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum orçamento encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comece criando seu primeiro orçamento.
              </p>
              <Link to="/quotes/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Orçamento
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}