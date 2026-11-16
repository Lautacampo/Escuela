export function AsistenciaAlumnos({
  alumnos,
  fecha,
  onCambiarFecha,
  registrosDia,
  totales,
  limite,
  guardando = false,
  onCambiar,
}) {
  return (
    <>
      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <div className="controles-asistencia">
            <label>
              <span>Fecha de asistencia</span>
              <input
                type="date"
                disabled={guardando}
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
                  const valorFalta = Number(registro?.valorFalta ?? 0);
                  const libre = a.condicion === "Libre";

                  return (
                    <tr key={a.id} className={libre ? "fila-libre" : ""}>
                      <td>{i + 1}</td>
                      <td>
                        {a.apellido}, {a.nombre}
                      </td>
                      <td>{a.dni}</td>
                      <td>
                        <div
                          className="asistencia-opciones"
                          role="group"
                          aria-label={`Asistencia de ${a.apellido}, ${a.nombre}`}
                        >
                          <span className="asistencia-estado-dia">
                            {valorFalta === 0
                              ? "Presente"
                              : valorFalta === 0.5
                                ? "Media falta"
                                : "Falta"}
                          </span>
                          <label className="asistencia-opcion">
                            <input
                              type="checkbox"
                              checked={valorFalta === 0.5}
                              disabled={guardando}
                              onChange={(e) =>
                                onCambiar(a.id, e.target.checked ? 0.5 : 0)
                              }
                            />
                            Media falta (0,5)
                          </label>
                          <label className="asistencia-opcion">
                            <input
                              type="checkbox"
                              checked={valorFalta === 1}
                              disabled={guardando}
                              onChange={(e) =>
                                onCambiar(a.id, e.target.checked ? 1 : 0)
                              }
                            />
                            Falta (1)
                          </label>
                        </div>
                      </td>
                      <td>
                        {total} / {limite}
                      </td>
                      <td>
                        <span className={libre ? "estado-dp" : "estado-ap"}>
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
