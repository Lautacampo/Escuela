import React from "react";
import { Link } from "react-router";

export default function NoEncontradaPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "var(--color-fondo)",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1
        style={{
          fontSize: "6rem",
          color: "var(--color-secundario)",
          margin: "0",
        }}
      >
        404
      </h1>
      <h2 style={{ fontSize: "2rem", color: "white", marginBottom: "20px" }}>
        Página no encontrada
      </h2>
      <p
        style={{
          color: "var(--color-texto)",
          marginBottom: "40px",
          maxWidth: "500px",
        }}
      >
        Lo sentimos, la página que estás buscando no existe, ha sido movida o
        está temporalmente fuera de servicio.
      </p>

      {/* Botón para volver al inicio usando los estilos globales */}
      <Link to="/" className="btn-principal">
        <i className="fa-solid fa-house" style={{ marginRight: "10px" }}></i>
        Volver al inicio
      </Link>
    </div>
  );
}
