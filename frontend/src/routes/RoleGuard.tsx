import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { RoleName } from "../types";

// Impede que um perfil abra, pela URL, telas que não fazem parte das suas permissões.
export function RoleGuard({ roles, children }: { roles: RoleName[]; children: JSX.Element }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
