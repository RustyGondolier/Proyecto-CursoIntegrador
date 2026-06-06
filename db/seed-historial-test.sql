-- Datos de prueba para RF20 - Historial de accesos
-- Usuario: Jose Ramirez (id=5), Vehículo: AF-1234 (id=2)
-- Cochera 1 (Subterráneo), Cochera 2 (Exterior)

-- Hace 7 días - finalizado
INSERT INTO solicitudes_estacionamiento
  (usuario_id, vehiculo_id, estacionamiento_id, plaza_asignada_id, estado,
   hora_solicitud, hora_limite_ingreso, hora_ingreso, hora_salida,
   supervisor_ingreso_id, supervisor_salida_id, tiempo_permanencia_min,
   creado_en)
VALUES
  (5, 2, 1, 1, 'finalizado',
   NOW() - INTERVAL '7 days' - INTERVAL '10 minutes',
   NOW() - INTERVAL '7 days' + INTERVAL '20 minutes',
   NOW() - INTERVAL '7 days' - INTERVAL '5 minutes',
   NOW() - INTERVAL '7 days' + INTERVAL '2 hours 15 minutes',
   1, 1, 140,
   NOW() - INTERVAL '7 days');

-- Hace 3 días - finalizado (cochera 2)
INSERT INTO solicitudes_estacionamiento
  (usuario_id, vehiculo_id, estacionamiento_id, plaza_asignada_id, estado,
   hora_solicitud, hora_limite_ingreso, hora_ingreso, hora_salida,
   supervisor_ingreso_id, supervisor_salida_id, tiempo_permanencia_min,
   creado_en)
VALUES
  (5, 2, 2, 65, 'finalizado',
   NOW() - INTERVAL '3 days' - INTERVAL '8 minutes',
   NOW() - INTERVAL '3 days' + INTERVAL '22 minutes',
   NOW() - INTERVAL '3 days' - INTERVAL '3 minutes',
   NOW() - INTERVAL '3 days' + INTERVAL '3 hours 30 minutes',
   1, 1, 213,
   NOW() - INTERVAL '3 days');

-- Ayer - cancelado
INSERT INTO solicitudes_estacionamiento
  (usuario_id, vehiculo_id, estacionamiento_id, estado,
   hora_solicitud, hora_limite_ingreso, creado_en)
VALUES
  (5, 2, 1, 'cancelado',
   NOW() - INTERVAL '1 day' - INTERVAL '15 minutes',
   NOW() - INTERVAL '1 day' + INTERVAL '15 minutes',
   NOW() - INTERVAL '1 day');

-- Hoy - ingresado
INSERT INTO solicitudes_estacionamiento
  (usuario_id, vehiculo_id, estacionamiento_id, plaza_asignada_id, estado,
   hora_solicitud, hora_limite_ingreso, hora_ingreso,
   supervisor_ingreso_id, creado_en)
VALUES
  (5, 2, 1, 2, 'ingresado',
   NOW() - INTERVAL '1 hour',
   NOW() + INTERVAL '29 minutes',
   NOW() - INTERVAL '45 minutes',
   1,
   NOW() - INTERVAL '1 hour');

-- Hoy - pendiente
INSERT INTO solicitudes_estacionamiento
  (usuario_id, vehiculo_id, estacionamiento_id, estado,
   hora_solicitud, hora_limite_ingreso, creado_en)
VALUES
  (5, 2, 2, 'pendiente',
   NOW() - INTERVAL '5 minutes',
   NOW() + INTERVAL '25 minutes',
   NOW() - INTERVAL '5 minutes');
