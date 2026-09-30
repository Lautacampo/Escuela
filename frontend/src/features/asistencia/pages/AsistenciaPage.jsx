import { useEffect, useState } from "react";
import { getModulos } from "../services/AsistenciaServices";
import { AsistenciaTarjetas } from "../components/AsistenciaTarjetas";


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

  return (
    <section>
      <h2>Asistencia</h2>
      <div className="modulosdivision">
        {modulos.map((modulo)=> (
          <AsistenciaTarjetas key={modulo.id} modulo={modulo}/>
        ))}
      </div>
    </section>
  );
}
