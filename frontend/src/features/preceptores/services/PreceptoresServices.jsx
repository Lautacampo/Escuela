import { apiFetch } from "../../../shared/services/api.js";
 
export async function getPreceptores() {
    return apiFetch("/preceptores");
}

export async function setPreceptor(preceptor) {
  const{id, ...datos} = preceptor;
  return apiFetch(id?`/preceptores/${id}` : `/preceptores`,  {
    method: id? "PUT" : "POST",
    body: JSON.stringify(datos),
  });
}
 
export async function borrarPreceptor(id) {
  await apiFetch(`/preceptores/${id}`, { method: "DELETE" });
}

export const getCursos = () => apiFetch("/preceptores/cursos");

export const asignarCursos = (preceptorId, cursoIds) =>
  apiFetch(`/preceptores/${preceptorId}/cursos`, {
    method: "PUT",
    body: JSON.stringify({ cursoIds }),
  });
