/**
 * ============================================================
 *  CONSTANTES DEL SISTEMA — UTP Parking
 * ============================================================
 *
 *  ⚠️  VALORES PERSISTIDOS EN PostgreSQL — NO CAMBIAR
 *  ==============================================
 *  Los valores marcados con "NO CAMBIAR" están grabados
 *  en la base de datos. Cambiarlos sin una migración SQL
 *  romperá todas las consultas y la lógica del sistema.
 *
 *  Si necesitas cambiar un valor:
 *    1. Crea una migración SQL que actualice la BD
 *    2. Cambia la constante
 *    3. Despliega ambos cambios juntos
 * ============================================================
 *
 *  ⚠️  SINCRONIZAR CON FRONTEND
 *  ============================
 *  Estos valores también existen en public/ (HTML, JS).
 *  NO modificar un valor sin sincronizar el frontend.
 *  La solución ideal: crear public/shared/js/constants.js
 *  (pendiente para Fase 5).
 * ============================================================
 */

const ROLES = Object.freeze({
  ESTUDIANTE: 'estudiante', // NO CAMBIAR — usuarios.rol
  DOCENTE: 'docente', // NO CAMBIAR
  SUPERVISOR: 'supervisor', // NO CAMBIAR
  ADMINISTRADOR: 'administrador', // NO CAMBIAR
  DIRECCION: 'direccion', // NO CAMBIAR
});

const ESTADO_SOLICITUD = Object.freeze({
  PENDIENTE: 'pendiente', // NO CAMBIAR — solicitudes_estacionamiento.estado
  INGRESADO: 'ingresado', // NO CAMBIAR
  FINALIZADO: 'finalizado', // NO CAMBIAR
  CANCELADO: 'cancelado', // NO CAMBIAR
  EXPIRADO: 'expirado', // NO CAMBIAR
});

const ESTADO_CUENTA = Object.freeze({
  ACTIVA: 'activa', // NO CAMBIAR — usuarios.estado_cuenta
  SUSPENDIDA: 'suspendida', // NO CAMBIAR
});

const ESTADO_PLAZA = Object.freeze({
  DISPONIBLE: 'disponible', // NO CAMBIAR — plazas.estado
  OCUPADA: 'ocupada', // NO CAMBIAR
  BLOQUEADA: 'bloqueada', // NO CAMBIAR — existe en CHECK de BD
  MANTENIMIENTO: 'mantenimiento', // NO CAMBIAR — existe en CHECK de BD
});

// estados_reporte.id (entero, usado en UPDATE/WHERE)
const ESTADO_REPORTE_ID = Object.freeze({
  ENVIADO: 1, // NO CAMBIAR — estados_reporte.id
  EN_REVISION: 2, // NO CAMBIAR
  RESUELTO: 3, // NO CAMBIAR
  PRIORITARIO: 4, // NO CAMBIAR
});

// estados_reporte.codigo (string, usado en JOINs)
const ESTADO_REPORTE_CODIGO = Object.freeze({
  ENVIADO: 'enviado', // NO CAMBIAR — estados_reporte.codigo
  EN_REVISION: 'en_revision', // NO CAMBIAR
  RESUELTO: 'resuelto', // NO CAMBIAR
  PRIORITARIO: 'prioritario', // NO CAMBIAR
});

const ESTADO_ACCESO = Object.freeze({
  FALLIDO: 'fallido',
  EXITOSO: 'exitoso',
});

const TIPO_VEHICULO = Object.freeze({
  AUTO: 'auto',
  MOTO: 'moto',
  MOTOTAXI: 'mototaxi',
});

const TIPO_ACCION_ADMIN = Object.freeze({
  VERIFICACION: 'verificacion',
  SUSPENSION: 'suspension',
  REACTIVACION: 'reactivacion',
});

const TIPO_NOTIFICACION = Object.freeze({
  SISTEMA: 'sistema',
  REPORTE: 'reporte',
});

const DURACION_SESION = Object.freeze({
  [ROLES.ESTUDIANTE]: '1h',
  [ROLES.DOCENTE]: '1h',
  [ROLES.SUPERVISOR]: '8h',
  [ROLES.ADMINISTRADOR]: '8h',
  [ROLES.DIRECCION]: '8h',
});

// Única fuente de verdad — lee del .env con fallback seguro
// Usa ?? en vez de || para no ignorar 0 (aunque 0 min no tiene sentido de negocio)
const TIEMPO_LIMITE_INGRESO_MIN = parseInt(process.env.TIEMPO_LIMITE_INGRESO_MIN ?? '30', 10);

// Congelado para impedir mutación accidental: constants.ROLES = {} desde otro módulo
module.exports = Object.freeze({
  ROLES,
  ESTADO_SOLICITUD,
  ESTADO_CUENTA,
  ESTADO_PLAZA,
  ESTADO_REPORTE_ID,
  ESTADO_REPORTE_CODIGO,
  ESTADO_ACCESO,
  TIPO_VEHICULO,
  TIPO_ACCION_ADMIN,
  TIPO_NOTIFICACION,
  DURACION_SESION,
  TIEMPO_LIMITE_INGRESO_MIN,
});
