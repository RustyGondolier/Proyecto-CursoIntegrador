CREATE TABLE sedes (
  id        SERIAL        PRIMARY KEY,
  nombre    VARCHAR(100)  NOT NULL,
  ubicacion VARCHAR(150),
  activo    BOOLEAN       DEFAULT true,
  creado_en TIMESTAMP     DEFAULT NOW()
);

INSERT INTO sedes (nombre, ubicacion) VALUES
  ('Lima Sur', 'Campus UTP Lima Sur');

CREATE TABLE usuarios (
  id                     SERIAL        PRIMARY KEY,
  codigo_universitario   VARCHAR(20)   UNIQUE NOT NULL,
  nombre                 VARCHAR(100)  NOT NULL,
  password_hash          VARCHAR(255)  NOT NULL,
  telefono               VARCHAR(20),
  dni                    VARCHAR(15),
  fecha_nacimiento       DATE,
  correo_institucional   VARCHAR(150),
  nro_licencia VARCHAR(20) UNIQUE,
  licencia_fecha_vencimiento DATE,
  rol                    VARCHAR(20)   NOT NULL DEFAULT 'estudiante'
                           CHECK (rol IN (
                             'estudiante','docente','administrativo',
                             'supervisor','directora'
                           )),
  estado_cuenta          VARCHAR(15)   NOT NULL DEFAULT 'activa'
                           CHECK (estado_cuenta IN ('activa','suspendida','eliminada')),
  motivo_suspension      TEXT,
  qr_token               VARCHAR(64)   UNIQUE NOT NULL,
  codigo_conadis         VARCHAR(20),
  conadis_verificado     BOOLEAN       DEFAULT false,
  puntos_infraccion      INTEGER       DEFAULT 0,
  preferencia_tema       VARCHAR(10)   DEFAULT 'claro'
                           CHECK (preferencia_tema IN ('claro','oscuro')),
  creado_en              TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE tipos_vehiculo (
  id          SERIAL      PRIMARY KEY,
  codigo      VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(50) NOT NULL
);

INSERT INTO tipos_vehiculo (codigo, descripcion) VALUES
  ('auto', 'Automóvil'),
  ('moto', 'Motocicleta');

CREATE TABLE vehiculos (
  id               SERIAL       PRIMARY KEY,
  usuario_id       INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_vehiculo_id INTEGER      NOT NULL REFERENCES tipos_vehiculo(id),
  placa            VARCHAR(20)  UNIQUE NOT NULL,
  modelo           VARCHAR(100),
  activo           BOOLEAN      DEFAULT true,
  creado_en        TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE historial_accesos (
  id         SERIAL      PRIMARY KEY,
  usuario_id INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado     VARCHAR(10) NOT NULL CHECK (estado IN ('exitoso','fallido')),
  ip_origen  VARCHAR(45),
  creado_en  TIMESTAMP   DEFAULT NOW()
);

CREATE TABLE estacionamientos (
  id        SERIAL       PRIMARY KEY,
  sede_id   INTEGER      NOT NULL REFERENCES sedes(id),
  nombre    VARCHAR(100) NOT NULL,
  ubicacion VARCHAR(150),
  cap_autos SMALLINT     NOT NULL DEFAULT 0,
  cap_motos SMALLINT     NOT NULL DEFAULT 0,
  activo    BOOLEAN      DEFAULT true
);

INSERT INTO estacionamientos (sede_id, nombre, ubicacion, cap_autos, cap_motos) VALUES
  (1,'Estacionamiento 1','Sede Sur - Subterraneo', 95, 22),
  (1,'Estacionamiento 2','Sede Sur - Exterior',   59,  5);

CREATE TABLE bloques (
  id                 SERIAL      PRIMARY KEY,
  estacionamiento_id INTEGER     NOT NULL REFERENCES estacionamientos(id),
  codigo             VARCHAR(25) UNIQUE NOT NULL,
  tipo_vehiculo      VARCHAR(10) NOT NULL CHECK (tipo_vehiculo IN ('auto','moto')),
  letra_bloque       CHAR(1)     NOT NULL,
  capacidad          SMALLINT    NOT NULL DEFAULT 8,
  esp32_id           VARCHAR(50) UNIQUE,
  descripcion        VARCHAR(100)
);

INSERT INTO bloques (estacionamiento_id, codigo, tipo_vehiculo, letra_bloque, capacidad, descripcion) VALUES
  (1,'E1-A-A','auto','A',8,'Est.1 Autos - Bloque A'),
  (1,'E1-A-B','auto','B',8,'Est.1 Autos - Bloque B'),
  (1,'E1-A-C','auto','C',8,'Est.1 Autos - Bloque C'),
  (1,'E1-A-D','auto','D',8,'Est.1 Autos - Bloque D'),
  (1,'E1-A-E','auto','E',8,'Est.1 Autos - Bloque E'),
  (1,'E1-A-F','auto','F',8,'Est.1 Autos - Bloque F'),
  (1,'E1-A-G','auto','G',8,'Est.1 Autos - Bloque G'),
  (1,'E1-A-H','auto','H',8,'Est.1 Autos - Bloque H'),
  (1,'E1-A-I','auto','I',8,'Est.1 Autos - Bloque I'),
  (1,'E1-A-J','auto','J',8,'Est.1 Autos - Bloque J'),
  (1,'E1-A-K','auto','K',8,'Est.1 Autos - Bloque K'),
  (1,'E1-A-L','auto','L',7,'Est.1 Autos - Bloque L (7 plazas)'),
  (1,'E1-M-A','moto','A',8,'Est.1 Motos - Bloque A'),
  (1,'E1-M-B','moto','B',8,'Est.1 Motos - Bloque B'),
  (1,'E1-M-C','moto','C',6,'Est.1 Motos - Bloque C (6 plazas)'),
  (2,'E2-A-A','auto','A',8,'Est.2 Autos - Bloque A'),
  (2,'E2-A-B','auto','B',8,'Est.2 Autos - Bloque B'),
  (2,'E2-A-C','auto','C',8,'Est.2 Autos - Bloque C'),
  (2,'E2-A-D','auto','D',8,'Est.2 Autos - Bloque D'),
  (2,'E2-A-E','auto','E',8,'Est.2 Autos - Bloque E'),
  (2,'E2-A-F','auto','F',8,'Est.2 Autos - Bloque F'),
  (2,'E2-A-G','auto','G',8,'Est.2 Autos - Bloque G'),
  (2,'E2-A-H','auto','H',3,'Est.2 Autos - Bloque H (3 plazas)'),
  (2,'E2-M-A','moto','A',5,'Est.2 Motos - Bloque A (5 plazas)');

CREATE TABLE tipos_plaza (
  id          SERIAL      PRIMARY KEY,
  codigo      VARCHAR(20) UNIQUE NOT NULL,
  descripcion VARCHAR(80) NOT NULL
);

INSERT INTO tipos_plaza (codigo, descripcion) VALUES
  ('auto_estandar',    'Auto estándar'),
  ('auto_discapacidad','Auto - Discapacidad'),
  ('moto_estandar',    'Moto estándar');

CREATE TABLE plazas (
  id            SERIAL      PRIMARY KEY,
  codigo        VARCHAR(15) UNIQUE NOT NULL,
  bloque_id     INTEGER     NOT NULL REFERENCES bloques(id),
  numero_plaza  SMALLINT    NOT NULL,
  tipo_plaza_id INTEGER     NOT NULL REFERENCES tipos_plaza(id) DEFAULT 1,
  estado        VARCHAR(25) NOT NULL DEFAULT 'libre'
                  CHECK (estado IN (
                    'libre','reservada','ocupada',
                    'ocupada_sin_reserva','inactiva'
                  ))
);

DO $$
DECLARE
  b       RECORD;
  tipo_id INTEGER;
BEGIN
  FOR b IN SELECT id, codigo, tipo_vehiculo, letra_bloque, capacidad FROM bloques ORDER BY id
  LOOP
    IF b.tipo_vehiculo = 'auto' THEN tipo_id := 1;
    ELSE tipo_id := 3;
    END IF;
    FOR i IN 1..b.capacidad LOOP
      INSERT INTO plazas (codigo, bloque_id, numero_plaza, tipo_plaza_id)
      VALUES (b.codigo || '-' || LPAD(i::TEXT,2,'0'), b.id, i, tipo_id);
    END LOOP;
  END LOOP;
END $$;

CREATE TABLE sensores (
  id               SERIAL        PRIMARY KEY,
  plaza_id         INTEGER       UNIQUE NOT NULL REFERENCES plazas(id),
  bloque_id        INTEGER       NOT NULL REFERENCES bloques(id),
  tipo             VARCHAR(20)   NOT NULL DEFAULT 'magnetometro'
                     CHECK (tipo IN ('magnetometro')),
  umbral_calibrado DECIMAL(10,4),
  activo           BOOLEAN       DEFAULT true,
  instalado_en     TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE lecturas_sensor (
  id        BIGSERIAL     PRIMARY KEY,
  sensor_id INTEGER       NOT NULL REFERENCES sensores(id),
  valor_raw DECIMAL(10,4) NOT NULL,
  ocupado   BOOLEAN       NOT NULL,
  leido_en  TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE reservas (
  id                   SERIAL      PRIMARY KEY,
  usuario_id           INTEGER     NOT NULL REFERENCES usuarios(id),
  plaza_id             INTEGER     NOT NULL REFERENCES plazas(id),
  vehiculo_id          INTEGER     NOT NULL REFERENCES vehiculos(id),
  hora_inicio          TIMESTAMP   NOT NULL,
  hora_fin             TIMESTAMP   NOT NULL,
  tolerancia_extendida BOOLEAN     DEFAULT false,
  estado               VARCHAR(15) NOT NULL DEFAULT 'activa'
                         CHECK (estado IN ('activa','completada','cancelada','expirada')),
  creado_en            TIMESTAMP   DEFAULT NOW()
);

CREATE UNIQUE INDEX una_reserva_activa
ON reservas (usuario_id)
WHERE estado = 'activa';

CREATE TABLE escaneos_qr (
  id         SERIAL      PRIMARY KEY,
  usuario_id INTEGER     NOT NULL REFERENCES usuarios(id),
  reserva_id INTEGER     REFERENCES reservas(id),
  resultado  VARCHAR(20) NOT NULL
               CHECK (resultado IN (
                 'acceso_ok','sin_reserva',
                 'fuera_horario','cuenta_suspendida'
               )),
  hora       TIMESTAMP   DEFAULT NOW()
);

CREATE TABLE registros_acceso (
  id         SERIAL      PRIMARY KEY,
  reserva_id INTEGER     REFERENCES reservas(id),
  plaza_id   INTEGER     NOT NULL REFERENCES plazas(id),
  escaneo_id INTEGER     REFERENCES escaneos_qr(id),
  tipo       VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada','salida')),
  hora       TIMESTAMP   DEFAULT NOW()
);

CREATE TABLE tipos_infraccion (
  id          SERIAL       PRIMARY KEY,
  codigo      VARCHAR(30)  UNIQUE NOT NULL,
  descripcion VARCHAR(150) NOT NULL
);

INSERT INTO tipos_infraccion (codigo, descripcion) VALUES
  ('sin_reserva',     'Vehículo ocupa plaza sin reserva válida'),
  ('tiempo_excedido', 'Vehículo excede el tiempo de reserva permitido');

CREATE TABLE infracciones (
  id                 SERIAL    PRIMARY KEY,
  usuario_id         INTEGER   NOT NULL REFERENCES usuarios(id),
  plaza_id           INTEGER   NOT NULL REFERENCES plazas(id),
  vehiculo_id        INTEGER   REFERENCES vehiculos(id),
  supervisor_id      INTEGER   NOT NULL REFERENCES usuarios(id),
  tipo_infraccion_id INTEGER   NOT NULL REFERENCES tipos_infraccion(id),
  hora_infraccion    TIMESTAMP NOT NULL,
  descripcion        TEXT,
  creado_en          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE estados_reporte (
  id          SERIAL      PRIMARY KEY,
  codigo      VARCHAR(20) UNIQUE NOT NULL,
  descripcion VARCHAR(50) NOT NULL
);

INSERT INTO estados_reporte (codigo, descripcion) VALUES
  ('enviado',     'Enviado'),
  ('en_revision', 'En revisión'),
  ('resuelto',    'Resuelto'),
  ('cancelado',   'Cancelado');

CREATE TABLE reportes_incidencias (
  id                   SERIAL    PRIMARY KEY,
  usuario_id           INTEGER   NOT NULL REFERENCES usuarios(id),
  plaza_id             INTEGER   REFERENCES plazas(id),
  descripcion          TEXT      NOT NULL,
  estado_id            INTEGER   NOT NULL REFERENCES estados_reporte(id) DEFAULT 1,
  es_prioritario       BOOLEAN   DEFAULT false,
  razon_prioridad      TEXT,
  supervisor_id        INTEGER   REFERENCES usuarios(id),
  respuesta_supervisor TEXT,
  valoracion           SMALLINT  CHECK (valoracion BETWEEN 1 AND 5),
  creado_en            TIMESTAMP DEFAULT NOW(),
  actualizado_en       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE faq_categorias (
  id     SERIAL      PRIMARY KEY,
  nombre VARCHAR(80) UNIQUE NOT NULL
);

INSERT INTO faq_categorias (nombre) VALUES
  ('Reservas'), ('Cuentas'), ('Incidencias'), ('General');

CREATE TABLE faq (
  id           SERIAL    PRIMARY KEY,
  categoria_id INTEGER   NOT NULL REFERENCES faq_categorias(id),
  pregunta     TEXT      NOT NULL,
  respuesta    TEXT      NOT NULL,
  activo       BOOLEAN   DEFAULT true,
  creado_en    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recomendaciones (
  id          SERIAL       PRIMARY KEY,
  titulo      VARCHAR(150) NOT NULL,
  descripcion TEXT         NOT NULL,
  activo      BOOLEAN      DEFAULT true,
  creado_en   TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE mensajes_soporte (
  id          SERIAL       PRIMARY KEY,
  usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id),
  asunto      VARCHAR(150) NOT NULL,
  descripcion TEXT         NOT NULL,
  respondido  BOOLEAN      DEFAULT false,
  respuesta   TEXT,
  creado_en   TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE tipos_notificacion (
  id          SERIAL      PRIMARY KEY,
  codigo      VARCHAR(30) UNIQUE NOT NULL,
  descripcion VARCHAR(80) NOT NULL
);

INSERT INTO tipos_notificacion (codigo, descripcion) VALUES
  ('reserva',      'Reserva'),
  ('infraccion',   'Infracción'),
  ('reporte',      'Reporte de incidencia'),
  ('soporte',      'Respuesta de soporte'),
  ('recordatorio', 'Recordatorio de reserva'),
  ('sistema',      'Sistema');

CREATE TABLE notificaciones (
  id          SERIAL       PRIMARY KEY,
  usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_id     INTEGER      NOT NULL REFERENCES tipos_notificacion(id),
  titulo      VARCHAR(150) NOT NULL,
  mensaje     TEXT         NOT NULL,
  leida       BOOLEAN      DEFAULT false,
  url_destino VARCHAR(255),
  creado_en   TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE preferencias_notificacion (
  id         SERIAL   PRIMARY KEY,
  usuario_id INTEGER  NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_id    INTEGER  NOT NULL REFERENCES tipos_notificacion(id),
  activo     BOOLEAN  DEFAULT true,
  UNIQUE (usuario_id, tipo_id)
);

CREATE TABLE eventos_sistema (
  id         BIGSERIAL   PRIMARY KEY,
  tipo       VARCHAR(30) NOT NULL
               CHECK (tipo IN (
                 'reserva_creada','reserva_cancelada',
                 'reserva_expirada','reserva_completada',
                 'infraccion_registrada','acceso_qr',
                 'plaza_ocupada_sin_reserva',
                 'usuario_registrado','usuario_suspendido'
               )),
  usuario_id INTEGER     REFERENCES usuarios(id),
  plaza_id   INTEGER     REFERENCES plazas(id),
  sede_id    INTEGER     REFERENCES sedes(id),
  metadata   JSONB,
  creado_en  TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_eventos_tipo    ON eventos_sistema(tipo);
CREATE INDEX idx_eventos_fecha   ON eventos_sistema(creado_en);
CREATE INDEX idx_eventos_sede    ON eventos_sistema(sede_id);
CREATE INDEX idx_eventos_usuario ON eventos_sistema(usuario_id);

CREATE VIEW v_ocupacion_actual AS
SELECT
  s.nombre                                                              AS sede,
  e.nombre                                                              AS estacionamiento,
  COUNT(p.id)                                                           AS total_plazas,
  COUNT(p.id) FILTER (WHERE p.estado = 'libre')                        AS libres,
  COUNT(p.id) FILTER (WHERE p.estado = 'reservada')                    AS reservadas,
  COUNT(p.id) FILTER (WHERE p.estado = 'ocupada')                      AS ocupadas,
  COUNT(p.id) FILTER (WHERE p.estado = 'ocupada_sin_reserva')          AS sin_reserva,
  COUNT(p.id) FILTER (WHERE p.estado = 'inactiva')                     AS inactivas,
  ROUND(
    COUNT(p.id) FILTER (WHERE p.estado IN ('reservada','ocupada'))::DECIMAL
    / NULLIF(COUNT(p.id) FILTER (WHERE p.estado != 'inactiva'),0) * 100
  ,1)                                                                   AS porcentaje_ocupacion
FROM plazas p
JOIN bloques          b ON b.id = p.bloque_id
JOIN estacionamientos e ON e.id = b.estacionamiento_id
JOIN sedes            s ON s.id = e.sede_id
GROUP BY s.nombre, e.id, e.nombre;

CREATE VIEW v_reservas_por_dia AS
SELECT
  DATE(r.creado_en)                                       AS fecha,
  COUNT(*)                                                AS total,
  COUNT(*) FILTER (WHERE r.estado = 'completada')         AS completadas,
  COUNT(*) FILTER (WHERE r.estado = 'cancelada')          AS canceladas,
  COUNT(*) FILTER (WHERE r.estado = 'expirada')           AS expiradas
FROM reservas r
WHERE r.creado_en >= NOW() - INTERVAL '30 days'
GROUP BY DATE(r.creado_en)
ORDER BY fecha DESC;

CREATE VIEW v_usuarios_incumplidos AS
SELECT
  u.id,
  u.nombre,
  u.codigo_universitario,
  u.rol,
  u.puntos_infraccion,
  COUNT(r.id) FILTER (WHERE r.estado = 'expirada')   AS reservas_expiradas,
  COUNT(r.id) FILTER (WHERE r.estado = 'cancelada')  AS reservas_canceladas,
  COUNT(r.id) FILTER (WHERE r.estado = 'completada') AS reservas_completadas,
  COUNT(r.id)                                         AS total_reservas
FROM usuarios u
LEFT JOIN reservas r ON r.usuario_id = u.id
WHERE u.rol IN ('estudiante','docente','administrativo')
GROUP BY u.id, u.nombre, u.codigo_universitario, u.rol, u.puntos_infraccion
HAVING COUNT(r.id) FILTER (WHERE r.estado = 'expirada') > 0
ORDER BY reservas_expiradas DESC, u.puntos_infraccion DESC;

CREATE VIEW v_flujo_por_hora AS
SELECT
  EXTRACT(HOUR FROM hora_inicio)::INTEGER AS hora,
  COUNT(*)                                AS total_reservas
FROM reservas
GROUP BY EXTRACT(HOUR FROM hora_inicio)
ORDER BY hora;

CREATE VIEW v_infracciones_por_mes AS
SELECT
  TO_CHAR(i.creado_en,'YYYY-MM') AS mes,
  ti.descripcion                  AS tipo,
  COUNT(*)                        AS total
FROM infracciones i
JOIN tipos_infraccion ti ON ti.id = i.tipo_infraccion_id
GROUP BY TO_CHAR(i.creado_en,'YYYY-MM'), ti.descripcion
ORDER BY mes DESC;
