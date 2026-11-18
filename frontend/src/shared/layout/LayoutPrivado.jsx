import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import NavbarGestion from "./NavbarGestion";
import NavBarGestionLateral from "./NavbarGestionLateral";

import "../../features/gestion/components/gestion.css";

export default function LayoutPrivado() {
  // El estado del menú vive acá porque lo usan las dos barras: el botón
  // hamburguesa está en la barra superior y el menú es la barra lateral.
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
  const alternarMenu = useCallback(() => setMenuAbierto((abierto) => !abierto), []);

  // Con el menú abierto: Escape lo cierra y la página de fondo no se desplaza.
  useEffect(() => {
    if (!menuAbierto) return undefined;

    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") cerrarMenu();
    };
    const overflowAnterior = document.body.style.overflow;

    document.addEventListener("keydown", alPresionarTecla);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowAnterior;
    };
  }, [menuAbierto, cerrarMenu]);

  // Si la pantalla pasa a tamaño escritorio, el menú móvil deja de tener sentido.
  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 769px)");
    const alCambiar = (evento) => {
      if (evento.matches) cerrarMenu();
    };
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, [cerrarMenu]);

  return (
    <div className="contenedor-dashboard">
      {/* Menú lateral (en celular se despliega debajo de la barra superior) */}
      <NavBarGestionLateral menuAbierto={menuAbierto} onCerrar={cerrarMenu} />

      {/* Barra superior y contenido de cada página */}
      <div className="contenido-principal">
        <NavbarGestion menuAbierto={menuAbierto} onAlternarMenu={alternarMenu} />

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
