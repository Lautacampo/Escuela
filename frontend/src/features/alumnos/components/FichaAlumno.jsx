import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { getAlumnos } from "../../SoftwareII/AlumnoService-is";
import { crearEvaluacionModulo } from "../services/EvaluacionesModuloService";

const NOMBRE_CURSO = {
    "1": "1° Año",
    "2": "2° Año",
    "3": "3° Año",
};

function calcularEdad(fechaNacimiento){
    if (!fechaNacimiento) return "-";

    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();

    const noCumplioEsteAnio =
        hoy.getMonth() < nacimiento.getMonth() ||
        (hoy.getMonth() === nacimiento.getMonth() &&
        hoy.getDate() < nacimiento.getDate());

    if (noCumplioEsteAnio) {
        edad--;
    }

    return `${edad} años`;
}

function formatearFecha(fecha) {
    if (!fecha) return "-";

    const partes = fecha.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function fechaActual() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function obtenerTipoInstancia(nroInstancia) {
    if (nroInstancia === 1) return "COLEGIADA";
    if (nroInstancia === 4) return "ESPECIAL";
    if (nroInstancia === 2 || nroInstancia === 3) return "CALENDARIO";

    return "";
}

function formatearCondicion(condicion) {
    if (!condicion) return "-";

    const texto = String(condicion).toLowerCase();
    return `${texto[0].toUpperCase()}${texto.slice(1)}`;
}

function formatearEstadoAcademico(estado) {
    if (!estado) return "Sin estado";

    return String(estado)
        .toLowerCase()
        .split("_")
        .map((parte) => `${parte[0].toUpperCase()}${parte.slice(1)}`)
        .join(" ");
}

function obtenerResultadoEvaluacion(nota) {
    if (nota === null || nota === undefined || nota === "") {
        return "Sin calificación";
    }

    return Number(nota) >= 7 ? "Aprobado" : "Desaprobado";
}


export function FichaAlumno() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [alumno, setAlumno] = useState(location.state?.alumno ?? null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [evaluacion, setEvaluacion] = useState({
        fecha: fechaActual(),
        nota: "",
        nroInstancia: "1",
    });
    const [guardandoEvaluacion, setGuardandoEvaluacion] = useState(false);
    const [errorEvaluacion, setErrorEvaluacion] = useState("");
    const [evaluacionGuardada, setEvaluacionGuardada] = useState(null);

    useEffect(() => {
        let activa = true;

        async function cargarAlumno() {
            try {
                const alumnos = await getAlumnos();
                const alumnoDesdeApi = alumnos.find(
                    (registro) => String(registro.id) === String(id)
                );

                if (!alumnoDesdeApi) {
                    throw new Error("No se encontró el alumno solicitado.");
                }

                if (activa) {
                    setAlumno((anterior) => ({
                        ...anterior,
                        ...alumnoDesdeApi,
                        curso:
                            alumnoDesdeApi.curso ??
                            alumnoDesdeApi.anioCurso ??
                            anterior?.curso,
                        moduloActual:
                            alumnoDesdeApi.moduloActual ??
                            alumnoDesdeApi.modulo ??
                            anterior?.moduloActual,
                        faltas:
                            alumnoDesdeApi.faltas ??
                            alumnoDesdeApi.faltasAcumuladas ??
                            anterior?.faltas,
                    }));
                }
            } catch (e) {
                if (activa) {
                    setError(e.message);
                }
            } finally {
                if (activa) {
                    setCargando(false);
                }
            }
        }

        cargarAlumno();

        return () => {
            activa = false;
        };
    }, [id]);

    async function guardarEvaluacion(e) {
        e.preventDefault();
        setErrorEvaluacion("");
        setEvaluacionGuardada(null);

        if (alumno.cursadaModuloId === undefined || alumno.cursadaModuloId === null) {
            setErrorEvaluacion(
                "El alumno no tiene cursadaModuloId disponible para registrar la evaluación."
            );
            return;
        }

        const payload = {
            idCursadaModulo: Number(alumno.cursadaModuloId),
            fecha: evaluacion.fecha,
            nota: Number(evaluacion.nota),
            nroInstancia: Number(evaluacion.nroInstancia),
            tipoInstancia: obtenerTipoInstancia(
                Number(evaluacion.nroInstancia)
            ),
        };

        if (
            !Number.isFinite(payload.nota) ||
            payload.nota < 0 ||
            payload.nota > 10
        ) {
            setErrorEvaluacion("La nota debe ser un número entre 0 y 10.");
            return;
        }

        if (
            !Number.isInteger(payload.nroInstancia) ||
            payload.nroInstancia < 1 ||
            payload.nroInstancia > 4
        ) {
            setErrorEvaluacion("El número de instancia debe estar entre 1 y 4.");
            return;
        }

        try {
            setGuardandoEvaluacion(true);
            const respuesta = await crearEvaluacionModulo(payload);
            setEvaluacionGuardada(respuesta ?? payload);

            try {
                const alumnos = await getAlumnos();
                const alumnoActualizado = alumnos.find(
                    (registro) => String(registro.id) === String(id)
                );

                if (alumnoActualizado) {
                    setAlumno((anterior) => ({
                        ...anterior,
                        ...alumnoActualizado,
                    }));
                }
            } catch (errorActualizacion) {
                setErrorEvaluacion(
                    `La nota se guardó, pero no se pudo actualizar la trayectoria: ${errorActualizacion.message}`
                );
            }
        } catch (e) {
            setErrorEvaluacion(e.message);
        } finally {
            setGuardandoEvaluacion(false);
        }
    }

    if (cargando) {
        return <p>Cargando ficha del alumno...</p>;
    }

    if (error) {
        return (
            <div className="ficha-no-encontrada" role="alert">
                <i className="fa-solid fa-circle-exclamation"></i>
                <h2>No se pudo cargar la ficha</h2>
                <p>{error}</p>
                <button
                    type="button"
                    className="btn-primario-gestion"
                    onClick={() => navigate("/gestion/alumnos")}
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    Volver al listado
                </button>
            </div>
        );
    }

    if (!alumno) {
        return (
            <div className="ficha-no-encontrada">
                <i className="fa-solid fa-user-xmark"></i>
                <h2>Alumno no encontrado</h2>

                <p>No se encontró la información del alumno solicitado.</p>

                <button
                type="button"
                className="btn-primario-gestion"
                onClick={() => navigate("/gestion/alymnos")}
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    Volver al listado
                </button>
            </div>
        );
    }

    const moduloActual = alumno.moduloActual ?? alumno.modulo;
    const faltasActuales = alumno.faltas ?? alumno.faltasAcumuladas;
    const condicionActual = formatearCondicion(alumno.condicion);
    const trayectoria = Array.isArray(alumno.trayectoria)
        ? alumno.trayectoria
        : [];
    const datosAcademicos = trayectoria.length > 0
        ? trayectoria.map((cursada, index) => ({
            id: cursada.idCursada ?? cursada.cursadaModuloId ?? index,
            modulo: cursada.modulo ?? "Módulo sin nombre",
            año:
                NOMBRE_CURSO[String(cursada.anioCurso)] ??
                (cursada.anioCurso ? `${cursada.anioCurso}° Año` : "-"),
            estado: formatearEstadoAcademico(cursada.estadoAcademico),
            nota: cursada.notaFinal ?? cursada.nota ?? null,
            faltas: cursada.faltas ?? cursada.cantidadFaltasAcumuladas ?? null,
            condicion: formatearCondicion(cursada.condicion),
            instancias: (cursada.evaluaciones ?? cursada.instancias ?? []).map(
                (evaluacion) => ({
                    ...evaluacion,
                    resultado: obtenerResultadoEvaluacion(evaluacion.nota),
                })
            ),
        }))
        : moduloActual
            ? [{
                id: alumno.cursadaModuloId ?? "actual",
                modulo: moduloActual,
                año: NOMBRE_CURSO[String(alumno.curso ?? alumno.anioCurso)] ?? "-",
                estado: "En curso",
                nota: null,
                faltas: faltasActuales,
                condicion: condicionActual,
                instancias: null,
            }]
            : [];
    const historialTieneInstancias = trayectoria.some(
        (cursada) =>
            Array.isArray(cursada.evaluaciones) ||
            Array.isArray(cursada.instancias)
    );
    const modulosAprobados = datosAcademicos.filter(
        (modulo) => modulo.estado.toLowerCase() === "aprobado"
    ).length;
    const totalFaltas = datosAcademicos.reduce(
        (total, modulo) => total + (Number(modulo.faltas) || 0),
        0
    );
    const tieneDatosPersonales = [
        "fechaNacimiento",
        "cuil",
        "lugarNacimiento",
        "domicilio",
        "telefono",
        "email",
        "telefonoEmergencia",
        "cantidadHijos",
        "trabaja",
    ].some((campo) => alumno[campo] !== undefined && alumno[campo] !== null);

    return(
        <div className="ficha-alumno">
            <div className="ficha-cabecera">
                <button type="button" className="btn-volver" onClick={() => navigate("/gestion/alumnos")}>
                    <i className="fa-solid fa-arrow-left"></i>
                    Volver
                </button>

                <div className="ficha-titulo">
                    <div className="ficha-avatar">
                        <i className="fa-solid fa-user"></i>
                    </div>

                    <div>
                        <h1>
                            {alumno.apellido}, {alumno.nombre}
                        </h1>

                        <p>
                            DNI {alumno.dni}
                            {" · "}
                            {NOMBRE_CURSO[alumno.curso] || "Sin curso"}
                            {alumno.division && ` - División ${alumno.division}`}
                        </p>
                    </div>
                </div>

                <button type="button" className="btn-secundario" onClick={() => navigate("/gestion/alumnos", {state: {editarAlumno:alumno}})}>
                    Editar datos
                </button>
            </div>

            <div className="ficha-resumen">
                <div className="ficha-resumen-item">
                    <span className="ficha-resumen-icono">
                        <i className="fa-solid fa-book"></i>
                    </span>

                    <div>
                        <span>Módulo actual</span>
                        <strong>
                            {alumno.moduloActual || "-"}
                        </strong>
                    </div>
                </div>

                <div className="ficha-resumen-item">
                    <span className="ficha-resumen-icono">
                        <i className="fa-solid fa-graduation-cap"></i>
                    </span>

                    <div>
                        <span>Módulos aprobados</span>
                        <strong>
                            {modulosAprobados}
                        </strong>
                    </div>
                </div>

                <div className="ficha-resumen-item">
                    <span className="ficha-resumen-icono">
                        <i className="fa-solid fa-calendar-xmark"></i>
                    </span>

                    <div>
                        <span>Faltas acumuladas</span>
                        <strong>
                            {datosAcademicos.length > 0
                                ? totalFaltas
                                : faltasActuales ?? "-"}
                        </strong>
                    </div>
                    </div>

                    <div className="ficha-resumen-item">
                    <span className="ficha-resumen-icono">
                        <i className="fa-solid fa-user-check"></i>
                    </span>

                    <div>
                        <span>Condición actual</span>

                        <strong
                        className={
                            alumno.condicion === "Libre"
                            ? "texto-libre"
                            : "texto-regular"
                        }
                        >
                        {condicionActual}
                        </strong>
                    </div>
                </div>
            </div>

            <section className="ficha-seccion">
                <div className="ficha-seccion-titulo">
                    <i className="fa-solid fa-id-card"></i>
                    <div>
                        <h2>Datos personales</h2>
                        <p>Informacion personal del estudiante.</p>
                    </div>
                </div>

                {!tieneDatosPersonales && (
                    <div className="ficha-advertencia" role="status">
                        <i className="fa-solid fa-circle-info"></i>
                        <div>
                            <strong>Datos personales no disponibles</strong>
                            <p>
                                La respuesta de GET /api/alumnos no incluye estos
                                campos. Cuando el backend los devuelva, aparecerán
                                aquí automáticamente.
                            </p>
                        </div>
                    </div>
                )}

                <div className="ficha-datos-grid">
                    <Dato label="Nombre" valor={alumno.nombre}></Dato>
                    <Dato label="Apellido" valor={alumno.apellido}></Dato>
                    <Dato label="DNI" valor={alumno.dni}></Dato>
                    <Dato label="Fecha de nacimiento" valor={formatearFecha(alumno.fechaNacimiento)}></Dato>
                    <Dato label="Edad" valor={calcularEdad(alumno.fechaNacimiento)}></Dato>
                    <Dato label="CUIL" valor={alumno.cuil}></Dato>
                    <Dato label="Lugar de nacimiento" valor={alumno.lugarNacimiento}></Dato>
                    <Dato label="Domicilio" valor={alumno.domicilio}></Dato>
                    <Dato label="Teléfono" valor={alumno.telefono}></Dato>
                    <Dato label="Correo electrónico" valor={alumno.email}></Dato>
                    <Dato label="Teléfono de emergencia" valor={alumno.telefonoEmergencia}></Dato>
                    <Dato label="Cantidad de hijos" valor={alumno.cantidadHijos}></Dato>
                    <Dato label="Situación laboral" valor={alumno.trabaja ? "Trabaja" : "No trabaja"}></Dato>
                </div>
            </section>

            <section className="ficha-seccion">
                <div className="ficha-seccion-titulo">
                    <i className="fa-solid fa-school"></i>
                    <div>
                        <h2>Situación académica</h2>
                        <p>Estado actual dentro de la trayectoria educativa.</p>
                    </div>
                </div>

                <div className="ficha-academica-info">
                    <div>
                        <span>Curso</span>
                        <strong>
                            {NOMBRE_CURSO[alumno.curso] || "-"}
                        </strong>
                    </div>

                    <div>
                        <span>División</span>
                        <strong>{alumno.division || "-"}</strong>
                    </div>

                    <div>
                        <span>Módulo actual</span>
                        <strong>{alumno.moduloActual || "-"}</strong>
                    </div>

                    <div>
                        <span>Condición</span>
                        <strong className={condicionActual === "Libre" ? "texto-libre" : "texto-regular"}>
                                        {condicionActual}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="ficha-seccion">
                <div className="ficha-seccion-titulo">
                    <i className="fa-solid fa-pen-to-square"></i>
                    <div>
                        <h2>Calificar módulo actual</h2>
                        <p>
                            Registrar una nota para {alumno.moduloActual || "el módulo actual"}.
                        </p>
                    </div>
                </div>

                {alumno.cursadaModuloId === undefined ||
                alumno.cursadaModuloId === null ? (
                    <div className="ficha-advertencia" role="alert">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <div>
                            <strong>No se puede identificar la cursada</strong>
                            <p>
                                El GET del alumno debe incluir cursadaModuloId para
                                asociar la evaluación al módulo correcto.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form className="ficha-evaluacion-form" onSubmit={guardarEvaluacion}>
                        <label>
                            <span>Nota (0 a 10)</span>
                            <input
                                className="input-gestion"
                                type="number"
                                name="nota"
                                min="0"
                                max="10"
                                step="0.01"
                                value={evaluacion.nota}
                                onChange={(e) =>
                                    setEvaluacion((anterior) => ({
                                        ...anterior,
                                        nota: e.target.value,
                                    }))
                                }
                                required
                            />
                        </label>

                        <label>
                            <span>Fecha</span>
                            <input
                                className="input-gestion"
                                type="date"
                                name="fecha"
                                value={evaluacion.fecha}
                                onChange={(e) =>
                                    setEvaluacion((anterior) => ({
                                        ...anterior,
                                        fecha: e.target.value,
                                    }))
                                }
                                required
                            />
                        </label>

                        <label>
                            <span>Número de instancia (1 a 4)</span>
                            <input
                                className="input-gestion"
                                type="number"
                                name="nroInstancia"
                                min="1"
                                max="4"
                                step="1"
                                value={evaluacion.nroInstancia}
                                onChange={(e) =>
                                    setEvaluacion((anterior) => ({
                                        ...anterior,
                                        nroInstancia: e.target.value,
                                    }))
                                }
                                required
                            />
                        </label>

                        <label>
                            <span>Tipo de instancia (automático)</span>
                            <input
                                className="input-gestion"
                                type="text"
                                value={obtenerTipoInstancia(
                                    Number(evaluacion.nroInstancia)
                                )}
                                readOnly
                            />
                        </label>

                        <button
                            className="btn-primario-gestion"
                            type="submit"
                            disabled={guardandoEvaluacion}
                        >
                            {guardandoEvaluacion ? "Guardando..." : "Guardar calificación"}
                        </button>
                    </form>
                )}

                {errorEvaluacion && (
                    <div className="ficha-advertencia ficha-evaluacion-mensaje" role="alert">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <p>{errorEvaluacion}</p>
                    </div>
                )}

                {evaluacionGuardada && (
                    <div className="ficha-evaluacion-guardada" role="status">
                        <i className="fa-solid fa-circle-check"></i>
                        Calificación guardada: {evaluacionGuardada.nota} —{" "}
                        {formatearFecha(evaluacionGuardada.fecha)} —{" "}
                        {evaluacionGuardada.tipoInstancia}, instancia{" "}
                        {evaluacionGuardada.nroInstancia}.
                    </div>
                )}
            </section>

            <section className="ficha-seccion">
                <div className="ficha-seccion-titulo">
                    <i className="fa-solid fa-route"></i>
                    <div>
                        <h2>Trayectoria académica</h2>
                        <p>Historial de los módulos cursados y sus resultados.</p>
                    </div>
                </div>

                <div className="trayectoria">
                    {datosAcademicos.length === 0 ? (
                        <div className="ficha-advertencia" role="status">
                            <i className="fa-solid fa-circle-info"></i>
                            <div>
                                <strong>No hay trayectoria académica disponible</strong>
                                <p>
                                    El GET del alumno no devolvió módulos cursados
                                    para mostrar en la trayectoria.
                                </p>
                            </div>
                        </div>
                    ) : (
                    <>
                    {!historialTieneInstancias && (
                    <div className="ficha-advertencia" role="status">
                        <i className="fa-solid fa-circle-info"></i>
                        <div>
                            <strong>Detalle de instancias no disponible</strong>
                            <p>
                                Se muestra el estado real de cada cursada. La
                                respuesta de trayectoria todavía no incluye las
                                evaluaciones rendidas, por lo que no es posible
                                mostrar sus fechas y notas.
                            </p>
                        </div>
                    </div>
                    )}
                    {datosAcademicos.map((modulo) => (
                        <div className="modulo-trayectoria" key={modulo.id}>
                            <div className="modulo-indicador"><span></span></div>

                            <div className="modulo-contenido">
                                <div className="modulo-cabecera">
                                    <div>
                                        <span className="modulo-año">
                                            {modulo.año}
                                        </span>

                                        <h3>{modulo.modulo}</h3>
                                    </div>

                                    <EstadoModulo estado={modulo.estado}/>
                                </div>

                                <div className="modulo-detalles">
                                    <div>
                                        <span>Calificación final</span>
                                        <strong>
                                            {modulo.nota ?? "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Faltas</span>
                                        <strong>{modulo.faltas}</strong>
                                    </div>

                                    <div>
                                        <span>Condición</span>
                                        <strong>{modulo.condicion}</strong>
                                    </div>

                                    <div>
                                        <span>Instancias utilizadas</span>
                                        <strong>
                                            {modulo.instancias?.length ?? "-"}
                                        </strong>
                                    </div>
                                </div>

                                {modulo.instancias?.length > 0 && (
                                    <div className="instancias-acreditacion">
                                        <h4>
                                            <i className="fa solid fa-clipboard-check"></i>
                                            Instancias de acreditación
                                        </h4>

                                        {modulo.instancias.map(
                                            (instancia, index) => (
                                                <div className="instancia" key={index}>
                                                    <span>
                                                        Instancia{" "}
                                                        {instancia.nroInstancia ??
                                                            instancia.numero ??
                                                            "-"}
                                                        {instancia.tipoInstancia
                                                            ? ` · ${instancia.tipoInstancia}`
                                                            : ""}
                                                    </span>

                                                    <span>
                                                        {formatearFecha(instancia.fecha)}
                                                    </span>

                                                    <strong className={
                                                        instancia.resultado === "Aprobado"
                                                            ? "resultado-instancia-aprobada"
                                                            : instancia.resultado === "Desaprobado"
                                                                ? "resultado-instancia-desaprobada"
                                                                : ""
                                                    }>
                                                        Nota: {instancia.nota ?? "-"} —{" "}
                                                        {instancia.resultado}
                                                    </strong>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    </>
                    )}
                </div>
            </section>

            <section className="ficha-seccion">
                <div className="ficha-seccion-titulo">
                    <i className="fa-solid fa-calendar-check"></i>

                    <div>
                        <h2>Asistencia</h2>
                        <p>Situación de asistencia correspondiente a cada módulo.</p>
                    </div>
                </div>

                <div className="tabla-responsive">
                    <table className="tabla-gestion tabla-asistencia">
                        <thead>
                            <tr>
                                <th>Módulo</th>
                                <th>Faltas</th>
                                <th>Límite</th>
                                <th>Condición</th>
                            </tr>
                        </thead>

                        <tbody>
                            {datosAcademicos.length === 0 ? (
                                <tr>
                                    <td colSpan="4">No hay datos de cursada disponibles.</td>
                                </tr>
                            ) : datosAcademicos.map((modulo => (
                                <tr key={modulo.id}>
                                    <td>
                                        <strong>{modulo.modulo}</strong>
                                    </td>

                                    <td>
                                        {modulo.faltas ?? "-"}
                                    </td>

                                    <td>25</td>

                                    <td>
                                        <span className={modulo.condicion === "Libre" ? "condicion-libre" : "condicion-regular"}>
                                            {modulo.condicion}
                                        </span>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="ficha-advertencia">
                <i className="fa-solid fa-circle-info"></i>

                <div>
                    <strong>Información académica</strong>

                    <p>
                        Las situaciones relacionadas con correlatividades, 
                        acreditaciones pendientes o condiciones académicas 
                        especiales deberán ser evaluadas por un directivo.
                    </p>
                </div>
            </div>
        </div>
    );
}

function Dato({ label, valor }) {
    return (
        <div className="ficha-dato">
            <span>{label}</span>
            <strong>{valor ?? "-"}</strong>
        </div>
    );
}

function EstadoModulo({ estado }) {
    let clase = "estado-modulo";

    if (estado === "Aprobado") {
        clase += " estado-aprobado";
    } else if (estado === "Desaprobado") {
        clase += " estado-desaprobado";
    } else if (estado === "Pendiente") {
        clase += " estado-pendiente";
    } else if (estado === "En curso") {
        clase += " estado-curso";
    } else {
        clase += " estado-no-cursado";
    }

    return <span className={clase}> {estado} </span>;
}
