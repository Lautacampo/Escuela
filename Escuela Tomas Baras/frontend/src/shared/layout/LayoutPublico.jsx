import { Outlet } from "react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";

function LayoutPublico() {
  return (
    <>
      <Navbar />

      {/* El main envuelve el contenido central */}
      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default LayoutPublico;
