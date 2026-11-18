// Reglas de correlatividades del lado del cliente.
//
// El backend (y la base) son quienes las hacen cumplir: esto solo sirve para
// mostrarle al directivo ANTES de guardar qué módulos puede elegir.
//
// Regla (migración 008, sin equivalencias):
// - En la primera matrícula el alumno puede empezar en cualquier módulo: ese
//   es su módulo de ingreso. Los módulos anteriores no se le exigen.
// - Desde el ingreso en adelante: III o IV piden I y II aprobados; V o VI
//   piden III y IV aprobados. Dentro del mismo año no hay correlatividad.

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

// Posición del módulo en la carrera: I = 1, II = 2, ..., VI = 6.
export function ordenModulo(modulo) {
  const anio = Number(modulo?.anioCurso);
  const periodo = Number(modulo?.periodo);
  if (!Number.isFinite(anio) || !Number.isFinite(periodo)) return null;
  return anio * 2 + periodo - 2;
}

// Módulos aprobados en la escuela.
export function modulosAprobados(alumno) {
  const ids = new Set();
  for (const cursada of trayectoriaDe(alumno)) {
    if (cursada.estadoAcademico === "APROBADO") ids.add(Number(cursada.moduloId));
  }
  return ids;
}

/**
 * Posición del módulo de ingreso: el primero (en orden) que el alumno cursó.
 * No cuenta la cursada activa vacía (sin asistencias, notas ni evaluaciones):
 * al cambiar la matrícula esa cursada se corrige. null = sin cursadas.
 */
export function ordenIngreso(alumno, catalogo) {
  const ordenes = trayectoriaDe(alumno)
    .filter(
      (cursada) =>
        !(cursada.activa && cursada.estadoAcademico === "EN_CURSO" && cursada.tieneDatos === false),
    )
    .map((cursada) => ordenModulo(catalogo[cursada.moduloId]))
    .filter((orden) => orden !== null);
  return ordenes.length > 0 ? Math.min(...ordenes) : null;
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
 * - yaAprobado: ya aprobó ese módulo (no se vuelve a cursar).
 * - recursa: quedó LIBRE en ese módulo; la matrícula crea la recursada.
 * - bloqueantes: correlativos que le faltan aprobar. Un correlativo anterior
 *     al módulo de ingreso no se exige; un alumno sin cursadas ingresa en el
 *     módulo elegido, así que no tiene bloqueantes.
 */
export function analizarMatricula(alumno, moduloId, catalogo) {
  const aprobados = modulosAprobados(alumno);
  const modulo = catalogo[moduloId];
  const actual = ultimaCursada(alumno, moduloId);

  const bloqueantes = [];
  if (modulo) {
    const ingreso = ordenIngreso(alumno, catalogo);
    const destino = ordenModulo(modulo);
    const desde = ingreso === null ? destino : Math.min(ingreso, destino ?? ingreso);

    for (const correlativo of modulo.correlativos ?? []) {
      const id = Number(correlativo.id);
      if (aprobados.has(id)) continue;
      const orden = ordenModulo(catalogo[id]);
      if (orden !== null && desde !== null && orden < desde) continue;

      const cursada = ultimaCursada(alumno, id);
      bloqueantes.push({
        id,
        nombre: catalogo[id]?.numeroLeyenda ?? correlativo.numeroLeyenda,
        libre: cursada?.estadoAcademico === "A_RECURSAR",
        cursado: Boolean(cursada),
      });
    }
  }

  return {
    yaAprobado: aprobados.has(Number(moduloId)),
    recursa: actual?.estadoAcademico === "A_RECURSAR",
    enCurso: ESTADOS_ABIERTOS.includes(actual?.estadoAcademico),
    bloqueantes: bloqueantes.sort((a, b) => a.id - b.id),
  };
}

// Todos los correlativos que le faltan al alumno, en orden, con el motivo.
export function correlativosFaltantes(analisis) {
  return analisis.bloqueantes.map((m) => ({
    ...m,
    detalle: m.libre
      ? "quedó libre: debe recursarlo"
      : m.cursado
        ? "todavía sin aprobar"
        : "sin cursar",
  }));
}

// Texto corto para la opción del módulo en un <select>.
export function etiquetaModulo(modulo, analisis) {
  if (analisis.yaAprobado) return `${modulo.numeroLeyenda} — ya aprobado`;
  if (analisis.bloqueantes.length > 0) {
    return `${modulo.numeroLeyenda} — requiere aprobar ${listar(
      correlativosFaltantes(analisis).map((m) => m.nombre),
    )}`;
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
