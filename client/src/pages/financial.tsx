import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Financial() {
  return (
    <AppLayout title="Financeiro" subtitle="Controle financeiro e contas">
      <Card>
        <CardHeader>
          <CardTitle>Controle Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo financeiro em desenvolvimento...</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
