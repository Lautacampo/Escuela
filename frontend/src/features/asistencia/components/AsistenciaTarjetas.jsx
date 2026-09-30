import { Link } from "react-router";

export function AsistenciaTarjetas({ modulo }) {
  return (
    <div className="modulotarjeta">
      <h3>{modulo.nombre}</h3>
      <div className="divisiones">
        {modulo.divisiones.map((division) => (
          <Link
            key={division}
            className="division-btn"
            to={`/gestion/asistencia/${modulo.id}/${division}`}
          >
            {division}
          </Link>
        ))}
      </div>
    </div>
  );
}