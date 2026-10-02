import { useNavigate } from "react-router";
import { useForm } from "../../../shared/hooks/useForm";
import { formatearDNI } from "../../../shared/utils/formato";

const CURSOS = ["1", "2", "3"];
const LIMITE_FALTAS = 25;

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function ListadoAlumnos({alumnos, asistencias = [], onEditar, onEliminar}) {
    const navigate = useNavigate();

    const { valores: filtros, manejarCambio, resetearFormulario: limpiarFiltros } = useForm({
        curso: "",
        division: "",
        busqueda: "",
    });

    const divisiones = [
        ...new Set(alumnos.map((alumno) => alumno.division).filter(Boolean)),
    ].sort();

    const filtrosSelect = [
        {
            nombre: "curso",
            etiqueta: "Curso",
            todos: "Todos los cursos",
            opciones: CURSOS.map((curso) => ({ valor: curso, texto: `${curso}° Año` })),
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
            const faltas = asistencias
                .filter((asistencia) => String(asistencia.alumnoId) === String(alumno.id))
                .reduce((total, asistencia) => total + Number(asistencia.falta || 0), 0);
        
            return {
                ...alumno,
                faltas,
                condicion: faltas >= LIMITE_FALTAS ? "Libre" : "Regular",
            };
        })
        .filter((alumno) => {
            const texto = normalizar(`${alumno.apellido} ${alumno.nombre} ${alumno.dni}`);
        
            const coincideBusqueda = normalizar(filtros.busqueda)
                .split(/\s+/)
                .every((palabra) => texto.includes(palabra));
        
            return (
                coincideBusqueda &&
                (!filtros.curso || alumno.curso === filtros.curso) &&
                (!filtros.division || alumno.division === filtros.division)
            );
        });

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
 
        <button type="button" className="btn-secundario" onClick={limpiarFiltros}>
            Limpiar
        </button>
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

                                <td>{formatearDNI(alumno.dni)}</td>
                                
                                <td>
                                    {alumno.curso ? `${alumno.curso}° Año` : "-"}
                                    {alumno.division && ` - ${alumno.division}`}
                                </td>

                                
                                <td>{alumno.moduloActual || "-"}</td>
                                
                                <td>{alumno.faltas}</td>
                                
                                <td>
                                    <span className={`condicion-${alumno.condicion.toLowerCase()}`}>
                                        {alumno.condicion}
                                    </span>

                                </td>

                                <td>
                                    <div className="acciones-tabla">
                                        <button
                                            type="button"
                                            className="btn-accion btn-ficha"
                                            onClick={() => navigate(`/gestion/alumnos/${alumno.id}`,{
                                                state:{
                                                    alumno,
                                                },
                                            })}
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
                                            aria-label={`Eliminar a ${alumno.nombre} ${alumno.apellido}`}
                                        >
                                            <i className="fa-solid fa-trash" aria-hidden="true"></i>
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