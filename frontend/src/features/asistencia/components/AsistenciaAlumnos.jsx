export function AsistenciaAlumnos ({alumnos,fecha,onCambiarFecha,registrosDia,totales,limite,onCambiar}){
    return (
    <>
      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <div className="controles-asistencia">
            <label>
              <span>Fecha de asistencia</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => onCambiarFecha(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="tabla-responsive">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>N°</th>
                <th>Alumno</th>
                <th>DNI</th>
                <th>Asistencia del día</th>
                <th>Faltas acumuladas</th>
                <th>Situación</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.length === 0 ? (
                <tr>
                  <td colSpan={6}>No hay alumnos en esta división.</td>
                </tr>
              ) : (
                alumnos.map((a, i) => {
                  const registro = registrosDia[a.id];
                  const total = totales[a.id] ?? 0;
                  const libre = total > limite;

                  return (
                    <tr key={a.id} className={libre ? "fila-libre" : ""}>
                      <td>{i + 1}</td>
                      <td>{a.apellido}, {a.nombre}</td>
                      <td>{a.dni}</td>
                      <td>
                        <select
                          value={registro ? String(registro.falta) : ""}
                          onChange={(e) => onCambiar(a.id, e.target.value)}
                        >
                          {!registro && (
                            <option value="" disabled>
                              Sin cargar
                            </option>
                          )}
                          <option value="0">Presente</option>
                          <option value="0.5">Media falta</option>
                          <option value="1">Falta</option>
                        </select>
                      </td>
                      <td>{total} / {limite}</td>
                      <td>
                        <span className={libre ? "estado-des" : "estado-ap"}>
                          {libre ? "Libre" : "Regular"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );


}