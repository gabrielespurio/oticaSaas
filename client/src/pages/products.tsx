import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Products() {
  return (
    <AppLayout title="Produtos & Estoque" subtitle="Gerencie seus produtos e controle de estoque">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo de produtos em desenvolvimento...</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
