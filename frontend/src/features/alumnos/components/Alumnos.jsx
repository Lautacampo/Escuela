import React, { useState } from "react";
import { useForm } from "../../../shared/hooks/useForm";
import { esEmailValido, esDniValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre } from "../../../shared/utils/formato";

export function Alumnos() {
  // 1. Usamos el Hook personalizado para manejar todo el formulario en una línea
  const { valores, manejarCambio, resetearFormulario } = useForm({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    fechaNacimiento: "",
    curso: "",
    observaciones: "",
  });

  const [errores, setErrores] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevosErrores = {};

    // 2. Usamos nuestras Validaciones
    if (!esDniValido(valores.dni)) {
      nuevosErrores.dni = "El DNI debe tener entre 1 y 99 millones";
    }
    if (!esEmailValido(valores.email)) {
      nuevosErrores.email = "Formato de correo inválido";
    }

    // Si hay errores, frenamos acá y los mostramos
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});

    // 3. Usamos nuestras herramientas de Formateo
    const nombreFormateado = capitalizarNombre(valores.nombre);
    const apellidoFormateado = capitalizarNombre(valores.apellido);

    console.log("Datos listos para enviar:", {
      ...valores,
      nombre: nombreFormateado,
      apellido: apellidoFormateado,
    });

    alert(
      `¡Alumno ${nombreFormateado} ${apellidoFormateado} registrado con éxito!`,
    );
    resetearFormulario();
  };

  return (
    <>
      <h1>Gestión de Alumnos</h1>
      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <h2>Registrar alumno</h2>
        </div>

        <form onSubmit={handleSubmit} className="form-gestion">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre:</label>
              {/* Conectamos el valor y la función de cambio del Hook */}
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={valores.nombre}
                onChange={manejarCambio}
                required
                className="input-gestion"
              />
            </div>
            <div className="form-group">
              <label htmlFor="apellido">Apellido:</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={valores.apellido}
                onChange={manejarCambio}
                required
                className="input-gestion"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dni">DNI:</label>
              <input
                type="number"
                id="dni"
                name="dni"
                value={valores.dni}
                onChange={manejarCambio}
                required
                className="input-gestion"
              />
              {/* Mostrar error si la validación falla */}
              {errores.dni && (
                <span style={{ color: "#bf1b1b", fontSize: "0.85rem" }}>
                  {errores.dni}
                </span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico:</label>
              <input
                type="text"
                id="email"
                name="email"
                value={valores.email}
                onChange={manejarCambio}
                required
                className="input-gestion"
              />
              {errores.email && (
                <span style={{ color: "#bf1b1b", fontSize: "0.85rem" }}>
                  {errores.email}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fechaNacimiento">Fecha de nacimiento:</label>
              <input
                type="date"
                id="fechaNacimiento"
                name="fechaNacimiento"
                value={valores.fechaNacimiento}
                onChange={manejarCambio}
                required
                className="input-gestion"
              />
            </div>
            <div className="form-group">
              <label htmlFor="curso">Curso:</label>
              <select
                id="curso"
                name="curso"
                value={valores.curso}
                onChange={manejarCambio}
                required
                className="input-gestion"
              >
                <option value="">Seleccione un curso</option>
                <option value="primero">Primer año</option>
                <option value="segundo">Segundo año</option>
                <option value="tercero">Tercer año</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ width: "100%" }}>
            <label htmlFor="observaciones">Observaciones:</label>
            <textarea
              id="observaciones"
              name="observaciones"
              rows="4"
              value={valores.observaciones}
              onChange={manejarCambio}
              className="input-gestion"
            ></textarea>
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              type="submit"
              className="btn-principal"
              style={{ padding: "10px 20px", fontSize: "1rem", border: "none" }}
            >
              Registrar alumno
            </button>
            <button
              type="button"
              onClick={resetearFormulario}
              className="btn-secundario"
            >
              Limpiar formulario
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
