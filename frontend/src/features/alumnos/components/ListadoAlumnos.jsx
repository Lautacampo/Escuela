import { useNavigate } from "react-router";
import { useForm } from "../../../shared/hooks/useForm";
import { formatearDNI } from "../../../shared/utils/formato";
import { exportarExcel } from "../../../shared/utils/exportarExcel.js";

const LIMITE_FALTAS = 25;

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function ListadoAlumnos({
  alumnos,
  asistencias = [],
  onEditar,
  onEliminar,
}) {
  const navigate = useNavigate();

  const {
    valores: filtros,
    manejarCambio,
    resetearFormulario: limpiarFiltros,
  } = useForm({
    curso: "",
    division: "",
    busqueda: "",
  });

  const divisiones = [
    ...new Set(alumnos.map((alumno) => alumno.division).filter(Boolean)),
  ].sort();
  const cursos = [
    ...new Set(alumnos.map((alumno) => String(alumno.curso)).filter(Boolean)),
  ].sort((a, b) => Number(a) - Number(b));

  const filtrosSelect = [
    {
      nombre: "curso",
      etiqueta: "Curso",
      todos: "Todos los cursos",
      opciones: cursos.map((curso) => ({
        valor: curso,
        texto: `${curso}° Año`,
      })),
    },
    {
      nombre: "division",
      etiqueta: "División",
      todos: "Todas",
      opciones: divisiones.map((division) => ({
        valor: division,
        texto: `División ${division}`,
      })),
    },
  ];

  const alumnosFiltrados = alumnos
    .map((alumno) => {
      const faltas =
        alumno.faltas != null
          ? Number(alumno.faltas)
          : asistencias
              .filter(
                (asistencia) =>
                  String(asistencia.alumnoId) === String(alumno.id),
              )
              .reduce(
                (total, asistencia) => total + Number(asistencia.falta || 0),
                0,
              );

      const condicion = alumno.condicion
        ? String(alumno.condicion).toUpperCase() === "LIBRE"
          ? "Libre"
          : "Regular"
        : faltas > LIMITE_FALTAS
          ? "Libre"
          : "Regular";

      return {
        ...alumno,
        faltas,
        condicion,
      };
    })
    .filter((alumno) => {
      const texto = normalizar(
        `${alumno.apellido} ${alumno.nombre} ${alumno.dni}`,
      );

      const coincideBusqueda = normalizar(filtros.busqueda)
        .split(/\s+/)
        .every((palabra) => texto.includes(palabra));

      return (
        coincideBusqueda &&
        (!filtros.curso || String(alumno.curso) === filtros.curso) &&
        (!filtros.division || alumno.division === filtros.division)
      );
    });

  const exportarListado = () => {
    if (!alumnosFiltrados.length) return;

    const filas = alumnosFiltrados.map((alumno) => ({
      apellido: alumno.apellido,
      nombre: alumno.nombre,
      dni: String(alumno.dni ?? ""),
      cuil: String(alumno.cuil ?? ""),
      fechaNacimiento: String(alumno.fechaNacimiento ?? ""),
      lugarNacimiento: alumno.lugarNacimiento ?? "",
      domicilio: alumno.domicilio ?? "",
      telefono: String(alumno.telefono ?? ""),
      email: alumno.email ?? "",
      telefonoEmergencia: String(alumno.telefonoEmergencia ?? ""),
      trabaja: alumno.trabaja == null ? "" : alumno.trabaja ? "Sí" : "No",
      cantidadHijos:
        alumno.cantidadHijos == null ? "" : Number(alumno.cantidadHijos),
      curso: alumno.curso ? `${alumno.curso}º año` : "Sin curso",
      division: alumno.division ?? "",
      modulo: alumno.moduloActual ?? "",
      faltas: alumno.faltas,
      condicion: alumno.condicion,
    }));

    const detalle =
      [
        filtros.curso && `curso_${filtros.curso}`,
        filtros.division && `division_${filtros.division}`,
      ]
        .filter(Boolean)
        .join("_") || "completo";

    exportarExcel({
      nombreArchivo: `alumnos_${detalle}`,
      nombreHoja: "Listado de alumnos",
      columnas: [
        { titulo: "Apellido", clave: "apellido", ancho: 22 },
        { titulo: "Nombre", clave: "nombre", ancho: 22 },
        { titulo: "DNI", clave: "dni", ancho: 16 },
        { titulo: "CUIL", clave: "cuil", ancho: 20 },
        { titulo: "Fecha nacimiento", clave: "fechaNacimiento", ancho: 19 },
        { titulo: "Lugar nacimiento", clave: "lugarNacimiento", ancho: 25 },
        { titulo: "Domicilio", clave: "domicilio", ancho: 30 },
        { titulo: "Teléfono", clave: "telefono", ancho: 20 },
        { titulo: "Correo electrónico", clave: "email", ancho: 32 },
        {
          titulo: "Teléfono emergencia",
          clave: "telefonoEmergencia",
          ancho: 22,
        },
        { titulo: "Trabaja", clave: "trabaja", ancho: 12 },
        { titulo: "Cantidad de hijos", clave: "cantidadHijos", ancho: 18 },
        { titulo: "Curso", clave: "curso", ancho: 15 },
        { titulo: "División", clave: "division", ancho: 12 },
        { titulo: "Módulo actual", clave: "modulo", ancho: 20 },
        { titulo: "Faltas acumuladas", clave: "faltas", ancho: 21 },
        { titulo: "Condición", clave: "condicion", ancho: 17 },
      ],
      filas,
    });
  };

  return (
    <div className="contenedor-tabla">
      <div className="cabecera-tabla">
        <div>
          <h2>Listado de Alumnos</h2>
          <span className="cantidad-resultados">
            {alumnosFiltrados.length} alumno
            {alumnosFiltrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button
          type="button"
          className="btn-secundario"
          onClick={exportarListado}
          disabled={!alumnosFiltrados.length}
          title="Exportar listado de alumnos a Excel"
        >
          <i className="fa-solid fa-file-excel" aria-hidden="true" /> Exportar
          Excel
        </button>
      </div>

      <div className="barra-filtros">
        {filtrosSelect.map((filtro) => (
          <div className="form-group" key={filtro.nombre}>
            <label htmlFor={`alumno-filtro-${filtro.nombre}`}>
              {filtro.etiqueta}
            </label>

            <select
              id={`alumno-filtro-${filtro.nombre}`}
              name={filtro.nombre}
              value={filtros[filtro.nombre]}
              onChange={manejarCambio}
              className="input-gestion"
            >
              <option value="">{filtro.todos}</option>

              {filtro.opciones.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="form-group form-group-buscador">
          <label htmlFor="alumno-busqueda">Buscar</label>
          <input
            id="alumno-busqueda"
            name="busqueda"
            type="search"
            placeholder="Nombre, apellido o DNI"
            value={filtros.busqueda}
            onChange={manejarCambio}
            className="input-gestion"
          />
        </div>

        <button
          type="button"
          className="btn-secundario"
          onClick={limpiarFiltros}
        >
          Limpiar
        </button>
      </div>

      <div className="tabla-responsive">
        <table className="tabla-gestion tabla-tarjetas">
          <thead>
            <tr>
              <th>Apellido y Nombre</th>
              <th>DNI</th>
              <th>Curso y División</th>
              <th>Módulo actual</th>
              <th>Faltas acumuladas</th>
              <th>Condición</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {alumnosFiltrados.map((alumno) => (
              <tr key={alumno.id}>
                <td data-label="Apellido y nombre">
                  <strong>
                    {alumno.apellido}, {alumno.nombre}
                  </strong>
                  {alumno.planEstudio && (
                    <span className="alumno-plan">
                      Plan: {alumno.planEstudio.titulo}
                    </span>
                  )}
                </td>

                <td data-label="DNI">{formatearDNI(alumno.dni)}</td>

                <td data-label="Curso y división">
                  {alumno.curso ? `${alumno.curso}° Año` : "-"}
                  {alumno.division && ` - ${alumno.division}`}
                </td>

                <td data-label="Módulo actual">{alumno.moduloActual || "-"}</td>

                <td data-label="Faltas acumuladas">{alumno.faltas}</td>

                <td data-label="Condición">
                  <span
                    className={`condicion-${alumno.condicion.toLowerCase()}`}
                  >
                    {alumno.condicion}
                  </span>
                </td>

                <td data-label="Acciones">
                  <div className="acciones-tabla">
                    <button
                      type="button"
                      className="btn-accion btn-ficha"
                      onClick={() =>
                        navigate(`/gestion/alumnos/${alumno.id}`, {
                          state: {
                            alumno,
                          },
                        })
                      }
                      aria-label={`Ver ficha de ${alumno.nombre} ${alumno.apellido}`}
                    >
                      <i className="fa-solid fa-id-card" aria-hidden="true"></i>
                      <span>Ver ficha</span>
                    </button>
                    <button
                      type="button"
                      className="btn-accion btn-editar"
                      onClick={() => onEditar(alumno)}
                      aria-label={`Editar a ${alumno.nombre} ${alumno.apellido}`}
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true"></i>
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      className="btn-accion btn-eliminar"
                      onClick={() => onEliminar(alumno.id)}
                      aria-label={`Dar de Baja a ${alumno.nombre} ${alumno.apellido}`}
                    >
                      <i className="fa-solid fa-trash" aria-hidden="true"></i>
                      <span>Dar de Baja</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {alumnosFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="sin-resultados">
                  No se encontraron alumnos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
