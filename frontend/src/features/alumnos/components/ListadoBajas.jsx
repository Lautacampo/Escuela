import { useState } from "react";
import { useNavigate } from "react-router";
import { formatearDNI } from "../../../shared/utils/formato";

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Alumnos dados de baja (baja lógica). No figuran en el padrón ni en las
 * planillas, pero conservan su historial: desde acá se los puede reactivar.
 */
export function ListadoBajas({ bajas, onReactivar, reactivando }) {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");

  const palabras = normalizar(busqueda).split(/\s+/);
  const visibles = bajas.filter((alumno) => {
    const texto = normalizar(
      `${alumno.apellido} ${alumno.nombre} ${alumno.dni}`,
    );
    return palabras.every((palabra) => texto.includes(palabra));
  });

  return (
    <div className="contenedor-tabla">
      <div className="cabecera-tabla">
        <div>
          <h2>Alumnos dados de baja</h2>
          <span className="cantidad-resultados">
            {visibles.length} alumno{visibles.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="barra-filtros">
        <div className="form-group form-group-buscador">
          <label htmlFor="baja-busqueda">Buscar</label>
          <input
            id="baja-busqueda"
            type="search"
            placeholder="Nombre, apellido o DNI"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-gestion"
          />
        </div>
      </div>

      <div className="tabla-responsive">
        <table className="tabla-gestion">
          <thead>
            <tr>
              <th>Apellido y Nombre</th>
              <th>DNI</th>
              <th>Plan de estudios</th>
              <th>Último módulo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {visibles.map((alumno) => {
              const ultima = alumno.trayectoria?.at(-1);
              return (
                <tr key={alumno.id} className="fila-inactiva">
                  <td>
                    <strong>
                      {alumno.apellido}, {alumno.nombre}
                    </strong>
                  </td>
                  <td>{formatearDNI(alumno.dni)}</td>
                  <td>{alumno.planEstudio?.titulo ?? "Sin asignar"}</td>
                  <td>{ultima?.modulo ?? "Sin matrícula"}</td>
                  <td>
                    <span className="etiqueta-situacion inactivo">
                      Dado de baja
                    </span>
                  </td>
                  <td>
                    <div className="acciones-tabla">
                      <button
                        type="button"
                        className="btn-accion btn-reactivar"
                        onClick={() => onReactivar(alumno)}
                        disabled={reactivando === alumno.id}
                        aria-label={`Reactivar a ${alumno.nombre} ${alumno.apellido}`}
                      >
                        <i className="fa-solid fa-user-check" aria-hidden="true"></i>
                        <span>Reactivar</span>
                      </button>
                      <button
                        type="button"
                        className="btn-accion btn-ficha"
                        onClick={() => navigate(`/gestion/alumnos/${alumno.id}`)}
                        aria-label={`Ver ficha de ${alumno.nombre} ${alumno.apellido}`}
                      >
                        <i className="fa-solid fa-id-card" aria-hidden="true"></i>
                        <span>Ver ficha</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="sin-resultados">
                  {bajas.length === 0
                    ? "No hay alumnos dados de baja."
                    : "No se encontraron alumnos con esa búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
