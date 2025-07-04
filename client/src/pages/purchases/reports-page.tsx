import { AppLayout } from "@/components/layout/app-layout";
import PurchaseReportsTab from "./reports";

export default function PurchaseReportsPage() {
  return (
    <AppLayout title="Relatórios de Compras">
      <PurchaseReportsTab />
    </AppLayout>
  );
}