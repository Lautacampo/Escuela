export function AsistenciaAlumnos ({alumnos,moduloId,division}){
    return (
    <>
      <div className="contenedor-tabla">
        <div className="tabla-responsive">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>N°</th>
                <th>Alumno</th>
                <th>DNI</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.length === 0 ? (
                <tr>
                  <td colSpan={3}>No hay alumnos en esta división.</td>
                </tr>
              ) : (
                alumnos.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td>{a.apellido}, {a.nombre}</td>
                    <td>{a.dni}</td>
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