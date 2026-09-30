import React from "react";
import { useForm } from "../../../shared/hooks/useForm";
import { ListadoAsistencias } from "./ListadoAsistencias";

export function Asistencia() {
  const { valores, manejarCambio, resetearFormulario } = useForm({
    curso: "",
    division: "",
    fecha: new Date().toISOString().split("T")[0], // Arranca con la fecha de hoy por defecto
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`¡Planilla de asistencia del ${valores.fecha} guardada con éxito!`);
    resetearFormulario();
  };

  return (
    <>
      <h1>Gestión de Asistencia</h1>

      {/* 1. Módulo visual del historial */}
      <ListadoAsistencias />

      {/* 2. Módulo de carga masiva */}
      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <h2>Tomar Asistencia Diaria</h2>
        </div>

        <form onSubmit={handleSubmit} className="form-gestion">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha">Fecha:</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={valores.fecha}
                onChange={manejarCambio}
                required
                className="input-gestion"
              />
            </div>
            <div className="form-group">
              <label htmlFor="curso">Curso:</label>
              <select
                id="curso"
                name="curso"
                value={valores.curso}
                onChange={manejarCambio}
                required
                className="input-gestion"
              >
                <option value="">Seleccione un curso</option>
                <option value="1">1° Año</option>
                <option value="2">2° Año</option>
                <option value="3">3° Año</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="division">División:</label>
              <select
                id="division"
                name="division"
                value={valores.division}
                onChange={manejarCambio}
                required
                className="input-gestion"
              >
                <option value="">Seleccione</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>
          </div>

          {/* La tabla de alumnos solo aparece cuando el preceptor elige el curso y división */}
          {valores.curso && valores.division && (
            <div
              className="tabla-responsive"
              style={{
                marginTop: "20px",
                borderTop: "1px solid #edf2f7",
                paddingTop: "20px",
              }}
            >
              <table className="tabla-gestion">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th style={{ textAlign: "center" }}>Presente</th>
                    <th style={{ textAlign: "center" }}>Ausente</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pérez, Juan</td>
                    <td style={{ textAlign: "center" }}>
                      <input type="radio" name="asist_1" defaultChecked />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input type="radio" name="asist_1" />
                    </td>
                  </tr>
                  <tr>
                    <td>González, María</td>
                    <td style={{ textAlign: "center" }}>
                      <input type="radio" name="asist_2" defaultChecked />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input type="radio" name="asist_2" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="acciones-formulario" style={{ marginTop: "20px" }}>
            <button type="submit" className="btn-primario-gestion">
              Guardar Planilla
            </button>
            <button
              type="button"
              onClick={resetearFormulario}
              className="btn-secundario"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
