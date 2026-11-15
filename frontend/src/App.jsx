import { RouterProvider } from "react-router/dom";
import { SesionProvider } from "./features/auth/context/SesionProvider";
import { router } from "./router";

function App() {
  return (
    <SesionProvider>
      <RouterProvider router={router} />
    </SesionProvider>
  );
}

export default App;
