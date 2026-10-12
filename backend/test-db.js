const pool = require('./db');

pool.query('SELECT count(*) FROM information_schema.tables WHERE table_schema = $1', ['public'])
  .then(({ rows }) => {
    console.log('Conexión OK. Tablas en la base:', rows[0].count);
    return pool.end();
  })
  .catch((err) => {
    console.error('Error de conexión:', err.message);
    pool.end();
  });