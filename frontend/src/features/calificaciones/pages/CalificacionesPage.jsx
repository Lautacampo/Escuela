import { useEffect, useState } from "react";
import { getSesion } from "../../auth/services/authServices";
import { getModulos } from "../services/CalificacionesServices";
import { CalificacionesTarjetas } from "../components/CalificacionesTarjetas";
import "../components/calificacionestarjetas.css";

const ANIOS = {
  1: { titulo: "Primer Año", clase: "primer-anio" },
  2: { titulo: "Segundo Año", clase: "segundo-anio" },
  3: { titulo: "Tercer Año", clase: "tercer-anio" },
};


export function CalificacionesPage() {
  const esDocente = getSesion()?.rol === "docente";
  const [anios, setAnios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    getModulos()
      .then((datos) => activo && setAnios(datos))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  if (cargando) return <p>Cargando módulos...</p>;
  if (error) return <p role="alert">No se pudieron cargar los módulos: {error}</p>;

  return (
    <section
      className={`pagina-calificaciones-modulos${esDocente ? " pagina-calificaciones-modulos--docente" : ""}`}
    >
      <h2>Calificaciones</h2>
      {anios.length === 0 && <p>No tienes módulos asignados.</p>}
      {anios.map((grupo) => {
        const info = ANIOS[grupo.anio] ?? { titulo: `Año ${grupo.anio}`, clase: "" };
        return (
          <div key={grupo.anio} className={`anio-grupo ${info.clase}`}>
            <h3 className="anio-titulo">{info.titulo}</h3>
            <div className="modulosdivision">
              {grupo.modulos.map((modulo) => (
                <CalificacionesTarjetas
                  key={modulo.id}
                  modulo={modulo}
                  esDocente={esDocente}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}