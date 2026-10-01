import { useLocation, useNavigate, useParams } from "react-router";

const NOMBRE_CURSO = {
    "1": "1° Año",
    "2": "2° Año",
    "3": "3° Año",
};

const DATOS_ACADEMICOS = [
    {
        modulo: "Módulo I",
        año: "1° Año",
        estado: "Aprobado",
        nota: 8,
        faltas: 6,
        condicion: "Regular",
        instancias: [],
    },
    {
        modulo: "Módulo II",
        año: "1° Año",
        estado: "Aprobado",
        nota: 7,
        faltas: 8,
        condicion: "Regular",
        instancias: [],
    },
    {
        modulo: "Módulo III",
        año: "2° Año",
        estado: "Pendiente",
        nota: null,
        faltas: 12,
        condicion: "Regular",
        instancias: [
        {
            numero: "Primera",
            fecha: "15/07/2026",
            resultado: "No aprobado",
        },
        ],
    },
    {
        modulo: "Módulo IV",
        año: "2° Año",
        estado: "En curso",
        nota: null,
        faltas: 4,
        condicion: "Regular",
        instancias: [],
    },
    {
        modulo: "Módulo V",
        año: "3° Año",
        estado: "No cursado",
        nota: null,
        faltas: 0,
        condicion: "-",
        instancias: [],
    },
    {
        modulo: "Módulo VI",
        año: "3° Año",
        estado: "No cursado",
        nota: null,
        faltas: 0,
        condicion: "-",
        instancias: [],
    },
];

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


export function FichaAlumno() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const alumno = location.state?.alumno;

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

    const datosAcademicos = DATOS_ACADEMICOS;

    const moduloAdicional = datosAcademicos.find((modulo) => modulo.estado === "En curso") || null;

    const modulosAprobados = datosAcademicos.filter((modulo) => modulo.estado === "Aprobado");

    const totalFaltas = datosAcademicos.reduce((total, modulo) => total + (modulo.faltas || 0), 0);

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
                            {modulosAprobados.length}
                        </strong>
                    </div>
                </div>

                <div className="ficha-resumen-item">
                    <span className="ficha-resumen-icono">
                        <i className="fa-solid fa-calendar-xmark"></i>
                    </span>

                    <div>
                        <span>Faltas acumuladas</span>
                        <strong>{totalFaltas}</strong>
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
                        {alumno.condicion || "Regular"}
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

                <div className="ficha-datos-grid">
                    <Dato label="Nombre" valor={alumno.nombre}></Dato>
                    <Dato label="Apellido" valor={alumno.apellido}></Dato>
                    <Dato label="DNI" valor={alumno.dni}></Dato>
                    <Dato label="Fecha de nacimiento" valor={alumno.fechaNacimiento}></Dato>
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
                        <strong className={alumno.condicion === "Libre" ? "texto-libre" : "texto-regular"}>
                            {alumno.condicion || "Regular"}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="ficha-seccion">
                <div className="ficha-seccion-titulo">
                    <i className="fa-solid fa-route"></i>
                    <div>
                        <h2>Trayectoria académica</h2>
                        <p>
                            Historial de los módulos cursados y acreditados.
                        </p>
                    </div>
                </div>

                <div className="trayectoria">
                    {datosAcademicos.map((modulo) => (
                        <div className="modulo-trayectoria" key={modulo.modulo}>
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
                                            {modulo.instancias.length}
                                        </strong>
                                    </div>
                                </div>

                                {modulo.instancias.length > 0 && (
                                    <div className="instancias-acreditacion">
                                        <h4>
                                            <i className="fa solid fa-clipboard-check"></i>
                                            Instancias de acreditación
                                        </h4>

                                        {modulo.instancias.map(
                                            (instancia, index) => (
                                                <div className="instancia" key={index}>
                                                    <span>
                                                        {instancia.numero} instancia
                                                    </span>

                                                    <span>
                                                        {instancia.fecha}
                                                    </span>

                                                    <strong>
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
                            {datosAcademicos.map((modulo => (
                                <tr key={modulo.modulo}>
                                    <td>
                                        <strong>{modulo.modulo}</strong>
                                    </td>

                                    <td>
                                        {modulo.faltas}
                                    </td>

                                    <td>25</td>

                                    <td>
                                        <span className={modulo.faltas >= 25 ? "condicion-libre" : "condicion-regular"}>
                                            {modulo.faltas >= 25 ? "Libre" : "Regular"}
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
            <strong>{valor || "-"}</strong>
        </div>
    );
}

function EstadoModulo({ estado }) {
    let clase = "estado-modulo";

    if (estado === "Aprobado") {
        clase += " estado-aprobado";
    } else if (estado === "Pendiente") {
        clase += " estado-pendiente";
    } else if (estado === "En curso") {
        clase += " estado-curso";
    } else {
        clase += " estado-no-cursado";
    }

    return <span className={clase}> {estado} </span>;
}

