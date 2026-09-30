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
      <h1>Gestión de Calificaciones</h1>
      <p style={{ marginBottom: "20px", color: "var(--gestion-texto)" }}>
        Módulo {moduloId} - División {division}
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
                    <td>{a.apellido}, {a.nombre}</td>
                    {materias.map((m) => {
                      const nota = notas[`${a.id}-${m.id}`];
                      const estado = nota?.estado ?? "en_curso";

                      return (
                        <td key={m.id}>
                          <select
                            className={`select-estado ${CLASES[estado]}`}
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
