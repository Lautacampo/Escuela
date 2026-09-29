import { useMemo } from "react";
import { useForm } from "../../../shared/hooks/useForm";

const NOMBRE_CURSO = {"1": "1° Año", "2": "2° Año", "3": "3° Año"};

export function ListadoAlumnos({alumnos, onEditar, onEliminar,}) {
    const { valores: filtros, manejarCambio } = useForm({
        curso: "",
        division: "",
        busqueda: "",
    });

    const divisionesDisponibles = useMemo(() => {
        return [
        ...new Set(alumnos.map((alumno) => alumno.division).filter(Boolean)),
        ].sort();
    }, [alumnos]);
     

    const alumnosFiltrados = useMemo(() => {
        return alumnos.filter((alumno) => {
        const coincideCurso =
            !filtros.curso || alumno.curso === filtros.curso;

        const coincideDivision =
            !filtros.division ||
            alumno.division === filtros.division;

        const textoBusqueda = filtros.busqueda
            .trim()
            .toLowerCase();

        const nombreCompleto =
            `${alumno.apellido} ${alumno.nombre}`.toLowerCase();

        const coincideBusqueda =
            !textoBusqueda ||
            nombreCompleto.includes(textoBusqueda) ||
            String(alumno.dni).includes(textoBusqueda);

        return (
            coincideCurso &&
            coincideDivision &&
            coincideBusqueda
        );
        });
    }, [alumnos, filtros]);

    return(
        <div className="contenedor-tabla">
            <div className="cabecera-tabla">
                <div>
                    <h2>Listado de Alumnos</h2>
                    <span className="cantidad-resultados">
                        {alumnosFiltrados.length} alumno
                        {alumnosFiltrados.length !== 1 ? "s" : ""}
                    </span>
                </div>
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
                                División {division}
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
                                    <strong>
                                        {alumno.apellido}, {alumno.nombre}
                                    </strong>
                                </td>

                                <td>{alumno.dni}</td>
                                
                                <td>
                                    {NOMBRE_CURSO[alumno.curso] || "-"}{" "}
                                    {alumno.division && `- ${alumno.division}`}
                                </td>
                                
                                <td>{alumno.moduloActual || "-"}</td>
                                
                                <td>{alumno.faltas ?? 0}</td>
                                
                                <td>
                                    <span className={alumno.condicion === "Regular" ? "condicion-regular" : "condicion-libre"}>
                                        {alumno.condicion || "Regular"}
                                    </span>
                                </td>

                                <td>
                                    <div className="acciones-tabla">
                                        <button
                                            type="button"
                                            className="btn-accion btn-editar"
                                            onClick={() => onEditar(alumno)}
                                            title="Editar Alumno"
                                        >
                                            <i className="fa-solid fa-pen"></i>
                                            <span>Editar</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-accion btn-eliminar"
                                            onClick={() => onEliminar(alumno.id)}
                                            title="Eliminar alumno"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                            <span>Eliminar</span>
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