import { Link } from "react-router";
import "./sinpermiso.css";

export function SinpermisoPage() {
  return (
    <section className="sin-permiso" aria-labelledby="sin-permiso-titulo">
      <div className="sin-permiso__tarjeta">
        <div className="sin-permiso__icono" aria-hidden="true">
          <i className="fa-solid fa-lock"></i>
        </div>

        <p className="sin-permiso__etiqueta">Acceso restringido</p>
        <h1 id="sin-permiso-titulo">No tenés permiso para entrar</h1>
        <p className="sin-permiso__descripcion">
          Tu perfil no cuenta con acceso a esta sección. Podés volver al inicio
          de gestión y continuar desde allí.
        </p>

        <Link to="/gestion" className="sin-permiso__boton">
          Volver a Inicio
        </Link>
      </div>
    </section>
  );
}