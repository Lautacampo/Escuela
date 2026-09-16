import { createBrowserRouter } from "react-router";
import LayoutPublico from "./shared/layout/LayoutPublico";
import LayoutPrivado from "./shared/layout/LayoutPrivado";
import { HomePage } from "./features/home/HomePage";
import { PreinscripcionPage } from "./features/preinscripcion/PreinscripcionPage";
import { ForoPage } from "./features/foro/ForoPage";
import { LoginPage } from "./features/login/LoginPage";
import { DashboardPage } from "./features/gestion/DashboardPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <LayoutPublico />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "preinscripcion", element: <PreinscripcionPage /> },
      { path: "foro", element: <ForoPage /> },
    ],
  },
  {
    path: "/gestion",
    element: <LayoutPrivado />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
]);
