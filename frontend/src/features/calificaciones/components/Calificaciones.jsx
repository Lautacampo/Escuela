import React from "react";

export function Calificaciones() {
  return (
    <>
      <h1>Gestión de Calificaciones</h1>
      <p style={{ marginBottom: "20px", color: "var(--gestion-texto)" }}>
        En esta sección los docentes podrán consultar y registrar las
        calificaciones correspondientes a los módulos cursados por los alumnos.
      </p>

      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <h2>Listado de Calificaciones de Módulos</h2>
        </div>

        <div className="tabla-responsive">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Año</th>
                <th>Módulo</th>
                <th>Nota en números</th>
                <th>Nota en letras</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Juan Pérez</td>
                <td>1° Año</td>
                <td>Módulo I</td>
                <td>8</td>
                <td>Ocho</td>
                <td>12/2026</td>
                <td>
                  <span className="estado-ap">Aprobado</span>
                </td>
              </tr>
              <tr>
                <td>Juan Pérez</td>
                <td>1° Año</td>
                <td>Módulo II</td>
                <td>7</td>
                <td>Siete</td>
                <td>12/2026</td>
                <td>
                  <span className="estado-ap">Aprobado</span>
                </td>
              </tr>
              <tr>
                <td>María González</td>
                <td>2° Año</td>
                <td>Módulo III</td>
                <td>9</td>
                <td>Nueve</td>
                <td>12/2026</td>
                <td>
                  <span className="estado-ap">Aprobado</span>
                </td>
              </tr>
              <tr>
                <td>María González</td>
                <td>2° Año</td>
                <td>Módulo IV</td>
                <td>8</td>
                <td>Ocho</td>
                <td>12/2026</td>
                <td>
                  <span className="estado-ap">Aprobado</span>
                </td>
              </tr>
              <tr>
                <td>Carlos López</td>
                <td>3° Año</td>
                <td>Módulo V</td>
                <td>7</td>
                <td>Siete</td>
                <td>12/2026</td>
                <td>
                  <span className="estado-ap">Aprobado</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
