export class HttpError extends Error {
  constructor(status, message, detalle) {
    super(message);
    this.status = status;
    this.detalle = detalle;
  }
}