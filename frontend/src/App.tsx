import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleGuard } from "./routes/RoleGuard";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TicketsPage } from "./pages/TicketsPage";
import { NewTicketPage } from "./pages/NewTicketPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketQueryPage } from "./pages/TicketQueryPage";
import { TechnicianPanelPage } from "./pages/TechnicianPanelPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { UsersPage } from "./pages/UsersPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { KnowledgePage } from "./pages/KnowledgePage";

// Usuários clientes (USER) não têm Dashboard: a rota "/" mostra direto os
// chamados que eles abriram. Admin e técnico continuam vendo o Dashboard.
function HomePage() {
  const { user } = useAuth();
  if (user?.role === "USER") return <TicketQueryPage />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/chamados" element={<TicketsPage />} />
            <Route path="/chamados/novo" element={<NewTicketPage />} />
            <Route path="/chamados/:id" element={<TicketDetailPage />} />
            <Route path="/consultar-chamados" element={<TicketQueryPage />} />
            <Route path="/painel-tecnico" element={<TechnicianPanelPage />} />
            <Route
              path="/usuarios"
              element={
                <RoleGuard roles={["ADMIN", "ANALISTA"]}>
                  <UsersPage />
                </RoleGuard>
              }
            />
            <Route
              path="/base-conhecimento"
              element={
                <RoleGuard roles={["ADMIN", "ANALISTA", "TECHNICIAN"]}>
                  <KnowledgePage />
                </RoleGuard>
              }
            />
            <Route path="/tecnicos" element={<ComingSoonPage title="Técnicos" />} />
            <Route
              path="/categorias"
              element={
                <RoleGuard roles={["ADMIN"]}>
                  <CategoriesPage />
                </RoleGuard>
              }
            />
            <Route
              path="/relatorios"
              element={
                <RoleGuard roles={["ADMIN"]}>
                  <ReportsPage />
                </RoleGuard>
              }
            />
            <Route path="/configuracoes" element={<ComingSoonPage title="Configurações" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
