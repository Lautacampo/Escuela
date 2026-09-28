import { useForm } from "../../../shared/hooks/useForm";

// Mock de datos adaptado para asistencias
const HISTORIAL_MOCK = [
  {
    id: 1,
    fecha: "2026-09-28",
    apellido: "Pérez",
    nombre: "Juan",
    curso: "1",
    division: "A",
    estado: "Presente",
  },
  {
    id: 2,
    fecha: "2026-09-28",
    apellido: "González",
    nombre: "María",
    curso: "1",
    division: "A",
    estado: "Ausente",
  },
  {
    id: 3,
    fecha: "2026-09-28",
    apellido: "López",
    nombre: "Carlos",
    curso: "1",
    division: "B",
    estado: "Presente",
  },
  {
    id: 4,
    fecha: "2026-09-27",
    apellido: "Rodríguez",
    nombre: "Laura",
    curso: "1",
    division: "B",
    estado: "Ausente",
  },
];

const NOMBRE_CURSO = { 1: "1° Año", 2: "2° Año", 3: "3° Año" };

export function ListadoAsistencias() {
  const { valores: filtros, manejarCambio } = useForm({
    fecha: "",
    curso: "",
    division: "",
    busqueda: "",
  });

  const asistenciasFiltradas = HISTORIAL_MOCK.filter((registro) => {
    const coincideFecha = !filtros.fecha || registro.fecha === filtros.fecha;
    const coincideCurso = !filtros.curso || registro.curso === filtros.curso;
    const coincideDivision =
      !filtros.division || registro.division === filtros.division;

    const textoBusqueda = filtros.busqueda.trim().toLowerCase();
    const coincideBusqueda =
      !textoBusqueda ||
      `${registro.apellido} ${registro.nombre}`
        .toLowerCase()
        .includes(textoBusqueda);

    return (
      coincideFecha && coincideCurso && coincideDivision && coincideBusqueda
    );
  });

  return (
    <div className="contenedor-tabla" style={{ marginBottom: "30px" }}>
      <div className="cabecera-tabla">
        <h2>Historial de Asistencias</h2>
      </div>

      <div className="barra-filtros">
        <div className="form-group">
          <label htmlFor="filtro-fecha">Filtrar por Fecha</label>
          <input
            type="date"
            id="filtro-fecha"
            name="fecha"
            value={filtros.fecha}
            onChange={manejarCambio}
            className="input-gestion"
          />
        </div>

        <div className="form-group">
          <label htmlFor="filtro-curso">Curso</label>
          <select
            name="curso"
            id="filtro-curso"
            value={filtros.curso}
            onChange={manejarCambio}
            className="input-gestion"
          >
            <option value=""> Todos </option>
            <option value="1"> 1° Año </option>
            <option value="2"> 2° Año </option>
            <option value="3"> 3° Año </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="filtro-division">División</label>
          <select
            name="division"
            id="filtro-division"
            value={filtros.division}
            onChange={manejarCambio}
            className="input-gestion"
          >
            <option value=""> Todas </option>
            <option value="A"> A </option>
            <option value="B"> B </option>
          </select>
        </div>

        <div className="form-group form-group-buscador">
          <label htmlFor="filtro-busqueda">Buscar Alumno</label>
          <input
            type="text"
            id="filtro-busqueda"
            name="busqueda"
            placeholder="Nombre o apellido"
            value={filtros.busqueda}
            onChange={manejarCambio}
            className="input-gestion"
          />
        </div>
      </div>

      <div className="tabla-responsive">
        <table className="tabla-gestion">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Apellido y Nombre</th>
              <th>Curso y División</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asistenciasFiltradas.map((registro) => (
              <tr key={registro.id}>
                <td>{registro.fecha}</td>
                <td>
                  {registro.apellido}, {registro.nombre}
                </td>
                <td>
                  {NOMBRE_CURSO[registro.curso]} - {registro.division}
                </td>
                <td>
                  <span
                    className={
                      registro.estado === "Presente" ? "estado-ap" : "estado-dp"
                    }
                  >
                    {registro.estado}
                  </span>
                </td>
                <td>
                  <a href="#" className="link-editar">
                    Modificar
                  </a>
                </td>
              </tr>
            ))}
            {asistenciasFiltradas.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    color: "#888",
                    padding: "30px",
                  }}
                >
                  No se encontraron registros de asistencia para los filtros
                  seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
