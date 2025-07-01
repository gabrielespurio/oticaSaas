import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Customers() {
  return (
    <AppLayout title="Clientes" subtitle="Gerencie seus clientes e pacientes">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo de clientes em desenvolvimento...</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
