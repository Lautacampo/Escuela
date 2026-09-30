function normalizar(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function ListadoAsistencias({
  alumnos,
  filtros,
  estados,
  onCambiarFiltro,
  onEditar,
}) {
  const palabras = normalizar(filtros.busqueda).split(/\s+/);

  const alumnosFiltrados = filtros.fecha
    ? alumnos.filter((alumno) => {
        const coincideCurso = !filtros.curso || alumno.curso === filtros.curso;

        const coincideDivision =
          !filtros.division || alumno.division === filtros.division;

        const datos = normalizar(
          `${alumno.apellido} ${alumno.nombre} ${alumno.dni}`,
        );

        const coincideBusqueda = palabras.every((palabra) =>
          datos.includes(palabra),
        );

        return coincideCurso && coincideDivision && coincideBusqueda;
      })
    : [];

  return (
    <div className="contenedor-tabla">
      <div className="cabecera-tabla">
        <div>
          <h2>Listado de Asistencias</h2>
          <span className="cantidad-resultados">
            {alumnosFiltrados.length} alumno
            {alumnosFiltrados.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="barra-filtros asistencia-filtros">
        <div className="form-group">
          <label htmlFor="asistencia-filtro-fecha">Fecha</label>
          <input
            id="asistencia-filtro-fecha"
            name="fecha"
            type="date"
            className="input-gestion"
            value={filtros.fecha}
            onChange={onCambiarFiltro}
          />
        </div>

        <div className="form-group">
          <label htmlFor="asistencia-filtro-curso">Curso</label>
          <select
            id="asistencia-filtro-curso"
            name="curso"
            className="input-gestion"
            value={filtros.curso}
            onChange={onCambiarFiltro}
          >
            <option value="">Todos los cursos</option>
            <option value="1">1° Año</option>
            <option value="2">2° Año</option>
            <option value="3">3° Año</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="asistencia-filtro-division">División</label>
          <select
            id="asistencia-filtro-division"
            name="division"
            className="input-gestion"
            value={filtros.division}
            onChange={onCambiarFiltro}
          >
            <option value="">Todas las divisiones</option>
            <option value="A">División A</option>
            <option value="B">División B</option>
            <option value="C">División C</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="asistencia-filtro-busqueda">Buscar alumno</label>
          <input
            id="asistencia-filtro-busqueda"
            name="busqueda"
            type="search"
            className="input-gestion"
            placeholder="Nombre, apellido o DNI"
            value={filtros.busqueda}
            onChange={onCambiarFiltro}
          />
        </div>
      </div>

      <div className="tabla-responsive">
        <table className="tabla-gestion asistencia-listado">
          <thead>
            <tr>
              <th scope="col">Apellido y nombre</th>
              <th scope="col">DNI</th>
              <th scope="col">Curso y división</th>
              <th scope="col">Estado del día</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {alumnosFiltrados.map((alumno) => {
              const estado = estados[alumno.id];

              const claseEstado =
                estado === "Presente"
                  ? "asistencia-presente"
                  : estado === "Ausente"
                    ? "asistencia-ausente"
                    : "asistencia-pendiente";

              return (
                <tr key={alumno.id}>
                  <td>
                    <strong>
                      {alumno.apellido}, {alumno.nombre}
                    </strong>
                  </td>

                  <td>{alumno.dni}</td>

                  <td>
                    {alumno.curso}° Año - {alumno.division}
                  </td>

                  <td>
                    <span className={`asistencia-estado ${claseEstado}`}>
                      {estado || "Sin registrar"}
                    </span>
                  </td>

                  <td>
                    <div className="acciones-tabla">
                      <button
                        type="button"
                        className="btn-accion btn-editar"
                        onClick={() => onEditar(alumno)}
                        title={`Editar planilla de ${alumno.curso}° ${alumno.division}`}
                        aria-label={`Editar planilla de ${alumno.curso}° ${alumno.division}`}
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true"></i>
                        <span>Editar planilla</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {alumnosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="sin-resultados">
                  {!filtros.fecha
                    ? "Seleccioná una fecha para consultar la asistencia."
                    : "No se encontraron alumnos con esos filtros."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
