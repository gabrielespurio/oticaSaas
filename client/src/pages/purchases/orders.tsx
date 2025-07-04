import { AppLayout } from "@/components/layout/app-layout";
import PurchaseOrdersTab from "./purchase-orders";

export default function PurchaseOrdersPage() {
  return (
    <AppLayout title="Pedidos de Compra">
      <PurchaseOrdersTab />
    </AppLayout>
  );
}