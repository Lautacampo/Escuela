import { Link } from "react-router";
export function CalificacionesTarjetas({ modulo }) {
  return (
    <div className="modulo">
      <h3>{modulo.nombre}</h3>
      <div className="divisiones">
        {modulo.divisiones.map((division) => (
          <Link
            key={division}
            className="divisionbtn"
            to={`/gestion/calificaciones/${modulo.id}/${division}`}
          >
            {division}
          </Link>
        ))}
      </div>
    </div>
  );
}
