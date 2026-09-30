import { useEffect, useState } from "react";
import { getModulos } from "../services/calificacionesServices";
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

  return (
    <section className="pagina-calificaciones-modulos">
      <h2>Calificaciones</h2>
      <div className="modulosdivision">
        {modulos.map((modulo) => (
          <CalificacionesTarjetas key={modulo.id} modulo={modulo} />
        ))}
      </div>
    </section>
  );
}
