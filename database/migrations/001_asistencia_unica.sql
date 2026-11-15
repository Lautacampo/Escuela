SELECT cursada_modulo_id, fecha, COUNT(*) FROM asistencia
GROUP BY 1, 2 HAVING COUNT(*) > 1;

DELETE FROM asistencia a USING asistencia b
WHERE a.ctid < b.ctid
AND a.cursada_modulo_id = b.cursada_modulo_id
AND a.fecha = b.fecha;

ALTER TABLE asistencia
ADD CONSTRAINT asistencia_cursada_fecha_uk UNIQUE (cursada_modulo_id, fecha);