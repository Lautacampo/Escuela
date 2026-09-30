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
    );

    return(
        <section className="pagina-asistencia-division">
            <Link className="btn-volver-asistencia" to="/gestion/asistencia">← Volver</Link>
            <AsistenciaAlumnos
                alumnos={alumnosDivision}
                moduloId={moduloId}
                division={division}
            />
        </section>
    )

}