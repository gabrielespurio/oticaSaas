import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Appointments() {
  return (
    <AppLayout title="Agendamentos" subtitle="Gerencie agendamentos e consultas">
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo de agendamentos em desenvolvimento...</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
