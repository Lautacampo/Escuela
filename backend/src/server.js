import app from "./app.js";
import { env } from "./config/env.js";
import { asegurarEsquema } from "./config/esquema.js";

// Sin JWT_SECRET no se pueden firmar ni verificar sesiones: mejor no arrancar
// que responder 500 en cada inicio de sesión.
if (!env.JWT_SECRET) {
  console.error("Falta la variable de entorno JWT_SECRET. Configurala en .env (local) o en Render.");
  process.exit(1);
}

app.listen(env.PORT, () => {
  console.log(`Servidor en http://localhost:${env.PORT}`);
  // Se verifica el esquema al iniciar; si la base no responde todavía, se
  // reintenta en el primer pedido.
  asegurarEsquema().catch((err) =>
    console.error("No se pudo verificar el esquema de la base:", err.message),
  );
});
