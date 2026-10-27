import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-base">
      <Sidebar />
      <div className="ml-60 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
