import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Customers from "@/pages/customers";
import Sales from "@/pages/sales";
import Financial from "@/pages/financial";
import Appointments from "@/pages/appointments";
import Prescriptions from "@/pages/prescriptions";
import Reports from "@/pages/reports";
import Quotes from "@/pages/quotes";
import ReceivablesPage from "@/pages/financial/receivables";
import AccountsPayablePage from "@/pages/accounts-payable";
import PurchasesPage from "@/pages/purchases";
import PurchaseOrdersPage from "@/pages/purchases/orders";
import ReceiptsPage from "@/pages/purchases/receipts-page";
import SuppliersPage from "@/pages/purchases/suppliers-page";
import PurchaseReportsPage from "@/pages/purchases/reports-page";


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/products">
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      </Route>
      <Route path="/sales">
        <ProtectedRoute>
          <Sales />
        </ProtectedRoute>
      </Route>

      <Route path="/purchases">
        <ProtectedRoute>
          <PurchasesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/purchases/orders">
        <ProtectedRoute>
          <PurchaseOrdersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/purchases/receipts">
        <ProtectedRoute>
          <ReceiptsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/purchases/suppliers">
        <ProtectedRoute>
          <SuppliersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/purchases/reports">
        <ProtectedRoute>
          <PurchaseReportsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/financial">
        <ProtectedRoute>
          <Financial />
        </ProtectedRoute>
      </Route>
      <Route path="/financial/receivables">
        <ProtectedRoute>
          <ReceivablesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/appointments">
        <ProtectedRoute>
          <Appointments />
        </ProtectedRoute>
      </Route>
      <Route path="/prescriptions">
        <ProtectedRoute>
          <Prescriptions />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/quotes">
        <ProtectedRoute>
          <Quotes />
        </ProtectedRoute>
      </Route>
      <Route path="/accounts-payable">
        <ProtectedRoute>
          <AccountsPayablePage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="optica-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
