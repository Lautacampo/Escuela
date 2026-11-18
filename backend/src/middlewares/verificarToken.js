import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';

// Middleware: se ejecuta ANTES del controller en las rutas protegidas.
// El cliente manda el token en el header:  Authorization: Bearer <token>
export const verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization; // "Bearer eyJhbGciOi..."

  // 1. ¿Vino el header con el formato correcto?
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta el token' });
  }

  // 2. Separar la palabra "Bearer" del token
  const token = authHeader.split(' ')[1];

  // 3. Verificar firma y vencimiento. Si algo falla, lanza un error
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    const mensaje = err.name === 'TokenExpiredError' ? 'Token vencido' : 'Token inválido';
    return res.status(401).json({ error: mensaje });
  }

  // 4. El token sigue siendo válido mientras el usuario esté activo. Si el
  //    directivo dio de baja o eliminó al docente o preceptor, su sesión
  //    abierta se corta en el próximo pedido (no hay que esperar a que venza).
  try {
    const { rows } = await pool.query(
      `SELECT u.activo, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
        WHERE u.id = $1`,
      [payload.id],
    );
    const usuario = rows[0];
    if (!usuario || !usuario.activo) {
      return res
        .status(401)
        .json({ error: 'Tu usuario ya no tiene acceso al sistema' });
    }

    // 5. Guardar los datos del usuario para que los use el controller
    req.usuario = {
      id: payload.id,
      nombre: payload.nombre,
      email: payload.email,
      rol: usuario.rol,
    };
    next(); // token válido y usuario activo: sigue hacia el controller
  } catch (err) {
    next(err);
  }
};
