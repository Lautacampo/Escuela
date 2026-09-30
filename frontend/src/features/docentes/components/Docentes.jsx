import { useState } from "react";
import { useForm } from "../../../shared/hooks/useForm";
import { esEmailValido, esDniValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre } from "../../../shared/utils/formato";

// Datos ficticios para mostrar el funcionamiento del frontend.
const DOCENTES_MOCK = [
  {
    id: 1,
    nombre: "Lucía",
    apellido: "Pérez",
    dni: "30123456",
    email: "lucia.perez@example.com",
    telefono: "",
    materias: "Lengua y Literatura",
    observaciones: "",
  },
  {
    id: 2,
    nombre: "Martín",
    apellido: "Gómez",
    dni: "32876543",
    email: "martin.gomez@example.com",
    telefono: "",
    materias: "Matemáticas",
    observaciones: "",
  },
];

export function Docentes() {
  // LISTADO Y BÚSQUEDA
  const [docentes, setDocentes] = useState(DOCENTES_MOCK);
  const [busqueda, setBusqueda] = useState("");

  // ERRORES Y MENSAJE DE CONFIRMACIÓN
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");

  // FORMULARIO
  const { valores, manejarCambio, resetearFormulario } = useForm({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    materias: "",
    observaciones: "",
  });

  // FILTRAR DOCENTES
  const docentesFiltrados = docentes.filter((docente) => {
    const texto = busqueda.trim().toLowerCase();

    const apellidoNombre =
      `${docente.apellido} ${docente.nombre}`.toLowerCase();

    const nombreApellido =
      `${docente.nombre} ${docente.apellido}`.toLowerCase();

    return (
      apellidoNombre.includes(texto) ||
      nombreApellido.includes(texto) ||
      String(docente.dni).includes(texto)
    );
  });

  // LIMPIAR FORMULARIO Y MENSAJES
  const limpiarFormulario = () => {
    resetearFormulario();
    setErrores({});
    setMensaje("");
  };

  // REGISTRAR DOCENTE
  const handleSubmit = (e) => {
    e.preventDefault();
    setMensaje("");

    const nuevosErrores = {};

    const nombre = valores.nombre.trim();
    const apellido = valores.apellido.trim();
    const dni = valores.dni.trim();
    const email = valores.email.trim();
    const materias = valores.materias.trim();

    if (!nombre) {
      nuevosErrores.nombre = "Ingresá el nombre.";
    }

    if (!apellido) {
      nuevosErrores.apellido = "Ingresá el apellido.";
    }

    if (!/^\d{1,8}$/.test(dni) || !esDniValido(dni)) {
      nuevosErrores.dni = "Ingresá un DNI válido, sin puntos ni espacios.";
    } else {
      const dniRepetido = docentes.some(
        (docente) => Number(docente.dni) === Number(dni),
      );

      if (dniRepetido) {
        nuevosErrores.dni = "Ya existe un docente registrado con ese DNI.";
      }
    }

    if (!email || !esEmailValido(email)) {
      nuevosErrores.email = "Ingresá un correo electrónico válido.";
    }

    if (!materias) {
      nuevosErrores.materias = "Ingresá las materias o la especialidad.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    const nuevoDocente = {
      id: crypto.randomUUID(),
      nombre: capitalizarNombre(nombre),
      apellido: capitalizarNombre(apellido),
      dni: String(Number(dni)),
      email,
      telefono: valores.telefono.trim(),
      materias,
      observaciones: valores.observaciones.trim(),
    };

    setDocentes((actuales) => [...actuales, nuevoDocente]);

    resetearFormulario();
    setBusqueda("");

    setMensaje(
      `Docente ${nuevoDocente.nombre} ${nuevoDocente.apellido} agregado al listado.`,
    );
  };

  return (
    <>
      <h1>Gestión de Docentes</h1>

      {mensaje && <p role="status">{mensaje}</p>}

      {/* ==================== LISTADO ==================== */}
      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <h2>Listado de Docentes</h2>
        </div>

        <div className="barra-filtros">
          <div className="form-group form-group-buscador">
            <label htmlFor="buscar-docente">Buscar docente</label>

            <input
              type="search"
              id="buscar-docente"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, apellido o DNI"
              className="input-gestion"
            />
          </div>
        </div>

        <p>
          Mostrando {docentesFiltrados.length} de {docentes.length} docentes.
        </p>

        <div className="tabla-responsive">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th scope="col">Apellido y nombre</th>
                <th scope="col">DNI</th>
                <th scope="col">Correo electrónico</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Materias / especialidad</th>
              </tr>
            </thead>

            <tbody>
              {docentesFiltrados.map((docente) => (
                <tr key={docente.id}>
                  <td>
                    {docente.apellido}, {docente.nombre}
                  </td>
                  <td>{docente.dni}</td>
                  <td>{docente.email}</td>
                  <td>{docente.telefono || "Sin informar"}</td>
                  <td>{docente.materias}</td>
                </tr>
              ))}

              {docentesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    No se encontraron docentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== FORMULARIO ==================== */}
      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <h2>Registrar docente</h2>
        </div>

        <p>Los campos con * son obligatorios.</p>

        <form onSubmit={handleSubmit} className="form-gestion" noValidate>
          {/* Mostramos los errores de validación */}
          {Object.keys(errores).length > 0 && (
            <div role="alert" className="mensaje-error">
              <ul>
                {Object.entries(errores).map(([campo, error]) => (
                  <li key={campo}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="docente-nombre">Nombre *</label>
              <input
                type="text"
                id="docente-nombre"
                name="nombre"
                value={valores.nombre}
                onChange={manejarCambio}
                required
                className="input-gestion"
                aria-invalid={Boolean(errores.nombre)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="docente-apellido">Apellido *</label>
              <input
                type="text"
                id="docente-apellido"
                name="apellido"
                value={valores.apellido}
                onChange={manejarCambio}
                required
                className="input-gestion"
                aria-invalid={Boolean(errores.apellido)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="docente-dni">DNI *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                id="docente-dni"
                name="dni"
                value={valores.dni}
                onChange={manejarCambio}
                placeholder="Sin puntos ni espacios"
                required
                className="input-gestion"
                aria-invalid={Boolean(errores.dni)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="docente-email">Correo electrónico *</label>
              <input
                type="email"
                id="docente-email"
                name="email"
                value={valores.email}
                onChange={manejarCambio}
                required
                className="input-gestion"
                aria-invalid={Boolean(errores.email)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="docente-telefono">Teléfono</label>
              <input
                type="tel"
                id="docente-telefono"
                name="telefono"
                value={valores.telefono}
                onChange={manejarCambio}
                className="input-gestion"
              />
            </div>

            <div className="form-group">
              <label htmlFor="docente-materias">
                Materias / especialidad *
              </label>
              <input
                type="text"
                id="docente-materias"
                name="materias"
                value={valores.materias}
                onChange={manejarCambio}
                placeholder="Ej.: Historia y Educación Cívica"
                required
                className="input-gestion"
                aria-invalid={Boolean(errores.materias)}
              />
            </div>
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="docente-observaciones">Observaciones</label>
            <textarea
              id="docente-observaciones"
              name="observaciones"
              rows="4"
              value={valores.observaciones}
              onChange={manejarCambio}
              className="input-gestion"
            />
          </div>

          <div className="acciones-formulario">
            <button type="submit" className="btn-primario-gestion">
              Registrar docente
            </button>

            <button
              type="button"
              onClick={limpiarFormulario}
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
