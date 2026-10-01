import { Link } from "react-router";

export function CalificacionesTarjetas({ modulo }) {
  const anio =
    Number(modulo.id) <= 2
      ? "Primer Año"
      : Number(modulo.id) <= 4
        ? "Segundo Año"
        : "Tercer Año";

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
