export const permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    return res.status(403).json({ error: "No tienes permiso para esta acción" });
  }
  next();
};