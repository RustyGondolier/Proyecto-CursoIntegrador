const XLSX = require('xlsx');

function buildWorkbook(hojas) {
  const wb = XLSX.utils.book_new();

  hojas.forEach(({ nombre, columnas, datos }) => {
    const filas = datos.map(item => {
      const fila = {};
      columnas.forEach(col => {
        fila[col.header] = item[col.key] ?? '—';
      });
      return fila;
    });

    const ws = XLSX.utils.json_to_sheet(filas);
    ws['!cols'] = columnas.map(c => ({ wch: Math.max(c.header.length * 2, 14) }));
    XLSX.utils.book_append_sheet(wb, ws, nombre.slice(0, 31));
  });

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { buildWorkbook };
