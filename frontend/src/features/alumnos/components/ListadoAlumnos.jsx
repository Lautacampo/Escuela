import { useForm } from "../../../shared/hooks/useForm";

const ALUMNOS_MOCK = [
  {
    id: 1,
    apellido: "Pérez",
    nombre: "Juan",
    dni: 40123456,
    curso: "1",
    division: "A",
    moduloActual: "Módulo II",
    faltas: 4,
    condicion: "Regular",
  },
  {
    id: 2,
    apellido: "González",
    nombre: "María",
    dni: 38987654,
    curso: "1",
    division: "A",
    moduloActual: "Módulo II",
    faltas: 12,
    condicion: "Regular",
  },
  {
    id: 3,
    apellido: "López",
    nombre: "Carlos",
    dni: 41567890,
    curso: "1",
    division: "B",
    moduloActual: "Módulo I",
    faltas: 24,
    condicion: "Regular",
  },
  {
    id: 4,
    apellido: "Rodríguez",
    nombre: "Laura",
    dni: 37543210,
    curso: "1",
    division: "B",
    moduloActual: "Módulo I",
    faltas: 25,
    condicion: "Libre",
  },
  {
    id: 5,
    apellido: "Fernández",
    nombre: "Diego",
    dni: 39876543,
    curso: "2",
    division: "A",
    moduloActual: "Módulo IV",
    faltas: 8,
    condicion: "Regular",
  },
  {
    id: 6,
    apellido: "Martínez",
    nombre: "Sofía",
    dni: 40234567,
    curso: "2",
    division: "A",
    moduloActual: "Módulo III",
    faltas: 18,
    condicion: "Regular",
  },
  {
    id: 7,
    apellido: "Sosa",
    nombre: "Roberto",
    dni: 33112233,
    curso: "3",
    division: "A",
    moduloActual: "Módulo VI",
    faltas: 6,
    condicion: "Regular",
  },
  {
    id: 8,
    apellido: "Herrera",
    nombre: "Valentina",
    dni: 42998877,
    curso: "3",
    division: "B",
    moduloActual: "Módulo V",
    faltas: 27,
    condicion: "Libre",
  },
];

const NOMBRE_CURSO = { 1: "1° Año", 2: "2° Año", 3: "3° Año" };

export function ListadoAlumnos() {
  const { valores: filtros, manejarCambio } = useForm({
    curso: "",
    division: "",
    busqueda: "",
  });

  const divisionesDisponibles = [
    ...new Set(ALUMNOS_MOCK.map((alumno) => alumno.division)),
  ].sort();

  const alumnosFiltrados = ALUMNOS_MOCK.filter((alumno) => {
    const coincideCurso = !filtros.curso || alumno.curso === filtros.curso;
    const coincideDivision =
      !filtros.division || alumno.division === filtros.division;

    const textoBusqueda = filtros.busqueda.trim().toLowerCase();
    const coincideBusqueda =
      !textoBusqueda ||
      "${alumno.apellido} ${alumno.nombre}"
        .toLowerCase()
        .includes(textoBusqueda) ||
      String(alumno.dni).includes(textoBusqueda);

    return coincideCurso && coincideDivision && coincideBusqueda;
  });

  return (
    <div className="contenedor-tabla">
      <div className="cabecera-tabla">
        <h2>Listado de Alumnos</h2>
      </div>

      <div className="barra-filtros">
        <div className="form-group">
          <label htmlFor="filtro-curso">Curso</label>
          <select
            name="curso"
            id="filtro-curso"
            value={filtros.curso}
            onChange={manejarCambio}
            className="input-gestion"
          >
            <option value=""> Todos los cursos </option>
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
            {divisionesDisponibles.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group form-group-buscador">
          <label htmlFor="filtro-busqueda"> Buscar </label>
          <input
            type="text"
            id="filtro-busqueda"
            name="busqueda"
            placeholder="Nombre, apellido o DNI"
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
                <td>
                  {alumno.apellido}, {alumno.nombre}
                </td>
                <td>{alumno.dni}</td>
                <td>
                  {NOMBRE_CURSO[alumno.curso]} - {alumno.division}
                </td>
                <td>{alumno.moduloActual}</td>
                <td>{alumno.faltas}</td>
                <td>
                  <span
                    className={
                      alumno.condicion === "Regular"
                        ? "condicion-regular"
                        : "condicion-libre"
                    }
                  >
                    {alumno.condicion}
                  </span>
                </td>
                <td>
                  <a href="#" className="link-editar">
                    Ver ficha
                  </a>
                </td>
              </tr>
            ))}

            {alumnosFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#888" }}>
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
