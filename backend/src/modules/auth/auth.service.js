import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import * as authRepository from "./auth.repository.js";

const SALT_ROUNDS = 10;
const ROLES_VALIDOS = ["directivo", "docente", "preceptor"];

export const autenticar = async (email, password) => {
  const usuario = await authRepository.buscarPorEmail(email);
  const coincide = usuario && usuario.activo && (await bcrypt.compare(password, usuario.contrahash));

  if (!coincide) throw new Error("Credenciales inválidas");

  const datos = {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: usuario.rol,
  };

  const token = jwt.sign(datos, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  return { token, usuario: datos };
};

export const registrar = async ({ nombre, apellido, email, password, rol }) => {
  if (!ROLES_VALIDOS.includes(rol)) {
    throw new Error("Rol inválido");
  }
  if (password.length < 4) {
    throw new Error("La contraseña es muy corta");
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  
 
  return await authRepository.crearUsuario({ nombre, apellido, email, hash, rol });
};