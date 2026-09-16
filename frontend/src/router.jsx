import { createBrowserRouter } from "react-router";
import LayoutPublico from "./shared/layout/LayoutPublico";
import { HomePage } from "./features/home/HomePage";

// import LoginPage from './features/auth/pages/LoginPage';
// import PreinscripcionPage from './features/preinscripcion/pages/PreinscripcionPage';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutPublico />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },

      /*
      { 
        path: 'preinscripcion', 
        element: <PreinscripcionPage /> 
      },
      { 
        path: 'login', 
        element: <LoginPage /> 
      }
      */
    ],
  },
]);
