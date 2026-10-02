import { useEffect, useState } from "react";
import { getModulos } from "../services/CalificacionesServices";
import { CalificacionesTarjetas } from "../components/CalificacionesTarjetas";
import "../components/calificacionestarjetas.css";

export function CalificacionesPage() {
  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const datos = await getModulos();
        setModulos(datos);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) return <p>Cargando módulos...</p>;
  if (error) return <p role="alert">No se pudieron cargar los módulos: {error}</p>;

  const grupos = [
    { titulo: "Primer Año", clase: "primer-anio", modulos: modulos.filter((m) => Number(m.id) <= 2) },
    { titulo: "Segundo Año", clase: "segundo-anio", modulos: modulos.filter((m) => Number(m.id) >= 3 && Number(m.id) <= 4) },
    { titulo: "Tercer Año", clase: "tercer-anio", modulos: modulos.filter((m) => Number(m.id) >= 5 && Number(m.id) <= 6) },
  ];

  return (
    <section className="pagina-calificaciones-modulos">
      <h2>Calificaciones</h2>
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className={`anio-grupo ${grupo.clase}`}>
            <h3 className="anio-titulo">{grupo.titulo}</h3>
            <div className="modulosdivision">
              {grupo.modulos.map((modulo) => (
                <CalificacionesTarjetas key={modulo.id} modulo={modulo} />
              ))}
            </div>
        </div>
      ))}
    </section>
  );
}
