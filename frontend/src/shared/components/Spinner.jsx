import React from "react";

export default function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "var(--color-fondo)",
        color: "var(--color-tercero)",
      }}
    >
      {/* Usando FontAwesome (si lo tenés integrado) o podés usar un SVG animado */}
      <i
        className="fa-solid fa-circle-notch fa-spin fa-3x"
        style={{ marginBottom: "20px" }}
      ></i>
      <h2 style={{ fontFamily: "var(--fuente-encabezados)", color: "white" }}>
        Cargando sistema...
      </h2>
    </div>
  );
}
