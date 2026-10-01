import { useState } from "react";
import { useNavigate } from "react-router";
import "./login.css";

export function Login() {
  const [credenciales, setCredenciales] = useState({
    mail: "",
    contrasena: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue sola
    console.log("Iniciando sesión con:", credenciales);

    // 1. CREAMOS LA SESIÓN SIMULADA
    localStorage.setItem("sistemaGestionAuth", "true");

    // 2. Redirigimos al panel de gestión
    navigate("/gestion");
  };
  return (
    <div className="login-body-wrapper">
      <main className="login-pagina">
        <section className="login-contenedor" aria-labelledby="titulo-login">
          <div className="login-presentacion">
            <div className="login-imagen-sistema">
              {/* Ajustá la ruta de la imagen si es necesario */}
              <img src="/img/logos/logo-principal.png" alt="Foto del sistema" />
            </div>
            <h1>
              Colegio N° 3<br />
              Tomás Baras
            </h1>
            <p>Accedé al sistema de gestión académica de la institución.</p>
          </div>

          <div className="login-formulario">
            <h2 id="titulo-login">Iniciar sesión</h2>
            <p className="login-subtitulo">Ingresá tus datos para continuar.</p>

            <form onSubmit={handleSubmit}>
              <div className="login-campo">
                <label htmlFor="mail">Correo</label>
                <input
                  type="email"
                  id="mail"
                  name="mail"
                  placeholder="ejemplo@gmail.com"
                  value={credenciales.mail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="login-campo">
                <label htmlFor="contrasena">Contraseña</label>
                <input
                  type="password"
                  id="contrasena"
                  name="contrasena"
                  placeholder="Ingresá tu contraseña"
                  autoComplete="current-password"
                  value={credenciales.contrasena}
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="login-boton" type="submit">
                Ingresar al sistema
              </button>
            </form>

            <p className="login-ayuda">
              Si no podés ingresar, comunicate con la administración.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
