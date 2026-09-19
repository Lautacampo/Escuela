import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";

function LayoutPublico() {
  const [mostrarBoton, setMostrarBoton] = useState(false);

  useEffect(() => {
    const controlarBoton = () => {
      setMostrarBoton(window.scrollY > 300);
    };
    window.addEventListener("scroll", controlarBoton);
    return () => window.removeEventListener("scroll", controlarBoton);
  }, []);

  const volverArriba = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />

      <button
        className={`btn-arriba ${mostrarBoton ? "visible" : ""}`}
        id="btn-arriba"
        aria-label="Volver arriba"
        title="Volver arriba"
        onClick={volverArriba}
      >
        <i className="fa-solid fa-arrow-up"></i>
      </button>
    </>
  );
}

export default LayoutPublico;
