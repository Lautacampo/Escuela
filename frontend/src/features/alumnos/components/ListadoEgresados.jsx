import { useState } from "react";
import { useNavigate } from "react-router";
import { formatearDNI } from "../../../shared/utils/formato";

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatearFecha(fecha) {
  if (!fecha) return "-";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

/**
 * Listado de solo lectura de los alumnos egresados: sin editar ni dar de
 * baja. Desde acá solo se consulta la ficha con la trayectoria finalizada.
 */
export function ListadoEgresados({ egresados }) {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");

  const palabras = normalizar(busqueda).split(/\s+/);
  const visibles = egresados.filter((alumno) => {
    const texto = normalizar(
      `${alumno.apellido} ${alumno.nombre} ${alumno.dni}`,
    );
    return palabras.every((palabra) => texto.includes(palabra));
  });

  return (
    <div className="contenedor-tabla">
      <div className="cabecera-tabla">
        <div>
          <h2>Alumnos egresados</h2>
          <span className="cantidad-resultados">
            {visibles.length} egresado{visibles.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="barra-filtros">
        <div className="form-group form-group-buscador">
          <label htmlFor="egresado-busqueda">Buscar</label>
          <input
            id="egresado-busqueda"
            type="search"
            placeholder="Nombre, apellido o DNI"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-gestion"
          />
        </div>
      </div>

      <div className="tabla-responsive">
        <table className="tabla-gestion tabla-tarjetas">
          <thead>
            <tr>
              <th>Apellido y Nombre</th>
              <th>DNI</th>
              <th>Plan de estudios</th>
              <th>Módulos acreditados</th>
              <th>Fecha de egreso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {visibles.map((alumno) => (
              <tr key={alumno.id}>
                <td data-label="Apellido y nombre">
                  <strong>
                    {alumno.apellido}, {alumno.nombre}
                  </strong>
                </td>
                <td data-label="DNI">{formatearDNI(alumno.dni)}</td>
                <td data-label="Plan de estudios">{alumno.planEstudio?.titulo ?? "-"}</td>
                <td data-label="Módulos acreditados">{alumno.modulosAcreditados?.length ?? 6} de 6</td>
                <td data-label="Fecha de egreso">{formatearFecha(alumno.fechaEgreso)}</td>
                <td data-label="Estado">
                  <span className="condicion-egresado">Egresado</span>
                </td>
                <td data-label="Acciones">
                  <div className="acciones-tabla">
                    <button
                      type="button"
                      className="btn-accion btn-ficha"
                      onClick={() => navigate(`/gestion/alumnos/${alumno.id}`)}
                      aria-label={`Ver ficha de ${alumno.nombre} ${alumno.apellido}`}
                    >
                      <i className="fa-solid fa-id-card" aria-hidden="true"></i>
                      <span>Ver trayectoria</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="sin-resultados">
                  {egresados.length === 0
                    ? "Todavía no hay alumnos egresados."
                    : "No se encontraron egresados con esa búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
