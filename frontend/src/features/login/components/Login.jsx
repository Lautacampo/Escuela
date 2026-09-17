import './login.css';
import { useNavigate } from 'react-router';
import { useState } from "react";

export default function Login() {
    const navegador = useNavigate();

    const [credenciales, setCredenciales] = useState({
        mail: "",
        contrasena: ""
    });

    //msj error
    const [error, setError] = useState("");

    
    const handleChange = (e) => {
        setCredenciales({
            ...credenciales,
            [e.target.name]: e.target.value
        });
        // si hay error se borra
        setError(""); 
    };

    
    const handleSubmit = (e) => {
        e.preventDefault();

        //simula validacion de credenciales
        if (credenciales.mail === "admin@gmail.com" && credenciales.contrasena === "123456") {
            console.log("¡Login exitoso! Entrando...");
            // Si todo está bien lo mandamos 
            navegador("/"); 
        } else {
            // si esta mal mensaje de error
            setError("Correo o contraseña incorrectos. Intente nuevamente.");
        }
    };

    return (
        <section className="login-pagina">
            <section className="login-contenedor" aria-labelledby="titulo-login">
                
                <div className="login-presentacion">
                    <div className="login-imagen-sistema">
                        <img src="../public/logo-tomas-baras-letras-blancas.png" alt="Foto del sistema" />
                    </div>
                    
                    <h1>Colegio N° 3<br />Tomás Baras</h1> 
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
                        
                        {/* Si el estado "error" tiene textose muestar aca*/}
                        {error && (
                            <p style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>
                                {error}
                            </p>
                        )}

                        <button className="login-boton" type="submit">Ingresar al sistema</button>
                    </form>

                    <p className="login-ayuda">Si no podés ingresar, comunicate con la administración.</p>
                </div>
                
            </section>
        </section>
    );
}