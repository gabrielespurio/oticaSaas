import { AppLayout } from "@/components/layout/app-layout";
import SuppliersTab from "./suppliers";

export default function SuppliersPage() {
  return (
    <AppLayout title="Fornecedores">
      <SuppliersTab />
    </AppLayout>
  );
}