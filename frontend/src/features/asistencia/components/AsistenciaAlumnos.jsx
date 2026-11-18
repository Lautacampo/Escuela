// Fecha local de hoy en AAAA-MM-DD: no se carga asistencia de días futuros.
const fechaDeHoy = () => {
  const hoy = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
};

const MOTIVO_LIBRE = {
  INASISTENCIAS: "superó las 25 inasistencias",
  MATERIA_DESAPROBADA: "materia desaprobada",
  INSTANCIAS_AGOTADAS: "agotó las 4 instancias",
};

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
                max={fechaDeHoy()}
                onChange={(e) => onCambiarFecha(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="tabla-responsive">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th scope="col">N°</th>
                <th scope="col">Alumno</th>
                <th scope="col">DNI</th>
                <th scope="col">Asistencia del día</th>
                <th scope="col">Faltas acumuladas</th>
                <th scope="col">Situación</th>
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
                  const libre = a.condicion === "Libre";
                  const valorFalta = Number(registro?.valorFalta ?? 0);

                  return (
                    <tr key={a.id} className={libre ? "fila-libre" : ""}>
                      <td data-label="N°">{i + 1}</td>
                      <td data-label="Alumno">
                        {a.apellido}, {a.nombre}
                      </td>
                      <td data-label="DNI">{a.dni}</td>
                      <td data-label="Asistencia del día">
                        <div
                          className="asistencia-opciones"
                          role="group"
                          aria-label={`Asistencia de ${a.apellido}, ${a.nombre}`}
                        >
                          {/* Sin registro en esa fecha la asistencia todavía
                              no se tomó: no se muestra como "Presente". */}
                          <span
                            className={`asistencia-estado-dia${registro ? "" : " sin-cargar"}`}
                          >
                            {!registro
                              ? "Sin cargar"
                              : valorFalta === 0
                                ? "Presente"
                                : valorFalta === 0.5
                                  ? "Media falta"
                                  : "Falta completa"}
                          </span>
                          <label className="asistencia-opcion">
                            <input
                              type="checkbox"
                              checked={Boolean(registro) && valorFalta === 0}
                              disabled={guardando}
                              onChange={(e) => {
                                if (e.target.checked) onCambiar(a.id, 0);
                              }}
                            />
                            Presente
                          </label>
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
                            Falta completa (1)
                          </label>
                        </div>
                      </td>
                      <td data-label="Faltas acumuladas">
                        {total} / {limite}
                      </td>
                      <td data-label="Situación">
                        <span className={libre ? "estado-dp" : "estado-ap"}>
                          {libre ? "Libre" : "Regular"}
                        </span>
                        {libre && MOTIVO_LIBRE[a.motivoLibre] && (
                          <span className="motivo-libre">
                            {MOTIVO_LIBRE[a.motivoLibre]}
                          </span>
                        )}
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
