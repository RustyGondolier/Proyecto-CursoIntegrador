const direccionRepository = require('../repositories/direccion.repository');

async function getDashboard(fechaInicio, fechaFin) {
  const [
    resumen,
    permanencia,
    solicitudesPorHora,
    ocupacionPorDia,
    ocupacionPorSemana,
    ocupacionPorHora,
    reportes
  ] = await Promise.all([
    direccionRepository.getResumen(fechaInicio, fechaFin),
    direccionRepository.getTiempoPermanencia(fechaInicio, fechaFin),
    direccionRepository.getSolicitudesPorHora(fechaInicio, fechaFin),
    direccionRepository.getOcupacionPorDia(fechaInicio, fechaFin),
    direccionRepository.getOcupacionPorSemana(fechaInicio, fechaFin),
    direccionRepository.getOcupacionPorHora(fechaInicio, fechaFin),
    direccionRepository.getReportesInfo(fechaInicio, fechaFin)
  ]);

  return {
    resumen: {
      total_solicitudes: Number(resumen.total_solicitudes),
      total_ingresos: Number(resumen.total_ingresos),
      total_infracciones: Number(resumen.total_infracciones),
      total_reportes: Number(resumen.total_reportes)
    },
    permanencia,
    solicitudes_por_hora: solicitudesPorHora,
    ocupacion: {
      por_dia: ocupacionPorDia,
      por_semana: ocupacionPorSemana,
      por_hora: ocupacionPorHora
    },
    reportes
  };
}

module.exports = {
  getDashboard
};
