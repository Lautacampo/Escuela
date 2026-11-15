import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { getSesion } from "../../auth/services/authServices";
import {
  getModulos,
  getCiclosCalificaciones,
} from "../services/CalificacionesServices";
import { useSesion } from "../../auth/context/SesionContext";
import { CalificacionesTarjetas } from "../components/CalificacionesTarjetas";
import "../components/calificacionestarjetas.css";

const ANIOS = {
  1: { titulo: "Primer Año", clase: "primer-anio" },
  2: { titulo: "Segundo Año", clase: "segundo-anio" },
  3: { titulo: "Tercer Año", clase: "tercer-anio" },
};

export function CalificacionesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const anioSeleccionado = searchParams.get("anio") ?? "";
  const [ciclos, setCiclos] = useState([]);
  const { usuario } = useSesion();
  const esDocente = usuario?.rol === "docente";
  const [anios, setAnios] = useState([]);
  const [anioCargado, setAnioCargado] = useState("");
  const [cargandoCiclos, setCargandoCiclos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    getCiclosCalificaciones()
      .then((respuesta) => {
        if (!activo) return;
        const disponibles = respuesta?.ciclos ?? [];
        setCiclos(disponibles);
        const solicitado = new URLSearchParams(window.location.search).get(
          "anio",
        );
        const valido = disponibles.some((c) => String(c.anio) === solicitado);
        const elegido = valido
          ? solicitado
          : String(respuesta?.cicloActivo?.anio ?? disponibles[0]?.anio ?? "");
        if (elegido) setSearchParams({ anio: elegido }, { replace: true });
      })
      .catch((e) => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setCargandoCiclos(false);
      });
    return () => {
      activo = false;
    };
  }, [setSearchParams]);

  useEffect(() => {
    if (!anioSeleccionado) return;
    let activo = true;
    setCargando(true);
    setError(null);
    setAnios([]);
    setAnioCargado("");
    getModulos(anioSeleccionado)
      .then((datos) => {
        if (activo) {
          setAnios(datos);
          setAnioCargado(anioSeleccionado);
        }
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
  }, [anioSeleccionado]);

  if (cargandoCiclos) return <p>Cargando ciclos lectivos...</p>;
  if (error)
    return (
      <p role="alert">No se pudieron cargar las calificaciones: {error}</p>
    );
  const mostrandoCiclo = !cargando && anioCargado === anioSeleccionado;

  return (
    <section
      className={`pagina-calificaciones-modulos${esDocente ? " pagina-calificaciones-modulos--docente" : ""}`}
    >
      <div className="calif-ciclo-encabezado">
        <h2>Calificaciones</h2>
        <div className="calif-ciclo-selector">
          <label htmlFor="calif-ciclo">Ciclo lectivo</label>
          <select
            id="calif-ciclo"
            value={anioSeleccionado}
            onChange={(e) => setSearchParams({ anio: e.target.value })}
          >
            {ciclos.map((ciclo) => (
              <option key={ciclo.id} value={ciclo.anio}>
                {ciclo.anio}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!mostrandoCiclo && anioSeleccionado && (
        <p role="status">Cargando el ciclo lectivo {anioSeleccionado}...</p>
      )}
      {!cargando && !anioSeleccionado && (
        <p>No hay ciclos lectivos registrados.</p>
      )}
      {mostrandoCiclo && anioSeleccionado && anios.length === 0 && (
        <p>
          No hay cursos y módulos habilitados para el ciclo {anioSeleccionado}.
          Para comenzar a calificar en este ciclo, deben crearse sus cursos y
          matricularse estudiantes.
        </p>
      )}
      {mostrandoCiclo &&
        anios.map((grupo) => {
          const info = ANIOS[grupo.anio] ?? {
            titulo: `Año ${grupo.anio}`,
            clase: "",
          };
          return (
            <div key={grupo.anio} className={`anio-grupo ${info.clase}`}>
              <h3 className="anio-titulo">{info.titulo}</h3>
              <div className="modulosdivision">
                {grupo.modulos.map((modulo) => (
                  <CalificacionesTarjetas
                    key={modulo.id}
                    modulo={modulo}
                    esDocente={esDocente}
                    anio={anioSeleccionado}
                  />
                ))}
              </div>
            </div>
          );
        })}
    </section>
  );
}
