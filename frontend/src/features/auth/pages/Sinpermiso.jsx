import { Link } from "react-router";

export function SinpermisoPage() {
  return (
    <div className="text-center py-5">
      <h2>Sin acceso</h2>
      <p>Tu perfil no tiene permiso para ver esta sección.</p>
      <Link to="/gestion" className="btn btn-primary">
        Volver al inicio de Gestion
      </Link>
    </div>
  );
}