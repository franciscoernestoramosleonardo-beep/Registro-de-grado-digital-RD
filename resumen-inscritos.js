/**
RESUMEN DE INSCRITOS E INSCRITAS DE LA SECCIÓN
✅ Sincronización con página principal
✅ Auto-cálculo desde registrosSigerd (FORMULARIO)
✅ Fecha de inicio de clases determina Matrícula Inicial vs Nuevos Inscritos
✅ Meses sin movimiento replican el mes anterior
✅ Totales: "1er día" y "último día" muestran el valor del ÚLTIMO mes
✅ Tanda incluida en la barra de información
*/

// ============================================
// VARIABLES DE SINCRONIZACIÓN
// ============================================
let currentGrade = 3;
let currentSection = 'A';
let currentTanda = 'MATUTINA';
let currentSchoolYear = '2025-2026';

// ============================================
// CONFIGURACIÓN
// ============================================
const MESES = [
    'Agosto', 'Septiembre', 'Octubre', 'Noviembre',
    'Diciembre', 'Enero', 'Febrero', 'Marzo',
    'Abril', 'Mayo', 'Junio'
];

const FECHAS_INICIO_CLASES = {
    '2024-2025': '2024-08-19',
    '2025-2026': '2025-08-18',
    '2026-2027': '2026-08-24',
    '2027-2028': '2027-08-23',
    '2028-2029': '2028-08-21',
    '2029-2030': '2029-08-20'
};

// ============================================
// UTILIDADES
// ============================================
function normalizar(txt) {
    if (!txt) return '';
    return String(txt).toUpperCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function convertirGradoANumero(gradoTexto) {
    if (!gradoTexto) return null;
    const n = normalizar(gradoTexto);
    if (n.includes('PRIMER') || n.includes('1ER')) return 1;
    if (n.includes('SEGUNDO') || n.includes('2DO')) return 2;
    if (n.includes('TERCER') || n.includes('3ER')) return 3;
    if (n.includes('CUARTO') || n.includes('4TO')) return 4;
    if (n.includes('QUINTO') || n.includes('5TO')) return 5;
    if (n.includes('SEXTO') || n.includes('6TO')) return 6;
    if (/^[1-6]$/.test(n)) return parseInt(n, 10);
    return null;
}

function parsearAnioEscolar(yearStr) {
    if (!yearStr) {
        const anio = new Date().getFullYear();
        return { anioInicio: anio, anioFin: anio + 1 };
    }
    const partes = String(yearStr).split('-');
    if (partes.length === 2) {
        return {
            anioInicio: parseInt(partes[0], 10),
            anioFin: parseInt(partes[1], 10)
        };
    }
    const anio = parseInt(yearStr, 10) || new Date().getFullYear();
    return { anioInicio: anio, anioFin: anio + 1 };
}

function obtenerFechaInicioClases() {
    const fechaStr = FECHAS_INICIO_CLASES[currentSchoolYear];
    if (!fechaStr) return null;
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return null;
    return new Date(
        parseInt(partes[0], 10),
        parseInt(partes[1], 10) - 1,
        parseInt(partes[2], 10)
    );
}

function parsearFechaDDMMYYYY(fechaStr) {
    if (!fechaStr) return null;
    const partes = String(fechaStr).split('/');
    if (partes.length !== 3) return null;
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const anio = parseInt(partes[2], 10);
    if (!dia || !mes || !anio) return null;
    return new Date(anio, mes - 1, dia);
}

function formatearTanda(tanda) {
    if (!tanda) return 'Matutina';
    const t = String(tanda).toUpperCase().trim();
    const mapa = {
        'MATUTINA': 'Matutina', 'VESPERTINA': 'Vespertina', 'NOCTURNA': 'Nocturna',
        'MATUTINO': 'Matutina', 'VESPERTINO': 'Vespertina', 'NOCTURNO': 'Nocturna',
        'MAÑANA': 'Matutina', 'MANANA': 'Matutina',
        'TARDE': 'Vespertina', 'NOCHE': 'Nocturna'
    };
    return mapa[t] || tanda;
}

// ============================================
// APLICAR DATOS SINCRONIZADOS
// ============================================
function aplicarDatosSincronizados() {
    try {
        const datosSync = localStorage.getItem('datosSincronizados');
        if (!datosSync) return false;
        const datos = JSON.parse(datosSync);
        console.log('📥 Datos sincronizados:', datos);
        
        if (datos.grado) {
            const gradoMap = {
                'Primer Grado': 1, 'Segundo Grado': 2, 'Tercer Grado': 3,
                'Cuarto Grado': 4, 'Quinto Grado': 5, 'Sexto Grado': 6
            };
            currentGrade = gradoMap[datos.grado] || convertirGradoANumero(datos.grado) || 3;
        }
        if (datos.seccion) currentSection = datos.seccion;
        if (datos.tanda) currentTanda = datos.tanda;
        if (datos.anioEscolar) currentSchoolYear = datos.anioEscolar;
        
        localStorage.setItem('inscritos_grade', String(currentGrade));
        localStorage.setItem('inscritos_section', currentSection);
        localStorage.setItem('inscritos_tanda', currentTanda);
        localStorage.setItem('inscritos_year', currentSchoolYear);
        
        actualizarInfoGradoRI();
        return true;
    } catch (e) {
        console.error('❌ Error:', e);
        return false;
    }
}

function getGradeTextRI(grade) {
    const texts = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to' };
    return texts[grade] || '3er';
}

function actualizarInfoGradoRI() {
    const g = document.getElementById('gradeDisplayRI');
    const s = document.getElementById('sectionDisplayRI');
    const t = document.getElementById('tandaDisplayRI');
    const y = document.getElementById('schoolYearDisplayRI');
    if (g) g.textContent = getGradeTextRI(currentGrade) + ' Grado';
    if (s) s.textContent = 'Sección ' + currentSection;
    if (t) t.textContent = formatearTanda(currentTanda);
    if (y) y.textContent = currentSchoolYear;
}

function syncData(grade, section, year, tanda) {
    if (grade !== undefined && grade >= 1 && grade <= 6) currentGrade = grade;
    if (section !== undefined) currentSection = section;
    if (year !== undefined) currentSchoolYear = year;
    if (tanda !== undefined) currentTanda = tanda;
    localStorage.setItem('inscritos_grade', String(currentGrade));
    localStorage.setItem('inscritos_section', currentSection);
    localStorage.setItem('inscritos_tanda', currentTanda);
    localStorage.setItem('inscritos_year', currentSchoolYear);
    actualizarInfoGradoRI();
    generarTablaResumen();
    setTimeout(function() {
        autoCalcularDesdeRegistros(false);
    }, 300);
}

window.syncData = syncData;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;
window.actualizarInfoGradoRI = actualizarInfoGradoRI;

/* ============ GENERAR TABLA ============ */
function generarTablaResumen() {
    const container = document.getElementById('tabla-resumen-container');
    if (!container) return;
    
    let html = '<table class="tabla-resumen">';
    html += '<thead>';
    html += '<tr>';
    html += '<th class="col-mes col-mes-header" rowspan="2">MES</th>';
    html += '<th colspan="2" class="col-sub-header">Inscritos al 1er.<br>día del mes</th>';
    html += '<th colspan="2" class="col-sub-header">Nuevos estudiantes<br>inscritos en el mes</th>';
    html += '<th colspan="2" class="col-sub-header">Estudiantes<br>retirados en el mes</th>';
    html += '<th colspan="2" class="col-sub-header">Estudiantes<br>inscritos al último<br>día en el mes</th>';
    html += '</tr>';
    html += '<tr>';
    html += '<th class="col-sub-header">Masc.</th>';
    html += '<th class="col-sub-header">Fem.</th>';
    html += '<th class="col-sub-header">Masc.</th>';
    html += '<th class="col-sub-header">Fem.</th>';
    html += '<th class="col-sub-header">Masc.</th>';
    html += '<th class="col-sub-header">Fem.</th>';
    html += '<th class="col-sub-header">Masc.</th>';
    html += '<th class="col-sub-header">Fem.</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    
    MESES.forEach((mes, index) => {
        html += `<tr data-mes="${mes}" data-index="${index}">`;
        html += `<td class="col-mes">${mes}</td>`;
        html += `<td><input type="number" min="0" max="999" data-campo="${mes.toLowerCase()}_1er_masc" placeholder="0"></td>`;
        html += `<td><input type="number" min="0" max="999" data-campo="${mes.toLowerCase()}_1er_fem" placeholder="0"></td>`;
        html += `<td><input type="number" min="0" max="999" data-campo="${mes.toLowerCase()}_nuevos_masc" placeholder="0"></td>`;
        html += `<td><input type="number" min="0" max="999" data-campo="${mes.toLowerCase()}_nuevos_fem" placeholder="0"></td>`;
        html += `<td><input type="number" min="0" max="999" data-campo="${mes.toLowerCase()}_retirados_masc" placeholder="0"></td>`;
        html += `<td><input type="number" min="0" max="999" data-campo="${mes.toLowerCase()}_retirados_fem" placeholder="0"></td>`;
        html += `<td><input type="number" min="0" max="999" data-campo="${mes.toLowerCase()}_ultimo_masc" placeholder="0"></td>`;
        html += `<td><input type="number" min="0" max="999" data-campo="${mes.toLowerCase()}_ultimo_fem" placeholder="0"></td>`;
        html += '</tr>';
    });
    
    html += '<tr class="fila-total">';
    html += '<td class="col-mes">TOTAL</td>';
    html += '<td><input type="number" min="0" max="9999" data-campo="total_1er_masc" placeholder="0" readonly></td>';
    html += '<td><input type="number" min="0" max="9999" data-campo="total_1er_fem" placeholder="0" readonly></td>';
    html += '<td><input type="number" min="0" max="9999" data-campo="total_nuevos_masc" placeholder="0" readonly></td>';
    html += '<td><input type="number" min="0" max="9999" data-campo="total_nuevos_fem" placeholder="0" readonly></td>';
    html += '<td><input type="number" min="0" max="9999" data-campo="total_retirados_masc" placeholder="0" readonly></td>';
    html += '<td><input type="number" min="0" max="9999" data-campo="total_retirados_fem" placeholder="0" readonly></td>';
    html += '<td><input type="number" min="0" max="9999" data-campo="total_ultimo_masc" placeholder="0" readonly></td>';
    html += '<td><input type="number" min="0" max="9999" data-campo="total_ultimo_fem" placeholder="0" readonly></td>';
    html += '</tr>';
    html += '</tbody></table>';
    
    container.innerHTML = html;
    console.log('✅ Tabla generada');
    asignarEventosCalculo();
}

/* ============ ASIGNAR EVENTOS ============ */
function asignarEventosCalculo() {
    document.querySelectorAll('#tabla-resumen-container input[type="number"]:not([readonly])').forEach(input => {
        input.addEventListener('input', function() {
            validarDatos(this);
            recalcularCadenaMeses();
            calcularTotales();
        });
        input.addEventListener('blur', function() {
            recalcularCadenaMeses();
            calcularTotales();
        });
    });
    
    document.querySelectorAll('#matricula-inicial input').forEach(input => {
        input.addEventListener('input', function() {
            calcularMatriculaInicial();
            recalcularCadenaMeses();
            calcularTotales();
        });
    });
}

function validarDatos(input) {
    const valor = parseInt(input.value) || 0;
    if (valor < 0) input.value = 0;
    if (valor > 9999) input.value = 9999;
}

function calcularMatriculaInicial() {
    const inicialMasc = parseInt(document.querySelector('[data-campo="inicial_masc"]')?.value) || 0;
    const inicialFem = parseInt(document.querySelector('[data-campo="inicial_fem"]')?.value) || 0;
    const inputInicialTotal = document.querySelector('[data-campo="inicial_total"]');
    if (inputInicialTotal) inputInicialTotal.value = inicialMasc + inicialFem;
}

/* ============ RECALCULAR CADENA DE MESES ============ */
function recalcularCadenaMeses() {
    const inicialMasc = parseInt(document.querySelector('[data-campo="inicial_masc"]')?.value) || 0;
    const inicialFem = parseInt(document.querySelector('[data-campo="inicial_fem"]')?.value) || 0;
    
    let acumMasc = inicialMasc;
    let acumFem = inicialFem;
    
    MESES.forEach((mes) => {
        const key = mes.toLowerCase();
        const set = (campo, valor) => {
            const input = document.querySelector(`[data-campo="${campo}"]`);
            if (input) input.value = valor;
        };
        const get = (campo) => {
            return parseInt(document.querySelector(`[data-campo="${campo}"]`)?.value) || 0;
        };
        
        set(`${key}_1er_masc`, acumMasc);
        set(`${key}_1er_fem`, acumFem);
        
        const nuevosMasc = get(`${key}_nuevos_masc`);
        const nuevosFem = get(`${key}_nuevos_fem`);
        const retiradosMasc = get(`${key}_retirados_masc`);
        const retiradosFem = get(`${key}_retirados_fem`);
        
        const ultimoMasc = acumMasc + nuevosMasc - retiradosMasc;
        const ultimoFem = acumFem + nuevosFem - retiradosFem;
        set(`${key}_ultimo_masc`, ultimoMasc);
        set(`${key}_ultimo_fem`, ultimoFem);
        
        acumMasc = ultimoMasc;
        acumFem = ultimoFem;
    });
}

/* ============================================
✅ CALCULAR TOTALES
- Total "1er día" = valor del ÚLTIMO mes (Junio)
- Total "Nuevos" = suma de todos los meses
- Total "Retirados" = suma de todos los meses
- Total "Último día" = valor del ÚLTIMO mes (Junio)
============================================ */
function calcularTotales() {
    let totalNuevosMasc = 0, totalNuevosFem = 0;
    let totalRetiradosMasc = 0, totalRetiradosFem = 0;
    
    MESES.forEach(mes => {
        const key = mes.toLowerCase();
        totalNuevosMasc += parseInt(document.querySelector(`[data-campo="${key}_nuevos_masc"]`)?.value) || 0;
        totalNuevosFem += parseInt(document.querySelector(`[data-campo="${key}_nuevos_fem"]`)?.value) || 0;
        totalRetiradosMasc += parseInt(document.querySelector(`[data-campo="${key}_retirados_masc"]`)?.value) || 0;
        totalRetiradosFem += parseInt(document.querySelector(`[data-campo="${key}_retirados_fem"]`)?.value) || 0;
    });
    
    const set = (campo, valor) => {
        const input = document.querySelector(`[data-campo="${campo}"]`);
        if (input) input.value = valor;
    };
    
    // ✅ Total "1er día" = valor del ÚLTIMO mes (Junio)
    const ultimoMes = MESES[MESES.length - 1].toLowerCase();
    const ultimoMes1erMasc = parseInt(document.querySelector(`[data-campo="${ultimoMes}_1er_masc"]`)?.value) || 0;
    const ultimoMes1erFem = parseInt(document.querySelector(`[data-campo="${ultimoMes}_1er_fem"]`)?.value) || 0;
    set('total_1er_masc', ultimoMes1erMasc);
    set('total_1er_fem', ultimoMes1erFem);
    
    // Total Nuevos = suma
    set('total_nuevos_masc', totalNuevosMasc);
    set('total_nuevos_fem', totalNuevosFem);
    
    // Total Retirados = suma
    set('total_retirados_masc', totalRetiradosMasc);
    set('total_retirados_fem', totalRetiradosFem);
    
    // ✅ Total "Último día" = valor del ÚLTIMO mes (Junio)
    const ultimoDiaMasc = parseInt(document.querySelector(`[data-campo="${ultimoMes}_ultimo_masc"]`)?.value) || 0;
    const ultimoDiaFem = parseInt(document.querySelector(`[data-campo="${ultimoMes}_ultimo_fem"]`)?.value) || 0;
    set('total_ultimo_masc', ultimoDiaMasc);
    set('total_ultimo_fem', ultimoDiaFem);
    
    // Matrícula final
    const inicialMasc = parseInt(document.querySelector('[data-campo="inicial_masc"]')?.value) || 0;
    const inicialFem = parseInt(document.querySelector('[data-campo="inicial_fem"]')?.value) || 0;
    const finalMasc = inicialMasc + totalNuevosMasc - totalRetiradosMasc;
    const finalFem = inicialFem + totalNuevosFem - totalRetiradosFem;
    
    const inputFinalMasc = document.querySelector('[data-campo="final_masc"]');
    const inputFinalFem = document.querySelector('[data-campo="final_fem"]');
    const inputFinalTotal = document.querySelector('[data-campo="final_total"]');
    if (inputFinalMasc) inputFinalMasc.value = finalMasc;
    if (inputFinalFem) inputFinalFem.value = finalFem;
    if (inputFinalTotal) inputFinalTotal.value = finalMasc + finalFem;
}

/* ============ OBTENER ESTUDIANTES DEL GRUPO ============ */
function obtenerEstudiantesDelGrupo() {
    try {
        const stored = localStorage.getItem('registrosSigerd');
        if (!stored) return [];
        const registros = JSON.parse(stored);
        if (!Array.isArray(registros)) return [];

        const seccionActual = (currentSection || '').toUpperCase().trim();
        const tandaActual = (currentTanda || '').toUpperCase().trim();
        const gradoActual = currentGrade;

        const filtrados = registros.filter(r => {
            const gNum = convertirGradoANumero(r.grado);
            if (gNum !== gradoActual) return false;
            const s = (r.seccion || '').toUpperCase().trim();
            if (seccionActual && s && s !== seccionActual) return false;
            const t = (r.tanda || '').toUpperCase().trim();
            if (tandaActual && t && t !== tandaActual) return false;
            return true;
        });

        console.log('🔍 Filtro aplicado:', {
            gradoBuscado: gradoActual,
            seccionBuscada: seccionActual,
            tandaBuscada: tandaActual,
            totalRegistros: registros.length,
            encontrados: filtrados.length
        });

        filtrados.sort((a, b) => (parseInt(a.orden) || 0) - (parseInt(b.orden) || 0));
        return filtrados;
    } catch (e) {
        console.error('❌ Error:', e);
        return [];
    }
}

/* ============ MAPEAR FECHA → MES ESCOLAR ============ */
function mapearMesYAnio(fechaStr, anioInicio, anioFin) {
    if (!fechaStr) return null;
    const partes = String(fechaStr).split('/');
    if (partes.length !== 3) return null;
    
    const mes = parseInt(partes[1], 10);
    const anio = parseInt(partes[2], 10);
    if (!mes || !anio) return null;
    
    let mesEscolar = -1;
    if (mes >= 8 && mes <= 12) {
        if (anio !== anioInicio) return null;
        mesEscolar = mes - 8;
    } else if (mes >= 1 && mes <= 6) {
        if (anio !== anioFin) return null;
        mesEscolar = mes + 4;
    } else {
        return null;
    }
    if (mesEscolar < 0 || mesEscolar > 10) return null;
    return { mesEscolar };
}

/* ============================================
✅ AUTO-CALCULAR DESDE registrosSigerd
============================================ */
function autoCalcularDesdeRegistros(mostrarMensaje) {
    try {
        const estudiantes = obtenerEstudiantesDelGrupo();
        if (estudiantes.length === 0) {
            if (mostrarMensaje) alert('ℹ️ No hay estudiantes registrados para este grupo.');
            return false;
        }

        const { anioInicio, anioFin } = parsearAnioEscolar(currentSchoolYear);
        const fechaInicioClases = obtenerFechaInicioClases();
        
        console.log(`📅 Año escolar: ${anioInicio}-${anioFin}`);
        console.log(`📅 Fecha de inicio de clases: ${fechaInicioClases ? fechaInicioClases.toLocaleDateString() : 'NO DEFINIDA'}`);
        console.log(`📊 Procesando ${estudiantes.length} estudiantes...`);

        let inicialMasc = 0;
        let inicialFem = 0;

        const conteo = {};
        MESES.forEach(m => {
            conteo[m.toLowerCase()] = {
                nuevos_masc: 0, nuevos_fem: 0,
                retirados_masc: 0, retirados_fem: 0
            };
        });

        estudiantes.forEach(est => {
            const sexoNorm = normalizar(est.sexo);
            const esMasc = sexoNorm.includes('MASC');
            const esFem = sexoNorm.includes('FEM');
            if (!esMasc && !esFem) return;

            const tieneNuevoInscrito = est.nuevoInscrito && String(est.nuevoInscrito).trim() !== '';
            let esMatriculaInicial = false;
            
            if (!tieneNuevoInscrito) {
                esMatriculaInicial = true;
            } else {
                const fechaNuevo = parsearFechaDDMMYYYY(est.nuevoInscrito);
                
                if (!fechaNuevo) {
                    esMatriculaInicial = true;
                } else if (fechaInicioClases && fechaNuevo < fechaInicioClases) {
                    esMatriculaInicial = true;
                } else {
                    const mapeo = mapearMesYAnio(est.nuevoInscrito, anioInicio, anioFin);
                    if (mapeo) {
                        const key = MESES[mapeo.mesEscolar].toLowerCase();
                        if (esMasc) conteo[key].nuevos_masc++;
                        if (esFem) conteo[key].nuevos_fem++;
                    } else {
                        esMatriculaInicial = true;
                    }
                }
            }
            
            if (esMatriculaInicial) {
                if (esMasc) inicialMasc++;
                if (esFem) inicialFem++;
            }

            if (est.retirado && String(est.retirado).trim() !== '') {
                const mapeo = mapearMesYAnio(est.retirado, anioInicio, anioFin);
                if (mapeo) {
                    const key = MESES[mapeo.mesEscolar].toLowerCase();
                    if (esMasc) conteo[key].retirados_masc++;
                    if (esFem) conteo[key].retirados_fem++;
                }
            }
        });

        const inputInicialMasc = document.querySelector('[data-campo="inicial_masc"]');
        const inputInicialFem = document.querySelector('[data-campo="inicial_fem"]');
        if (inputInicialMasc) inputInicialMasc.value = inicialMasc;
        if (inputInicialFem) inputInicialFem.value = inicialFem;
        calcularMatriculaInicial();

        MESES.forEach((mes) => {
            const key = mes.toLowerCase();
            const c = conteo[key];
            const set = (campo, valor) => {
                const input = document.querySelector(`[data-campo="${campo}"]`);
                if (input) input.value = valor;
            };
            
            set(`${key}_nuevos_masc`, c.nuevos_masc);
            set(`${key}_nuevos_fem`, c.nuevos_fem);
            set(`${key}_retirados_masc`, c.retirados_masc);
            set(`${key}_retirados_fem`, c.retirados_fem);
        });

        recalcularCadenaMeses();
        calcularTotales();

        console.log('✅ Auto-cálculo completado');
        
        if (mostrarMensaje) {
            alert(
                `✅ Cálculo completado\n\n` +
                `• Estudiantes procesados: ${estudiantes.length}\n` +
                `• Matrícula Inicial: ${inicialMasc + inicialFem} (M:${inicialMasc} F:${inicialFem})\n` +
                `• Fecha de inicio de clases: ${fechaInicioClases ? fechaInicioClases.toLocaleDateString() : 'No definida'}`
            );
        }
        return true;
    } catch (e) {
        console.error('❌ Error:', e);
        if (mostrarMensaje) alert('❌ Error: ' + e.message);
        return false;
    }
}

/* ============ GUARDAR / CARGAR ============ */
function guardarDatosResumenInscritos() {
    const datos = {};
    document.querySelectorAll('#tabla-resumen-container input, #matricula-inicial input, #matricula-final input').forEach(input => {
        const campo = input.dataset.campo;
        if (campo && input.value !== '') datos[campo] = input.value;
    });
    localStorage.setItem('resumenInscritos', JSON.stringify(datos));
}

function cargarDatosResumenInscritos() {
    const datosStr = localStorage.getItem('resumenInscritos');
    if (!datosStr) return;
    const datos = JSON.parse(datosStr);
    Object.keys(datos).forEach(campo => {
        const input = document.querySelector(`[data-campo="${campo}"]`);
        if (input) input.value = datos[campo];
    });
    calcularMatriculaInicial();
    recalcularCadenaMeses();
    calcularTotales();
}

/* ============ INICIALIZACIÓN ============ */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Resumen de Inscritos - Cargando...');
    
    const sincronizado = aplicarDatosSincronizados();
    if (!sincronizado) {
        const savedGrade = localStorage.getItem('inscritos_grade') || '3';
        const savedSection = localStorage.getItem('inscritos_section') || 'A';
        const savedTanda = localStorage.getItem('inscritos_tanda') || 'MATUTINA';
        const savedYear = localStorage.getItem('inscritos_year') || '2025-2026';
        currentGrade = parseInt(savedGrade);
        currentSection = savedSection;
        currentTanda = savedTanda;
        currentSchoolYear = savedYear;
        actualizarInfoGradoRI();
    }
    
    generarTablaResumen();
    
    setTimeout(function() {
        autoCalcularDesdeRegistros(false);
    }, 300);
});

document.addEventListener('formulariosActualizado', function() {
    autoCalcularDesdeRegistros(false);
});

window.addEventListener('storage', function(e) {
    if (e.key === 'registrosSigerd' || e.key === 'datosSincronizados') {
        setTimeout(() => autoCalcularDesdeRegistros(false), 300);
    }
});

/* ============ FUNCIONES GLOBALES ============ */
window.guardarResumenInscritos = guardarDatosResumenInscritos;
window.cargarResumenInscritos = cargarDatosResumenInscritos;
window.calcularTotalesResumenInscritos = calcularTotales;
window.autoCalcularDesdeRegistros = autoCalcularDesdeRegistros;
window.recalcularCadenaMeses = recalcularCadenaMeses;
window.syncData = syncData;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;
window.actualizarInfoGradoRI = actualizarInfoGradoRI;