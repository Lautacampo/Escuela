import { Link } from "react-router";

export function CalificacionesTarjetas({ modulo }) {
  return (
    <div className="modulo">
      <div className="modulo-header">
        <h3>{modulo.nombre}</h3>
      </div>
      <h5>Divisiones :</h5>
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
