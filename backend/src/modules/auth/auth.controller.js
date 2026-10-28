import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";
import { env } from "../../config/env.js";

const SALT_ROUNDS = 10;
const ROLES_VALIDOS = ["directivo", "docente", "preceptor"];

// POST /api/auth/registro
export const registro = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body ?? {};

    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({
        error: "Nombre, apellido, email, password y rol son obligatorios",
      });
    }
    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ error: "Rol inválido" });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "La contraseña es muy corta" });
    }

    // Nunca se guarda la contraseña: se guarda su hash
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, contrahash, rol_id)
       VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE nombre = $5))
       RETURNING id, nombre, apellido, email`,
      [nombre, apellido, email, hash, rol],
    );

    res.status(201).json({ ...rows[0], rol });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Ya existe un usuario con ese email" });
    }
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son obligatorios" });
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.contrahash, u.activo,
              r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
        WHERE u.email = $1`,
      [email],
    );
    const usuario = rows[0];

    const coincide =
      usuario && usuario.activo && (await bcrypt.compare(password, usuario.contrahash));

    if (!coincide) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const datos = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
    };

    const token = jwt.sign(datos, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    res.json({ token, usuario: datos });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/perfil (protegida)
export const perfil = (req, res) => {
  res.json(req.usuario);
};