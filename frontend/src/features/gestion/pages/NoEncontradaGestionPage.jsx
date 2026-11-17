import { Link } from "react-router";
import "../../auth/pages/sinpermiso.css";

export function NoEncontradaGestionPage() {
  return (
    <section className="sin-permiso" aria-labelledby="gestion-404-titulo">
      <div className="sin-permiso__tarjeta">
        <div className="sin-permiso__icono" aria-hidden="true">
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>

        <p className="sin-permiso__etiqueta">Error 404</p>
        <h1 id="gestion-404-titulo">Ruta de gestión no encontrada</h1>
        <p className="sin-permiso__descripcion">
          La dirección que buscás no existe o fue movida. Tu sesión sigue
          activa; podés volver al inicio de gestión.
        </p>

        <Link to="/gestion" className="sin-permiso__boton">
          Volver a Inicio
        </Link>
      </div>
    </section>
  );
}
