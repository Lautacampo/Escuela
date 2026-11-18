import { useEffect, useState } from "react";
import { getModulos } from "../services/asistenciaServices";
import { AsistenciaTarjetas } from "../components/AsistenciaTarjetas";
import "../components/asistenciaTarjetas.css";

const ANIOS = [
  { anio: 1, titulo: "Primer Año" },
  { anio: 2, titulo: "Segundo Año" },
  { anio: 3, titulo: "Tercer Año" },
];

export function AsistenciaPage() {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    getModulos()
      .then((datos) => {
        if (!Array.isArray(datos)) {
          throw new Error(
            "El servidor devolvió un formato de módulos inesperado.",
          );
        }
        if (activo) setGrupos(datos);
      })
      .catch((e) => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  if (cargando) return <p>Cargando módulos y divisiones...</p>;
  if (error)
    return <p role="alert">No se pudo cargar la asistencia: {error}</p>;

  const gruposConAsignaciones = new Map(
    grupos
      .filter(
        (grupo) =>
          Array.isArray(grupo.modulos) &&
          grupo.modulos.some(
            (modulo) =>
              Array.isArray(modulo.divisiones) && modulo.divisiones.length > 0,
          ),
      )
      .map((grupo) => [Number(grupo.anio), grupo]),
  );

  return (
    <section className="pagina-asistencia-modulos">
      <h2>Asistencia</h2>
      {ANIOS.filter(({ anio }) => gruposConAsignaciones.has(anio)).map(
        ({ anio, titulo }) => {
          const grupo = gruposConAsignaciones.get(anio);
          const modulos = grupo.modulos.filter(
            (modulo) =>
              Array.isArray(modulo.divisiones) && modulo.divisiones.length > 0,
          );
          return (
            <div key={anio} className="anio-grupo">
              <h3 className="anio-titulo">{titulo}</h3>
              <div className="modulosdivision">
                {modulos.map((modulo) => (
                  <AsistenciaTarjetas key={modulo.moduloId} modulo={modulo} />
                ))}
              </div>
            </div>
          );
        },
      )}
    </section>
  );
}
