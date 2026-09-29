export function capitalizarNombre(texto) {
  if (!texto) return "";
  return texto
    .split(" ")
    .map(
      (palabra) =>
        palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase(),
    )
    .join(" ");
}

export function formatearDNI(dni) {
  return new Intl.NumberFormat("es-AR").format(dni);
}
