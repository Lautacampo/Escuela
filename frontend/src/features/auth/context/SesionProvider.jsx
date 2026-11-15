import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  getSesionCompleta,
  login,
  logout,
  suscribirSesion,
} from "../services/authServices";
import { SesionContext } from "./SesionContext";

export function SesionProvider({ children }) {
  const sesion = useSyncExternalStore(
    suscribirSesion,
    getSesionCompleta,
    getSesionCompleta,
  );

  const iniciarSesion = useCallback(
    (email, password) => login(email, password),
    [],
  );

  const cerrarSesion = useCallback(() => logout(), []);

  const valor = useMemo(
    () => ({
      sesion,
      usuario: sesion?.usuario ?? null,
      expiraEn: sesion?.exp ?? null,
      estaAutenticada: Boolean(sesion?.usuario),
      iniciarSesion,
      cerrarSesion,
    }),
    [sesion, iniciarSesion, cerrarSesion],
  );

  return (
    <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
  );
}
