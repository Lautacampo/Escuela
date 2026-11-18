export const errorHandler = (err, req, res, next) => {
  if (err.status) {
    return res.status(err.status).json({ error: err.message, ...err.detalle });
  }
  // Reglas académicas rechazadas por un trigger de la base (RAISE EXCEPTION).
  if (err.code === "P0001") {
    return res.status(409).json({ error: err.message });
  }
  if (err.code === "23505") {
    return res.status(409).json({ error: "Ya existe un registro con ese dato (DNI, CUIL o correo)" });
  }
  // Un id o un número fuera del rango de la base (por ejemplo /alumnos/99999999999)
  // o con un formato que la base no acepta: es un dato inválido, no un error interno.
  if (err.code === "22003" || err.code === "22P02") {
    return res.status(400).json({ error: "Dato numérico fuera de rango o con formato inválido" });
  }
  if (err.code === "23503") {
    return res.status(409).json({ error: "No se puede completar: hay registros asociados (por ejemplo, cursos a cargo)" });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
};
