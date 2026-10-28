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
    next(err); 
  }
};

export const registro = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body ?? {};

    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({ error: "Nombre, apellido, email, password y rol son obligatorios" });
    }

    const nuevoUsuario = await authService.registrar({ nombre, apellido, email, password, rol });
    res.status(201).json({ ...nuevoUsuario, rol });

  } catch (err) {
    if (err.code === "23505") { 
      err.status = 409;
      err.message = "Ya existe un usuario con ese email";
    }
    next(err);
  }
};

export const perfil = (req, res) => {
  res.json(req.usuario); 
};