import { createBrowserRouter } from "react-router";

// ==================== LAYOUTS ====================
import LayoutPublico from "./shared/layout/LayoutPublico";
import LayoutPrivado from "./shared/layout/LayoutPrivado";
import NoEncontradaPage from "./shared/pages/NoEncontradaPage";
import Spinner from "./shared/components/Spinner";

// ==================== VISTAS PÚBLICAS ====================
import { HomePage } from "./features/home/pages/HomePage";
import { PreinscripcionPage } from "./features/preinscripcion/pages/PreinscripcionPage";
import { ForoPage } from "./features/foro/pages/ForoPage";

// ==================== AUTENTICACIÓN ====================
import { LoginPage } from "./features/auth/pages/LoginPage";
//import {redirigirSiHaySesion,protegerRuta,} from

// ==================== VISTAS PRIVADAS (GESTIÓN) ====================
import { DashboardPage } from "./features/gestion/pages/DashboardPage";
import { AlumnosPage } from "./features/alumnos/pages/AlumnosPage";
import { FichaAlumnoPage } from "./features/alumnos/pages/FichaAlumnoPage";
import { DocentesPages } from "./features/docentes/pages/DocentesPage";
import { PreceptoresPage } from "./features/preceptores/pages/PreceptoresPage";
import { AsistenciaPage } from "./features/asistencia/pages/AsistenciaPage";
import { CalificacionesPage } from "./features/calificaciones/pages/CalificacionesPage";
import { DivisionCalificacionesPage } from "./features/calificaciones/pages/DivisionCalificacionesPage";
import { ReportesPage } from "./features/reportes/pages/ReportesPage";

export const router = createBrowserRouter([
  // ---------- VISTA PÚBLICA ----------
  {
    path: "/",
    element: <LayoutPublico />,
    errorElement: <NoEncontradaPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "preinscripcion", element: <PreinscripcionPage /> },
      { path: "foro", element: <ForoPage /> },
      { path: "*", element: <NoEncontradaPage /> },
    ],
  },

  // ---------- AUTENTICACIÓN (AISLADA) ----------
  {
    path: "/login",
    element: <LoginPage />,
    // loader: redirigirSiHaySesion, // Si el admin ya se logueó, lo patea a /gestion
    hydrateFallbackElement: <Spinner />,
  },

  // ---------- VISTA PRIVADA (SISTEMA DE GESTIÓN) ----------
  {
    path: "/gestion",
    element: <LayoutPrivado />,
    // loader: protegerRuta, // Bloquea la entrada si no hay sesión iniciada
    hydrateFallbackElement: <Spinner />,
    errorElement: <NoEncontradaPage />,
    children: [
      { index: true, element: <DashboardPage /> }, // Panel de Inicio por defecto
      // Rutas anidadas
      { path: "alumnos", element: <AlumnosPage /> },
      { path: "alumnos/:id", element: <FichaAlumnoPage /> },
      { path: "docentes", element: <DocentesPages /> },
      { path: "preceptores", element: <PreceptoresPage /> },
      { path: "asistencia", element: <AsistenciaPage /> },
      { path: "calificaciones", element: <CalificacionesPage /> },
      {
        path: "calificaciones/:moduloId/:division",
        element: <DivisionCalificacionesPage />,
      },
      { path: "reportes", element: <ReportesPage /> },
    ],
  },
]);
