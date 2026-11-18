import { apiFetch } from "../../../shared/services/api.js";

export async function getAlumnos(incluirInactivos = false) {
  return apiFetch(
    incluirInactivos ? "/alumnos?incluirInactivos=true" : "/alumnos"
  );
}

// Alumnos que completaron los 6 módulos. Su legajo es de solo lectura.
export async function getAlumnosEgresados() {
  return apiFetch("/alumnos?egresados=true");
}

// Ficha completa: trayectoria, equivalencias y, por cada cursada, sus
// materias y si admite una evaluación de módulo.
export async function getAlumno(id) {
  return apiFetch(`/alumnos/${id}`);
}

// Cursos del ciclo vigente con sus módulos y las correlativas de cada uno.
export async function getCursos() {
  return apiFetch("/cursos");
}

export async function setAlumno(alumno) {
  return apiFetch(alumno.id ? `/alumnos/${alumno.id}` : "/alumnos", {
    method: alumno.id ? "PUT" : "POST",
    body: JSON.stringify(alumno),
  });
}

// Vuelve a dar de alta a un alumno dado de baja, con su matrícula e historial.
export async function reactivarAlumno(id) {
  return apiFetch(`/alumnos/${id}/reactivar`, { method: "PATCH" });
}

export async function borrarAlumno(id) {
  // Baja lógica: el backend conserva el historial y marca al alumno
  // como inactivo. Ya no hace falta borrar asistencias ni notas.
  await apiFetch(`/alumnos/${id}`, { method: "DELETE" });
}

// `ingreso` es opcional: { equivalencias: [idModulo...], observacion } para
// un alumno que empieza en un módulo avanzado acreditando los anteriores.
function cuerpoMatricula(idCurso, idModulo, ingreso) {
  return JSON.stringify({
    idCurso,
    idModulo,
    ...(ingreso?.equivalencias?.length
      ? {
          equivalencias: ingreso.equivalencias,
          observacionEquivalencia: ingreso.observacion,
        }
      : {}),
  });
}

// Primera matrícula del alumno.
export async function matricularAlumno(idAlumno, idCurso, idModulo, ingreso) {
  return apiFetch(`/alumnos/${idAlumno}/cursadas`, {
    method: "POST",
    body: cuerpoMatricula(idCurso, idModulo, ingreso),
  });
}

// Cambio de curso, división o módulo. También inscribe para recursar.
export async function actualizarMatricula(idAlumno, idCurso, idModulo, ingreso) {
  return apiFetch(`/alumnos/${idAlumno}/cursadas`, {
    method: "PUT",
    body: cuerpoMatricula(idCurso, idModulo, ingreso),
  });
}

export async function registrarEquivalencias(idAlumno, modulosIds, observacion) {
  return apiFetch(`/alumnos/${idAlumno}/equivalencias`, {
    method: "POST",
    body: JSON.stringify({ modulosIds, observacion }),
  });
}
