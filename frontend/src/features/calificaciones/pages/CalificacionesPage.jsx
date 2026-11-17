import { useEffect, useState } from "react";
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
  const { usuario } = useSesion();
  const esDocente = usuario?.rol === "docente";
  // Se trabaja siempre sobre el ciclo lectivo vigente (no se elige en pantalla).
  const [anioVigente, setAnioVigente] = useState("");
  const [anios, setAnios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const respuesta = await getCiclosCalificaciones();
        const vigente =
          respuesta?.cicloActivo?.anio ?? respuesta?.ciclos?.[0]?.anio ?? "";
        const modulos = vigente ? await getModulos(vigente) : [];
        if (activo) {
          setAnioVigente(String(vigente));
          setAnios(modulos);
        }
      } catch (e) {
        if (activo) setError(e.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  if (cargando) return <p>Cargando calificaciones...</p>;
  if (error)
    return (
      <p role="alert">No se pudieron cargar las calificaciones: {error}</p>
    );

  return (
    <section
      className={`pagina-calificaciones-modulos${esDocente ? " pagina-calificaciones-modulos--docente" : ""}`}
    >
      <div className="calif-ciclo-encabezado">
        <h2>Calificaciones</h2>
      </div>
      {!anioVigente && <p>No hay ciclos lectivos registrados.</p>}
      {anioVigente && anios.length === 0 && (
        <p>No hay cursos y módulos habilitados para calificar.</p>
      )}
      {anios.map((grupo) => {
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
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
