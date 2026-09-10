import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Contacts } from "./pages/Contacts";
import { ContactDetail } from "./pages/ContactDetail";
import { Properties } from "./pages/Properties";
import { PropertyDetail } from "./pages/PropertyDetail";
import { Pipeline } from "./pages/Pipeline";
import { Tasks } from "./pages/Tasks";
import { Help } from "./pages/Help";
import { Team } from "./pages/Team";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AdminRoute } from "./auth/AdminRoute";

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="registro" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contactos" element={<Contacts />} />
          <Route path="contactos/:id" element={<ContactDetail />} />
          <Route path="propiedades" element={<Properties />} />
          <Route path="propiedades/:id" element={<PropertyDetail />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="tareas" element={<Tasks />} />
          <Route path="ayuda" element={<Help />} />
          <Route element={<AdminRoute />}>
            <Route path="equipo" element={<Team />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
