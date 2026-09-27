import { Outlet } from "react-router";
import "../../features/gestion/components/gestion.css";
import NavabarGestion from "./NavabarGestion";
import NavBarGestionLateral from "./NavBarGestionLateral";

export default function LayoutPrivado() {
  return (
    <div className="contenedor-dashboard">
      <NavBarGestionLateral />

      <div className="contenido-principal">
        <NavabarGestion />

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
