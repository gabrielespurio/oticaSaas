import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Sales() {
  return (
    <AppLayout title="Vendas & Orçamentos" subtitle="Gerencie vendas e orçamentos">
      <Card>
        <CardHeader>
          <CardTitle>Vendas e Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo de vendas em desenvolvimento...</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
