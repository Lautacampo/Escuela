import { Link } from "react-router";

export function AsistenciaTarjetas({ modulo }) {
  return (
    <div className="modulotarjeta">
      <div className="modulo-header">
        <h3>{modulo.nombre}</h3>
      </div>
      <h5>Divisiones:</h5>
      <div className="divisiones">
        {modulo.divisiones?.length ? (
          modulo.divisiones.map((division) => (
            <Link
              key={division}
              className="division-btn"
              to={`/gestion/asistencia/${modulo.moduloId}/${encodeURIComponent(division)}`}
            >
              {division}
            </Link>
          ))
        ) : (
          <p>No hay divisiones asignadas.</p>
        )}
      </div>
    </div>
  );
}
