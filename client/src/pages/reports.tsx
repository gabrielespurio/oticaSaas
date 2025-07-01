import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  return (
    <AppLayout title="Relatórios" subtitle="Relatórios e análises do negócio">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo de relatórios em desenvolvimento...</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
