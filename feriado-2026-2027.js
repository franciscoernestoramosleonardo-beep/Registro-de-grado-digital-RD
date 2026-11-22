// DATOS CORREGIDOS - Calendario Escolar 2026-2027
const feriadosEscolares2026_2027 = {
  fuente: "Calendario Escolar 2026-2027 - MINERD",
  ano: "2026-2027",
  feriados: [
    // 2026
    { fecha: "2026-01-01", diaSemana: "jueves", nombre: "Año Nuevo", trasladado: false },
    { fecha: "2026-01-05", diaSemana: "lunes", nombre: "Día de los Santos Reyes", trasladado: true },
    { fecha: "2026-01-21", diaSemana: "miércoles", nombre: "Nuestra Señora de la Altagracia", trasladado: false },
    { fecha: "2026-01-26", diaSemana: "lunes", nombre: "Natalicio de Juan Pablo Duarte", trasladado: false },
    { fecha: "2026-02-27", diaSemana: "viernes", nombre: "Independencia Nacional", trasladado: false },
    { fecha: "2026-04-03", diaSemana: "viernes", nombre: "Viernes Santo", trasladado: false },
    { fecha: "2026-05-04", diaSemana: "lunes", nombre: "Día del Trabajo", trasladado: true },
    { fecha: "2026-06-04", diaSemana: "jueves", nombre: "Corpus Christi", trasladado: false },
    { fecha: "2026-08-16", diaSemana: "domingo", nombre: "Día de la Restauración", trasladado: false },
    { fecha: "2026-09-24", diaSemana: "jueves", nombre: "Día de Nuestra Señora de las Mercedes", trasladado: false },
    { fecha: "2026-11-09", diaSemana: "lunes", nombre: "Día de la Constitución", trasladado: true },
    { fecha: "2026-12-25", diaSemana: "viernes", nombre: "Navidad", trasladado: false },
    
    // 2027
    { fecha: "2027-01-01", diaSemana: "viernes", nombre: "Año Nuevo", trasladado: false },
    { fecha: "2027-01-04", diaSemana: "lunes", nombre: "Día de los Santos Reyes", trasladado: true },
    { fecha: "2027-01-21", diaSemana: "jueves", nombre: "Nuestra Señora de la Altagracia", trasladado: false },
    { fecha: "2027-01-25", diaSemana: "lunes", nombre: "Natalicio de Juan Pablo Duarte", trasladado: true },
    { fecha: "2027-02-27", diaSemana: "sábado", nombre: "Independencia Nacional", trasladado: false },
    { fecha: "2027-03-26", diaSemana: "viernes", nombre: "Viernes Santo", trasladado: false },
    { fecha: "2027-05-03", diaSemana: "lunes", nombre: "Día del Trabajo", trasladado: true },
    { fecha: "2027-05-27", diaSemana: "jueves", nombre: "Corpus Christi", trasladado: false },
    { fecha: "2027-08-16", diaSemana: "lunes", nombre: "Día de la Restauración", trasladado: false },
    { fecha: "2027-09-24", diaSemana: "viernes", nombre: "Día de Nuestra Señora de las Mercedes", trasladado: false },
    { fecha: "2027-11-08", diaSemana: "lunes", nombre: "Día de la Constitución", trasladado: true },
    { fecha: "2027-12-25", diaSemana: "sábado", nombre: "Navidad", trasladado: false }
  ]
};

// ============================================
// FUNCIONES PARA ACCEDER A LOS FERIADOS
// ============================================

function esFeriado(fechaStr) {
  return feriadosEscolares2026_2027.feriados.find(f => f.fecha === fechaStr) || null;
}

function obtenerFeriadosPorMes(mes, ano) {
  const mesStr = String(mes).padStart(2, '0');
  const prefijo = `${ano}-${mesStr}`;
  const resultado = feriadosEscolares2026_2027.feriados.filter(f => f.fecha.startsWith(prefijo));
  return resultado;
}

function obtenerFeriadosDelMes(mesIndex, schoolYear) {
  // mesIndex: 0=Agosto, 1=Septiembre, 2=Octubre, 3=Noviembre, 4=Diciembre,
  //           5=Enero, 6=Febrero, 7=Marzo, 8=Abril, 9=Mayo, 10=Junio
  
  const year = parseInt(schoolYear.split('-')[0]);
  let mesNumerico;
  let añoReal;
  
  if (mesIndex >= 5) {
    // Enero (5) -> mes 1, Febrero (6) -> mes 2, ... Junio (10) -> mes 6
    mesNumerico = mesIndex - 4; // 5->1, 6->2, 7->3, 8->4, 9->5, 10->6
    añoReal = year + 1;
  } else {
    // Agosto (0) -> mes 8, Septiembre (1) -> mes 9, ... Diciembre (4) -> mes 12
    mesNumerico = mesIndex + 8; // 0->8, 1->9, 2->10, 3->11, 4->12
    añoReal = year;
  }
  
  const feriados = obtenerFeriadosPorMes(mesNumerico, añoReal);
  
  const resultado = feriados.map(f => {
    const dia = parseInt(f.fecha.split('-')[2]);
    return {
      dia: dia,
      nombre: f.nombre,
      fecha: f.fecha,
      trasladado: f.trasladado || false
    };
  });
  
  return resultado;
}

function obtenerDiasFeriados(mesIndex, schoolYear) {
  const feriados = obtenerFeriadosDelMes(mesIndex, schoolYear);
  return feriados.map(f => f.dia);
}

function totalFeriados() {
  return feriadosEscolares2026_2027.feriados.length;
}

// EXPORTAR PARA USO GLOBAL
window.feriadosEscolares2026_2027 = feriadosEscolares2026_2027;
window.esFeriado = esFeriado;
window.obtenerFeriadosPorMes = obtenerFeriadosPorMes;
window.obtenerFeriadosDelMes = obtenerFeriadosDelMes;
window.obtenerDiasFeriados = obtenerDiasFeriados;
window.totalFeriados = totalFeriados;

console.log('📅 Calendario de feriados cargado correctamente');
console.log('✅ Total de feriados:', totalFeriados());

// PRUEBA: Feriados de Septiembre 2026 (mesIndex=1)
console.log('🔴 Feriados de Septiembre 2026:', obtenerFeriadosDelMes(1, '2026-2027'));
console.log('🔴 Días feriados de Septiembre 2026:', obtenerDiasFeriados(1, '2026-2027'));