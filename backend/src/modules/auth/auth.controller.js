import * as authService from "./auth.service.js";


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son obligatorios" });
    }

    const resultado = await authService.autenticar(email, password);
    res.json(resultado);
  } catch (err) {
    if (err.message === "Credenciales inválidas") {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
};


export const registro = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body ?? {};

    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({
        error: "Nombre, apellido, email, password y rol son obligatorios",
      });
    }

    const nuevoUsuario = await authService.registrar({ nombre, apellido, email, password, rol });
    res.status(201).json({ ...nuevoUsuario, rol });

  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Ya existe un usuario con ese email" });
    }
    if (err.message === "Rol inválido" || err.message === "La contraseña es muy corta") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};


export const perfil = (req, res) => {
  res.json(req.usuario); 
};