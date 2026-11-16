// Error de dominio lanzado desde un repository DENTRO de una transacción.
// Al propagarse hace ROLLBACK; el service lo traduce a un HttpError.
export class ReglaNegocio extends Error {
  constructor(motivo, datos = {}) {
    super(motivo);
    this.name = "ReglaNegocio";
    this.motivo = motivo;
    this.datos = datos;
  }
}
