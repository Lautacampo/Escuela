import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getAlumnos } from "../services/AsistenciaServices.js";
import { AsistenciaAlumnos } from "../components/AsistenciaAlumnos.jsx";
import "../components/asistenciaAlumnos.css";

export function DivisionAsistenciaPage(){
    const { moduloId, division } = useParams();
    const [alumnos, setAlumnos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(()=> {
        async function cargar() {
            try{
                const datos = await getAlumnos();
                setAlumnos(datos);
            }catch(e){
                setError(e.message);
            }finally{
                setCargando(false);
            }
        }
        cargar();
    },[]);

    if (cargando) return <p>Cargando...</p>;
    if (error) return <p>{error}</p>;

    const alumnosDivision = alumnos.filter(
        (a) => a.moduloId === Number(moduloId) && a.division === division
    ).sort((a, b) =>
        a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" }) ||
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    );

    return(
        <section className="pagina-asistencia-division">
            <Link to="/gestion/asistencia"className="btn-volver-calificaciones"><span aria-hidden="true">←</span>Volver</Link>
            <h2>Módulo {moduloId} - División {division}</h2>
            <AsistenciaAlumnos
                alumnos={alumnosDivision}
                moduloId={moduloId}
                division={division}
            />
        </section>
    )

}