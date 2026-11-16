const CLASES ={
  aprobado:"estado-ap",
  desaprobado:"estado-de",
  en_curso:"estado-cur",
};

export function CalificacionesAlumnos({
  alumnos,
  materias,
  notas,
  moduloId,
  division,
  onCambiar,
}) {
  return (
    <>
      <div className="contenedor-tabla">
        <div className="tabla-responsive">
          <table
            className="tabla-gestion"
            aria-label={`Calificaciones del módulo ${moduloId}, división ${division}`}
          >
            <thead>
              <tr>
                <th scope="col">Alumno</th>
                {materias.map((m) => (
                  <th key={m.id} scope="col">{m.nombre}</th>
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
                    <td data-label="Alumno" className="calificacion-alumno">
                      {a.apellido}, {a.nombre}
                    </td>
                    {materias.map((m) => {
                      const nota = notas[`${a.id}-${m.id}`];
                      const estado = nota?.estado ?? "en_curso";

                      return (
                        <td key={m.id} data-label={m.nombre}>
                          <select
                            className={`select-estado ${CLASES[estado]}`}
                            aria-label={`${m.nombre}: ${a.apellido}, ${a.nombre}`}
                            value={estado}
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
