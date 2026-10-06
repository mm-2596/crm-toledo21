import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Contacts } from "./pages/Contacts";
import { ContactDetail } from "./pages/ContactDetail";
import { Properties } from "./pages/Properties";
import { PropertyDetail } from "./pages/PropertyDetail";
import { Pipeline } from "./pages/Pipeline";
import { Visits } from "./pages/Visits";
import { Tasks } from "./pages/Tasks";
import { Help } from "./pages/Help";
import { Team } from "./pages/Team";
import { Greetings } from "./pages/Greetings";
import { Campaigns } from "./pages/Campaigns";
import { BuildingsMap } from "./pages/BuildingsMap";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AdminRoute } from "./auth/AdminRoute";
import { RentalsRoute, SalesRoute } from "./auth/RoleRoute";
import { Rentals } from "./pages/Rentals";
import { RentalDetail } from "./pages/RentalDetail";
import { TeamOverview } from "./pages/TeamOverview";

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
          <Route path="visitas" element={<Visits />} />
          <Route element={<SalesRoute />}>
            <Route path="pipeline" element={<Pipeline />} />
          </Route>
          <Route path="mapa" element={<BuildingsMap />} />
          <Route path="tareas" element={<Tasks />} />
          <Route element={<RentalsRoute />}>
            <Route path="alquileres" element={<Rentals />} />
            <Route path="alquileres/:id" element={<RentalDetail />} />
            <Route path="mi-equipo" element={<TeamOverview />} />
          </Route>
          <Route path="ayuda" element={<Help />} />
          <Route path="perfil" element={<Profile />} />
          <Route element={<AdminRoute />}>
            <Route path="campanas" element={<Campaigns />} />
            <Route path="felicitaciones" element={<Greetings />} />
            <Route path="equipo" element={<Team />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
