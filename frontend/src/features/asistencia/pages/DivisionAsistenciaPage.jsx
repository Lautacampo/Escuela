import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getAlumnos , getAsistencias , setAsistencia } from "../services/AsistenciaServices.js";
import { AsistenciaAlumnos } from "../components/AsistenciaAlumnos.jsx";
import "../components/asistenciaAlumnos.css";

const LIMITE_FALTAS=25;

function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}


export function DivisionAsistenciaPage(){
    const { moduloId, division } = useParams();
    const [alumnos, setAlumnos] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [fecha, setFecha] = useState(hoy());
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [errorGuardar, setErrorGuardar] = useState(null);

    useEffect(()=> {
        async function cargar() {
            try{
                const [alum,asisten] = await Promise.all([getAlumnos(),getAsistencias()]);
                setAlumnos(alum);
                setAsistencias(asisten);
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

    const asistenciaDia={};
    const totales={};
    asistencias.forEach((r)=>{
        totales[r.alumnoId] = (totales[r.alumnoId] ?? 0)+r.falta;
        if (r.fecha == fecha) asistenciaDia[r.alumnoId]=r;
    });

    async function cambiarFalta(alumnoId, valor) {
    const existente = asistenciaDia[alumnoId];
    try {
      setErrorGuardar(null);
      const guardado = await setAsistencia({
        ...existente,
        alumnoId,
        fecha,
        falta: Number(valor),
      });
      setAsistencias((prev) =>
        existente
          ? prev.map((r) => (r.id === guardado.id ? guardado : r))
          : [...prev, guardado]
      );
    } catch (e) {
      setErrorGuardar(e.message);
    }
  }

    return(
        <section className="pagina-asistencia-division">
            <Link to="/gestion/asistencia"className="btn-volver-calificaciones"><span aria-hidden="true">←</span>Volver</Link>
            <h2>Módulo {moduloId} - División {division}</h2>
            {errorGuardar && <p className="error-asistencia" role="alert">{errorGuardar}</p>}
            <AsistenciaAlumnos
                alumnos={alumnosDivision}
                moduloId={moduloId}
                division={division}
                fecha={fecha}
                onCambiarFecha={setFecha}
                registrosDia={asistenciaDia}
                totales={totales}
                limite={LIMITE_FALTAS}
                onCambiar={cambiarFalta}
            />
        </section>
    );

}