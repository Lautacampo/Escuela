export const errorHandler = (err, req, res, next) => {
  if (err.status) {
    return res.status(err.status).json({ error: err.message, ...err.detalle });
  }
  if (err.code === "23505") {
    return res.status(409).json({ error: "Ya existe un registro con ese dato (DNI, CUIL o correo)" });
  }
  if (err.code === "23503") {
    return res.status(409).json({ error: "No se puede completar: hay registros asociados (por ejemplo, cursos a cargo)" });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
};