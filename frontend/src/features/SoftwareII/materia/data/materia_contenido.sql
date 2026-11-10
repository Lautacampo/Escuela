-- Ejecutar una vez, antes de iniciar el backend (sirve con cualquier ddl-auto).
CREATE TABLE IF NOT EXISTS materia_contenido (
    materia_id  INTEGER      NOT NULL REFERENCES materia (id),
    orden       INTEGER      NOT NULL,
    anio_curso  INTEGER      NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    PRIMARY KEY (materia_id, orden)
);
