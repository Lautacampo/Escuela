export const errorHandler = (err, req, res, next) => {
  if (err.status) {
    return res.status(err.status).json({ error: err.message, ...err.detalle });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
};