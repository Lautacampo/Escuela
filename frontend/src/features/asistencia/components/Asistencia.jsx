import React from "react";

export function Asistencia() {
  return (
    <>
      <h1>Registro de Asistencia</h1>
      <p style={{ marginBottom: "20px", color: "var(--gestion-texto)" }}>
        En esta sección los preceptores podrán registrar y consultar la
        asistencia de los estudiantes, realizar el seguimiento de faltas y
        consultar condición académica.
      </p>

      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <h2>Asistencia - Primer Año</h2>
        </div>

        <div className="tabla-responsive">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>DNI</th>
                <th>Curso</th>
                <th>Asistencia</th>
                <th>Faltas acumuladas</th>
                <th>Condición</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Juan Pérez</td>
                <td>40123456</td>
                <td>1° Año</td>
                <td>
                  <span className="estado-ap">Presente</span>
                </td>
                <td>4</td>
                <td>Regular</td>
              </tr>
              <tr>
                <td>María González</td>
                <td>38987654</td>
                <td>1° Año</td>
                <td>
                  <span className="estado-dp">Ausente</span>
                </td>
                <td>12</td>
                <td>Regular</td>
              </tr>
              <tr>
                <td>Carlos López</td>
                <td>41567890</td>
                <td>1° Año</td>
                <td>
                  <span className="estado-dp">Ausente</span>
                </td>
                <td>24</td>
                <td>Regular</td>
              </tr>
              <tr>
                <td>Laura Rodríguez</td>
                <td>37543210</td>
                <td>1° Año</td>
                <td>
                  <span className="estado-dp">Ausente</span>
                </td>
                <td>25</td>
                <td>
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    Libre
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
