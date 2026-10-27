import { apifetch } from "../../../shared/services/api.js";
 
export async function getPreceptores() {
    return apifetch("/preceptores");
}

export async function setPreceptor(preceptor) {
  const{id, ...datos} = preceptor;
  return apifetch(id?`/preceptores/${id}` : `/preceptores`,  {
    method: id? "PUT" : "POST",
    body: JSON.stringify(datos),
  });
}
 
export async function borrarPreceptor(id) {
  await apiFetch(`/preceptores/${id}`, { method: "DELETE" });
}