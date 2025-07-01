import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ProductForm } from "@/components/products/product-form";
import { BarcodeGenerator } from "@/components/ui/barcode-generator";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Product, type ProductCategory } from "@shared/schema";
import { 
  Plus, 
  Edit, 
  AlertTriangle, 
  Package, 
  BarChart3, 
  QrCode,
  Eye,
  MoreHorizontal,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ProductWithCategory = Product & { category?: ProductCategory };

export default function Products() {
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [viewCodesProduct, setViewCodesProduct] = useState<Product | undefined>();
  const [deleteProduct, setDeleteProduct] = useState<Product | undefined>();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
  });

  const { data: lowStockProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/dashboard/low-stock"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/low-stock"] });
      toast({
        title: "Produto removido",
        description: "Produto removido com sucesso.",
      });
      setDeleteProduct(undefined);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openCreateForm = () => {
    setSelectedProduct(undefined);
    setFormMode("create");
    setProductFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setSelectedProduct(product);
    setFormMode("edit");
    setProductFormOpen(true);
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity <= 0) {
      return { label: "Sem estoque", variant: "destructive" as const };
    }
    if (product.stockQuantity <= product.minStockLevel) {
      return { label: "Estoque baixo", variant: "secondary" as const };
    }
    return { label: "Em estoque", variant: "default" as const };
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Sem categoria";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Categoria não encontrada";
  };

  const columns: ColumnDef<ProductWithCategory>[] = [
    {
      accessorKey: "name",
      header: "Produto",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div>
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">
              {product.brand && `${product.brand} - `}
              {product.model && product.model}
              {product.color && ` • ${product.color}`}
              {product.size && ` • ${product.size}`}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("sku")}</div>
      ),
    },
    {
      accessorKey: "categoryId",
      header: "Categoria",
      cell: ({ row }) => {
        const categoryId = row.getValue("categoryId") as number | null;
        return (
          <Badge variant="outline">
            {getCategoryName(categoryId)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "salePrice",
      header: "Preço",
      cell: ({ row }) => {
        const price = row.getValue("salePrice") as string;
        return <div className="font-medium">{formatCurrency(price)}</div>;
      },
    },
    {
      accessorKey: "stockQuantity",
      header: "Estoque",
      cell: ({ row }) => {
        const product = row.original;
        const status = getStockStatus(product);
        return (
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-sm text-muted-foreground">
              {product.stockQuantity} unid.
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openEditForm(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewCodesProduct(product)}>
                <QrCode className="mr-2 h-4 w-4" />
                Ver códigos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteProduct(product)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <AppLayout title="Produtos & Estoque" subtitle="Gerencie seus produtos e controle de estoque">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-semibold">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categorias</p>
                <p className="text-2xl font-semibold">{categories.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-semibold text-red-600">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(
                    products.reduce((total, product) => {
                      return total + (parseFloat(product.salePrice) * product.stockQuantity);
                    }, 0)
                  )}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Produtos</CardTitle>
            <Button onClick={openCreateForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              searchColumn="name"
              searchPlaceholder="Buscar produtos..."
            />
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        product={selectedProduct}
        mode={formMode}
      />

      {/* View Codes Dialog */}
      <Dialog open={!!viewCodesProduct} onOpenChange={() => setViewCodesProduct(undefined)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Códigos do Produto</DialogTitle>
            <DialogDescription>
              Códigos de barras e QR Code para: {viewCodesProduct?.name}
            </DialogDescription>
          </DialogHeader>
          {viewCodesProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BarcodeGenerator 
                value={viewCodesProduct.sku} 
                type="barcode" 
                title="Código de Barras - SKU" 
              />
              <BarcodeGenerator 
                value={viewCodesProduct.sku} 
                type="qrcode" 
                title="QR Code - SKU" 
              />
              {viewCodesProduct.barcode && (
                <>
                  <BarcodeGenerator 
                    value={viewCodesProduct.barcode} 
                    type="barcode" 
                    title="Código de Barras - Produto" 
                  />
                  <BarcodeGenerator 
                    value={viewCodesProduct.barcode} 
                    type="qrcode" 
                    title="QR Code - Produto" 
                  />
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o produto "{deleteProduct?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
