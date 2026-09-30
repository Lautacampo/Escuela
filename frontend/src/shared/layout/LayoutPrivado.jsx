import { Outlet } from "react-router";
import NavbarGestion from "./NavbarGestion";
import NavBarGestionLateral from "./NavbarGestionLateral";

import "../../features/gestion/components/gestion.css";

export default function LayoutPrivado() {
  return (
    <div className="contenedor-dashboard">
      {/* Menú lateral */}
      <NavBarGestionLateral />

      {/* Barra superior y contenido de cada página */}
      <div className="contenido-principal">
        <NavbarGestion />

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
