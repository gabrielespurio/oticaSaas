import { AppLayout } from "@/components/layout/app-layout";
import ReceiptsTab from "./receipts";

export default function ReceiptsPage() {
  return (
    <AppLayout title="Recebimentos">
      <ReceiptsTab />
    </AppLayout>
  );
}