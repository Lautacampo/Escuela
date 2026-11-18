const CLASES ={
  aprobado:"estado-ap",
  desaprobado:"estado-de",
  en_curso:"estado-cur",
};

const MOTIVO_LIBRE = {
  INASISTENCIAS: "superó las 25 inasistencias",
  MATERIA_DESAPROBADA: "materia desaprobada",
  INSTANCIAS_AGOTADAS: "agotó las 4 instancias",
};

export function CalificacionesAlumnos({
  alumnos,
  materias,
  notas,
  onCambiar,
}) {
  return (
    <>
      <div className="contenedor-tabla">
        <div className="tabla-responsive">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>Alumno</th>
                {materias.map((m) => (
                  <th key={m.id}>{m.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alumnos.length === 0 ? (
                <tr>
                  <td colSpan={materias.length + 1}>
                    No hay alumnos en esta división.
                  </td>
                </tr>
              ) : (
                alumnos.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.apellido}, {a.nombre}
                      {a.estadoAcademico === "APROBADO" && (
                        <span className="etiqueta-situacion aprobado">
                          Módulo aprobado
                        </span>
                      )}
                      {a.condicion === "LIBRE" && (
                        <>
                          <span className="etiqueta-situacion libre">
                            Libre
                          </span>
                          <span className="motivo-libre">
                            Debe recursar el módulo
                            {MOTIVO_LIBRE[a.motivoLibre]
                              ? `: ${MOTIVO_LIBRE[a.motivoLibre]}`
                              : ""}
                          </span>
                        </>
                      )}
                    </td>
                    {materias.map((m) => {
                      const nota = notas[`${a.id}-${m.id}`];
                      const estado = nota?.estado ?? "en_curso";

                      return (
                        <td key={m.id} data-label={m.nombre}>
                          <select
                            aria-label={`${m.nombre} de ${a.apellido}, ${a.nombre}`}
                            className={`select-estado ${CLASES[estado]}`}
                            value={estado}
                            // Un módulo aprobado ya no admite cambios de nota.
                            disabled={a.estadoAcademico === "APROBADO"}
                            onChange={(e) => onCambiar(a.id, m.id, e.target.value)}
                          >
                            {(!nota || estado === "en_curso") && (
                              <option value="en_curso" disabled>
                                En curso
                              </option>
                            )}
                            <option value="aprobado">Aprobado</option>
                            <option value="desaprobado">Desaprobado</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    
    </>
  );
}
