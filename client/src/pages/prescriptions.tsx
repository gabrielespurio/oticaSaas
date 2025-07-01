import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Prescriptions() {
  return (
    <AppLayout title="Prescrições" subtitle="Gerencie prescrições e exames oftalmológicos">
      <Card>
        <CardHeader>
          <CardTitle>Prescrições e Exames</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo de prescrições em desenvolvimento...</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
