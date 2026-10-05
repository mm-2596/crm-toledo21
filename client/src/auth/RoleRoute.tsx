import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Alquileres y equipo del día: administradores y Administración. */
export function RentalsRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role === "AGENT") return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Compraventa: Administración queda fuera, solo gestiona alquileres. */
export function SalesRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "ADMINISTRACION") return <Navigate to="/alquileres" replace />;
  return <Outlet />;
}
