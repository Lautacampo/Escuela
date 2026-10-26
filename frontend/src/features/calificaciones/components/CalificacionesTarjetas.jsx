import { Link } from "react-router";

export function CalificacionesTarjetas({ modulo, esDocente }) {
  return (
    <div className="modulo">
      <div className="modulo-header">
        <h3>{modulo.nombre}</h3>
      </div>
      {esDocente && modulo.materias?.length > 0 && (
        <p className="modulo-materias">
          <span>Materias:</span> {modulo.materias.join(", ")}
        </p>
      )}
      <h5>Divisiones :</h5>
      <div className="divisiones">
        {modulo.divisiones.map((division) => (
          <Link
            key={division}
            className="divisionbtn"
            to={`/gestion/calificaciones/${modulo.id}/${division}`}
          >
            {esDocente ? `División ${division}` : division}
          </Link>
        ))}
      </div>
    </div>
  );
}
