// Reglas de correlatividades del lado del cliente.
//
// El backend (y la base) son quienes las hacen cumplir: esto solo sirve para
// mostrarle al directivo ANTES de guardar qué módulos puede elegir y cuándo
// corresponde un ingreso por equivalencia.

export const DESCRIPCION_MOTIVO_LIBRE = {
  INASISTENCIAS: "superó el límite de 25 inasistencias",
  MATERIA_DESAPROBADA: "tiene una materia del módulo desaprobada",
  INSTANCIAS_AGOTADAS: "agotó las 4 instancias de acreditación",
};

export const NOMBRE_PERIODO = {
  1: "marzo a julio",
  2: "agosto a diciembre",
};

const ESTADOS_ABIERTOS = ["EN_CURSO", "PENDIENTE"];

// Catálogo { [moduloId]: módulo } armado con los módulos de GET /cursos.
export function catalogoDeModulos(cursos) {
  const catalogo = {};
  for (const curso of cursos ?? []) {
    for (const modulo of curso.modulos ?? []) {
      catalogo[modulo.id] = modulo;
    }
  }
  return catalogo;
}

function trayectoriaDe(alumno) {
  return Array.isArray(alumno?.trayectoria) ? alumno.trayectoria : [];
}

// Módulos aprobados en la escuela o reconocidos por equivalencia.
export function modulosAcreditados(alumno) {
  const ids = new Set((alumno?.equivalencias ?? []).map((e) => e.moduloId));
  for (const cursada of trayectoriaDe(alumno)) {
    if (cursada.estadoAcademico === "APROBADO") ids.add(cursada.moduloId);
  }
  return ids;
}

// Última cursada del alumno en ese módulo (o undefined si nunca lo cursó).
export function ultimaCursada(alumno, moduloId) {
  return trayectoriaDe(alumno)
    .filter((cursada) => Number(cursada.moduloId) === Number(moduloId))
    .at(-1);
}

/**
 * Analiza si el alumno puede matricularse en un módulo.
 *
 * Devuelve:
 * - yaAcreditado: lo aprobó o lo tiene por equivalencia (no se vuelve a cursar).
 * - recursa: quedó LIBRE en ese módulo; la matrícula crea la recursada.
 * - bloqueantes: correlativos que cursó en la escuela y todavía no aprobó.
 *     No admiten equivalencia: debe aprobarlos o recursarlos.
 * - porEquivalencia: correlativos que nunca cursó en la escuela. Solo puede
 *     matricularse si los acredita por equivalencia. Incluye la cadena
 *     completa (para Módulo V: I, II, III y IV).
 */
export function analizarMatricula(alumno, moduloId, catalogo) {
  const acreditados = modulosAcreditados(alumno);
  const modulo = catalogo[moduloId];
  const actual = ultimaCursada(alumno, moduloId);

  const bloqueantes = [];
  const porEquivalencia = [];
  const visitados = new Set();

  const recorrer = (id) => {
    for (const correlativo of catalogo[id]?.correlativos ?? []) {
      if (visitados.has(correlativo.id) || acreditados.has(correlativo.id)) {
        continue;
      }
      visitados.add(correlativo.id);

      const cursada = ultimaCursada(alumno, correlativo.id);
      if (cursada) {
        bloqueantes.push({
          id: correlativo.id,
          nombre: correlativo.numeroLeyenda,
          libre: cursada.estadoAcademico === "A_RECURSAR",
        });
      } else {
        porEquivalencia.push({
          id: correlativo.id,
          nombre: correlativo.numeroLeyenda,
        });
        recorrer(correlativo.id);
      }
    }
  };
  if (modulo) recorrer(moduloId);

  const ordenar = (lista) => lista.sort((a, b) => a.id - b.id);

  return {
    yaAcreditado: acreditados.has(Number(moduloId)),
    recursa: actual?.estadoAcademico === "A_RECURSAR",
    enCurso: ESTADOS_ABIERTOS.includes(actual?.estadoAcademico),
    bloqueantes: ordenar(bloqueantes),
    porEquivalencia: ordenar(porEquivalencia),
  };
}

// Todos los correlativos que le faltan al alumno, en orden, con el motivo.
export function correlativosFaltantes(analisis) {
  return [
    ...analisis.bloqueantes.map((m) => ({
      ...m,
      detalle: m.libre ? "quedó libre: debe recursarlo" : "todavía sin aprobar",
    })),
    ...analisis.porEquivalencia.map((m) => ({ ...m, detalle: "sin cursar" })),
  ].sort((a, b) => a.id - b.id);
}

// Texto corto para la opción del módulo en un <select>.
export function etiquetaModulo(modulo, analisis) {
  if (analisis.yaAcreditado) return `${modulo.numeroLeyenda} — ya acreditado`;
  if (analisis.bloqueantes.length > 0) {
    return `${modulo.numeroLeyenda} — requiere aprobar ${listar(
      correlativosFaltantes(analisis).map((m) => m.nombre),
    )}`;
  }
  if (analisis.porEquivalencia.length > 0) {
    return `${modulo.numeroLeyenda} — requiere equivalencias`;
  }
  if (analisis.recursa) return `${modulo.numeroLeyenda} — recursar`;
  return modulo.numeroLeyenda;
}

export function listar(nombres) {
  if (nombres.length <= 1) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}

export function esLibre(condicion) {
  return String(condicion ?? "").toUpperCase() === "LIBRE";
}

// Estado inicial del bloque de ingreso por equivalencia.
export const INGRESO_INICIAL = { confirma: false, observacion: "" };

// Devuelve el mensaje de error del bloque, o "" si está completo.
export function validarIngreso(valor) {
  if (!valor.confirma) {
    return "Confirmá que el alumno acredita esos módulos por equivalencia o elegí otro módulo.";
  }
  return "";
}
