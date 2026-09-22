import { useState } from "react";

export function useForm(estadoInicial = {}) {
  const [valores, setValores] = useState(estadoInicial);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setValores({
      ...valores,
      [name]: value,
    });
  };

  const resetearFormulario = () => {
    setValores(estadoInicial);
  };

  return {
    valores,
    manejarCambio,
    resetearFormulario,
  };
}
