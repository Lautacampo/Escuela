import { listar } from "../utils/correlatividades";

/**
 * Bloque del formulario de matrícula que aparece cuando el módulo elegido
 * tiene correlativos que el alumno nunca cursó en la escuela: solo puede
 * matricularse si los acredita por equivalencia (Res. N.º 195-ME-2024).
 */
export function IngresoEquivalencia({
  idBase,
  modulo,
  modulosPrevios,
  valor,
  onCambiar,
  error,
}) {
  const nombres = listar(modulosPrevios.map((m) => m.nombre));

  return (
    <div className="ingreso-equivalencia">
      <p>
        <i className="fa-solid fa-circle-info" aria-hidden="true"></i>{" "}
        <strong>Ingreso por equivalencia.</strong> Para cursar {modulo} el
        alumno debe tener aprobados {nombres}. Si los cursó en otra
        institución, registrá la equivalencia; de lo contrario debe comenzar
        por esos módulos.
      </p>

      <label className="ingreso-equivalencia-confirmar" htmlFor={`${idBase}-confirma`}>
        <input
          type="checkbox"
          id={`${idBase}-confirma`}
          checked={valor.confirma}
          onChange={(e) => onCambiar({ ...valor, confirma: e.target.checked })}
        />
        El alumno acredita por equivalencia {nombres}
      </label>

      <div className="form-group">
        <label htmlFor={`${idBase}-observacion`}>
          Institución de origen / norma que respalda la equivalencia *
        </label>
        <input
          type="text"
          id={`${idBase}-observacion`}
          className={`input-gestion ${error ? "input-error" : ""}`}
          maxLength={300}
          placeholder="Ej.: 2.º año completo en Escuela N.º 12 — Res. 195, Tabla 3"
          value={valor.observacion}
          onChange={(e) => onCambiar({ ...valor, observacion: e.target.value })}
          disabled={!valor.confirma}
        />
      </div>

      {error && (
        <span className="mensaje-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
