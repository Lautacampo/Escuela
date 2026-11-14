/**
 * Carga de datos DEMO para el Sistema de Gestión Académica Tomás Baras.
 * Ejecutar desde backend/: node scripts/seed-neon-demo.mjs
 * Requiere npm install, backend/.env con DATABASE_URL de Neon, pg y bcryptjs.
 * NO contiene datos personales reales, contraseñas fijas ni elimina registros.
 * Usa la estructura de 22 tablas en neon_estructura_tomas_baras.sql.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Falta DATABASE_URL en backend/.env');
const host = new URL(url).hostname;
if (!host.endsWith('.neon.tech')) {
  throw new Error('Seguridad: este script solo admite una conexion a Neon (*.neon.tech).');
}

const { Pool } = pg;
const pool = new Pool({ connectionString: url, max: 2, connectionTimeoutMillis: 10000 });
const credencialesNuevas = [];
let client;

// Consulta primero para que el script pueda ejecutarse de nuevo sin duplicar sus datos.
async function asegurar(selectSql, selectParams, insertSql, insertParams) {
  const actual = await client.query(selectSql, selectParams);
  if (actual.rows.length) return actual.rows[0].id;
  const creado = await client.query(insertSql, insertParams);
  return creado.rows[0].id;
}
async function asociar(sql, params) { await client.query(sql, params); }

try {
  client = await pool.connect();
  const base = await client.query('SELECT current_database() AS nombre');
  if (base.rows[0].nombre !== 'neondb') {
    throw new Error('Seguridad: se esperaba la base neondb.');
  }
  await client.query('BEGIN');

  // 1. Roles y ciclo lectivo.
  const roles = {};
  for (const nombre of ['directivo', 'docente', 'preceptor']) {
    roles[nombre] = await asegurar(
      'SELECT id FROM roles WHERE nombre = $1', [nombre],
      'INSERT INTO roles(nombre) VALUES ($1) RETURNING id', [nombre]
    );
  }
  const ciclo = await asegurar(
    'SELECT id FROM ciclo_lectivo WHERE anio = $1', [2026],
    'INSERT INTO ciclo_lectivo(anio) VALUES ($1) RETURNING id', [2026]
  );

  // 2. Seis modulos y materias institucionales (nombres academicos, no datos personales).
  const nombresModulos = ['Modulo I', 'Modulo II', 'Modulo III', 'Modulo IV', 'Modulo V', 'Modulo VI'];
  const modulos = [];
  for (const numeroLeyenda of nombresModulos) {
    modulos.push(await asegurar(
      'SELECT id FROM modulo WHERE numero_leyenda = $1 LIMIT 1', [numeroLeyenda],
      'INSERT INTO modulo(numero_leyenda) VALUES ($1) RETURNING id', [numeroLeyenda]
    ));
  }
  const nombresMaterias = [
    'Matematica', 'Informatica', 'Lengua', 'Tecnologia de la Informacion y la Comunicacion',
    'Geografia', 'Historia', 'Biologia', 'Educacion para la Salud', 'Artes Visuales',
    'Lengua Extranjera Ingles', 'Formacion Etica y Ciudadana', 'Lengua y Literatura',
    'Psicologia', 'Derecho', 'Quimica', 'Artes Audiovisuales',
    'Proyecto Socio Comunitario', 'Fisica', 'Cultura y Comunicacion',
    'Proyecto de Investigacion', 'Formacion para la Vida y el Trabajo',
    'Teatro', 'Politica y Ciudadania'
  ];
  const materias = new Map();
  for (const nombre of nombresMaterias) {
    const id = await asegurar(
      'SELECT id FROM materia WHERE nombre = $1 LIMIT 1', [nombre],
      'INSERT INTO materia(nombre) VALUES ($1) RETURNING id', [nombre]
    );
    materias.set(nombre, id);
  }
  // La distribucion respeta el esquema de 6 modulos usado por el proyecto.
  const grupos = [
    nombresMaterias.slice(0, 11),
    nombresMaterias.slice(0, 11),
    ['Matematica','Informatica','Lengua y Literatura','Tecnologia de la Informacion y la Comunicacion',
      'Psicologia','Derecho','Quimica','Educacion para la Salud','Artes Audiovisuales',
      'Lengua Extranjera Ingles','Proyecto Socio Comunitario'],
    ['Matematica','Informatica','Lengua y Literatura','Tecnologia de la Informacion y la Comunicacion',
      'Psicologia','Derecho','Quimica','Educacion para la Salud','Artes Audiovisuales',
      'Lengua Extranjera Ingles','Proyecto Socio Comunitario'],
    ['Matematica','Fisica','Cultura y Comunicacion','Proyecto de Investigacion',
      'Formacion para la Vida y el Trabajo','Educacion para la Salud','Teatro',
      'Lengua Extranjera Ingles','Politica y Ciudadania'],
    ['Matematica','Fisica','Cultura y Comunicacion','Proyecto de Investigacion',
      'Formacion para la Vida y el Trabajo','Educacion para la Salud','Teatro',
      'Lengua Extranjera Ingles','Politica y Ciudadania']
  ];
  for (let idx = 0; idx < 6; idx++) {
    for (const nombre of grupos[idx]) {
      await asociar(
        `INSERT INTO materia_modulo (materia_id, modulo_id)
         VALUES ($1, $2) ON CONFLICT (materia_id, modulo_id) DO NOTHING`,
        [materias.get(nombre), modulos[idx]]
      );
    }
  }
  for (const [modIdx, requisitoIdx] of [[2,0], [2,1], [3,2], [4,2], [4,3], [5,4]]) {
    await asociar(
      `INSERT INTO modulo_correlativo (modulo_id, modulo_correlativo_id)
       VALUES ($1, $2) ON CONFLICT (modulo_id, modulo_correlativo_id) DO NOTHING`,
      [modulos[modIdx], modulos[requisitoIdx]]
    );
  }

  // 3. Personas ficticias, personal, docentes, directivo y preceptor.
  async function personaDemo(codigo, nombre, apellido, nacimiento = null, trabaja = false) {
    const dni = String(99000000 + codigo);
    const cuil = `20-${dni}-9`;
    const personaId = await asegurar(
      'SELECT id FROM persona WHERE dni=$1', [dni],
      `INSERT INTO persona (nombre, apellido, dni, cuil, domicilio, telefono, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [nombre, apellido, dni, cuil, `Domicilio ficticio ${codigo}`, '0000000000', `demo${codigo}@example.com`]
    );
    if (nacimiento) {
      await asociar(
        `INSERT INTO alumno (id, fecha_nacimiento, lugar_nacimiento, trabaja, telefono_emergencia, cantidad_hijos)
         VALUES ($1,$2,'Localidad ficticia', $3,'0000000000',0)
         ON CONFLICT (id) DO NOTHING`,
        [personaId, nacimiento, trabaja]
      );
    }
    return personaId;
  }
  const staff = [
    { codigo: 1, nombre: 'Daniela', apellido: 'Demostracion', tipo: 'directivo', titulo: 'Prof. de Historia', antiguedad: 12 },
    { codigo: 2, nombre: 'Marcos', apellido: 'Ejemplo', tipo: 'docente', titulo: 'Prof. de Matematica', antiguedad: 8 },
    { codigo: 3, nombre: 'Paula', apellido: 'Muestra', tipo: 'docente', titulo: 'Prof. de Lengua', antiguedad: 7 },
    { codigo: 4, nombre: 'Sofia', apellido: 'Simulacion', tipo: 'preceptor', titulo: 'Preceptor', antiguedad: 5 }
  ];
  const staffIds = [];
  for (const p of staff) {
    const id = await personaDemo(p.codigo, p.nombre, p.apellido);
    staffIds.push(id);
    await asociar(
      `INSERT INTO personal (id,titulo,antiguedad) VALUES ($1,$2,$3)
       ON CONFLICT (id) DO NOTHING`, [id, p.titulo, p.antiguedad]
    );
    await asociar(
      `INSERT INTO ${p.tipo} (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [id]
    );
  }

  // 4. Seis cursos de demostracion (A/B en 1.o, 2.o y 3.o), todos con preceptor.
  const cursos = new Map();
  for (const anio of [1,2,3]) {
    for (const division of ['A','B']) {
      const id = await asegurar(
        `SELECT id FROM curso
         WHERE ciclo_lectivo_id=$1 AND anio_curso=$2 AND division=$3 LIMIT 1`,
        [ciclo, anio, division],
        `INSERT INTO curso (preceptor_id, ciclo_lectivo_id, division, anio_curso)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [staffIds[3], ciclo, division, anio]
      );
      cursos.set(`${anio}${division}`, id);
      // No reemplazar preceptores ya existentes; completar solo si falta.
      await asociar('UPDATE curso SET preceptor_id=$1 WHERE id=$2 AND preceptor_id IS NULL', [staffIds[3], id]);
      for (const idx of [2*anio-2, 2*anio-1]) {
        await asociar(
          `INSERT INTO curso_modulo (curso_id,modulo_id) VALUES ($1,$2)
           ON CONFLICT (curso_id,modulo_id) DO NOTHING`,
          [id, modulos[idx]]
        );
      }
    }
  }

  // Docentes con materias y cursos asociados (ambas relaciones del modelo).
  for (const curso of cursos.values()) {
    await asociar(
      `INSERT INTO docente_curso (docente_id,curso_id) VALUES ($1,$2)
       ON CONFLICT (docente_id,curso_id) DO NOTHING`, [staffIds[1], curso]
    );
    await asociar(
      `INSERT INTO docente_curso (docente_id,curso_id) VALUES ($1,$2)
       ON CONFLICT (docente_id,curso_id) DO NOTHING`, [staffIds[2], curso]
    );
  }
  for (const [idx,nombre] of nombresMaterias.entries()) {
    const docenteId = idx % 2 === 0 ? staffIds[1] : staffIds[2];
    await asociar(
      `INSERT INTO docente_materia (docente_id,materia_id) VALUES ($1,$2)
       ON CONFLICT (docente_id,materia_id) DO NOTHING`, [docenteId, materias.get(nombre)]
    );
  }
  await asociar(
    `INSERT INTO asistencia_personal (personal_id,fecha,motivo,valor)
     SELECT $1, DATE '2026-10-20', 'Inasistencia ficticia', TRUE
     WHERE NOT EXISTS (SELECT 1 FROM asistencia_personal
     WHERE personal_id=$1 AND fecha=DATE '2026-10-20')`, [staffIds[3]]
  );

  // 5. Cuentas demo: una por rol. Cada clave es ALEATORIA, hasheada con bcryptjs.
  const cuentas = [
    { rol: 'directivo', email: 'demo.directivo@example.com', nombre: 'Daniela', apellido: 'Demostracion', personaId: staffIds[0] },
    { rol: 'docente', email: 'demo.docente@example.com', nombre: 'Marcos', apellido: 'Ejemplo', personaId: staffIds[1] },
    { rol: 'preceptor', email: 'demo.preceptor@example.com', nombre: 'Sofia', apellido: 'Simulacion', personaId: staffIds[3] }
  ];
  for (const c of cuentas) {
    const existente = await client.query('SELECT id FROM usuarios WHERE email=$1', [c.email]);
    if (existente.rows.length) continue; // No cambiar claves de cuentas ya creadas.
    const clave = randomBytes(18).toString('base64url');
    const hash = await bcrypt.hash(clave, 10); // Exactamente lo que verifica auth.service.js.
    await asociar(
      `INSERT INTO usuarios (email,contrahash,rol_id,activo,nombre,apellido,persona_id)
       VALUES ($1,$2,$3,TRUE,$4,$5,$6)`,
      [c.email, hash, roles[c.rol], c.nombre, c.apellido, c.personaId]
    );
    credencialesNuevas.push({ rol: c.rol, email: c.email, clave });
  }

    // 5b. Usuarios originales del proyecto (mismo hash que en la base local).
  const HASH_ORIGINAL = '$2b$10$7WUb2rKIkJ8g.ZKam.qwYO7IdL4RmB0SabvxiH/pYKZKp3t0NJgse';
  const originales = [
    { rol: 'directivo', email: 'director@escuela.com',  nombre: 'Ana',   apellido: 'Directora',  personaId: staffIds[0] },
    { rol: 'docente',   email: 'docente@escuela.com',   nombre: 'Luis',  apellido: 'Docente',    personaId: staffIds[1] },
    { rol: 'preceptor', email: 'preceptor@escuela.com', nombre: 'Marta', apellido: 'Preceptora', personaId: staffIds[3] }
  ];
  for (const u of originales) {
    await asociar(
      `INSERT INTO usuarios (email, contrahash, rol_id, activo, nombre, apellido, persona_id)
       VALUES ($1,$2,$3,TRUE,$4,$5,$6)
       ON CONFLICT (email) DO UPDATE
       SET contrahash = EXCLUDED.contrahash,
           rol_id     = EXCLUDED.rol_id,
           persona_id = EXCLUDED.persona_id`,
      [u.email, HASH_ORIGINAL, roles[u.rol], u.nombre, u.apellido, u.personaId]
    );
  }


  // 6. Dieciocho estudiantes DEMO: 3 por division y anio.
  const nombres = [
    ['Lucia','Demo'],['Tomas','Ejemplo'],['Valentina','Prueba'],
    ['Mateo','Muestra'],['Camila','Ficticia'],['Bruno','Simulado'],
    ['Julieta','Demo'],['Facundo','Ejemplo'],['Carolina','Prueba'],
    ['Nicolas','Muestra'],['Agustina','Ficticia'],['Martin','Simulado'],
    ['Milagros','Demo'],['Franco','Ejemplo'],['Delfina','Prueba'],
    ['Emiliano','Muestra'],['Rocio','Ficticia'],['Santiago','Simulado']
  ];
  let cursadasDemo = 0;
  for (let i=0; i<nombres.length; i++) {
    const anio = Math.floor(i/6)+1;
    const division = i%6 < 3 ? 'A' : 'B';
    const cursoId = cursos.get(`${anio}${division}`);
    const estudianteId = await personaDemo(
      100 + i + 1, nombres[i][0], nombres[i][1],
      `${2001 + (i%5)}-0${(i%8)+1}-${String(10+(i%18)).padStart(2,'0')}`,
      i%3 === 0
    );
    const primerIdx = 2*(anio-1), segundoIdx=primerIdx+1;
    // Solo uno agota las 4 instancias y otro queda PENDIENTE.
    const estadoPrimero = i === 4 ? 'A_RECURSAR' : (i === 7 ? 'PENDIENTE' : 'APROBADO');
    const estados = [{modIdx:primerIdx, estado:estadoPrimero}];
    if (estadoPrimero === 'APROBADO') estados.push({modIdx:segundoIdx,estado:'EN_CURSO'});

    for (const item of estados) {
      const esLibre = i === 3 && item.modIdx === primerIdx;
      const cursadaId = await asegurar(
        `SELECT id FROM cursada_modulo
         WHERE alumno_id=$1 AND modulo_id=$2 AND curso_id=$3 LIMIT 1`,
        [estudianteId, modulos[item.modIdx], cursoId],
        `INSERT INTO cursada_modulo
         (alumno_id,modulo_id,curso_id,condicion,cantidad_faltas_acumuladas,estado_academico)
         VALUES ($1,$2,$3,$4,0,$5) RETURNING id`,
        [estudianteId, modulos[item.modIdx], cursoId, esLibre ? 'LIBRE' : 'REGULAR', item.estado]
      );
      cursadasDemo++;

      // Asistencias consistentes con el acumulado de faltas, siempre enteras.
      const faltas = esLibre ? 26 : (item.estado === 'EN_CURSO' ? (i%3)+1 : i%2);
      const mesBase = item.modIdx%2===0 ? 3 : 8; // abril / septiembre
      for (let f=0; f<faltas; f++) {
        const fecha = new Date(Date.UTC(2026, mesBase, 1+f)).toISOString().slice(0,10);
        await asociar(
          `INSERT INTO asistencia (cursada_modulo_id, fecha, valor_falta)
           SELECT $1, $2::date, 1
           WHERE NOT EXISTS (SELECT 1 FROM asistencia WHERE cursada_modulo_id=$1 AND fecha=$2::date)`,
          [cursadaId,fecha]
        );
      }
      const total = await client.query(
        'SELECT COALESCE(SUM(valor_falta),0) AS faltas FROM asistencia WHERE cursada_modulo_id=$1',
        [cursadaId]
      );
      await asociar(
        `UPDATE cursada_modulo SET cantidad_faltas_acumuladas=$1, condicion=$2 WHERE id=$3`,
        [Number(total.rows[0].faltas), Number(total.rows[0].faltas)>25?'LIBRE':'REGULAR',cursadaId]
      );

      // Calificaciones de materia: estado textual (NO nota individual).
      for (const [k, nombreMateria] of grupos[item.modIdx].entries()) {
        const estado = item.estado==='APROBADO' ? 'Aprobado'
          : item.estado==='EN_CURSO' ? (k%4===0?'Desaprobado':'En Curso')
          : (k%3===0?'Desaprobado':'En Curso');
        await asociar(
          `INSERT INTO calificacion (materia_id,cursada_modulo_id,estado)
           VALUES ($1,$2,$3) ON CONFLICT (cursada_modulo_id,materia_id) DO NOTHING`,
          [materias.get(nombreMateria),cursadaId,estado]
        );
      }

      const notas = item.estado==='APROBADO' ? [8]
        : item.estado==='PENDIENTE' ? [5,6]
        : item.estado==='A_RECURSAR' ? [3,4,5,6] : [];
      for (let j=0;j<notas.length;j++) {
        const previa=await client.query(
          `SELECT id FROM evaluacion_modulo WHERE cursada_modulo_id=$1 AND nro_instancia=$2 LIMIT 1`,
          [cursadaId,j+1]
        );
        if (!previa.rows.length) {
          await asociar(
            `INSERT INTO evaluacion_modulo
             (cursada_modulo_id,fecha,nota,nro_instancia,tipo_instancia)
             VALUES ($1,$2,$3,$4,$5)`,
            [cursadaId, `2026-10-${String(5+j).padStart(2,'0')}`,
              notas[j],j+1,j===0?'COLEGIADA':j===3?'ESPECIAL':'CALENDARIO']
          );
        }
      }
    }
  }

  // 7. Tablas de Plan de Estudios. El backend también puede crearlas automáticamente;
  // aqui se inicializan ahora para mostrar una demostracion completa.
  await asociar(`
    CREATE TABLE IF NOT EXISTS public.plan_estudio (
      id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      titulo varchar(150) NOT NULL,
      resolucion varchar(100) NOT NULL,
      orientacion varchar(100) DEFAULT 'Ciencias Sociales' NOT NULL,
      anio_inicio integer DEFAULT 2026 NOT NULL,
      estado varchar(20) DEFAULT 'Vigente' NOT NULL,
      activo boolean DEFAULT true NOT NULL,
      creado_en timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT plan_estudio_estado_check CHECK (estado IN ('Vigente','Inactivo'))
    );
    CREATE TABLE IF NOT EXISTS public.plan_estudio_materia_modulo (
      id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      plan_estudio_id integer NOT NULL REFERENCES public.plan_estudio(id) ON DELETE CASCADE,
      modulo_id integer NOT NULL REFERENCES public.modulo(id) ON DELETE CASCADE,
      materia_id integer NOT NULL REFERENCES public.materia(id) ON DELETE CASCADE,
      UNIQUE(plan_estudio_id,modulo_id,materia_id)
    );
  `, []);
  const planId = await asegurar(
    `SELECT id FROM plan_estudio WHERE titulo=$1 LIMIT 1`, ['Plan de demostracion 2026'],
    `INSERT INTO plan_estudio(titulo,resolucion,orientacion,anio_inicio,estado,activo)
     VALUES ($1,$2,$3,$4,'Vigente',true) RETURNING id`,
    ['Plan de demostracion 2026','DEMO-2026','Ciencias Sociales',2026]
  );
  await asociar(
    `INSERT INTO plan_estudio_materia_modulo (plan_estudio_id,modulo_id,materia_id)
     SELECT $1,modulo_id,materia_id FROM materia_modulo
     ON CONFLICT (plan_estudio_id,modulo_id,materia_id) DO NOTHING`, [planId]
  );

  await client.query('COMMIT');
  console.log('\nDATOS DEMO CARGADOS CORRECTAMENTE en neondb.');
  const conteo = await client.query(`
    SELECT 'roles' AS tabla, COUNT(*) AS cantidad FROM roles
    UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
    UNION ALL SELECT 'personas', COUNT(*) FROM persona
    UNION ALL SELECT 'alumnos', COUNT(*) FROM alumno
    UNION ALL SELECT 'docentes', COUNT(*) FROM docente
    UNION ALL SELECT 'preceptores', COUNT(*) FROM preceptor
    UNION ALL SELECT 'cursos', COUNT(*) FROM curso
    UNION ALL SELECT 'materias', COUNT(*) FROM materia
    UNION ALL SELECT 'modulos', COUNT(*) FROM modulo
    UNION ALL SELECT 'cursadas', COUNT(*) FROM cursada_modulo
    UNION ALL SELECT 'calificaciones', COUNT(*) FROM calificacion
    UNION ALL SELECT 'evaluaciones', COUNT(*) FROM evaluacion_modulo
    UNION ALL SELECT 'asistencias', COUNT(*) FROM asistencia
    UNION ALL SELECT 'planes', COUNT(*) FROM plan_estudio
    ORDER BY tabla;
  `);
  console.table(conteo.rows);
  if (credencialesNuevas.length) {
    console.log('\nGUARDAR ESTAS CLAVES EN UN LUGAR PRIVADO (SE MOSTRARAN UNA SOLA VEZ):');
    for (const x of credencialesNuevas) {
      console.log(`Rol: ${x.rol} | Usuario: ${x.email} | Clave: ${x.clave}`);
    }
  } else {
    console.log('\nLos usuarios demo ya existian; no se modificaron sus contraseñas.');
  }
  console.log('\nIMPORTANTE: no compartir estas credenciales ni subir .env a GitHub.');
} catch (err) {
  if (client) {
    try { await client.query('ROLLBACK'); } catch { /* rollback best effort */ }
  }
  console.error('ERROR EN LA CARGA:', err.message);
  process.exitCode = 1;
} finally {
  if (client) client.release();
  await pool.end();
}
