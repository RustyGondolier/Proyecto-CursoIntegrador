-- ========================================================
-- SISTEMA DE GESTIÓN DE ESTACIONAMIENTOS
-- SCRIPT COMPLETO DE ESTRUCTURA Y DATOS INICIALES
-- ========================================================

-- 1. SEDES
CREATE TABLE sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(150),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    radio_permitido_metros INTEGER DEFAULT 2500,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sedes (nombre, ubicacion, latitud, longitud, radio_permitido_metros)
VALUES ('Lima Sur', 'Campus UTP Lima Sur', -12.19395294, -76.97149420, 2500); ---12.19395294, -76.97149420

-- 2. USUARIOS
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    codigo_universitario VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    dni VARCHAR(15),
    fecha_nacimiento DATE,
    correo_institucional VARCHAR(150),
    nro_licencia VARCHAR(20) UNIQUE,
    licencia_fecha_vencimiento DATE,
    codigo_conadis VARCHAR(20),
    conadis_verificado BOOLEAN DEFAULT false,
    rol VARCHAR(20) NOT NULL DEFAULT 'estudiante' CHECK (rol IN ('estudiante', 'docente', 'supervisor', 'administrador', 'direccion')),
    estado_cuenta VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado_cuenta IN ('activa', 'suspendida', 'eliminada')),
    motivo_suspension TEXT,
    puntos_infraccion INTEGER DEFAULT 0,
    verificado BOOLEAN DEFAULT false,
    requiere_reverificacion BOOLEAN DEFAULT true,
    verificado_por INTEGER REFERENCES usuarios(id),
    verificado_en TIMESTAMPTZ,
    preferencia_tema VARCHAR(10) DEFAULT 'claro' CHECK (preferencia_tema IN ('claro', 'oscuro')),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TIPOS DE VEHICULO
CREATE TABLE tipos_vehiculo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(15) UNIQUE NOT NULL,
    descripcion VARCHAR(80) NOT NULL,
    categoria_plaza VARCHAR(10) NOT NULL
        CHECK (categoria_plaza IN ('auto','moto'))
);

INSERT INTO tipos_vehiculo (codigo, descripcion, categoria_plaza)
VALUES ('auto', 'Automóvil', 'auto'), ('moto', 'Motocicleta', 'moto'), ('mototaxi', 'Mototaxi', 'auto');

-- 4. VEHICULOS
CREATE TABLE vehiculos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_vehiculo_id INTEGER NOT NULL REFERENCES tipos_vehiculo(id),
    placa VARCHAR(20) UNIQUE NOT NULL,
    modelo VARCHAR(120),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HISTORIAL DE ACCESOS
CREATE TABLE historial_accesos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(15) NOT NULL CHECK (estado IN ('exitoso', 'fallido')),
    ip_origen VARCHAR(45),
    user_agent TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ESTACIONAMIENTOS
CREATE TABLE estacionamientos (
    id SERIAL PRIMARY KEY,
    sede_id INTEGER NOT NULL REFERENCES sedes(id),
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(150),
    --cap_autos SMALLINT DEFAULT 0,
    --cap_motos SMALLINT DEFAULT 0,
    activo BOOLEAN DEFAULT true
);

INSERT INTO estacionamientos (sede_id, nombre, ubicacion)
VALUES (1, 'Estacionamiento 1', 'Sede Sur - Subterráneo'),
       (1, 'Estacionamiento 2', 'Sede Sur - Exterior');

-- 7. BLOQUES
CREATE TABLE bloques (
    id SERIAL PRIMARY KEY,
    estacionamiento_id INTEGER NOT NULL REFERENCES estacionamientos(id),
    codigo VARCHAR(25) UNIQUE NOT NULL,
    tipo_vehiculo VARCHAR(10) NOT NULL CHECK (tipo_vehiculo IN ('auto', 'moto')),
    letra_bloque CHAR(1) NOT NULL,
    capacidad SMALLINT NOT NULL DEFAULT 8,
    descripcion VARCHAR(120)
);

-- 8. TIPOS DE PLAZA
CREATE TABLE tipos_plaza (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(25) UNIQUE NOT NULL,
    descripcion VARCHAR(100) NOT NULL
);

INSERT INTO tipos_plaza (codigo, descripcion)
VALUES ('auto_estandar', 'Auto estándar'), 
       ('auto_discapacidad', 'Auto discapacidad'), 
       ('moto_estandar', 'Moto estándar');

-- 9. PLAZAS
CREATE TABLE plazas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    bloque_id INTEGER NOT NULL REFERENCES bloques(id),
    numero_plaza SMALLINT NOT NULL,
    tipo_plaza_id INTEGER NOT NULL REFERENCES tipos_plaza(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupada', 'bloqueada', 'mantenimiento'))
);

-- 10. SOLICITUDES DE ESTACIONAMIENTO
CREATE TABLE solicitudes_estacionamiento (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
    estacionamiento_id INTEGER NOT NULL REFERENCES estacionamientos(id),
    --plaza_assigned_id INTEGER REFERENCES plazas(id), -- Corregido el nombre para consistencia si fuera necesario
    plaza_asignada_id INTEGER REFERENCES plazas(id),
    supervisor_ingreso_id INTEGER REFERENCES usuarios(id),
    supervisor_salida_id INTEGER REFERENCES usuarios(id),
    identificador_codigo VARCHAR(20),
    hora_solicitud TIMESTAMPTZ DEFAULT NOW(),
    hora_limite_ingreso TIMESTAMPTZ NOT NULL,
    hora_ingreso TIMESTAMPTZ,
    hora_salida TIMESTAMPTZ,
    tiempo_permanencia_min INTEGER,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'ingresado', 'finalizado', 'cancelado', 'expirado')),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX una_solicitud_activa ON solicitudes_estacionamiento(usuario_id) 
WHERE estado IN ('pendiente','ingresado');

CREATE INDEX idx_solicitudes_usuario ON solicitudes_estacionamiento(usuario_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_estacionamiento(estado);

-- 11. VERIFICACIONES DE UBICACION
CREATE TABLE verificaciones_ubicacion (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    solicitud_id INTEGER REFERENCES solicitudes_estacionamiento(id),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    distancia_metros INTEGER,
    permitido BOOLEAN,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TIPOS DE INFRACCION
CREATE TABLE tipos_infraccion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    descripcion VARCHAR(150) NOT NULL
);

INSERT INTO tipos_infraccion (codigo, descripcion)
VALUES ('mal_estacionado', 'Vehículo mal estacionado'),
       ('sin_identificador', 'Pérdida de identificador'),
       ('plaza_incorrecta', 'Uso de plaza incorrecta'),
       ('obstruccion', 'Obstrucción de tránsito'),
       ('conduccion_riesgosa', 'Conducción riesgosa');

-- 13. INFRACCIONES
CREATE TABLE infracciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    vehiculo_id INTEGER REFERENCES vehiculos(id),
    plaza_id INTEGER REFERENCES plazas(id),
    solicitud_id INTEGER REFERENCES solicitudes_estacionamiento(id),
    supervisor_id INTEGER NOT NULL REFERENCES usuarios(id),
    tipo_infraccion_id INTEGER NOT NULL REFERENCES tipos_infraccion(id),
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_infracciones_usuario ON infracciones(usuario_id);

-- 14. ESTADOS DE REPORTE
CREATE TABLE estados_reporte (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion VARCHAR(80) NOT NULL
);

INSERT INTO estados_reporte (codigo, descripcion)
VALUES ('enviado', 'Enviado'), ('en_revision', 'En revisión'), ('resuelto', 'Resuelto'), ('prioritario', 'Prioritario'), ('cancelado', 'Cancelado');

-- 15. REPORTES DE INCIDENCIAS
CREATE TABLE reportes_incidencias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    solicitud_id INTEGER REFERENCES solicitudes_estacionamiento(id),
    plaza_id INTEGER REFERENCES plazas(id),
    estacionamiento_id INTEGER REFERENCES estacionamientos(id),
    supervisor_id INTEGER REFERENCES usuarios(id),
    descripcion TEXT NOT NULL,
    estado_id INTEGER NOT NULL DEFAULT 1 REFERENCES estados_reporte(id),
    es_prioritario BOOLEAN DEFAULT false,
    razon_prioridad TEXT,
    respuesta_supervisor TEXT,
    valoracion SMALLINT CHECK (valoracion BETWEEN 1 AND 5),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reportes_usuario ON reportes_incidencias(usuario_id);

-- 16. FAQ
CREATE TABLE faq_categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) UNIQUE NOT NULL
);

INSERT INTO faq_categorias (nombre) VALUES ('General'), ('Solicitudes'), ('Incidencias'), ('Cuentas');

CREATE TABLE faq (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL REFERENCES faq_categorias(id),
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 17. TIPOS NOTIFICACION
CREATE TABLE tipos_notificacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    descripcion VARCHAR(80) NOT NULL
);

INSERT INTO tipos_notificacion (codigo, descripcion)
VALUES ('solicitud', 'Solicitud de estacionamiento'), ('reporte', 'Reporte de incidencia'), ('infraccion', 'Infracción'), ('sistema', 'Sistema'), ('soporte', 'Soporte');

-- 18. NOTIFICACIONES
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_id INTEGER NOT NULL REFERENCES tipos_notificacion(id),
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    url_destino VARCHAR(255),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);

-- 19. ACCIONES ADMINISTRATIVAS
CREATE TABLE acciones_administrativas (
    id SERIAL PRIMARY KEY,
    administrador_id INTEGER NOT NULL REFERENCES usuarios(id),
    usuario_afectado_id INTEGER REFERENCES usuarios(id),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('verificacion', 'suspension', 'reactivacion', 'bloqueo_plaza', 'desbloqueo_plaza')),
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 20. VISTAS ANALYTICS
CREATE VIEW v_ocupacion_actual AS
SELECT
    e.nombre AS estacionamiento,
    COUNT(p.id) FILTER (WHERE tp.codigo LIKE 'auto%') AS total_autos,
    COUNT(p.id) FILTER (WHERE tp.codigo LIKE 'moto%') AS total_motos,
    COUNT(p.id) FILTER (WHERE p.estado = 'ocupada' AND tp.codigo LIKE 'auto%') AS autos_ocupados,
    COUNT(p.id) FILTER (WHERE p.estado = 'ocupada' AND tp.codigo LIKE 'moto%') AS motos_ocupadas
FROM plazas p
JOIN bloques b ON b.id = p.bloque_id
JOIN estacionamientos e ON e.id = b.estacionamiento_id
JOIN tipos_plaza tp ON tp.id = p.tipo_plaza_id
GROUP BY e.id, e.nombre;

CREATE VIEW v_flujo_por_hora AS
SELECT
    EXTRACT(HOUR FROM hora_ingreso)::INTEGER AS hora,
    COUNT(*) AS total_ingresos
FROM solicitudes_estacionamiento
WHERE hora_ingreso IS NOT NULL
GROUP BY hora
ORDER BY hora;

CREATE VIEW v_permanencia_promedio AS
SELECT
    AVG(tiempo_permanencia_min) AS promedio_minutos
FROM solicitudes_estacionamiento
WHERE tiempo_permanencia_min IS NOT NULL;

CREATE VIEW v_usuarios_reincidentes AS
SELECT
    u.id,
    u.nombre,
    u.codigo_universitario,
    COUNT(i.id) AS total_infracciones
FROM usuarios u
LEFT JOIN infracciones i ON i.usuario_id = u.id
GROUP BY u.id, u.nombre, u.codigo_universitario
HAVING COUNT(i.id) > 0
ORDER BY total_infracciones DESC;

CREATE VIEW v_reportes_por_estacionamiento AS
SELECT
    e.nombre AS estacionamiento,
    COUNT(r.id) AS total_reportes
FROM reportes_incidencias r
JOIN estacionamientos e ON e.id = r.estacionamiento_id
GROUP BY e.id, e.nombre
ORDER BY total_reportes DESC;