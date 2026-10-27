import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TicketsPage } from "./pages/TicketsPage";
import { NewTicketPage } from "./pages/NewTicketPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketQueryPage } from "./pages/TicketQueryPage";
import { TechnicianPanelPage } from "./pages/TechnicianPanelPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
<<<<<<< HEAD
import { UsersPage } from "./pages/UsersPage";
=======
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2

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
<<<<<<< HEAD
            <Route path="/usuarios" element={<UsersPage />} />
=======
            <Route path="/usuarios" element={<ComingSoonPage title="Gestão de usuários" />} />
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
            <Route path="/tecnicos" element={<ComingSoonPage title="Técnicos" />} />
            <Route path="/categorias" element={<ComingSoonPage title="Categorias" />} />
            <Route path="/relatorios" element={<ComingSoonPage title="Relatórios" />} />
            <Route path="/configuracoes" element={<ComingSoonPage title="Configurações" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
