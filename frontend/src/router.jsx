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
import { SinpermisoPage } from "./features/auth/pages/Sinpermiso";
import {yahaySesion, controlSesion,}from "./features/auth/services/authServices";
import {ROLES}from"./features/auth/roles"
const {DIRECTIVO, DOCENTE, PRECEPTOR}=ROLES;


// ==================== VISTAS PRIVADAS (GESTIÓN) ====================
import { DashboardPage } from "./features/gestion/pages/DashboardPage";
import { AlumnosPage } from "./features/alumnos/pages/AlumnosPage";
import { DocentesPages } from "./features/docentes/pages/DocentesPage";
import { PreceptoresPage } from "./features/preceptores/pages/PreceptoresPage";
import { FichaAlumnoPage } from "./features/alumnos/pages/FichaAlumnoPage";
import { AsistenciaPage } from "./features/asistencia/pages/AsistenciaPage";
import { DivisionAsistenciaPage } from "./features/asistencia/pages/DivisionAsistenciaPage";
import { CalificacionesPage } from "./features/calificaciones/pages/CalificacionesPage";
import { DivisionCalificacionesPage } from "./features/calificaciones/pages/DivisionCalificacionesPage";
import { PlanEstudiosPage } from "./features/planestudios/pages/PlanEstudiosPage";
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
    loader: yahaySesion,
    hydrateFallbackElement: <Spinner />,
  },

  // ---------- VISTA PRIVADA (SISTEMA DE GESTIÓN) ----------
  {
    path: "/gestion",
    element: <LayoutPrivado />,
    loader: controlSesion(),
    hydrateFallbackElement: <Spinner />,
    errorElement: <NoEncontradaPage />,
    children: [
      { index: true, element: <DashboardPage /> }, // Panel de Inicio por defecto
      {path: "sin-permiso", element:<SinpermisoPage/>},
      // rutas segun el rol
      //solo directivo
      { path: "alumnos", element: <AlumnosPage />, loader: controlSesion([DIRECTIVO]) },
      { path: "alumnos/:id", element: <FichaAlumnoPage />, loader: controlSesion([DIRECTIVO]) },
      { path: "docentes", element: <DocentesPages />, loader: controlSesion([DIRECTIVO]) },
      { path: "preceptores", element: <PreceptoresPage />, loader: controlSesion([DIRECTIVO]) },
      { path: "plan-estudios", element: <PlanEstudiosPage />, loader: controlSesion([DIRECTIVO]) },
      { path: "reportes", element: <ReportesPage />, loader: controlSesion([DIRECTIVO]) },
      //directio y preceptor
      { path: "asistencia", element: <AsistenciaPage />, loader: controlSesion([DIRECTIVO, PRECEPTOR]) },
      {
        path: "asistencia/:moduloId/:division",
        element: <DivisionAsistenciaPage />,
        loader: controlSesion([DIRECTIVO, PRECEPTOR]),
      },
      //directivo y docente
      { path: "calificaciones", element: <CalificacionesPage />, loader: controlSesion([DIRECTIVO, DOCENTE]) },
      {
        path: "calificaciones/:moduloId/:division",
        element: <DivisionCalificacionesPage />,
        loader: controlSesion([DIRECTIVO, DOCENTE]),
      },
    ],
  },
]);
