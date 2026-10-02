import { useEffect, useState } from "react";
import { getModulos } from "../services/AsistenciaServices";
import { AsistenciaTarjetas } from "../components/AsistenciaTarjetas";
import "../components/asistenciaTarjetas.css";


export function AsistenciaPage() {
  const[modulos, setModulos] = useState([]);
  const[cargando, setCargando]=useState(true);
  const[error, setError]=useState(null);

  useEffect (()=>
  {
    async function cargar(){
      try{
        const datos= await getModulos();
        setModulos(datos);
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

  const grupos = [
    { titulo: "Primer Año", modulos: modulos.filter((m) => Number(m.id) <= 2) },
    { titulo: "Segundo Año", modulos: modulos.filter((m) => Number(m.id) >= 3 && Number(m.id) <= 4) },
    { titulo: "Tercer Año", modulos: modulos.filter((m) => Number(m.id) >= 5 && Number(m.id) <= 6) },
  ];

  return (
    <section className="pagina-asistencia-modulos">
      <h2>Asistencia</h2>
      {grupos.map((grupo) => (
          <div key={grupo.titulo} className="anio-grupo">
            <h3 className="anio-titulo">{grupo.titulo}</h3>
            <div className="modulosdivision">
              {grupo.modulos.map((modulo)=> (
                <AsistenciaTarjetas key={modulo.id} modulo={modulo}/>
              ))}
            </div>
          </div>
      ))}
    </section>
  );
}
