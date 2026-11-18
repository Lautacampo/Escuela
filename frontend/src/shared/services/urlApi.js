// Dirección del backend a partir de VITE_API_URL.
//
// Todas las rutas de la API cuelgan de "/api". Si en Vercel (o en el .env
// local) la variable se carga sin "/api", con una barra al final o con
// "/api" repetido, el login respondía "Ruta no encontrada". Acá se acepta
// cualquiera de esas formas y siempre se devuelve ".../api", sin barra final:
//   https://escuela.onrender.com          -> https://escuela.onrender.com/api
//   https://escuela.onrender.com/api/     -> https://escuela.onrender.com/api
//   https://escuela.onrender.com/api/api  -> https://escuela.onrender.com/api
// Si la variable está vacía devuelve "" (api.js usa entonces el backend local).
export function normalizarUrlApi(url) {
  const limpia = String(url ?? "").trim().replace(/\/+$/, "");
  if (!limpia) return "";
  return `${limpia.replace(/(\/api)+$/i, "")}/api`;
}
