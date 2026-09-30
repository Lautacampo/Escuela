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
import {
  protegerRuta,
  redirigirSiHaySesion,
} from "./features/auth/services/authServices";

// ==================== VISTAS PRIVADAS (GESTIÓN) ====================
import { DashboardPage } from "./features/gestion/pages/DashboardPage";
import { AlumnosPage } from "./features/alumnos/pages/AlumnosPage";
import { AsistenciaPage } from "./features/asistencia/pages/AsistenciaPage";
import { DivisionAsistenciaPage } from "./features/asistencia/pages/DivisionAsistenciaPage";
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
    loader: redirigirSiHaySesion,
    hydrateFallbackElement: <Spinner />,
  },

  // ---------- VISTA PRIVADA (SISTEMA DE GESTIÓN) ----------
  {
    path: "/gestion",
    element: <LayoutPrivado />,
    loader: protegerRuta,
    hydrateFallbackElement: <Spinner />,
    errorElement: <NoEncontradaPage />,
    children: [
      { index: true, element: <DashboardPage /> }, // Panel de Inicio por defecto
      // Rutas anidadas
      { path: "alumnos", element: <AlumnosPage /> },
      { path: "asistencia", element: <AsistenciaPage /> },
      { path: "asistencia/:moduloId/:division", element: <DivisionAsistenciaPage /> },
      { path: "calificaciones", element: <CalificacionesPage />},
      { path: "calificaciones/:moduloId/:division", element: <DivisionCalificacionesPage /> },
      { path: "reportes", element: <ReportesPage /> },
    ],
  },
]);
