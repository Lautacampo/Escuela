import * as authService from "./auth.service.js";
import {
  minutosDeBloqueo,
  registrarExitoso,
  registrarFallido,
} from "../../utils/intentosLogin.js";

// POST /api/auth/login
export const login = async (req, res, next) => {
  // El correo no distingue mayúsculas ni espacios al principio o al final.
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = req.body?.password;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son obligatorios" });
    }
    if (typeof req.body.email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email y password deben ser texto" });
    }

    const espera = minutosDeBloqueo(req.ip, email);
    if (espera > 0) {
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Probá de nuevo en ${espera} minuto${espera === 1 ? "" : "s"}.`,
      });
    }

    const resultado = await authService.autenticar(email, password);
    registrarExitoso(req.ip, email);
    res.json(resultado);
  } catch (err) {
    if (err.status === 401) registrarFallido(req.ip, email);
    next(err);
  }
};

// POST /api/auth/registro
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
      err.status = 409;
      err.message = "Ya existe un usuario con ese email";
    }
    next(err);
  }
};

// GET /api/auth/perfil (protegida)
export const perfil = (req, res) => {
  res.json(req.usuario);
};
