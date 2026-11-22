/* ============================================ /
/ REGISTRO DE EVALUACIÓN - CÓDIGO COMPLETO    /
/ FUNCIONA EN MODO INDEPENDIENTE Y EN ÍNDICE  /
/ ✅ SIN BLOQUEOS DE CELDAS                   /
/ ✅ SOLO VALIDACIÓN:                         /
/    - Rec Final NO puede ser MENOR al Final  /
/    - Rec Especial NO puede ser MENOR al Final/
/ ✅ ESCRITURA FLUIDA (recalcula solo en blur)/
/ ✅ SINCRONIZACIÓN CON PÁGINA PRINCIPAL      /
/ ✅ PROMEDIOS EN TIEMPO REAL                 /
/ ✅ CON TANDA Y BADGE DE ASIGNACIÓN          /
/ ✅ SINCRONIZACIÓN CON FORMULARIO            /
/ ✅ NOTAS GUARDADAS POR UID                  /
/ ✅ MODAL DE CALIFICACIONES HORIZONTAL       /
/ ✅ BOTÓN IMPRIMIR CALIFICACIONES            /
/ ✅ CURSOR PRESERVADO EN RECUPERACIONES      /
/ ✅ Backspace/Delete borra toda la celda     /
/ ============================================ */

// ============================================ //
// CONFIGURACIÓN DE GRADOS Y MATERIAS           //
// ============================================ //
const NOTA_MINIMA_APROBATORIA = 65;

const materiasBase = [
    {
        nombre:  "LENGUA ESPAÑOLA  ",
        c1:  "Comunicativa: Expresa y comprende, de forma oral y escrita en contextos variados...  ",
        c2:  "Pensamiento Lógico, Creativo y Crítico: Expone con creatividad y de manera crítica...  ",
        c3:  "Ética y Ciudadana: Describe problemas sociales de manera colectiva...  "
    },
    {
        nombre:  "MATEMÁTICA  ",
        c1:  "Comunicativa: Representa su comprensión de los enunciados de problemas matemáticos...  ",
        c2:  "Pensamiento Lógico, Creativo y Crítico: Utiliza en forma sistemática estrategias...  ",
        c3:  "Ética y Ciudadana: Interpreta posibles soluciones a situaciones del entorno...  "
    },
    {
        nombre:  "CIENCIAS SOCIALES  ",
        c1:  "Comunicativa: Comunica sus ideas sobre acontecimientos, a partir del análisis...  ",
        c2:  "Pensamiento Lógico, Creativo y Crítico: Utiliza procedimientos científicos...  ",
        c3:  "Ética y Ciudadana: Integra en su vida el respeto a sí mismo y a las demás...  "
    },
    {
        nombre:  "CIENCIAS DE LA NATURALEZA  ",
        c1:  "Comunicativa: Ofrece explicaciones de observaciones, exploraciones e inferencias...  ",
        c2:  "Pensamiento Lógico, Creativo y Crítico: Aplica sencillos y organizados procedimientos...  ",
        c3:  "Ética y Ciudadana: Asume una actitud preventiva, interrogativa y en armonía...  "
    },
    {
        nombre:  "EDUCACIÓN FÍSICA  ",
        c1:  "Comunicativa: Establece comunicación armónica con las demás personas...  ",
        c2:  "Pensamiento Lógico, Creativo y Crítico: Maneja la noción de su esquema corporal...  ",
        c3:  "Ética y Ciudadana: Realiza actividades motrices en interacción con el grupo...  "
    },
    {
        nombre:  "FORMACIÓN INTEGRAL HUMANA Y RELIGIOSA  ",
        c1:  "Comunicativa: Plantea sus ideas sobre las diferentes etapas de la vida...  ",
        c2:  "Pensamiento Lógico, Creativo y Crítico: Practica normas de convivencia...  ",
        c3:  "Ética y Ciudadana: Demuestra valoración de la vida humana y de la creación...  "
    },
    {
        nombre:  "EDUCACIÓN ARTÍSTICA  ",
        c1:  "Comunicativa: Intercambia ideas, conceptos y sentimientos...  ",
        c2:  "Pensamiento Lógico, Creativo y Crítico: Incorpora en sus expresiones artísticas...  ",
        c3:  "Ética y Ciudadana: Participa en actividades artísticas grupales...  "
    }
];

const materiaIngles = {
    nombre: "INGLÉS (LENGUAS EXTRANJERAS)",
    c1: "Comunicativa: Comprende y expresa información, ideas, sentimientos...",
    c2: "Pensamiento Lógico, Creativo y Crítico: Identifica, organiza y comparte información...",
    c3: "Ética y Ciudadana: Interactúa con cortesía, aceptación, asertividad..."
};

const DEFAULT_GRADE_CONFIG = {
    subjects: {
        1: ['LENGUA ESPAÑOLA', 'MATEMÁTICA', 'CIENCIAS SOCIALES', 'CIENCIAS DE LA NATURALEZA', 'EDUCACIÓN FÍSICA', 'FORMACIÓN INTEGRAL HUMANA Y RELIGIOSA', 'EDUCACIÓN ARTÍSTICA'],
        2: ['LENGUA ESPAÑOLA', 'MATEMÁTICA', 'CIENCIAS SOCIALES', 'CIENCIAS DE LA NATURALEZA', 'EDUCACIÓN FÍSICA', 'FORMACIÓN INTEGRAL HUMANA Y RELIGIOSA', 'EDUCACIÓN ARTÍSTICA'],
        3: ['LENGUA ESPAÑOLA', 'MATEMÁTICA', 'CIENCIAS SOCIALES', 'CIENCIAS DE LA NATURALEZA', 'EDUCACIÓN FÍSICA', 'FORMACIÓN INTEGRAL HUMANA Y RELIGIOSA', 'EDUCACIÓN ARTÍSTICA'],
        4: ['LENGUA ESPAÑOLA', 'MATEMÁTICA', 'CIENCIAS SOCIALES', 'CIENCIAS DE LA NATURALEZA', 'INGLÉS (LENGUAS EXTRANJERAS)', 'EDUCACIÓN FÍSICA', 'FORMACIÓN INTEGRAL HUMANA Y RELIGIOSA', 'EDUCACIÓN ARTÍSTICA'],
        5: ['LENGUA ESPAÑOLA', 'MATEMÁTICA', 'CIENCIAS SOCIALES', 'CIENCIAS DE LA NATURALEZA', 'INGLÉS (LENGUAS EXTRANJERAS)', 'EDUCACIÓN FÍSICA', 'FORMACIÓN INTEGRAL HUMANA Y RELIGIOSA', 'EDUCACIÓN ARTÍSTICA'],
        6: ['LENGUA ESPAÑOLA', 'MATEMÁTICA', 'CIENCIAS SOCIALES', 'CIENCIAS DE LA NATURALEZA', 'INGLÉS (LENGUAS EXTRANJERAS)', 'EDUCACIÓN FÍSICA', 'FORMACIÓN INTEGRAL HUMANA Y RELIGIOSA', 'EDUCACIÓN ARTÍSTICA']
    },
    periods: {
        count: 4,
        names: ['P1', 'P2', 'P3', 'P4'],
        weights: [25, 25, 25, 25]
    }
};

// ============================================ //
// VARIABLES DE ESTADO                          //
// ============================================ //
let currentGrade = 3;
let currentSection = 'A';
let currentTanda = 'Matutina';
let currentSchoolYear = '2025-2026';
let rowCounts = {};
const MAX_ROWS = 100;
let currentPage = 1;
let totalPages = 7;
const saveTimeouts = {};
let studentNames = {};
let isIntegratedMode = false;
let isIndexMode = false;
let migracionRealizada = false;

let uidPorOrdenCache = {};
let estudiantesCache = [];

// ============================================ //
// ✅ CLAVES DE ALMACENAMIENTO                  //
// ============================================ //
function getKeyNotaPrincipal(pageIndex, rowNum, comp, period, esRP) {
    const sufijo = esRP ? `rp${period}` : `p${period}`;
    return `evalNota_g${currentGrade}_s${currentSection}_m${pageIndex}_r${rowNum}_c${comp}_${sufijo}`;
}

function getKeyRecFinalPrincipal(pageIndex, rowNum) {
    return `evalRec_g${currentGrade}_s${currentSection}_m${pageIndex}_r${rowNum}`;
}

function getKeyRecEspecialPrincipal(pageIndex, rowNum) {
    return `evalRecEsp_g${currentGrade}_s${currentSection}_m${pageIndex}_r${rowNum}`;
}

function getClaveNota(uid, pageIndex, comp, period, esRP) {
    if (!uid) return null;
    const sufijo = esRP ? `rp${period}` : `p${period}`;
    return `nota_${uid}_m${pageIndex}c${comp}${sufijo}`;
}

// ============================================ //
// ✅ GUARDAR / LEER NOTAS (SISTEMA DOBLE)      //
// ============================================ //
function guardarNota(uid, pageIndex, comp, period, esRP, valor, rowNum) {
    const valorLimpio = (valor || '').toString().trim();
    const sufijo = esRP ? `rp${period}` : `p${period}`;
    
    const keyPrincipal = getKeyNotaPrincipal(pageIndex, rowNum, comp, period, esRP);
    const keyUID = uid ? `nota_${uid}_m${pageIndex}c${comp}${sufijo}` : null;

    if (valorLimpio !== '') {
        localStorage.setItem(keyPrincipal, valorLimpio);
        if (keyUID) localStorage.setItem(keyUID, valorLimpio);
    } else {
        localStorage.removeItem(keyPrincipal);
        if (keyUID) localStorage.removeItem(keyUID);
    }
}

function leerNota(uid, pageIndex, comp, period, esRP, rowNum) {
    const sufijo = esRP ? `rp${period}` : `p${period}`;
    
    if (uid) {
        const keyUID = `nota_${uid}_m${pageIndex}c${comp}${sufijo}`;
        const valUID = localStorage.getItem(keyUID);
        if (valUID !== null && valUID !== '') return valUID;
    }
    
    const keyPrincipal = getKeyNotaPrincipal(pageIndex, rowNum, comp, period, esRP);
    const valPrincipal = localStorage.getItem(keyPrincipal);
    if (valPrincipal !== null && valPrincipal !== '') {
        if (uid) {
            localStorage.setItem(`nota_${uid}_m${pageIndex}c${comp}${sufijo}`, valPrincipal);
        }
        return valPrincipal;
    }
    return null;
}

function guardarRecFinal(uid, pageIndex, rowNum, valor) {
    const valorLimpio = (valor || '').toString().trim();
    const keyPrincipal = getKeyRecFinalPrincipal(pageIndex, rowNum);
    const keyUID = uid ? `nota_${uid}_m${pageIndex}rec_final` : null;
    
    if (valorLimpio !== '') {
        localStorage.setItem(keyPrincipal, valorLimpio);
        if (keyUID) localStorage.setItem(keyUID, valorLimpio);
    } else {
        localStorage.removeItem(keyPrincipal);
        if (keyUID) localStorage.removeItem(keyUID);
    }
}

function guardarRecEspecial(uid, pageIndex, rowNum, valor) {
    const valorLimpio = (valor || '').toString().trim();
    const keyPrincipal = getKeyRecEspecialPrincipal(pageIndex, rowNum);
    const keyUID = uid ? `nota_${uid}_m${pageIndex}rec_especial` : null;
    
    if (valorLimpio !== '') {
        localStorage.setItem(keyPrincipal, valorLimpio);
        if (keyUID) localStorage.setItem(keyUID, valorLimpio);
    } else {
        localStorage.removeItem(keyPrincipal);
        if (keyUID) localStorage.removeItem(keyUID);
    }
}

function leerRecFinal(uid, pageIndex, rowNum) {
    if (uid) {
        const keyUID = `nota_${uid}_m${pageIndex}rec_final`;
        const valUID = localStorage.getItem(keyUID);
        if (valUID !== null && valUID !== '') return valUID;
    }
    const keyPrincipal = getKeyRecFinalPrincipal(pageIndex, rowNum);
    const valPrincipal = localStorage.getItem(keyPrincipal);
    if (valPrincipal !== null && valPrincipal !== '') {
        if (uid) localStorage.setItem(`nota_${uid}_m${pageIndex}rec_final`, valPrincipal);
        return valPrincipal;
    }
    return null;
}

function leerRecEspecial(uid, pageIndex, rowNum) {
    if (uid) {
        const keyUID = `nota_${uid}_m${pageIndex}rec_especial`;
        const valUID = localStorage.getItem(keyUID);
        if (valUID !== null && valUID !== '') return valUID;
    }
    const keyPrincipal = getKeyRecEspecialPrincipal(pageIndex, rowNum);
    const valPrincipal = localStorage.getItem(keyPrincipal);
    if (valPrincipal !== null && valPrincipal !== '') {
        if (uid) localStorage.setItem(`nota_${uid}_m${pageIndex}rec_especial`, valPrincipal);
        return valPrincipal;
    }
    return null;
}

// ============================================ //
// ✅ ACTUALIZAR CACHÉ DE ESTUDIANTES           //
// ============================================ //
function actualizarCacheEstudiantes() {
    try {
        const registros = JSON.parse(localStorage.getItem('registrosSigerd') || '[]');
        if (!Array.isArray(registros)) {
            estudiantesCache = [];
            uidPorOrdenCache = {};
            return;
        }
        
        const gradoTexto = obtenerGradoTextoDesdeEvaluacion();
        const seccion = currentSection || 'A';
        const tanda = obtenerTandaDesdeEvaluacion();
        
        estudiantesCache = registros.filter(est => {
            const estGrado = (est.grado || '').trim().toUpperCase();
            const estSeccion = (est.seccion || '').trim().toUpperCase();
            const estTanda = (est.tanda || '').trim().toUpperCase();
            return estGrado === gradoTexto.trim().toUpperCase() && 
                   estSeccion === seccion.trim().toUpperCase() && 
                   estTanda === tanda.trim().toUpperCase();
        });
        
        estudiantesCache.sort((a, b) => (parseInt(a.orden) || 0) - (parseInt(b.orden) || 0));
        
        uidPorOrdenCache = {};
        estudiantesCache.forEach(est => {
            const orden = parseInt(est.orden);
            if (orden > 0 && est.uid) {
                uidPorOrdenCache[orden] = est.uid;
            }
        });
        
        console.log('📦 Caché actualizado:', Object.keys(uidPorOrdenCache).length, 'estudiantes');
    } catch (e) {
        console.error('Error actualizando caché:', e);
        estudiantesCache = [];
        uidPorOrdenCache = {};
    }
}

// ============================================ //
// ✅ UTILIDADES PARA NOTAS POR UID             //
// ============================================ //
function getUidDeFila(rowNum) {
    if (uidPorOrdenCache[rowNum]) return uidPorOrdenCache[rowNum];
    const estudiantes = obtenerEstudiantesDesdeFormulario();
    const est = estudiantes.find(e => parseInt(e.orden) === rowNum);
    return est ? est.uid : null;
}

function migrarNotasViejas() {
    if (migracionRealizada) return;
    migracionRealizada = true;
    
    try {
        let yaHayNotasNuevas = false;
        let contadorNotasNuevas = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('nota_') && !key.startsWith('nota_respaldo_')) {
                yaHayNotasNuevas = true;
                contadorNotasNuevas++;
            }
        }
        if (yaHayNotasNuevas) {
            console.log(`ℹ️ Ya hay ${contadorNotasNuevas} notas en formato nuevo, saltando migración`);
            return;
        }
        
        const estudiantes = obtenerEstudiantesDesdeFormulario();
        if (estudiantes.length === 0) {
            console.log('ℹ️ No hay estudiantes, saltando migración');
            return;
        }
        
        const savedData = localStorage.getItem(getStorageKey());
        if (!savedData) {
            console.log('ℹ️ No hay datos viejos que migrar');
            return;
        }
        
        let dataVieja = {};
        try { dataVieja = JSON.parse(savedData); } catch (e) { return; }
        
        const materias = getMateriasForGrade(currentGrade);
        const periodsCount = getPeriodsCount();
        let migradas = 0;
        
        estudiantes.forEach(est => {
            const uid = est.uid;
            const orden = parseInt(est.orden);
            if (!uid || !orden) return;
            
            for (let m = 1; m <= materias.length; m++) {
                for (let c = 1; c <= 3; c++) {
                    for (let p = 1; p <= periodsCount; p++) {
                        const oldPKey = `g${currentGrade}s${currentSection}m${m}r${orden}c${c}p${p}`;
                        const newPKey = getClaveNota(uid, m, c, p, false);
                        if (dataVieja[oldPKey] && newPKey && !localStorage.getItem(newPKey)) {
                            localStorage.setItem(newPKey, dataVieja[oldPKey]);
                            migradas++;
                        }
                        const oldRPKey = `g${currentGrade}s${currentSection}m${m}r${orden}c${c}rp${p}`;
                        const newRPKey = getClaveNota(uid, m, c, p, true);
                        if (dataVieja[oldRPKey] && newRPKey && !localStorage.getItem(newRPKey)) {
                            localStorage.setItem(newRPKey, dataVieja[oldRPKey]);
                            migradas++;
                        }
                    }
                }
            }
        });
        
        if (migradas > 0) {
            console.log(`✅ ${migradas} notas migradas al formato por UID`);
            localStorage.removeItem(getStorageKey());
        } else {
            console.log('ℹ️ No se encontraron notas viejas para migrar');
        }
    } catch (e) {
        console.warn('⚠️ Error migrando notas:', e);
    }
}

function eliminarNotasHuerfanas() {
    console.log('⚠️ Limpieza de huérfanas desactivada para proteger datos');
}

// ============================================ //
// 🖼️ FOTO Y DATOS DEL ESTUDIANTE               //
// ============================================ //
function leerFotoEstudiante(uid) {
    if (!uid) return null;
    try {
        const data = localStorage.getItem(`foto_${uid}`);
        if (data) {
            const datos = JSON.parse(data);
            if (datos && datos.base64) return datos.base64;
        }
    } catch (e) {}
    return null;
}

function obtenerEstudiantePorUid(uid) {
    if (!uid) return null;
    try {
        const stored = localStorage.getItem('registrosSigerd');
        if (stored) {
            const registros = JSON.parse(stored);
            if (Array.isArray(registros)) {
                return registros.find(r => r.uid === uid) || null;
            }
        }
    } catch (e) {}
    return null;
}

// ============================================ //
// 📊 LEER CALIFICACIONES DE UNA MATERIA        //
// ============================================ //
function leerCalificacionesMateria(uid, pageIndex) {
    const resultado = {
        competencias: [],
        promedioCompetencias: [null, null, null],
        finalMateria: null,
        recuperacionFinal: null,
        recuperacionEspecial: null,
        aprobada: false,
        razon: 'incompleta'
    };
    
    if (!uid) return resultado;
    
    const periodsCount = getPeriodsCount();
    
    let rowNum = 0;
    for (const r in uidPorOrdenCache) {
        if (uidPorOrdenCache[r] === uid) { rowNum = parseInt(r); break; }
    }
    if (!rowNum) {
        const est = obtenerEstudiantePorUid(uid);
        if (est) rowNum = parseInt(est.orden);
    }
    
    for (let c = 1; c <= 3; c++) {
        const comp = { numero: c, periodos: [], promedio: null };
        let valoresValidos = 0;
        let sumatoria = 0;
        
        for (let p = 1; p <= periodsCount; p++) {
            const pVal = leerNota(uid, pageIndex, c, p, false, rowNum);
            const rpVal = leerNota(uid, pageIndex, c, p, true, rowNum);
            
            let valorUsar = null;
            let estado = 'vacio';
            
            const pNum = pVal !== null && pVal !== '' ? parseFloat(pVal) : null;
            const rpNum = rpVal !== null && rpVal !== '' ? parseFloat(rpVal) : null;
            
            if (pNum !== null && pNum >= NOTA_MINIMA_APROBATORIA) { valorUsar = pNum; estado = 'aprobado'; }
            else if (pNum !== null && pNum < NOTA_MINIMA_APROBATORIA && rpNum !== null) { valorUsar = rpNum; estado = 'recuperado'; }
            else if (pNum !== null && pNum < NOTA_MINIMA_APROBATORIA) { valorUsar = pNum; estado = 'reprobado_sin_rp'; }
            else if (pNum === null && rpNum !== null) { valorUsar = rpNum; estado = 'solo_rp'; }
            
            if (valorUsar !== null && !isNaN(valorUsar)) {
                if (valorUsar > 100) valorUsar = 100;
                sumatoria += valorUsar;
                valoresValidos++;
            }
            
            comp.periodos.push({ periodo: p, p: pNum, rp: rpNum, valor: valorUsar, estado });
        }
        
        if (valoresValidos > 0) {
            comp.promedio = Math.round(sumatoria / valoresValidos);
            resultado.promedioCompetencias[c - 1] = comp.promedio;
        }
        resultado.competencias.push(comp);
    }
    
    const promediosValidos = resultado.promedioCompetencias.filter(v => v !== null && v !== undefined);
    if (promediosValidos.length === 3) {
        resultado.finalMateria = Math.round(
            (resultado.promedioCompetencias[0] + resultado.promedioCompetencias[1] + resultado.promedioCompetencias[2]) / 3
        );
    }
    
    resultado.recuperacionFinal = leerRecFinal(uid, pageIndex, rowNum);
    resultado.recuperacionEspecial = leerRecEspecial(uid, pageIndex, rowNum);
    
    if (resultado.finalMateria !== null) {
        if (resultado.finalMateria >= NOTA_MINIMA_APROBATORIA) {
            resultado.aprobada = true;
            resultado.razon = 'final';
        } else {
            const recFinalNum = resultado.recuperacionFinal !== null && resultado.recuperacionFinal !== ''
                ? parseFloat(resultado.recuperacionFinal) : null;
            const recEspNum = resultado.recuperacionEspecial !== null && resultado.recuperacionEspecial !== ''
                ? parseFloat(resultado.recuperacionEspecial) : null;
            
            if (recFinalNum !== null && !isNaN(recFinalNum) && recFinalNum >= NOTA_MINIMA_APROBATORIA) {
                resultado.aprobada = true;
                resultado.razon = 'rec_final';
            } else if (recEspNum !== null && !isNaN(recEspNum) && recEspNum >= NOTA_MINIMA_APROBATORIA) {
                resultado.aprobada = true;
                resultado.razon = 'rec_especial';
            } else {
                resultado.aprobada = false;
                resultado.razon = 'reprobada';
            }
        }
    }
    
    return resultado;
}

// ============================================ //
// 📚 LEER CALIFICACIONES DE TODAS LAS MATERIAS //
// ============================================ //
function leerTodasLasMaterias(uid) {
    const materias = getMateriasForGrade(currentGrade);
    const resultado = [];
    
    if (!uid) return resultado;
    
    materias.forEach((materia, idx) => {
        const pageIndex = idx + 1;
        const calif = leerCalificacionesMateria(uid, pageIndex);
        resultado.push({
            nombre: materia.nombre,
            pageIndex: pageIndex,
            final: calif.finalMateria,
            promedio: calif.promedioCompetencias,
            recuperacion: calif.recuperacionFinal,
            recuperacionEspecial: calif.recuperacionEspecial,
            aprobada: calif.aprobada,
            razon: calif.razon
        });
    });
    
    return resultado;
}

// ============================================ //
// 🖨️ GENERAR HTML DE IMPRESIÓN                //
// ============================================ //
function generarHTMLImpresion(row, uid, pageIndex) {
    const estudiante = obtenerEstudiantePorUid(uid);
    const nombreCompleto = estudiante
        ? `${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim()
        : `ESTUDIANTE ${row}`;
    const telefono = estudiante ? (estudiante.telefono || '') : '';
    const grado = estudiante ? (estudiante.grado || '') : '';
    const seccion = estudiante ? (estudiante.seccion || '') : '';
    const tanda = estudiante ? (estudiante.tanda || '') : '';
    const idEstudiante = estudiante ? (estudiante.id || '') : '';
    const edad = estudiante ? (estudiante.edad || '') : '';
    const fotoBase64 = leerFotoEstudiante(uid);
    
    const materias = getMateriasForGrade(currentGrade);
    const materiaActual = materias[pageIndex - 1] || { nombre: 'Materia desconocida' };
    const califActual = leerCalificacionesMateria(uid, pageIndex);
    const todasMaterias = leerTodasLasMaterias(uid);
    
    const periodsCount = getPeriodsCount();
    const periodNames = getPeriodNames();
    
    let sumaFinales = 0;
    let contadorFinales = 0;
    todasMaterias.forEach(m => {
        if (m.final !== null) { sumaFinales += m.final; contadorFinales++; }
    });
    const promedioGeneral = contadorFinales > 0 ? Math.round(sumaFinales / contadorFinales) : null;
    
    let tablaActualHTML = `<table class="tabla-impresion"><thead><tr><th>Competencia</th>`;
    for (let p = 1; p <= periodsCount; p++) {
        tablaActualHTML += `<th>${periodNames[p-1] || 'P'+p}</th><th>RP${p}</th>`;
    }
    tablaActualHTML += `<th>Promedio</th></tr></thead><tbody>`;
    
    califActual.competencias.forEach(comp => {
        tablaActualHTML += `<tr><td class="celda-comp">C${comp.numero}</td>`;
        comp.periodos.forEach(per => {
            const classP = per.p === null ? 'vacio' : (per.p >= NOTA_MINIMA_APROBATORIA ? 'aprobado' : 'reprobado');
            tablaActualHTML += `<td class="${classP}">${per.p !== null ? per.p : '—'}</td>`;
            const classRP = per.rp === null ? 'vacio' : (per.rp >= NOTA_MINIMA_APROBATORIA ? 'aprobado' : 'reprobado');
            tablaActualHTML += `<td class="${classRP}">${per.rp !== null ? per.rp : '—'}</td>`;
        });
        const classProm = comp.promedio === null ? 'vacio' : (comp.promedio >= NOTA_MINIMA_APROBATORIA ? 'aprobado' : 'reprobado');
        tablaActualHTML += `<td class="promedio ${classProm}">${comp.promedio !== null ? comp.promedio : '—'}</td></tr>`;
    });
    tablaActualHTML += `</tbody></table>`;
    
    let tablaTodasHTML = `<table class="tabla-impresion"><thead><tr><th style="text-align: left; width: 45%;">Materia</th><th>C1</th><th>C2</th><th>C3</th><th>FINAL</th></tr></thead><tbody>`;
    todasMaterias.forEach(m => {
        const esActual = m.pageIndex === pageIndex;
        const classFinal = m.final === null ? 'vacio' : (m.aprobada ? 'aprobado' : 'reprobado');
        tablaTodasHTML += `<tr class="${esActual ? 'fila-actual' : ''}">`;
        tablaTodasHTML += `<td class="celda-materia">${esActual ? '★ ' : ''}${m.nombre.trim()}`;
        if (m.razon === 'rec_final') tablaTodasHTML += ` <span style="font-size:9px; color:#e65100; font-weight:bold;">🔄 RF</span>`;
        else if (m.razon === 'rec_especial') tablaTodasHTML += ` <span style="font-size:9px; color:#1565c0; font-weight:bold;">🌟 RE</span>`;
        tablaTodasHTML += `</td>`;
        m.promedio.forEach(p => {
            const classP = p === null ? 'vacio' : (p >= NOTA_MINIMA_APROBATORIA ? 'aprobado' : 'reprobado');
            tablaTodasHTML += `<td class="${classP}">${p !== null ? p : '—'}</td>`;
        });
        tablaTodasHTML += `<td class="final ${classFinal}">${m.final !== null ? m.final : '—'}</td></tr>`;
    });
    
    if (promedioGeneral !== null) {
        const classProm = promedioGeneral >= NOTA_MINIMA_APROBATORIA ? 'aprobado' : 'reprobado';
        tablaTodasHTML += `<tr class="fila-promedio"><td class="celda-materia">📊 PROMEDIO GENERAL (${contadorFinales} materias)</td><td colspan="3">—</td><td class="final ${classProm}">${promedioGeneral}</td></tr>`;
    }
    tablaTodasHTML += `</tbody></table>`;
    
    const fotoHTML = fotoBase64 
        ? `<img src="${fotoBase64}" class="foto-estudiante" alt="Foto" />`
        : `<div class="foto-vacia">📷</div>`;
        
    const fechaImpresion = new Date().toLocaleDateString('es-DO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Calificaciones - ${nombreCompleto}</title>
    <style>
        @page { size: letter portrait; margin: 15mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 20px; color: #1a2a4a; font-size: 12px; }
        .header-impresion { display: flex; align-items: center; gap: 20px; border-bottom: 4px double #1a3a6b; padding-bottom: 12px; margin-bottom: 16px; }
        .foto-estudiante { width: 110px; height: 110px; object-fit: cover; border-radius: 10px; border: 3px solid #1a3a6b; }
        .foto-vacia { width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; font-size: 42px; background: #f0f4fa; border: 3px dashed #aabac8; border-radius: 10px; color: #aabac8; }
        .datos-estudiante { flex: 1; }
        .datos-estudiante h1 { font-size: 20px; margin: 0 0 8px 0; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; }
        .datos-linea { font-size: 12px; margin: 3px 0; display: flex; gap: 8px; }
        .datos-linea strong { color: #1a3a6b; min-width: 90px; }
        .titulo-materia { background: linear-gradient(135deg, #1a3a6b, #2a5a8b); color: white; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 18px 0 10px 0; display: flex; justify-content: space-between; }
        .titulo-materia .nombre-materia { color: #ffd700; }
        .tabla-impresion { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px; }
        .tabla-impresion th { background: #1a3a6b; color: white; padding: 6px 4px; border: 1px solid #0f2a52; font-weight: 700; text-align: center; }
        .tabla-impresion td { padding: 5px 4px; border: 1px solid #dce4ec; text-align: center; font-weight: 600; }
        .tabla-impresion .celda-comp, .tabla-impresion .celda-materia { text-align: left; font-weight: 700; color: #1a2a4a; }
        .tabla-impresion .aprobado { background: #e6f4ea; color: #137333; }
        .tabla-impresion .reprobado { background: #fce8e6; color: #c5221f; }
        .tabla-impresion .vacio { color: #aabac8; }
        .tabla-impresion .promedio, .tabla-impresion .final { font-weight: 900; font-size: 13px; }
        .tabla-impresion .fila-actual { background: #fff8e1; }
        .tabla-impresion .fila-promedio { background: #e8f0f8; font-weight: 900; }
        .tabla-impresion .fila-promedio .celda-materia { text-transform: uppercase; color: #1a3a6b; }
        .resumen-box { background: #f8fafc; border: 2px solid #1a3a6b; border-radius: 10px; padding: 12px 20px; margin-top: 16px; display: flex; justify-content: space-around; align-items: center; }
        .resumen-item { text-align: center; }
        .resumen-label { font-size: 10px; color: #4a6a8a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
        .resumen-valor { font-size: 26px; font-weight: 900; line-height: 1; margin-top: 4px; }
        .resumen-valor.aprobado { color: #137333; }
        .resumen-valor.reprobado { color: #c5221f; }
        .footer-impresion { margin-top: 20px; padding-top: 10px; border-top: 2px solid #1a3a6b; display: flex; justify-content: space-between; font-size: 10px; color: #6a8a9e; }
        .footer-impresion .watermark { text-transform: uppercase; letter-spacing: 1px; }
        @media print { body { padding: 0; } .tabla-impresion th, .tabla-impresion .aprobado, .tabla-impresion .reprobado, .tabla-impresion .fila-actual, .tabla-impresion .fila-promedio, .titulo-materia, .resumen-box { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
    </style></head><body>
    <div class="header-impresion">${fotoHTML}
        <div class="datos-estudiante">
            <h1>${nombreCompleto}</h1>
            ${idEstudiante ? `<div class="datos-linea"><strong>ID:</strong> <span>${idEstudiante}</span></div>` : ''}
            ${edad ? `<div class="datos-linea"><strong>Edad:</strong> <span>${edad}</span></div>` : ''}
            <div class="datos-linea"><strong>Grupo:</strong> <span>${grado} · ${seccion} · ${tanda}</span></div>
            <div class="datos-linea"><strong>Teléfono:</strong> <span>${telefono || 'No registrado'}</span></div>
            <div class="datos-linea"><strong>Año Escolar:</strong> <span>${currentSchoolYear}</span></div>
        </div>
    </div>
    <div class="titulo-materia"><span>📖 Materia Actual</span><span class="nombre-materia">${materiaActual.nombre.trim()}</span></div>
    ${tablaActualHTML}
    ${califActual.recuperacionFinal ? `<div style="padding: 8px 12px; background: #fff3e0; border-left: 4px solid #e65100; border-radius: 6px; margin-bottom: 14px;"><strong style="color: #e65100;">📝 Recuperación Final:</strong><strong style="color: #1a2a4a; margin-left: 8px;">${califActual.recuperacionFinal}</strong></div>` : ''}
    ${califActual.recuperacionEspecial ? `<div style="padding: 8px 12px; background: #e3f2fd; border-left: 4px solid #1565c0; border-radius: 6px; margin-bottom: 14px;"><strong style="color: #1565c0;">🌟 Recuperación Especial:</strong><strong style="color: #1a2a4a; margin-left: 8px;">${califActual.recuperacionEspecial}</strong></div>` : ''}
    <div class="titulo-materia"><span>🎓 Calificaciones de TODAS las materias</span><span class="nombre-materia">${contadorFinales} materias con notas</span></div>
    ${tablaTodasHTML}
    ${promedioGeneral !== null ? `<div class="resumen-box"><div class="resumen-item"><div class="resumen-label">Materias Evaluadas</div><div class="resumen-valor">${contadorFinales}</div></div><div class="resumen-item"><div class="resumen-label">Promedio General</div><div class="resumen-valor ${promedioGeneral >= NOTA_MINIMA_APROBATORIA ? 'aprobado' : 'reprobado'}">${promedioGeneral}</div></div><div class="resumen-item"><div class="resumen-label">Estado</div><div class="resumen-valor ${promedioGeneral >= NOTA_MINIMA_APROBATORIA ? 'aprobado' : 'reprobado'}">${promedioGeneral >= NOTA_MINIMA_APROBATORIA ? '✓' : ''}</div></div></div>` : ''}
    <div class="footer-impresion"><span class="watermark">Ministerio de Educación • República Dominicana</span><span>Impreso: ${fechaImpresion}</span></div>
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };<\/script>
    </body></html>`;
}

function imprimirCalificaciones(row, uid, pageIndex) {
    try {
        const html = generarHTMLImpresion(row, uid, pageIndex);
        const ventana = window.open('', '_blank', 'width=900,height=700');
        if (!ventana) { alert('⚠️ Permita ventanas emergentes.'); return; }
        ventana.document.open();
        ventana.document.write(html);
        ventana.document.close();
    } catch (e) {
        console.error('Error al imprimir:', e);
        alert('❌ Error: ' + e.message);
    }
}

// ============================================ //
// 👤 MODAL DE CALIFICACIONES (HORIZONTAL)      //
// ============================================ //
function mostrarModalCalificaciones(row, uid, pageIndex) {
    console.log('🎬 mostrarModalCalificaciones:', row, uid, pageIndex);
    const previo = document.getElementById('modalCalificacionesEstudiante');
    if (previo) previo.remove();
    
    const estudiante = obtenerEstudiantePorUid(uid);
    const nombreCompleto = estudiante 
        ? `${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim()
        : `ESTUDIANTE ${row}`;
    const telefono = estudiante ? (estudiante.telefono || '') : '';
    const grado = estudiante ? (estudiante.grado || '') : '';
    const seccion = estudiante ? (estudiante.seccion || '') : '';
    const tanda = estudiante ? (estudiante.tanda || '') : '';
    const idEstudiante = estudiante ? (estudiante.id || '') : '';
    const edad = estudiante ? (estudiante.edad || '') : '';
    const fotoBase64 = leerFotoEstudiante(uid);
    
    const materias = getMateriasForGrade(currentGrade);
    const materiaActual = materias[pageIndex - 1] || { nombre: 'Materia desconocida' };
    const califActual = leerCalificacionesMateria(uid, pageIndex);
    const todasMaterias = leerTodasLasMaterias(uid);
    
    const overlay = document.createElement('div');
    overlay.id = 'modalCalificacionesEstudiante';
    overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 20, 40, 0.75); backdrop-filter: blur(3px); display: flex; justify-content: center; align-items: flex-start; padding: 25px 20px 20px 20px; z-index: 99999; overflow-y: auto;`;
    
    const box = document.createElement('div');
    box.style.cssText = `background: #ffffff; border-radius: 16px; padding: 0; max-width: 950px; width: 100%; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 3px rgba(26,58,107,0.15); font-family: 'Times New Roman', Times, serif; animation: slideDown 0.3s ease;`;
    
    const header = document.createElement('div');
    header.style.cssText = `background: linear-gradient(135deg, #1a3a6b 0%, #2a5a8b 100%); padding: 14px 24px; display: flex; align-items: center; gap: 14px; border-bottom: 4px solid #ffd700;`;
    header.innerHTML = `<span style="font-size: 26px;">📚</span><div style="flex: 1; display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap;"><div style="color: #ffd700; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Estudiante Nº ${row}</div><div style="color: #ffffff; font-size: 17px; font-weight: 700;">${nombreCompleto || 'Sin nombre'}</div></div>`;
    
    const body = document.createElement('div');
    body.style.cssText = `padding: 20px 24px; display: grid; grid-template-columns: 260px 1fr; gap: 22px; align-items: start;`;
    
    const colIzq = document.createElement('div');
    colIzq.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
    
    const fotoContenedor = document.createElement('div');
    fotoContenedor.style.cssText = `width: 140px; height: 140px; margin: 0 auto; border: 3px solid #1a3a6b; border-radius: 14px; background: #f0f4fa; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(26,58,107,0.2);`;
    if (fotoBase64) {
        const img = document.createElement('img');
        img.src = fotoBase64;
        img.alt = `Foto de ${nombreCompleto}`;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        fotoContenedor.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.textContent = '📷';
        placeholder.style.cssText = 'font-size: 52px; color: #aabac8;';
        fotoContenedor.appendChild(placeholder);
    }
    colIzq.appendChild(fotoContenedor);
    
    const datos = [];
    if (idEstudiante) datos.push({ label: '🆔 ID', valor: idEstudiante });
    if (edad) datos.push({ label: '🎂 Edad', valor: edad });
    if (grado || seccion || tanda) {
        datos.push({ label: '📚 Grupo', valor: `${grado}${seccion ? ' · ' + seccion : ''}${tanda ? ' · ' + tanda : ''}` });
    }
    datos.push({ label: '📞 Teléfono', valor: telefono || 'No registrado' });
    
    datos.forEach(d => {
        const linea = document.createElement('div');
        linea.style.cssText = `display: flex; flex-direction: column; gap: 2px; padding: 7px 10px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #1a3a6b; font-size: 12px;`;
        linea.innerHTML = `<span style="color: #4a6a8a; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">${d.label}</span><span style="color: #1a2a4a; font-weight: 700; word-break: break-word;">${d.valor}</span>`;
        colIzq.appendChild(linea);
    });
    
    const bloqueFinalActual = document.createElement('div');
    const finalActual = califActual.finalMateria;
    const colorFinal = finalActual === null ? '#6a8a9e' : (califActual.aprobada ? '#137333' : '#c5221f');
    const bgFinal = finalActual === null ? '#f0f4f8' : (califActual.aprobada ? '#e6f4ea' : '#fce8e6');
    
    let razonTexto = '';
    if (finalActual !== null) {
        if (califActual.razon === 'final') razonTexto = '✓ Aprobada por final';
        else if (califActual.razon === 'rec_final') razonTexto = '🔄 Aprobada por Rec. Final';
        else if (califActual.razon === 'rec_especial') razonTexto = '🌟 Aprobada por Rec. Especial';
        else razonTexto = '✗ Reprobada';
    } else {
        razonTexto = 'Sin calificaciones';
    }
    
    bloqueFinalActual.style.cssText = `margin-top: 8px; padding: 12px; border-radius: 10px; background: ${bgFinal}; border: 2px solid ${colorFinal}; text-align: center;`;
    bloqueFinalActual.innerHTML = `<div style="font-size: 10px; font-weight: 700; color: ${colorFinal}; text-transform: uppercase; letter-spacing: 0.5px;">Final de esta materia</div><div style="font-size: 32px; font-weight: 900; color: ${colorFinal}; line-height: 1.1; margin-top: 4px;">${finalActual !== null ? finalActual : '—'}</div><div style="font-size: 10px; color: ${colorFinal}; margin-top: 2px;">${razonTexto}</div>`;
    colIzq.appendChild(bloqueFinalActual);
    
    body.appendChild(colIzq);
    
    const colDer = document.createElement('div');
    colDer.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
    
    const tituloMateria = document.createElement('div');
    tituloMateria.style.cssText = `font-size: 12px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; background: #e8f0f8; border-radius: 8px; border-left: 4px solid #1a3a6b; display: flex; align-items: center; gap: 8px;`;
    tituloMateria.innerHTML = `📖 Materia actual: <span style="color: #e65100;">${materiaActual.nombre.trim()}</span>`;
    colDer.appendChild(tituloMateria);
    
    const tablaActual = document.createElement('div');
    tablaActual.style.cssText = 'overflow-x: auto;';
    
    const periodsCount = getPeriodsCount();
    const periodNames = getPeriodNames();
    
    let htmlTabla = `<table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Times New Roman', Times, serif;"><thead><tr style="background: #1a3a6b; color: white;"><th style="padding: 6px 4px; border: 1px solid #0f2a52; text-align: center;">Competencia</th>`;
    for (let p = 1; p <= periodsCount; p++) {
        htmlTabla += `<th style="padding: 6px 4px; border: 1px solid #0f2a52; text-align: center;">${periodNames[p-1] || 'P'+p}</th>`;
        htmlTabla += `<th style="padding: 6px 4px; border: 1px solid #0f2a52; text-align: center; background: #7a1f1a;">RP${p}</th>`;
    }
    htmlTabla += `<th style="padding: 6px 4px; border: 1px solid #0f2a52; text-align: center; background: #2a5a8b;">Promedio</th></tr></thead><tbody>`;
    
    califActual.competencias.forEach((comp, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        const colorProm = comp.promedio === null ? '#6a8a9e' : (comp.promedio >= NOTA_MINIMA_APROBATORIA ? '#137333' : '#c5221f');
        const bgProm = comp.promedio === null ? '#f0f4f8' : (comp.promedio >= NOTA_MINIMA_APROBATORIA ? '#e6f4ea' : '#fce8e6');
        
        htmlTabla += `<tr style="background: ${bg};"><td style="padding: 6px 8px; border: 1px solid #dce4ec; font-weight: 700; color: #1a2a4a;">C${comp.numero}</td>`;
        comp.periodos.forEach(per => {
            const colorP = per.p === null ? '#aabac8' : (per.p >= NOTA_MINIMA_APROBATORIA ? '#137333' : '#c5221f');
            const bgP = per.p === null ? 'transparent' : (per.p >= NOTA_MINIMA_APROBATORIA ? '#e6f4ea' : '#fce8e6');
            htmlTabla += `<td style="padding: 6px 4px; border: 1px solid #dce4ec; text-align: center; background: ${bgP}; color: ${colorP}; font-weight: 700;">${per.p !== null ? per.p : '—'}</td>`;
            const colorRP = per.rp === null ? '#aabac8' : (per.rp >= NOTA_MINIMA_APROBATORIA ? '#137333' : '#c5221f');
            const bgRP = per.rp === null ? 'transparent' : (per.rp >= NOTA_MINIMA_APROBATORIA ? '#e6f4ea' : '#fce8e6');
            htmlTabla += `<td style="padding: 6px 4px; border: 1px solid #dce4ec; text-align: center; background: ${bgRP}; color: ${colorRP}; font-weight: 700;">${per.rp !== null ? per.rp : '—'}</td>`;
        });
        htmlTabla += `<td style="padding: 6px 4px; border: 1px solid #dce4ec; text-align: center; background: ${bgProm}; color: ${colorProm}; font-weight: 900; font-size: 13px;">${comp.promedio !== null ? comp.promedio : '—'}</td></tr>`;
    });
    htmlTabla += `</tbody></table>`;
    tablaActual.innerHTML = htmlTabla;
    colDer.appendChild(tablaActual);
    
    if (califActual.recuperacionFinal) {
        const recFinal = document.createElement('div');
        recFinal.style.cssText = `padding: 10px 14px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #e65100; font-size: 12px;`;
        recFinal.innerHTML = `<span style="color: #e65100; font-weight: 700;">📝 Recuperación Final:</span><span style="color: #1a2a4a; font-weight: 900; margin-left: 8px;">${califActual.recuperacionFinal}</span>`;
        colDer.appendChild(recFinal);
    }
    
    if (califActual.recuperacionEspecial) {
        const recEspecial = document.createElement('div');
        recEspecial.style.cssText = `padding: 10px 14px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #1565c0; font-size: 12px;`;
        recEspecial.innerHTML = `<span style="color: #1565c0; font-weight: 700;">🌟 Recuperación Especial:</span><span style="color: #1a2a4a; font-weight: 900; margin-left: 8px;">${califActual.recuperacionEspecial}</span>`;
        colDer.appendChild(recEspecial);
    }
    
    const tituloTodas = document.createElement('div');
    tituloTodas.style.cssText = `font-size: 12px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; background: #e8f0f8; border-radius: 8px; border-left: 4px solid #1a3a6b; margin-top: 6px;`;
    tituloTodas.innerHTML = `🎓 Calificaciones de TODAS las materias`;
    colDer.appendChild(tituloTodas);
    
    let sumaFinales = 0;
    let contadorFinales = 0;
    todasMaterias.forEach(m => { if (m.final !== null) { sumaFinales += m.final; contadorFinales++; } });
    const promedioGeneral = contadorFinales > 0 ? Math.round(sumaFinales / contadorFinales) : null;
    
    const tablaTodas = document.createElement('div');
    tablaTodas.style.cssText = 'overflow-x: auto;';
    
    let htmlTodas = `<table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Times New Roman', Times, serif;"><thead><tr style="background: #2a5a8b; color: white;"><th style="padding: 6px 8px; border: 1px solid #1a3a6b; text-align: left; width: 45%;">Materia</th><th style="padding: 6px 4px; border: 1px solid #1a3a6b; text-align: center;">C1</th><th style="padding: 6px 4px; border: 1px solid #1a3a6b; text-align: center;">C2</th><th style="padding: 6px 4px; border: 1px solid #1a3a6b; text-align: center;">C3</th><th style="padding: 6px 4px; border: 1px solid #1a3a6b; text-align: center; background: #1a3a6b;">FINAL</th></tr></thead><tbody>`;
    
    todasMaterias.forEach((m, idx) => {
        const esActual = m.pageIndex === pageIndex;
        const bg = esActual ? '#fff8e1' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');
        const colorFinal = m.final === null ? '#6a8a9e' : (m.aprobada ? '#137333' : '#c5221f');
        const bgFinal = m.final === null ? '#f0f4f8' : (m.aprobada ? '#e6f4ea' : '#fce8e6');
        
        let razonBadge = '';
        if (m.razon === 'rec_final') razonBadge = ' <span style="font-size:9px; color:#e65100; font-weight:bold;">🔄 RF</span>';
        else if (m.razon === 'rec_especial') razonBadge = ' <span style="font-size:9px; color:#1565c0; font-weight:bold;">🌟 RE</span>';
        else if (m.razon === 'final') razonBadge = ' <span style="font-size:9px; color:#137333; font-weight:bold;">✓</span>';
        
        htmlTodas += `<tr style="background: ${bg};"><td style="padding: 6px 8px; border: 1px solid #dce4ec; font-weight: ${esActual ? '900' : '600'}; color: #1a2a4a;">${esActual ? '★ ' : ''}${m.nombre.trim()}${razonBadge}</td>`;
        m.promedio.forEach((p) => {
            const colorP = p === null ? '#aabac8' : (p >= NOTA_MINIMA_APROBATORIA ? '#137333' : '#c5221f');
            htmlTodas += `<td style="padding: 6px 4px; border: 1px solid #dce4ec; text-align: center; color: ${colorP}; font-weight: 700;">${p !== null ? p : '—'}</td>`;
        });
        htmlTodas += `<td style="padding: 6px 4px; border: 1px solid #dce4ec; text-align: center; background: ${bgFinal}; color: ${colorFinal}; font-weight: 900; font-size: 13px;">${m.final !== null ? m.final : '—'}</td></tr>`;
    });
    
    if (promedioGeneral !== null) {
        const colorProm = promedioGeneral >= NOTA_MINIMA_APROBATORIA ? '#137333' : '#c5221f';
        const bgProm = promedioGeneral >= NOTA_MINIMA_APROBATORIA ? '#e6f4ea' : '#fce8e6';
        htmlTodas += `<tr style="background: #e8f0f8; font-weight: 900;"><td style="padding: 8px; border: 2px solid #1a3a6b; color: #1a3a6b; text-transform: uppercase;">📊 Promedio General (${contadorFinales} materias)</td><td colspan="3" style="padding: 8px; border: 2px solid #1a3a6b; text-align: center; color: #4a6a8a;">—</td><td style="padding: 8px; border: 2px solid #1a3a6b; text-align: center; background: ${bgProm}; color: ${colorProm}; font-size: 16px;">${promedioGeneral}</td></tr>`;
    }
    htmlTodas += `</tbody></table>`;
    tablaTodas.innerHTML = htmlTodas;
    colDer.appendChild(tablaTodas);
    
    const leyenda = document.createElement('div');
    leyenda.style.cssText = `font-size: 10px; color: #666; padding: 6px 10px; background: #f0f4f8; border-radius: 6px; line-height: 1.5;`;
    leyenda.innerHTML = `<strong>Leyenda:</strong> ✓ Aprobada por final · 🔄 RF Aprobada por Rec. Final · 🌟 RE Aprobada por Rec. Especial`;
    colDer.appendChild(leyenda);
    
    if (contadorFinales === 0) {
        const vacio = document.createElement('div');
        vacio.style.cssText = `text-align: center; padding: 10px; background: #fff3cd; border-radius: 8px; color: #856404; font-size: 12px; font-weight: 600;`;
        vacio.textContent = '⚠️ Este estudiante aún no tiene calificaciones registradas.';
        colDer.appendChild(vacio);
    }
    
    body.appendChild(colDer);
    
    const barraBotones = document.createElement('div');
    barraBotones.style.cssText = `display: flex; gap: 12px; padding: 0 24px 20px 24px;`;
    
    const btnImprimir = document.createElement('button');
    btnImprimir.textContent = '🖨️ IMPRIMIR CALIFICACIONES';
    btnImprimir.style.cssText = `flex: 1; padding: 11px 20px; background: linear-gradient(135deg, #34a853, #1e7e34); color: white; border: none; border-radius: 50px; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; font-family: 'Times New Roman', Times, serif; box-shadow: 0 4px 14px rgba(52,168,83,0.35); transition: all 0.3s ease;`;
    btnImprimir.onmouseenter = function() { this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 20px rgba(52,168,83,0.5)'; };
    btnImprimir.onmouseleave = function() { this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 14px rgba(52,168,83,0.35)'; };
    btnImprimir.onclick = function() { imprimirCalificaciones(row, uid, pageIndex); };
    
    const btnCerrar = document.createElement('button');
    btnCerrar.textContent = '✕ CERRAR';
    btnCerrar.style.cssText = `flex: 1; padding: 11px 20px; background: linear-gradient(135deg, #6c757d, #495057); color: white; border: none; border-radius: 50px; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; font-family: 'Times New Roman', Times, serif; box-shadow: 0 4px 14px rgba(108,117,125,0.35); transition: all 0.3s ease;`;
    btnCerrar.onmouseenter = function() { this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 20px rgba(108,117,125,0.5)'; };
    btnCerrar.onmouseleave = function() { this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 14px rgba(108,117,125,0.35)'; };
    btnCerrar.onclick = function() { overlay.remove(); };
    
    barraBotones.appendChild(btnImprimir);
    barraBotones.appendChild(btnCerrar);
    
    box.appendChild(header);
    box.appendChild(body);
    box.appendChild(barraBotones);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    const escHandler = function(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
}

window.mostrarModalCalificaciones = mostrarModalCalificaciones;
window.imprimirCalificaciones = imprimirCalificaciones;
window.generarHTMLImpresion = generarHTMLImpresion;
window.leerCalificacionesMateria = leerCalificacionesMateria;
window.leerTodasLasMaterias = leerTodasLasMaterias;
window.leerFotoEstudiante = leerFotoEstudiante;

// ============================================ //
// FUNCIONES PARA EL BADGE DE ASIGNACIÓN        //
// ============================================ //
function obtenerTandaDesdeEvaluacion() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const tandaUrl = urlParams.get('tanda');
        if (tandaUrl) return decodeURIComponent(tandaUrl);
        
        const fuentes = [
            localStorage.getItem('datosSincronizados'),
            localStorage.getItem('registroGradoData')
        ];
        for (const fuente of fuentes) {
            if (fuente) {
                try {
                    const datos = JSON.parse(fuente);
                    if (datos && datos.tanda) return datos.tanda;
                } catch (e) { continue; }
            }
        }
        
        const tandaSS = sessionStorage.getItem('tandaSeleccionada');
        if (tandaSS) return tandaSS;
        
        const tandaSelect = document.getElementById('tandaSelectEval');
        if (tandaSelect && tandaSelect.value) return tandaSelect.value;
        
        return 'Matutina';
    } catch (e) {
        console.warn('⚠️ Error obteniendo tanda:', e);
        return 'Matutina';
    }
}

function obtenerGradoTextoDesdeEvaluacion() {
    const grade = currentGrade || 3;
    const nombres = {
        1: 'Primer Grado', 2: 'Segundo Grado', 3: 'Tercer Grado',
        4: 'Cuarto Grado', 5: 'Quinto Grado', 6: 'Sexto Grado'
    };
    return nombres[grade] || 'Tercer Grado';
}

function crearBadgeAsignacionEval() {
    const grado = obtenerGradoTextoDesdeEvaluacion();
    const seccion = currentSection || 'A';
    const tanda = obtenerTandaDesdeEvaluacion();
    
    const badge = document.createElement('div');
    badge.className = 'badge-asignacion-eval';
    badge.id = 'badgeAsignacionEval';
    badge.innerHTML = `📚 Asignación: <span style="color: #FFD700;">${grado}</span> <span style="color: #fff; opacity: 0.4; margin: 0 6px;">|</span> <span style="color: #4FC3F7;">${seccion}</span> <span style="color: #fff; opacity: 0.4; margin: 0 6px;">|</span> <span style="color: #81C784;">${tanda}</span> <button onclick="cambiarGradoDesdeEvaluacion()" style="background: #6c757d; color: white; border: none; padding: 4px 14px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.3s ease; margin-left: 12px; font-family: 'Times New Roman', Times, serif;">🔄 Cambiar</button>`;
    return badge;
}

window.cambiarGradoDesdeEvaluacion = function() {
    if (confirm('¿Desea cambiar de grado? Se guardarán los datos actuales.')) {
        guardarTodoInmediato();
        if (typeof AuthSystem !== 'undefined') {
            const sesion = AuthSystem.obtenerSesion();
            if (sesion && sesion.cedula) {
                AuthSystem.eliminarGradoSeleccionado(sesion.cedula);
                sessionStorage.removeItem('gradoSeleccionado');
                sessionStorage.removeItem('seccionSeleccionada');
                sessionStorage.removeItem('tandaSeleccionada');
            }
        }
        window.top.location.href = 'login.html?action=select_grado';
    }
};

function actualizarBadgeAsignacionEval() {
    const container = document.getElementById('evalBadgeContainer');
    if (!container) return;
    
    const isInIndex = document.getElementById('contenido-evaluacion') !== null;
    if (isInIndex) container.style.cssText = 'max-width: 1100px; margin: 0 auto;';
    
    const badgeAnterior = container.querySelector('.badge-asignacion-eval');
    if (badgeAnterior) badgeAnterior.remove();
    
    const badge = crearBadgeAsignacionEval();
    container.appendChild(badge);
}

function sincronizarTandaDesdeSelect() {
    const select = document.getElementById('tandaSelectEval');
    if (select) {
        const tanda = obtenerTandaDesdeEvaluacion();
        let encontrado = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === tanda) { select.value = tanda; encontrado = true; break; }
        }
        if (!encontrado) select.value = 'Matutina';
        sessionStorage.setItem('tandaSeleccionada', select.value);
        currentTanda = select.value;
        actualizarBadgeAsignacionEval();
    }
}

function sincronizarGradoSeccionTandaEval() {
    const gradeSelect = document.getElementById('gradeSelectEval');
    const sectionSelect = document.getElementById('sectionSelectEval');
    const tandaSelect = document.getElementById('tandaSelectEval');
    
    if (gradeSelect) gradeSelect.value = currentGrade;
    if (sectionSelect) sectionSelect.value = currentSection;
    if (tandaSelect) {
        const tanda = obtenerTandaDesdeEvaluacion();
        let encontrado = false;
        for (let i = 0; i < tandaSelect.options.length; i++) {
            if (tandaSelect.options[i].value === tanda) { tandaSelect.value = tanda; encontrado = true; break; }
        }
        if (!encontrado) tandaSelect.value = 'Matutina';
        sessionStorage.setItem('tandaSeleccionada', tandaSelect.value);
        currentTanda = tandaSelect.value;
    }
    actualizarBadgeAsignacionEval();
}

// ============================================ //
// ✅ APLICAR DATOS SINCRONIZADOS              //
// ============================================ //
function aplicarDatosSincronizados() {
    try {
        const datosSync = localStorage.getItem('datosSincronizados');
        if (!datosSync) {
            console.log('ℹ️ No hay datos sincronizados desde la página principal');
            return false;
        }
        const datos = JSON.parse(datosSync);
        console.log('📥 Datos sincronizados recibidos:', datos);
        
        if (datos.grado) {
            const gradoMap = {
                'Primer Grado': 1, 'Segundo Grado': 2, 'Tercer Grado': 3,
                'Cuarto Grado': 4, 'Quinto Grado': 5, 'Sexto Grado': 6
            };
            currentGrade = gradoMap[datos.grado] || 3;
        }
        if (datos.seccion) currentSection = datos.seccion;
        if (datos.tanda) {
            currentTanda = datos.tanda;
            sessionStorage.setItem('tandaSeleccionada', currentTanda);
        }
        if (datos.anioEscolar) currentSchoolYear = datos.anioEscolar;
        
        sessionStorage.setItem('gradoSeleccionado', currentGrade.toString());
        sessionStorage.setItem('seccionSeleccionada', currentSection);
        sessionStorage.setItem('tandaSeleccionada', currentTanda);
        
        return true;
    } catch (e) {
        console.error('❌ Error aplicando datos sincronizados:', e);
        return false;
    }
}

// ============================================ //
// ✅ FUNCIONES DE SINCRONIZACIÓN CON FORMULARIO //
// ============================================ //
function obtenerEstudiantesDesdeFormulario() {
    try {
        const registrosRaw = localStorage.getItem('registrosSigerd');
        if (!registrosRaw) return [];
        const registros = JSON.parse(registrosRaw);
        if (!Array.isArray(registros) || registros.length === 0) return [];
        
        const gradoTexto = obtenerGradoTextoDesdeEvaluacion();
        const seccion = currentSection || 'A';
        const tanda = obtenerTandaDesdeEvaluacion();
        
        const estudiantesFiltrados = registros.filter(est => {
            const estGrado = (est.grado || '').trim().toUpperCase();
            const estSeccion = (est.seccion || '').trim().toUpperCase();
            const estTanda = (est.tanda || '').trim().toUpperCase();
            const gradoActual = gradoTexto.trim().toUpperCase();
            const seccionActual = seccion.trim().toUpperCase();
            const tandaActual = tanda.trim().toUpperCase();
            return estGrado === gradoActual && 
                   estSeccion === seccionActual && 
                   estTanda === tandaActual;
        });
        
        estudiantesFiltrados.sort((a, b) => {
            const ordenA = parseInt(a.orden) || 0;
            const ordenB = parseInt(b.orden) || 0;
            return ordenA - ordenB;
        });
        
        return estudiantesFiltrados;
    } catch (e) {
        console.error('❌ Error obteniendo estudiantes del formulario:', e);
        return [];
    }
}

function contarEstudiantesActivos() {
    return obtenerEstudiantesDesdeFormulario().length;
}

function obtenerNombresEstudiantesPorFila() {
    const estudiantes = obtenerEstudiantesDesdeFormulario();
    const nombresPorFila = {};
    estudiantes.forEach(est => {
        const orden = parseInt(est.orden) || 0;
        if (orden > 0) {
            const nombreCompleto = `${est.nombre || ''} ${est.apellido || ''}`.trim() || `ESTUDIANTE ${orden}`;
            nombresPorFila[orden] = nombreCompleto;
        }
    });
    return nombresPorFila;
}

function filaTieneEstudiante(rowNum) {
    return obtenerEstudiantesDesdeFormulario().some(est => parseInt(est.orden) === rowNum);
}

function sincronizarFilasConEstudiantes() {
    const totalEstudiantes = contarEstudiantesActivos();
    const filasActuales = getRowCountForCurrent();
    
    if (totalEstudiantes > filasActuales) {
        const filasAAgregar = totalEstudiantes - filasActuales;
        console.log(`📈 Agregando ${filasAAgregar} filas automáticamente`);
        setRowCountForCurrent(totalEstudiantes);
        saveRowCount();
        return true;
    }
    return false;
}

// ============================================ //
// ✅ SIN BLOQUEO DE FILAS                      //
// ============================================ //
function aplicarLocksPorEstudiantes() {
    // ✅ Bloqueo eliminado por completo
    actualizarCacheEstudiantes();
    console.log('ℹ️ Bloqueo por estudiantes DESACTIVADO');
}

// ============================================ //
// ✅ GUARDAR TODO INMEDIATO                    //
// ============================================ //
function guardarTodoInmediato() {
    const container = getEvalContainer();
    if (!container) {
        console.log('⚠️ No hay contenedor para guardar');
        return;
    }
    
    actualizarCacheEstudiantes();
    let contador = 0;
    const paginas = container.querySelectorAll('.eval-page');
    
    paginas.forEach((page, pageIdx) => {
        const pageIndex = pageIdx + 1;
        const filas = page.querySelectorAll('tbody tr');
        
        filas.forEach((tr, rowIdx) => {
            const rowNum = rowIdx + 1;
            const uid = uidPorOrdenCache[rowNum] || null;
            
            tr.querySelectorAll('input.grade-input').forEach(input => {
                const compMatch = input.className.match(/c(\d)/);
                if (!compMatch) return;
                const comp = parseInt(compMatch[1]);
                const rpMatch = input.className.match(/rp(\d)/);
                const pMatch = input.className.match(/p(\d)/);
                
                if (rpMatch) {
                    const period = parseInt(rpMatch[1]);
                    guardarNota(uid, pageIndex, comp, period, true, input.value, rowNum);
                    contador++;
                } else if (pMatch) {
                    const period = parseInt(pMatch[1]);
                    guardarNota(uid, pageIndex, comp, period, false, input.value, rowNum);
                    contador++;
                }
            });
            
            const recFinalCell = tr.querySelector('td.rec-final-input');
            if (recFinalCell) {
                guardarRecFinal(uid, pageIndex, rowNum, recFinalCell.innerText);
                contador++;
            }
            
            const recEspecialCell = tr.querySelector('td.rec-especial-input');
            if (recEspecialCell) {
                guardarRecEspecial(uid, pageIndex, rowNum, recEspecialCell.innerText);
                contador++;
            }
        });
    });
    
    console.log(`💾 ${contador} valores guardados (G${currentGrade} S${currentSection})`);
}

// ============================================ //
// ✅ CARGAR TODO INMEDIATO                     //
// ============================================ //
function cargarTodoInmediato() {
    const container = getEvalContainer();
    if (!container) {
        console.log('⚠️ No hay contenedor para cargar');
        return;
    }
    
    actualizarCacheEstudiantes();
    let contador = 0;
    const paginas = container.querySelectorAll('.eval-page');
    
    paginas.forEach((page, pageIdx) => {
        const pageIndex = pageIdx + 1;
        const filas = page.querySelectorAll('tbody tr');
        
        filas.forEach((tr, rowIdx) => {
            const rowNum = rowIdx + 1;
            const uid = uidPorOrdenCache[rowNum] || null;
            
            tr.querySelectorAll('input.grade-input').forEach(input => {
                const compMatch = input.className.match(/c(\d)/);
                if (!compMatch) return;
                const comp = parseInt(compMatch[1]);
                const rpMatch = input.className.match(/rp(\d)/);
                const pMatch = input.className.match(/p(\d)/);
                let valor = null;
                
                if (rpMatch) {
                    const period = parseInt(rpMatch[1]);
                    valor = leerNota(uid, pageIndex, comp, period, true, rowNum);
                } else if (pMatch) {
                    const period = parseInt(pMatch[1]);
                    valor = leerNota(uid, pageIndex, comp, period, false, rowNum);
                }
                
                if (valor !== null && valor !== '') {
                    input.value = valor;
                    contador++;
                } else {
                    input.value = '';
                }
            });
            
            const recFinalCell = tr.querySelector('td.rec-final-input');
            if (recFinalCell) {
                const valor = leerRecFinal(uid, pageIndex, rowNum);
                if (valor !== null && valor !== '') {
                    recFinalCell.innerText = valor;
                    recFinalCell.dataset.lastValidValue = valor;
                    contador++;
                } else {
                    recFinalCell.innerText = '';
                    recFinalCell.dataset.lastValidValue = '0';
                }
            }
            
            const recEspecialCell = tr.querySelector('td.rec-especial-input');
            if (recEspecialCell) {
                const valor = leerRecEspecial(uid, pageIndex, rowNum);
                if (valor !== null && valor !== '') {
                    recEspecialCell.innerText = valor;
                    recEspecialCell.dataset.lastValidValue = valor;
                    contador++;
                } else {
                    recEspecialCell.innerText = '';
                    recEspecialCell.dataset.lastValidValue = '0';
                }
            }
        });
    });
    
    console.log(`📂 ${contador} valores cargados (G${currentGrade} S${currentSection})`);
}

// ============================================ //
// ✅ SAVE DATA (con debounce para input)       //
// ============================================ //
function saveData() {
    clearTimeout(saveTimeouts['eval']);
    saveTimeouts['eval'] = setTimeout(() => {
        guardarTodoInmediato();
    }, 200);
}

function loadData() {
    cargarTodoInmediato();
    const container = getEvalContainer();
    if (!container) return;
    container.querySelectorAll('tbody tr').forEach(row => {
        calculateRow(row);
    });
    container.querySelectorAll('input.grade-input').forEach(input => {
        if (input.value) applyColorToInput(input);
    });
}

// ============================================ //
// FUNCIONES AUXILIARES                         //
// ============================================ //
function getMateriasForGrade(grade) {
    const subjectNames = DEFAULT_GRADE_CONFIG.subjects[grade] || [];
    const materias = [];
    subjectNames.forEach(subjectName => {
        let found = materiasBase.find(m => m.nombre === subjectName);
        if (!found && subjectName === 'INGLÉS (LENGUAS EXTRANJERAS)') found = materiaIngles;
        if (found) materias.push(found);
        else materias.push({ nombre: subjectName, c1: 'Competencia comunicativa personalizada', c2: 'Pensamiento lógico personalizado', c3: 'Ética y ciudadana personalizada' });
    });
    return materias;
}

function getPeriodsCount() { return DEFAULT_GRADE_CONFIG.periods.count || 4; }
function getPeriodNames() { return DEFAULT_GRADE_CONFIG.periods.names || ['P1', 'P2', 'P3', 'P4']; }

function getStorageKey() {
    const gradeText = currentGrade === 1 ? '1er' : (currentGrade === 2 ? '2do' : (currentGrade === 3 ? '3er' : (currentGrade === 4 ? '4to' : (currentGrade === 5 ? '5to' : '6to'))));
    return `registro_${gradeText}_sec${currentSection}_v25`;
}

function getRowCountKey() {
    const gradeText = currentGrade === 1 ? '1er' : (currentGrade === 2 ? '2do' : (currentGrade === 3 ? '3er' : (currentGrade === 4 ? '4to' : (currentGrade === 5 ? '5to' : '6to'))));
    return `rowCount_${gradeText}_sec${currentSection}_v25`;
}

function getStudentStorageKey() {
    const gradeText = currentGrade === 1 ? '1er' : (currentGrade === 2 ? '2do' : (currentGrade === 3 ? '3er' : (currentGrade === 4 ? '4to' : (currentGrade === 5 ? '5to' : '6to'))));
    return `student_data_${gradeText}_sec${currentSection}_v3`;
}

function saveRowCount() { localStorage.setItem(getRowCountKey(), getRowCountForCurrent()); }
function getRowCountForCurrent() { return rowCounts[`${currentGrade}_${currentSection}`] || 30; }
function setRowCountForCurrent(val) { rowCounts[`${currentGrade}_${currentSection}`] = val; }
function loadRowCount() { const saved = localStorage.getItem(getRowCountKey()); setRowCountForCurrent(saved ? parseInt(saved) : 30); }

function hasStudentName(row) {
    return !!uidPorOrdenCache[row];
}

// ============================================ //
// FUNCIONES PARA OBTENER ELEMENTOS             //
// ============================================ //
function getEvalContainer() {
    let container = document.getElementById('evalAppContainer');
    if (container) { isIntegratedMode = true; return container; }
    container = document.getElementById('app-container');
    if (container) { isIntegratedMode = false; return container; }
    return null;
}

function getModal() { return document.getElementById('evalStudentNotFoundModal') || document.getElementById('studentNotFoundModal'); }
function getModalRowNum() { return document.getElementById('evalStudentNotFoundRowNum') || document.getElementById('studentNotFoundRowNum'); }
function getCloseModalBtn() { return document.getElementById('evalCloseModalBtn') || document.getElementById('closeModalBtn'); }
function getGradeSelect() { return document.getElementById('gradeSelectEval') || document.getElementById('gradeSelect'); }
function getSectionSelect() { return document.getElementById('sectionSelectEval') || document.getElementById('sectionSelect'); }
function getPageLabel() { return document.getElementById('evalPageLabel') || document.getElementById('page-label'); }
function getPageLabel2() { return document.getElementById('evalPageLabel2') || document.getElementById('page-label2'); }
function getCurrentPage() { return document.getElementById('evalCurrentPage') || document.getElementById('currentPage'); }
function getCurrentPage2() { return document.getElementById('evalCurrentPage2') || document.getElementById('currentPage2'); }
function getTotalPages() { return document.getElementById('evalTotalPages') || document.getElementById('total-pages'); }
function getTotalPages2() { return document.getElementById('evalTotalPages2') || document.getElementById('total-pages2'); }
function getPrevBtn() { return document.getElementById('evalPrevBtn') || document.getElementById('prevBtn'); }
function getNextBtn() { return document.getElementById('evalNextBtn') || document.getElementById('nextBtn'); }
function getPrevBtn2() { return document.getElementById('evalPrevBtn2') || document.getElementById('prevBtn2'); }
function getNextBtn2() { return document.getElementById('evalNextBtn2') || document.getElementById('nextBtn2'); }
function getAddRowBtn() { return document.getElementById('evalAddRowBtn') || document.getElementById('addRowBtn'); }
function getDeleteRowBtn() { return document.getElementById('evalDeleteRowBtn') || document.getElementById('deleteRowBtn'); }
function getPrintBtn() { return document.getElementById('evalPrintBtn') || document.getElementById('printBtn'); }
function getClearBtn() { return document.getElementById('evalClearBtn') || document.getElementById('clearBtn'); }
function getConfigBar() { return document.querySelector('.eval-config-bar') || document.querySelector('.config-bar'); }
function getHeaderContainer() { return document.querySelector('.eval-header-container') || document.querySelector('.header-container'); }

function showStudentNotFoundModal(rowNum) {
    const rowEl = getModalRowNum();
    if (rowEl) rowEl.innerText = 'Nº ' + rowNum;
    const modal = getModal();
    if (modal) modal.classList.add('active');
}

function closeStudentNotFoundModal() {
    const modal = getModal();
    if (modal) modal.classList.remove('active');
}

function ocultarSelectoresEnModoIndice() {
    const isInIndex = document.getElementById('contenido-evaluacion') !== null;
    if (isInIndex) {
        isIndexMode = true;
        const configBar = getConfigBar();
        const headerContainer = getHeaderContainer();
        if (configBar) configBar.style.display = 'none';
        if (headerContainer) {
            const p = headerContainer.querySelector('p');
            if (p) p.style.display = 'none';
        }
        console.log('📌 Modo Índice: Selectores ocultos');
    }
}

// ============================================ //
// GENERAR TABLAS DE EVALUACIÓN                 //
// ============================================ //
function generateAllTables() {
    const container = getEvalContainer();
    if (!container) {
        console.error('❌ No se encontró el contenedor de evaluación');
        return;
    }
    
    let html = '';
    const totalRows = getRowCountForCurrent();
    const materias = getMateriasForGrade(currentGrade);
    const periodsCount = getPeriodsCount();
    const periodNames = getPeriodNames();
    const tanda = obtenerTandaDesdeEvaluacion();
    
    if (!materias || materias.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No hay materias configuradas para este grado.</p>';
        return;
    }
    
    totalPages = materias.length;
    actualizarCacheEstudiantes();
    
    const infoPorFila = {};
    estudiantesCache.forEach(est => {
        const orden = parseInt(est.orden);
        if (orden > 0) {
            infoPorFila[orden] = {
                uid: est.uid,
                nombre: `${est.nombre || ''} ${est.apellido || ''}`.trim()
            };
        }
    });
    
    materias.forEach((materia, mIndex) => {
        let pageIndex = mIndex + 1;
        let activeClass = pageIndex === currentPage ? 'active' : '';
        const gradeClass = currentGrade === 1 ? '1' : (currentGrade === 2 ? '2' : (currentGrade === 3 ? '3' : (currentGrade === 4 ? '4' : (currentGrade === 5 ? '5' : '6'))));
        const gradeName = currentGrade === 1 ? 'Primer' : (currentGrade === 2 ? 'Segundo' : (currentGrade === 3 ? 'Tercer' : (currentGrade === 4 ? 'Cuarto' : (currentGrade === 5 ? 'Quinto' : 'Sexto'))));
        
        const colSpan = periodsCount * 2;
        const columnasFinales = currentGrade >= 3 ? 3 : 2;
        
        html += `<div class="eval-page ${activeClass}" id="evalPage${pageIndex}">
                    <table class="eval-table">
                        <thead>
                            <tr class="header-row header-row-${gradeClass}">
                                <th colspan="${1 + colSpan * 3 + 3 + columnasFinales}" style="text-align:center; padding:8px 4px;">
                                    <span class="header-grade">${gradeName} Grado</span>
                                    <span class="header-section">| Sección: ${currentSection}</span>
                                    <span class="header-tanda">| Tanda: ${tanda}</span>
                                    <span class="header-area">ÁREA: ${materia.nombre}</span>
                                </th>
                            </tr>
                            <tr>
                                <th rowspan="3" class="num-col" style="width:30px;">Nº</th>`;
                                
        for (let c = 0; c < 3; c++) {
            const compText = c === 0 ? materia.c1 : (c === 1 ? materia.c2 : materia.c3);
            html += `<th colspan="${colSpan}" style="font-size:8px; padding:4px 2px; text-align:center;">
                        C${c + 1}: ${compText.substring(0, 45)}...
                        <span class="comp-desc">${compText}</span>
                    </th>`;
        }
        
        html += `<th colspan="3" style="font-size:8px; padding:4px 2px; text-align:center;">
                    Promedio del área<br>por competencia
                </th>
                <th rowspan="3" class="final-cell vertical-text" style="width:30px;">
                    Final del área
                </th>
                <th rowspan="3" class="final-cell vertical-text" style="width:30px;">
                    Recuperación final
                </th>`;
                
        if (currentGrade >= 3) {
            html += `<th rowspan="3" class="final-cell vertical-text" style="width:30px;">
                        Recuperación especial
                    </th>`;
        }
        
        html += `</tr>
                    <tr>`;
                    
        for (let c = 0; c < 3; c++) {
            for (let p = 0; p < periodsCount; p++) {
                const pName = periodNames[p] || `P${p + 1}`;
                html += `<th class="period-col" style="width:30px;">${pName}</th>`;
                html += `<th class="period-col" style="width:30px;">RP${p + 1}</th>`;
            }
        }
        
        html += `<th class="period-col" style="width:30px;">C1</th>
                <th class="period-col" style="width:32px;">C2</th>
                <th class="period-col" style="width:32px;">C3</th>
            </tr>
        </thead>
        <tbody>`;
        
        for (let i = 1; i <= totalRows; i++) {
            const info = infoPorFila[i];
            const tieneEst = !!info;
            const numClass = tieneEst ? 'num-col num-col-clickeable' : 'num-col';
            const tituloNum = tieneEst ? `👤 ${info.nombre || 'Estudiante'} (clic para ver calificaciones)` : 'Sin estudiante registrado';
            
            html += `<tr>`;
            html += `<td class="${numClass}" data-row="${i}" data-uid="${info ? info.uid : ''}" data-page="${pageIndex}" title="${tituloNum}" style="width:30px;">${i}</td>`;
            
            for (let c = 1; c <= 3; c++) {
                for (let p = 1; p <= periodsCount; p++) {
                    const inputId = `g${currentGrade}s${currentSection}m${pageIndex}r${i}c${c}p${p}`;
                    html += `<td style="width:30px;">
                                <input type="text" 
                                       class="grade-input c${c}p${p}" 
                                       id="${inputId}" 
                                       data-m="${pageIndex}"
                                       data-r="${i}"
                                       data-c="${c}"
                                       data-p="${p}"
                                       data-rp="0"
                                       maxlength="3" 
                                       placeholder="" 
                                       value="">
                            </td>`;
                    const rpId = `g${currentGrade}s${currentSection}m${pageIndex}r${i}c${c}rp${p}`;
                    html += `<td style="width:30px; background-color:#fce8e6;">
                                <input type="text" 
                                       class="grade-input recovery-input c${c}rp${p}" 
                                       id="${rpId}" 
                                       data-m="${pageIndex}"
                                       data-r="${i}"
                                       data-c="${c}"
                                       data-p="${p}"
                                       data-rp="1"
                                       maxlength="3" 
                                       placeholder="RP" 
                                       value="">
                            </td>`;
                }
            }
            
            html += `<td class="calc-cell avg-c1" style="width:32px;"></td>
                    <td class="calc-cell avg-c2" style="width:32px;"></td>
                    <td class="calc-cell avg-c3" style="width:32px;"></td>
                    <td class="final-cell final-grade" style="width:30px;"></td>
                    <td contenteditable="true" 
                        class="final-cell rec-final-input" 
                        data-m="${pageIndex}"
                        data-r="${i}"
                        data-last-valid-value="0"
                        id="g${currentGrade}s${currentSection}m${pageIndex}r${i}rec" 
                        style="width:30px;">
                    </td>`;
                    
            if (currentGrade >= 3) {
                html += `<td contenteditable="true" 
                            class="final-cell rec-especial-input" 
                            data-m="${pageIndex}"
                            data-r="${i}"
                            data-last-valid-value="0"
                            id="g${currentGrade}s${currentSection}m${pageIndex}r${i}recespecial" 
                            style="width:30px;">
                        </td>`;
            }
            
            html += `</tr>`;
        }
        
        html += `</tbody>
                </table>
            </div>`;
    });
    
    container.innerHTML = html;
    console.log('🔄 Generando tablas, cargando datos...');
    cargarTodoInmediato();
    attachInputListeners();
    
    if (container._numColHandler) container.removeEventListener('click', container._numColHandler);
    container._numColHandler = function(e) {
        const celdaNum = e.target.closest('.num-col-clickeable');
        if (celdaNum) {
            e.stopPropagation();
            const row = celdaNum.dataset.row || '';
            const uid = celdaNum.dataset.uid || '';
            const page = celdaNum.dataset.page || currentPage;
            console.log('👤 Clic en Nº', row, '- UID:', uid, '- Materia:', page);
            mostrarModalCalificaciones(row, uid, parseInt(page));
        }
    };
    container.addEventListener('click', container._numColHandler);
    
    setTimeout(() => {
        const cont = getEvalContainer();
        if (cont) {
            cont.querySelectorAll('tbody tr').forEach(row => {
                calculateRow(row);
            });
            cont.querySelectorAll('input.grade-input').forEach(input => {
                if (input.value) applyColorToInput(input);
            });
        }
    }, 100);
}

// ============================================ //
// ADJUNTAR EVENT LISTENERS                     //
// ✅ 'input'  → NO recalcula (escritura fluida)//
// ✅ 'blur'   → SÍ recalcula                   //
// ✅ 'Enter'  → fuerza blur                    //
// ============================================ //
function attachInputListeners() {
    const container = getEvalContainer();
    if (!container) return;
    
    const inputs = container.querySelectorAll('input.grade-input');
    inputs.forEach(input => {
        input.oninput = null;
        input.onchange = null;
        input.onblur = null;
        input.onkeydown = null;
        input.onfocus = null;
        
        input.addEventListener('input', function(e) {
            processGradeInput(e.target, false);
        });
        input.addEventListener('blur', function(e) {
            processGradeInput(e.target, true);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
                return;
            }
            handleNav(e);
        });
    });
    
    const recCells = container.querySelectorAll('td.rec-final-input, td.rec-especial-input');
    recCells.forEach(cell => {
        cell.oninput = null;
        cell.onchange = null;
        cell.onblur = null;
        cell.onkeydown = null;
        cell.onfocus = null;
        
        cell.addEventListener('input', function(e) {
            processRecoveryInput(e.target, false);
        });
        cell.addEventListener('blur', function(e) {
            processRecoveryInput(e.target, true);
        });
        cell.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                cell.blur();
                return;
            }
            handleRecoveryKeydown(e);
        });
    });
}

// ============================================ //
// ✅ MANEJAR TECLADO EN RECUPERACIONES         //
// ============================================ //
function handleRecoveryKeydown(e) {
    const cell = e.target;
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        resetearRecuperacion(cell);
        return;
    }
    
    const teclasPermitidas = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (teclasPermitidas.includes(e.key)) return;
    
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
        e.preventDefault();
    }
}

// ✅ Resetear celda de recuperación
function resetearRecuperacion(cell) {
    const row = cell.closest('tr');
    if (!row) return;
    
    cell.innerText = '';
    cell.dataset.lastValidValue = '0';
    cell.classList.remove('failing-grade');
    
    const m = parseInt(cell.dataset.m);
    const r = parseInt(cell.dataset.r);
    const esRecEspecial = cell.classList.contains('rec-especial-input');
    
    if (m && r) {
        const uid = uidPorOrdenCache[r] || null;
        if (esRecEspecial) {
            guardarRecEspecial(uid, m, r, '');
        } else {
            guardarRecFinal(uid, m, r, '');
        }
    }
    
    calculateRow(row);
    console.log(`🗑️ Recuperación borrada`);
}

// ============================================ //
// ✅ REVALIDAR FILA (SIN LOCKS)                //
// ============================================ //
function revalidarFilaCompleta(row) {
    if (!row) return;
    calculateRow(row);
    row.querySelectorAll('input.grade-input').forEach(input => {
        if (input.value) applyColorToInput(input);
    });
}

// ============================================ //
// ✅ REFRESCAR HOJA SIN PERDER FOCO            //
// ============================================ //
function refrescarHojaSinPerderFoco() {
    const container = getEvalContainer();
    if (!container) return;
    guardarTodoInmediato();
    cargarTodoInmediato();
    container.querySelectorAll('tbody tr').forEach(tr => {
        revalidarFilaCompleta(tr);
    });
    console.log('🔄 Hoja refrescada sin perder foco');
}

// ============================================ //
// ✅ PROCESAR INPUT DE NOTA                    //
// ✅ En 'input' NO recalcula (escritura fluida)//
// ✅ En 'blur'   SÍ recalcula                  //
// ============================================ //
function processGradeInput(input, esBlur) {
    if (typeof esBlur === 'undefined') esBlur = false;
    
    const row = input.closest('tr');
    if (!row) return;
    
    let val = input.value.replace(/[^0-9]/g, '');
    
    if (val === '') {
        input.value = '';
        applyColorToInput(input);
        
        const m = parseInt(input.dataset.m);
        const r = parseInt(input.dataset.r);
        const c = parseInt(input.dataset.c);
        const p = parseInt(input.dataset.p);
        const esRP = input.dataset.rp === '1';
        
        if (m && r && c && p) {
            const uid = uidPorOrdenCache[r] || null;
            guardarNota(uid, m, c, p, esRP, '', r);
        }
        
        // ✅ Solo recalcular si es blur
        if (esBlur) {
            calculateRow(row);
        }
        return;
    }
    
    let numVal = parseInt(val, 10);
    if (numVal > 100) numVal = 100;
    input.value = numVal;
    
    applyColorToInput(input);
    
    const m = parseInt(input.dataset.m);
    const r = parseInt(input.dataset.r);
    const c = parseInt(input.dataset.c);
    const p = parseInt(input.dataset.p);
    const esRP = input.dataset.rp === '1';
    
    if (m && r && c && p) {
        const uid = uidPorOrdenCache[r] || null;
        guardarNota(uid, m, c, p, esRP, numVal, r);
    }
    
    // ✅ Solo recalcular si es blur
    if (esBlur) {
        calculateRow(row);
    }
}

// ============================================ //
// ✅ PROCESAR INPUT DE RECUPERACIÓN            //
// ✅ En 'input' NO valida (escritura fluida)   //
// ✅ En 'blur'   SÍ valida                     //
// ✅ Rec Final  >= Final del Área              //
// ✅ Rec Especial >= Final del Área            //
// ============================================ //
function processRecoveryInput(cell, validar) {
    if (typeof validar === 'undefined') validar = true;
    
    const row = cell.closest('tr');
    if (!row) return;
    
    const esRecEspecial = cell.classList.contains('rec-especial-input');
    
    // ✅ Guardar posición del cursor
    const selection = window.getSelection();
    let cursorOffset = 0;
    try {
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (cell.contains(range.startContainer) || cell === range.startContainer) {
                cursorOffset = range.startOffset;
            } else {
                cursorOffset = cell.innerText.length;
            }
        }
    } catch (e) {
        cursorOffset = cell.innerText.length;
    }
    
    let valStr = cell.innerText.replace(/[^0-9]/g, '');
    
    // ✅ Si está vacío
    if (valStr === '' || cell.innerText.trim() === '') {
        cell.innerText = '';
        cell.dataset.lastValidValue = '0';
        cell.classList.remove('failing-grade');
        
        if (validar) {
            const m = parseInt(cell.dataset.m);
            const r = parseInt(cell.dataset.r);
            if (m && r) {
                const uid = uidPorOrdenCache[r] || null;
                if (esRecEspecial) {
                    guardarRecEspecial(uid, m, r, '');
                } else {
                    guardarRecFinal(uid, m, r, '');
                }
            }
            calculateRow(row);
        }
        return;
    }
    
    let valorNuevo = parseInt(valStr, 10);
    if (isNaN(valorNuevo)) valorNuevo = 0;
    if (valorNuevo > 100) valorNuevo = 100;
    
    // ✅ VALIDACIÓN: solo al validar (blur)
    if (validar) {
        const finalCell = row.querySelector('.final-grade');
        const finalText = finalCell ? (finalCell.innerText || '').trim() : '';
        const finalNum = finalText !== '' ? parseInt(finalText, 10) : null;
        
        if (finalNum !== null && !isNaN(finalNum)) {
            if (valorNuevo < finalNum) {
                // ❌ Revertir al valor anterior
                const valorAnterior = parseInt(cell.dataset.lastValidValue || '0', 10) || 0;
                if (valorAnterior >= finalNum) {
                    cell.innerText = String(valorAnterior);
                } else {
                    cell.innerText = '';
                    cell.dataset.lastValidValue = '0';
                }
                
                // Restaurar cursor
                try {
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(cell);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } catch (e) {}
                
                // Aviso visual
                cell.style.transition = 'background-color 0.3s';
                cell.style.backgroundColor = '#ffcdd2';
                setTimeout(() => {
                    cell.style.backgroundColor = '';
                }, 500);
                
                const tipo = esRecEspecial ? 'Recuperación Especial' : 'Recuperación Final';
                mostrarAvisoTemporal(`⚠️ La ${tipo} no puede ser menor al Final del Área (${finalNum}). Debe ser igual o mayor.`);
                
                // Guardar el valor anterior
                const m = parseInt(cell.dataset.m);
                const r = parseInt(cell.dataset.r);
                if (m && r) {
                    const uid = uidPorOrdenCache[r] || null;
                    if (esRecEspecial) {
                        guardarRecEspecial(uid, m, r, cell.innerText);
                    } else {
                        guardarRecFinal(uid, m, r, cell.innerText);
                    }
                }
                calculateRow(row);
                return;
            }
        }
    }
    
    // ✅ Asignar valor
    cell.innerText = String(valorNuevo);
    
    // ✅ Actualizar lastValidValue
    if (validar) {
        cell.dataset.lastValidValue = String(valorNuevo);
    } else {
        const valorAnterior = parseInt(cell.dataset.lastValidValue || '0', 10) || 0;
        if (valorNuevo >= valorAnterior) {
            cell.dataset.lastValidValue = String(valorNuevo);
        }
    }
    
    // ✅ Restaurar cursor
    try {
        const range = document.createRange();
        const sel = window.getSelection();
        const textNode = cell.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const newOffset = Math.min(cursorOffset, textNode.length);
            range.setStart(textNode, newOffset);
            range.setEnd(textNode, newOffset);
        } else {
            range.selectNodeContents(cell);
            range.collapse(false);
        }
        sel.removeAllRanges();
        sel.addRange(range);
    } catch (e) {}
    
    checkFailingGrade(cell, cell.innerText);
    
    // ✅ Guardar en localStorage
    const m = parseInt(cell.dataset.m);
    const r = parseInt(cell.dataset.r);
    
    if (m && r) {
        const uid = uidPorOrdenCache[r] || null;
        if (esRecEspecial) {
            guardarRecEspecial(uid, m, r, cell.innerText);
        } else {
            guardarRecFinal(uid, m, r, cell.innerText);
        }
    }
    
    // ✅ Solo recalcular si es validación
    if (validar) {
        calculateRow(row);
    }
}

// ✅ Mostrar aviso flotante temporal
function mostrarAvisoTemporal(mensaje) {
    const existente = document.querySelector('.aviso-temporal');
    if (existente) existente.remove();
    
    const aviso = document.createElement('div');
    aviso.className = 'aviso-temporal';
    aviso.textContent = mensaje;
    aviso.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: #fff3cd;
        color: #856404;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        z-index: 100000;
        border: 2px solid #ffc107;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.4s ease;
        opacity: 0;
        font-family: 'Times New Roman', Times, serif;
        pointer-events: none;
    `;
    
    document.body.appendChild(aviso);
    
    setTimeout(() => {
        aviso.style.transform = 'translateX(-50%) translateY(0)';
        aviso.style.opacity = '1';
    }, 50);
    
    setTimeout(() => {
        aviso.style.transform = 'translateX(-50%) translateY(-100px)';
        aviso.style.opacity = '0';
        setTimeout(() => aviso.remove(), 400);
    }, 2500);
}

function validateInput(input) { processGradeInput(input, true); }
function validateRecovery(input) { processRecoveryInput(input, true); }

function applyColorToInput(input) {
    const value = parseInt(input.value);
    const isNumeric = !isNaN(value) && value > 0;
    const isFailing = isNumeric && value < NOTA_MINIMA_APROBATORIA;
    const isPassing = isNumeric && value >= NOTA_MINIMA_APROBATORIA;
    
    input.style.backgroundColor = '';
    input.style.color = '';
    
    const isRecovery = input.classList.contains('recovery-input');
    input.className = isRecovery ? 'grade-input recovery-input' : 'grade-input';
    
    if (isFailing) input.classList.add('failing-grade');
    else if (isPassing) input.classList.add('passing-grade');
}

function checkFailingGrade(element, value) {
    if (!element) return;
    if (value !== "" && !isNaN(value) && Number(value) < NOTA_MINIMA_APROBATORIA) element.classList.add('failing-grade');
    else element.classList.remove('failing-grade');
}

function checkStudentExists(rowNum, element) {
    if (!hasStudentName(rowNum)) {
        element.blur();
        showStudentNotFoundModal(rowNum);
        return false;
    }
    return true;
}

// ============================================ //
// CÁLCULO DE PROMEDIOS                         //
// ============================================ //
function calculateRow(row) {
    if (!row) return;
    const periodsCount = getPeriodsCount();
    
    const allRows = Array.from(row.parentNode.querySelectorAll('tr'));
    const rowIndex = allRows.indexOf(row) + 1;
    
    const evalPage = row.closest('.eval-page');
    let pageIndex = currentPage;
    if (evalPage && evalPage.id) {
        const m = evalPage.id.match(/evalPage(\d+)/);
        if (m) pageIndex = parseInt(m[1]);
    }
    
    let vals1 = [], vals2 = [], vals3 = [];
    
    for (let c = 1; c <= 3; c++) {
        let competenciaVals = [];
        let valoresValidos = 0;
        
        for (let p = 1; p <= periodsCount; p++) {
            const pInputId = `g${currentGrade}s${currentSection}m${pageIndex}r${rowIndex}c${c}p${p}`;
            const pInput = document.getElementById(pInputId);
            if (!pInput) continue;
            
            let pVal = null;
            if (pInput.value && pInput.value.trim() !== '') {
                const parsed = parseFloat(pInput.value);
                if (!isNaN(parsed)) pVal = parsed;
            }
            
            let rpVal = null;
            const rpInputId = `g${currentGrade}s${currentSection}m${pageIndex}r${rowIndex}c${c}rp${p}`;
            const rpInput = document.getElementById(rpInputId);
            if (rpInput && rpInput.value && rpInput.value.trim() !== '') {
                const parsed = parseFloat(rpInput.value);
                if (!isNaN(parsed)) rpVal = parsed;
            }
            
            let valorUsar = null;
            if (pVal !== null && pVal >= NOTA_MINIMA_APROBATORIA) valorUsar = pVal;
            else if (pVal !== null && pVal < NOTA_MINIMA_APROBATORIA && rpVal !== null) valorUsar = rpVal;
            else if (pVal !== null && pVal < NOTA_MINIMA_APROBATORIA && rpVal === null) valorUsar = pVal;
            else if (pVal === null && rpVal !== null) valorUsar = rpVal;
            
            if (valorUsar !== null && !isNaN(valorUsar) && valorUsar >= 0) {
                if (valorUsar > 100) valorUsar = 100;
                competenciaVals.push(valorUsar);
                valoresValidos++;
            }
        }
        
        if (valoresValidos > 0) {
            const suma = competenciaVals.reduce((a, b) => a + b, 0);
            let promedio = Math.round(suma / valoresValidos);
            if (promedio > 100) promedio = 100;
            
            if (c === 1) vals1 = [promedio];
            else if (c === 2) vals2 = [promedio];
            else if (c === 3) vals3 = [promedio];
        }
    }
    
    const avgC1 = vals1.length > 0 ? vals1[0] : "";
    const avgC2 = vals2.length > 0 ? vals2[0] : "";
    const avgC3 = vals3.length > 0 ? vals3[0] : "";
    
    const avgC1El = row.querySelector('.avg-c1');
    const avgC2El = row.querySelector('.avg-c2');
    const avgC3El = row.querySelector('.avg-c3');
    const finalEl = row.querySelector('.final-grade');
    
    if (avgC1El) { avgC1El.innerText = avgC1; checkFailingGrade(avgC1El, avgC1); }
    if (avgC2El) { avgC2El.innerText = avgC2; checkFailingGrade(avgC2El, avgC2); }
    if (avgC3El) { avgC3El.innerText = avgC3; checkFailingGrade(avgC3El, avgC3); }
    
    if (avgC1 !== "" && avgC2 !== "" && avgC3 !== "") {
        let finalGrade = Math.round((parseFloat(avgC1) + parseFloat(avgC2) + parseFloat(avgC3)) / 3);
        if (finalGrade > 100) finalGrade = 100;
        if (finalEl) { finalEl.innerText = finalGrade; checkFailingGrade(finalEl, finalGrade); }
    } else {
        if (finalEl) { finalEl.innerText = ""; finalEl.classList.remove('failing-grade'); }
    }
}

// ============================================ //
// NAVEGACIÓN CON TECLADO                       //
// ============================================ //
function handleNav(e) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Backspace', 'Delete', 'Tab'].includes(e.key)) return;
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
        const input = e.target;
        if (input.tagName === 'INPUT' && input.value !== '') {
            e.preventDefault();
            input.value = '';
            applyColorToInput(input);
            
            const row = input.closest('tr');
            if (row) {
                const m = parseInt(input.dataset.m);
                const r = parseInt(input.dataset.r);
                const c = parseInt(input.dataset.c);
                const p = parseInt(input.dataset.p);
                const esRP = input.dataset.rp === '1';
                
                if (m && r && c && p) {
                    const uid = uidPorOrdenCache[r] || null;
                    guardarNota(uid, m, c, p, esRP, '', r);
                }
                calculateRow(row);
            }
            return;
        }
        return;
    }
    
    if (e.key === 'Tab') {
        e.preventDefault();
        const input = e.target;
        const td = input.closest('td');
        if (!td) return;
        const tr = td.closest('tr');
        if (!tr) return;
        const tbody = tr.closest('tbody');
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const currentRowIndex = rows.indexOf(tr);
        const cells = Array.from(tr.querySelectorAll('td'));
        const currentCellIndex = cells.indexOf(td);
        
        let nextRow = currentRowIndex;
        let nextCell = currentCellIndex + (e.shiftKey ? -1 : 1);
        let moved = false;
        
        if (nextCell >= cells.length) { nextRow = currentRowIndex + 1; nextCell = 0; moved = true; }
        else if (nextCell < 0) { nextRow = currentRowIndex - 1; nextCell = cells.length - 1; moved = true; }
        else moved = true;
        
        if (moved && nextRow >= 0 && nextRow < rows.length) {
            const targetTr = rows[nextRow];
            const targetCells = Array.from(targetTr.querySelectorAll('td'));
            if (nextCell >= 0 && nextCell < targetCells.length) {
                const targetTd = targetCells[nextCell];
                const targetInput = targetTd.querySelector('input.grade-input');
                if (targetInput) { targetInput.focus(); targetInput.select(); }
                else if (targetTd.isContentEditable) { targetTd.focus(); }
            }
        }
        return;
    }
    
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return;
    
    e.preventDefault();
    const input = e.target;
    const td = input.closest('td');
    if (!td) return;
    const tr = td.closest('tr');
    if (!tr) return;
    const tbody = tr.closest('tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const currentRowIndex = rows.indexOf(tr);
    const cells = Array.from(tr.querySelectorAll('td'));
    const currentCellIndex = cells.indexOf(td);
    
    let nextRow = currentRowIndex, nextCell = currentCellIndex;
    let moved = false;
    
    if (e.key === 'ArrowDown' || e.key === 'Enter') { nextRow = currentRowIndex + 1; moved = true; }
    else if (e.key === 'ArrowUp') { nextRow = currentRowIndex - 1; moved = true; }
    else if (e.key === 'ArrowRight') { nextCell = currentCellIndex + 1; moved = true; }
    else if (e.key === 'ArrowLeft') { nextCell = currentCellIndex - 1; moved = true; }
    
    if (moved && nextRow >= 0 && nextRow < rows.length) {
        const targetTr = rows[nextRow];
        const targetCells = Array.from(targetTr.querySelectorAll('td'));
        if (nextCell >= 0 && nextCell < targetCells.length) {
            const targetTd = targetCells[nextCell];
            const targetInput = targetTd.querySelector('input.grade-input');
            if (targetInput) { targetInput.focus(); targetInput.select(); }
            else if (targetTd.isContentEditable) { targetTd.focus(); }
        }
    }
}

// ============================================ //
// PAGINACIÓN                                   //
// ============================================ //
function updatePaginationUI() {
    const total = getMateriasForGrade(currentGrade).length;
    const pageLabel = getPageLabel();
    const pageLabel2 = getPageLabel2();
    const currentPageEl = getCurrentPage();
    const currentPage2El = getCurrentPage2();
    const totalPagesEl = getTotalPages();
    const totalPages2El = getTotalPages2();
    const prevBtn = getPrevBtn();
    const nextBtn = getNextBtn();
    const prevBtn2 = getPrevBtn2();
    const nextBtn2 = getNextBtn2();
    
    if (pageLabel) pageLabel.textContent = 'Materia';
    if (pageLabel2) pageLabel2.textContent = 'Materia';
    if (totalPagesEl) totalPagesEl.textContent = total;
    if (totalPages2El) totalPages2El.textContent = total;
    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (currentPage2El) currentPage2El.textContent = currentPage;
    
    if (prevBtn) prevBtn.disabled = (currentPage === 1);
    if (nextBtn) nextBtn.disabled = (currentPage === total);
    if (prevBtn2) prevBtn2.disabled = (currentPage === 1);
    if (nextBtn2) nextBtn2.disabled = (currentPage === total);
}

function changePage(direction) {
    guardarTodoInmediato();
    const targetPage = document.getElementById(`evalPage${currentPage}`);
    if (targetPage) targetPage.classList.remove('active');
    
    currentPage += direction;
    const totalPagesGrade = getMateriasForGrade(currentGrade).length;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPagesGrade) currentPage = totalPagesGrade;
    
    const newPage = document.getElementById(`evalPage${currentPage}`);
    if (newPage) newPage.classList.add('active');
    
    updatePaginationUI();
    window.scrollTo(0, 0);
}

// ============================================ //
// CAMBIO DE GRADO Y SECCIÓN                    //
// ============================================ //
function changeGrade(grade) {
    guardarTodoInmediato();
    currentGrade = parseInt(grade);
    currentPage = 1;
    migracionRealizada = false;
    sessionStorage.setItem('gradoSeleccionado', grade);
    actualizarBadgeAsignacionEval();
    loadRowCount();
    actualizarCacheEstudiantes();
    generateAllTables();
    updatePaginationUI();
    setTimeout(sincronizarCompleto, 200);
}

function changeSection(section) {
    guardarTodoInmediato();
    currentSection = section;
    currentPage = 1;
    migracionRealizada = false;
    sessionStorage.setItem('seccionSeleccionada', section);
    actualizarBadgeAsignacionEval();
    loadRowCount();
    actualizarCacheEstudiantes();
    generateAllTables();
    updatePaginationUI();
    setTimeout(sincronizarCompleto, 200);
}

function changeTanda(tanda) {
    guardarTodoInmediato();
    currentTanda = tanda;
    sessionStorage.setItem('tandaSeleccionada', tanda);
    actualizarBadgeAsignacionEval();
    actualizarCacheEstudiantes();
    generateAllTables();
    updatePaginationUI();
    setTimeout(sincronizarCompleto, 200);
}

// ============================================ //
// AGREGAR/ELIMINAR FILAS                       //
// ============================================ //
function addRow() {
    guardarTodoInmediato();
    if (getRowCountForCurrent() >= MAX_ROWS) { alert('Ya se alcanzó el máximo de 100 filas.'); return; }
    setRowCountForCurrent(getRowCountForCurrent() + 1);
    saveRowCount();
    generateAllTables();
    updateRowButtons();
    setTimeout(sincronizarCompleto, 200);
}

function deleteRow() {
    const currentRows = getRowCountForCurrent();
    if (currentRows <= 1) { alert('El registro debe tener al menos 1 fila.'); return; }
    if (confirm('¿Eliminar la última fila? Los datos se perderán.')) {
        guardarTodoInmediato();
        setRowCountForCurrent(currentRows - 1);
        saveRowCount();
        generateAllTables();
        updateRowButtons();
        setTimeout(sincronizarCompleto, 200);
    }
}

function updateRowButtons() {
    const currentRows = getRowCountForCurrent();
    const addBtn = getAddRowBtn();
    const deleteBtn = getDeleteRowBtn();
    
    if (addBtn) {
        addBtn.disabled = currentRows >= MAX_ROWS;
        addBtn.innerHTML = addBtn.disabled ? '✓ Máx. 100 filas' : '➕ Agregar Fila';
    }
    if (deleteBtn) deleteBtn.disabled = currentRows <= 1;
}

// ============================================ //
// BORRAR DATOS                                 //
// ============================================ //
function clearData() {
    const gradeText = currentGrade === 1 ? '1er' : (currentGrade === 2 ? '2do' : (currentGrade === 3 ? '3er' : (currentGrade === 4 ? '4to' : (currentGrade === 5 ? '5to' : '6to'))));
    
    if (confirm(`⚠️ ¿Borrar TODOS los datos del ${gradeText} Grado, Sección ${currentSection}?`)) {
        const clavesABorrar = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`evalNota_g${currentGrade}_s${currentSection}_`)) clavesABorrar.push(key);
            if (key && key.startsWith(`evalRec_g${currentGrade}_s${currentSection}_`)) clavesABorrar.push(key);
            if (key && key.startsWith(`evalRecEsp_g${currentGrade}_s${currentSection}_`)) clavesABorrar.push(key);
        }
        
        const estudiantes = obtenerEstudiantesDesdeFormulario();
        estudiantes.forEach(est => {
            if (est.uid) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(`nota_${est.uid}_`)) clavesABorrar.push(key);
                }
            }
        });
        
        clavesABorrar.forEach(k => localStorage.removeItem(k));
        console.log(`🗑️ ${clavesABorrar.length} claves borradas`);
        generateAllTables();
    }
}

function onGradeChange(input) { processGradeInput(input, true); }
function onRecoveryChange(cell) { processRecoveryInput(cell, true); }

// ============================================ //
// ✅ SINCRONIZACIÓN COMPLETA                   //
// ============================================ //
function sincronizarCompleto() {
    console.log('🔄 Iniciando sincronización completa...');
    actualizarCacheEstudiantes();
    migrarNotasViejas();
    sincronizarFilasConEstudiantes();
    
    const nombresPorFila = obtenerNombresEstudiantesPorFila();
    const storageKey = getStudentStorageKey();
    let studentData = {};
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) studentData = JSON.parse(saved);
    } catch (e) {}
    
    const totalFilas = getRowCountForCurrent();
    let datosActualizados = false;
    
    for (let i = 1; i <= totalFilas; i++) {
        const key = `std_g${currentGrade}s${currentSection}_r${i}_nombre`;
        if (nombresPorFila[i]) {
            if (studentData[key] !== nombresPorFila[i]) { studentData[key] = nombresPorFila[i]; datosActualizados = true; }
        } else {
            if (studentData[key] !== '') { studentData[key] = ''; datosActualizados = true; }
        }
    }
    
    if (datosActualizados) {
        localStorage.setItem(storageKey, JSON.stringify(studentData));
        studentNames = studentData;
    }
    
    generateAllTables();
    actualizarBadgeAsignacionEval();
    return true;
}

// ============================================ //
// ✅ INICIALIZACIÓN                            //
// ============================================ //
function initialize() {
    const container = getEvalContainer();
    if (!container) {
        console.error('❌ No se encontró el contenedor de evaluación');
        return;
    }
    
    console.log('🚀 Iniciando Registro de Evaluación...');
    console.log('✅ SIN BLOQUEOS de celdas');
    console.log('✅ Rec Final >= Final del Área');
    console.log('✅ Rec Especial >= Final del Área');
    console.log('✅ Escritura fluida (recalcula solo en blur)');
    
    const sincronizado = aplicarDatosSincronizados();
    if (!sincronizado) {
        const gradoDesdeMain = sessionStorage.getItem('gradoSeleccionado');
        const seccionDesdeMain = sessionStorage.getItem('seccionSeleccionada');
        const tandaDesdeMain = sessionStorage.getItem('tandaSeleccionada');
        
        if (gradoDesdeMain) currentGrade = parseInt(gradoDesdeMain);
        else if (window.gradoSeleccionado) currentGrade = parseInt(window.gradoSeleccionado);
        
        if (seccionDesdeMain) currentSection = seccionDesdeMain;
        else if (window.seccionSeleccionada) currentSection = window.seccionSeleccionada;
        
        if (tandaDesdeMain) {
            currentTanda = tandaDesdeMain;
            sessionStorage.setItem('tandaSeleccionada', tandaDesdeMain);
        } else if (window.tandaSeleccionada) {
            currentTanda = window.tandaSeleccionada;
            sessionStorage.setItem('tandaSeleccionada', window.tandaSeleccionada);
        }
    }
    
    const gradeSelect = getGradeSelect();
    const sectionSelect = getSectionSelect();
    const tandaSelect = document.getElementById('tandaSelectEval');
    
    if (gradeSelect) {
        gradeSelect.value = currentGrade;
        gradeSelect.addEventListener('change', function() { changeGrade(this.value); });
    }
    if (sectionSelect) {
        sectionSelect.value = currentSection;
        sectionSelect.addEventListener('change', function() { changeSection(this.value); });
    }
    if (tandaSelect) {
        const tanda = obtenerTandaDesdeEvaluacion();
        let encontrado = false;
        for (let i = 0; i < tandaSelect.options.length; i++) {
            if (tandaSelect.options[i].value === tanda) { tandaSelect.value = tanda; encontrado = true; break; }
        }
        if (!encontrado) tandaSelect.value = 'Matutina';
        sessionStorage.setItem('tandaSeleccionada', tandaSelect.value);
        currentTanda = tandaSelect.value;
        tandaSelect.addEventListener('change', function() { changeTanda(this.value); });
    }
    
    const schoolYearElements = document.querySelectorAll('.school-year-display strong, #schoolYearDisplayEval');
    schoolYearElements.forEach(el => { el.textContent = currentSchoolYear; });
    
    actualizarBadgeAsignacionEval();
    loadRowCount();
    actualizarCacheEstudiantes();
    
    const storageKey = getStudentStorageKey();
    let saved = localStorage.getItem(storageKey);
    if (!saved) {
        const data = {};
        const totalRows = getRowCountForCurrent();
        for (let i = 1; i <= totalRows; i++) {
            data[`std_g${currentGrade}s${currentSection}_r${i}_nombre`] = `ESTUDIANTE ${i}`;
        }
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
    const studentData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    studentNames = studentData;
    
    migrarNotasViejas();
    generateAllTables();
    updatePaginationUI();
    updateRowButtons();
    setTimeout(sincronizarCompleto, 300);
    
    if (!isIndexMode) {
        const prevBtn = getPrevBtn();
        const nextBtn = getNextBtn();
        const prevBtn2 = getPrevBtn2();
        const nextBtn2 = getNextBtn2();
        const addRowBtn = getAddRowBtn();
        const deleteRowBtn = getDeleteRowBtn();
        const printBtn = getPrintBtn();
        const clearBtn = getClearBtn();
        const closeModalBtn = getCloseModalBtn();
        const modal = getModal();
        
        if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));
        if (prevBtn2) prevBtn2.addEventListener('click', () => changePage(-1));
        if (nextBtn2) nextBtn2.addEventListener('click', () => changePage(1));
        if (addRowBtn) addRowBtn.addEventListener('click', addRow);
        if (deleteRowBtn) deleteRowBtn.addEventListener('click', deleteRow);
        if (printBtn) printBtn.addEventListener('click', () => window.print());
        if (clearBtn) clearBtn.addEventListener('click', clearData);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeStudentNotFoundModal);
        if (modal) modal.addEventListener('click', function(e) { if (e.target === this) closeStudentNotFoundModal(); });
    }
    
    window.addEventListener('beforeunload', function() {
        console.log('💾 Guardando antes de cerrar...');
        guardarTodoInmediato();
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'registrosSigerd' || e.key === 'datosSincronizados' || e.key === 'registroGradoData' || e.key === 'formulariosActualizadoTimestamp') {
            console.log('🔄 Cambios detectados, sincronizando...');
            setTimeout(sincronizarCompleto, 400);
        }
    });
    
    document.addEventListener('formulariosActualizado', function(e) {
        console.log('🔄 Evento "formulariosActualizado" recibido');
        setTimeout(sincronizarCompleto, 300);
    });
    
    setInterval(() => {
        try {
            const lastUpdate = localStorage.getItem('formulariosActualizadoTimestamp');
            const lastCheck = window._lastFormCheck || '0';
            if (lastUpdate && lastUpdate !== lastCheck) {
                window._lastFormCheck = lastUpdate;
                sincronizarCompleto();
            }
        } catch (e) {}
    }, 3000);
    
    ocultarSelectoresEnModoIndice();
    
    console.log('✅ Registro de Evaluación cargado correctamente');
    console.log('📚 Grado:', currentGrade, '| Sección:', currentSection, '| Tanda:', obtenerTandaDesdeEvaluacion());
    console.log('👥 Estudiantes en caché:', Object.keys(uidPorOrdenCache).length);
}

// ============================================ //
// EXPONER FUNCIONES GLOBALES                   //
// ============================================ //
window.validateInput = validateInput;
window.validateRecovery = validateRecovery;
window.handleNav = handleNav;
window.calculateRow = calculateRow;
window.onGradeChange = onGradeChange;
window.onRecoveryChange = onRecoveryChange;
window.processGradeInput = processGradeInput;
window.processRecoveryInput = processRecoveryInput;
window.attachInputListeners = attachInputListeners;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;
window.checkStudentExists = checkStudentExists;
window.actualizarBadgeAsignacionEval = actualizarBadgeAsignacionEval;
window.obtenerTandaDesdeEvaluacion = obtenerTandaDesdeEvaluacion;
window.revalidarFilaCompleta = revalidarFilaCompleta;
window.obtenerEstudiantesDesdeFormulario = obtenerEstudiantesDesdeFormulario;
window.contarEstudiantesActivos = contarEstudiantesActivos;
window.obtenerNombresEstudiantesPorFila = obtenerNombresEstudiantesPorFila;
window.filaTieneEstudiante = filaTieneEstudiante;
window.sincronizarFilasConEstudiantes = sincronizarFilasConEstudiantes;
window.aplicarLocksPorEstudiantes = aplicarLocksPorEstudiantes;
window.sincronizarCompleto = sincronizarCompleto;
window.migrarNotasViejas = migrarNotasViejas;
window.eliminarNotasHuerfanas = eliminarNotasHuerfanas;
window.getUidDeFila = getUidDeFila;
window.getClaveNota = getClaveNota;
window.mostrarModalCalificaciones = mostrarModalCalificaciones;
window.imprimirCalificaciones = imprimirCalificaciones;
window.generarHTMLImpresion = generarHTMLImpresion;
window.leerCalificacionesMateria = leerCalificacionesMateria;
window.leerTodasLasMaterias = leerTodasLasMaterias;
window.leerFotoEstudiante = leerFotoEstudiante;
window.guardarTodoInmediato = guardarTodoInmediato;
window.cargarTodoInmediato = cargarTodoInmediato;
window.actualizarCacheEstudiantes = actualizarCacheEstudiantes;
window.guardarNota = guardarNota;
window.leerNota = leerNota;
window.guardarRecEspecial = guardarRecEspecial;
window.leerRecEspecial = leerRecEspecial;
window.resetearRecuperacion = resetearRecuperacion;
window.refrescarHojaSinPerderFoco = refrescarHojaSinPerderFoco;
window.saveData = saveData;
window.loadData = loadData;

// ============================================ //
// INICIAR AL CARGAR LA PÁGINA                  //
// ============================================ //
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initialize, 300);
});