CREATE TABLE usuarios (
  id                   SERIAL       PRIMARY KEY,
  codigo_universitario VARCHAR(20)  UNIQUE NOT NULL,
  nombre               VARCHAR(100) NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  telefono             VARCHAR(20),
  rol                  VARCHAR(15)  NOT NULL DEFAULT 'user'
                         CHECK (rol IN ('user','supervisor')),
  estado_cuenta        VARCHAR(15)  NOT NULL DEFAULT 'activa'
                         CHECK (estado_cuenta IN ('activa','suspendida','eliminada')),
  motivo_suspension    TEXT,
  qr_token             VARCHAR(64)  UNIQUE NOT NULL,
  preferencia_tema     VARCHAR(10)  DEFAULT 'claro'
                         CHECK (preferencia_tema IN ('claro','oscuro')),
  creado_en            TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE tipos_vehiculo (
  id      SERIAL      PRIMARY KEY,
  codigo  VARCHAR(10) UNIQUE NOT NULL,
  label   VARCHAR(50) NOT NULL
);

INSERT INTO tipos_vehiculo (codigo, label) VALUES
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
  nombre    VARCHAR(100) NOT NULL,
  ubicacion VARCHAR(150),
  cap_autos SMALLINT     NOT NULL DEFAULT 0,
  cap_motos SMALLINT     NOT NULL DEFAULT 0,
  activo    BOOLEAN      DEFAULT true
);

INSERT INTO estacionamientos (nombre, ubicacion, cap_autos, cap_motos) VALUES
  ('Estacionamiento 1', 'Sede Sur - Zona Norte', 95, 22),
  ('Estacionamiento 2', 'Sede Sur - Zona Sur',   59,  5);

CREATE TABLE bloques (
  id                 SERIAL      PRIMARY KEY,
  estacionamiento_id INTEGER     NOT NULL REFERENCES estacionamientos(id),
  codigo             VARCHAR(10) UNIQUE NOT NULL,
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
  id      SERIAL      PRIMARY KEY,
  codigo  VARCHAR(20) UNIQUE NOT NULL,
  label   VARCHAR(80) NOT NULL
);

INSERT INTO tipos_plaza (codigo, label) VALUES
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
  b RECORD;
  tipo_id INTEGER;
BEGIN
  FOR b IN SELECT id, codigo, tipo_vehiculo, letra_bloque, capacidad FROM bloques ORDER BY id
  LOOP
    IF b.tipo_vehiculo = 'auto' THEN
      tipo_id := 1;
    ELSE
      tipo_id := 3;
    END IF;

    FOR i IN 1..b.capacidad LOOP
      INSERT INTO plazas (codigo, bloque_id, numero_plaza, tipo_plaza_id)
      VALUES (
        b.codigo || '-' || LPAD(i::TEXT, 2, '0'),
        b.id,
        i,
        tipo_id
      );
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
  creado_en            TIMESTAMP   DEFAULT NOW(),
  CONSTRAINT una_reserva_activa UNIQUE (usuario_id, estado)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE escaneos_qr (
  id         SERIAL      PRIMARY KEY,
  usuario_id INTEGER     NOT NULL REFERENCES usuarios(id),
  reserva_id INTEGER     REFERENCES reservas(id),
  resultado  VARCHAR(20) NOT NULL
               CHECK (resultado IN ('acceso_ok','sin_reserva','fuera_horario','cuenta_suspendida')),
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
  id      SERIAL      PRIMARY KEY,
  codigo  VARCHAR(20) UNIQUE NOT NULL,
  label   VARCHAR(50) NOT NULL
);

INSERT INTO estados_reporte (codigo, label) VALUES
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
  id      SERIAL      PRIMARY KEY,
  codigo  VARCHAR(30) UNIQUE NOT NULL,
  label   VARCHAR(80) NOT NULL
);

INSERT INTO tipos_notificacion (codigo, label) VALUES
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