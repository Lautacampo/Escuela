import { Link } from "react-router";

function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-md-6 col-lg-4">
            <section id="contacto">
              <h2>Contacto</h2>
              <p>
                <i className="fa-solid fa-location-dot"></i>
                <a
                  href="https://www.google.com/maps/place/Colegio+TOMAS+BARAS/@-33.3015241,-66.3274142,43m/data=!3m1!1e3!4m6!3m5!1s0x95d43eaa4a204741:0x65c68a2a42bef6b0!8m2!3d-33.3014951!4d-66.3274549!16s%2Fg%2F11cm11lqlv"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pringles y Av. Pte. Juan Domingo Perón, San Luis
                </a>
              </p>
              <p>
                <i className="fa-solid fa-phone"></i>
                <a href="tel:+542664517164"> 2664 517164 </a>
              </p>
            </section>

            <section id="horarios">
              <h2>Horarios de Atención</h2>
              <p>
                <i className="fa-solid fa-calendar-days"></i> Lunes a Viernes
              </p>
              <p>
                <i className="fa-solid fa-clock"></i> 19:30 a 23:30 hs
              </p>
            </section>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <section id="enlaces">
              <h2>Enlaces de Interés</h2>
              <ul>
                <li>
                  <a href="/#quienessomos"> ¿Quiénes Somos? </a>
                </li>
                <li>
                  <a href="/#historia-evolucion"> Historia </a>
                </li>
                <li>
                  <a href="/#equipo"> Equipo Docente </a>
                </li>
                {/* Enlace al Foro actualizado */}
                <li>
                  <Link to="/foro"> Foro </Link>
                </li>
                <li>
                  <Link to="/preinscripcion"> Preinscripción </Link>
                </li>
                <li>
                  <a href="/#contacto"> Contacto </a>
                </li>
                <li>
                  <Link to="/login"> Iniciar Sesión </Link>
                </li>
              </ul>
            </section>
          </div>

          <div className="col-12 col-lg-4">
            <section id="imgfooter">
              <Link to="/">
                <img
                  src="/img/logos/logo-tomas-baras-letras-blancas.png"
                  alt="Logo Colegio Tomás Baras"
                />
              </Link>

              <div id="redes-iconos">
                <a
                  href="https://www.facebook.com/tomas.baras.9"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  aria-label="Facebook del Colegio Tomás Baras"
                >
                  <i className="fa-brands fa-facebook"></i>
                </a>
                <a
                  href="https://www.instagram.com/colegio3tomas_baras/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  aria-label="Instagram del Colegio Tomás Baras"
                >
                  <i className="fa-brands fa-instagram"></i>
                </a>
              </div>
            </section>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <section id="finfooter">
              <p>Escuela Nocturna Secundaria de Adultos N°3 "Tomás Baras"</p>
              <p>&copy; 2026 Colegio Tomás Baras</p>
            </section>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
