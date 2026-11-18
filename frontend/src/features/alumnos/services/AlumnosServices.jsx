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

// Ficha completa: trayectoria, módulo de ingreso y, por cada cursada, sus
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

// Primera matrícula del alumno: puede ser en cualquier módulo (su ingreso).
export async function matricularAlumno(idAlumno, idCurso, idModulo) {
  return apiFetch(`/alumnos/${idAlumno}/cursadas`, {
    method: "POST",
    body: JSON.stringify({ idCurso, idModulo }),
  });
}

// Cambio de curso, división o módulo. También inscribe para recursar.
export async function actualizarMatricula(idAlumno, idCurso, idModulo) {
  return apiFetch(`/alumnos/${idAlumno}/cursadas`, {
    method: "PUT",
    body: JSON.stringify({ idCurso, idModulo }),
  });
}
