/**
============================================
ACTA DE RENDIMIENTO - VERSIÓN POR UID + TANDA
✅ 45 filas fijas
✅ Sin placeholders en nombres
✅ Tamaño carta al imprimir
✅ Solo 2 hojas
✅ Encabezados materias: HORIZONTAL
✅ Sub-encabezados: VERTICAL
✅ SINCRONIZACIÓN CON PÁGINA PRINCIPAL
✅ LEE CALIFICACIONES POR UID CALCULANDO EL FINAL
✅ LEE ASISTENCIA POR UID (boletin_asistencia_data_*)
✅ LEE NOMBRES DE registrosSigerd
✅ INGLÉS AGREGADO PARA 4TO-6TO (8 materias)
✅ OBSERVACIONES POR UID
✅ TANDA EN EL ENCABEZADO (solo lectura)
✅ SINCRONIZACIÓN AUTOMÁTICA CADA 3 SEGUNDOS
============================================
*/

// ============================================
// CONFIGURACIÓN
// ============================================
let currentGrade = 3;
let currentSection = 'A';
let currentTanda = 'Matutina';
let currentPageNum = 1;
const totalPages = 2;
const TOTAL_ROWS = 45;
let currentSchoolYear = '2025-2026';
let modalCallback = null;
let _intervaloSync = null;
let _ultimoHashRegistros = '';

// ✅ ACTA_MAP CORREGIDO - INGLÉS PARA 4TO-6TO
const ACTA_MAP = {
    1: { 1: 'le', 2: 'ma', 3: 'cs', 4: 'cn', 5: 'ef', 6: 'fi', 7: 'ea' },
    2: { 1: 'le', 2: 'ma', 3: 'cs', 4: 'cn', 5: 'ef', 6: 'fi', 7: 'ea' },
    3: { 1: 'le', 2: 'ma', 3: 'cs', 4: 'cn', 5: 'ef', 6: 'fi', 7: 'ea' },
    4: { 1: 'le', 2: 'ma', 3: 'cs', 4: 'cn', 5: 'in', 6: 'ef', 7: 'fi', 8: 'ea' },
    5: { 1: 'le', 2: 'ma', 3: 'cs', 4: 'cn', 5: 'in', 6: 'ef', 7: 'fi', 8: 'ea' },
    6: { 1: 'le', 2: 'ma', 3: 'cs', 4: 'cn', 5: 'in', 6: 'ef', 7: 'fi', 8: 'ea' }
};

const NOMBRE_MATERIA = {
    'le': 'Lengua Española',
    'ma': 'Matemática',
    'cs': 'Ciencias Sociales',
    'cn': 'Ciencias de la Naturaleza',
    'in': 'Inglés (Lenguas Extranjeras)',
    'ef': 'Educación Física',
    'fi': 'Formación Integral Humana y Religiosa',
    'ea': 'Educación Artística'
};

// ✅ MATERIAS POR PÁGINA
function getMateriasPagina1() {
    if (currentGrade >= 4) {
        return [1, 2, 3, 4, 5];
    }
    return [1, 2, 3, 4];
}

function getMateriasPagina2() {
    if (currentGrade >= 4) {
        return [6, 7, 8];
    }
    return [5, 6, 7];
}

// ============================================
// ✅ APLICAR DATOS SINCRONIZADOS
// ============================================
function aplicarDatosSincronizados() {
    try {
        const datosSync = localStorage.getItem('datosSincronizados');
        if (datosSync) {
            const datos = JSON.parse(datosSync);
            if (datos.grado) {
                const gradoMap = {
                    'Primer Grado': 1, 'Segundo Grado': 2, 'Tercer Grado': 3,
                    'Cuarto Grado': 4, 'Quinto Grado': 5, 'Sexto Grado': 6
                };
                currentGrade = gradoMap[datos.grado] || 3;
            }
            if (datos.seccion) currentSection = datos.seccion;
            if (datos.tanda) currentTanda = datos.tanda;
            if (datos.anioEscolar) currentSchoolYear = datos.anioEscolar;
        }
        
        // Fallback: registrosSigerd
        if (!datosSync) {
            const registros = localStorage.getItem('registrosSigerd');
            if (registros) {
                const datos = JSON.parse(registros);
                if (Array.isArray(datos) && datos.length > 0) {
                    const primerReg = datos[0];
                    if (primerReg.grado) {
                        const gradoMap = {
                            'PRIMER GRADO': 1, 'SEGUNDO GRADO': 2, 'TERCER GRADO': 3,
                            'CUARTO GRADO': 4, 'QUINTO GRADO': 5, 'SEXTO GRADO': 6,
                            'Primer Grado': 1, 'Segundo Grado': 2, 'Tercer Grado': 3,
                            'Cuarto Grado': 4, 'Quinto Grado': 5, 'Sexto Grado': 6
                        };
                        currentGrade = gradoMap[primerReg.grado.toUpperCase()] ||
                                       gradoMap[primerReg.grado] || 3;
                    }
                    if (primerReg.seccion) currentSection = primerReg.seccion;
                    if (primerReg.tanda) currentTanda = primerReg.tanda;
                }
            }
        }
        
        localStorage.setItem('acta_grade', String(currentGrade));
        localStorage.setItem('acta_section', currentSection);
        localStorage.setItem('acta_tanda', currentTanda);
        
        updateGradeDisplay();
        
        const schoolYearDisplay = document.getElementById('schoolYearDisplay');
        if (schoolYearDisplay) schoolYearDisplay.textContent = currentSchoolYear;
        
        console.log('✅ Datos sincronizados:', {
            grado: currentGrade, seccion: currentSection,
            tanda: currentTanda, año: currentSchoolYear,
            materias: currentGrade >= 4 ? 8 : 7
        });
        return true;
    } catch (e) {
        console.error('❌ Error aplicando datos sincronizados:', e);
        return false;
    }
}

// ============================================
// ✅ OBTENER ESTUDIANTES DEL GRUPO ACTUAL
// ============================================
function obtenerEstudiantesDelGrupo() {
    try {
        const stored = localStorage.getItem('registrosSigerd');
        if (!stored) return [];
        
        const registros = JSON.parse(stored);
        if (!Array.isArray(registros)) return [];
        
        const gradoMap = {
            1: 'PRIMER GRADO', 2: 'SEGUNDO GRADO', 3: 'TERCER GRADO',
            4: 'CUARTO GRADO', 5: 'QUINTO GRADO', 6: 'SEXTO GRADO'
        };
        const gradoActual = gradoMap[currentGrade] || '';
        const seccionActual = currentSection.toUpperCase().trim();
        
        const filtrados = registros.filter(r => {
            const rGrado = (r.grado || '').toUpperCase().trim();
            const rSeccion = (r.seccion || '').toUpperCase().trim();
            
            const gradoMatch = rGrado === gradoActual ||
                               rGrado === gradoActual.replace(' GRADO', '') ||
                               rGrado.includes(gradoActual.split(' ')[0]);
            const seccionMatch = rSeccion === seccionActual;
            
            return gradoMatch && seccionMatch;
        });
        
        filtrados.sort((a, b) => (parseInt(a.orden) || 0) - (parseInt(b.orden) || 0));
        
        return filtrados;
    } catch (e) {
        console.warn('⚠️ Error obteniendo estudiantes:', e);
        return [];
    }
}

// ============================================
// ✅ OBTENER UID DE LA FILA
// ============================================
function getUidDeFila(row) {
    const estudiantes = obtenerEstudiantesDelGrupo();
    const est = estudiantes.find(e => parseInt(e.orden) === row);
    return est ? est.uid : null;
}

// ============================================
// ✅ OBTENER NOMBRE DEL ESTUDIANTE
// ============================================
function getStudentName(row) {
    const estudiantes = obtenerEstudiantesDelGrupo();
    const est = estudiantes.find(e => parseInt(e.orden) === row);
    if (!est) return '';
    
    const nombre = (est.nombre || '').trim();
    const apellido = (est.apellido || '').trim();
    
    if (!nombre && !apellido) return '';
    
    if (nombre.toUpperCase().includes('ESTUDIANTE') ||
        nombre.toUpperCase().includes('SIN NOMBRE')) {
        return '';
    }
    
    return `${nombre} ${apellido}`.trim();
}

// ============================================
// ✅ CALCULAR CALIFICACIÓN FINAL POR UID
// ============================================
function getFinalGradePorUid(uid, pageIndex) {
    if (!uid) return '';
    
    const hasRP = currentGrade >= 3;
    const periodsCount = 4;
    
    let vals1 = [], vals2 = [], vals3 = [];
    
    for (let c = 1; c <= 3; c++) {
        let competenciaVals = [];
        
        for (let p = 1; p <= periodsCount; p++) {
            const pKey = `nota_${uid}_m${pageIndex}c${c}p${p}`;
            const pValStr = localStorage.getItem(pKey);
            const pVal = pValStr !== null && pValStr !== '' ? parseFloat(pValStr) : null;
            
            let rpVal = null;
            if (hasRP) {
                const rpKey = `nota_${uid}_m${pageIndex}c${c}rp${p}`;
                const rpValStr = localStorage.getItem(rpKey);
                rpVal = rpValStr !== null && rpValStr !== '' ? parseFloat(rpValStr) : null;
            }
            
            let valorUsar = null;
            
            if (hasRP) {
                if (pVal !== null && pVal >= 65) {
                    valorUsar = pVal;
                } else if (pVal !== null && pVal < 65 && rpVal !== null) {
                    valorUsar = rpVal;
                } else if (pVal !== null && pVal < 65 && rpVal === null) {
                    valorUsar = pVal;
                } else if (pVal === null && rpVal !== null) {
                    valorUsar = rpVal;
                }
            } else {
                if (pVal !== null) valorUsar = pVal;
            }
            
            if (valorUsar !== null && !isNaN(valorUsar) && valorUsar >= 0) {
                if (valorUsar > 100) valorUsar = 100;
                competenciaVals.push(valorUsar);
            }
        }
        
        if (competenciaVals.length > 0) {
            const suma = competenciaVals.reduce((a, b) => a + b, 0);
            let promedio = Math.round(suma / competenciaVals.length);
            if (promedio > 100) promedio = 100;
            
            if (c === 1) vals1 = [promedio];
            else if (c === 2) vals2 = [promedio];
            else if (c === 3) vals3 = [promedio];
        }
    }
    
    if (vals1.length > 0 && vals2.length > 0 && vals3.length > 0) {
        let finalGrade = Math.round((vals1[0] + vals2[0] + vals3[0]) / 3);
        if (finalGrade > 100) finalGrade = 100;
        return finalGrade;
    }
    
    return '';
}

// ============================================
// ✅ CALCULAR RECUPERACIÓN FINAL POR UID
// ============================================
function getRecGradePorUid(uid, pageIndex) {
    if (!uid) return '';
    
    const recFinalKey = `nota_${uid}_m${pageIndex}rec_final`;
    const recFinalVal = localStorage.getItem(recFinalKey);
    if (recFinalVal !== null && recFinalVal !== '') {
        return recFinalVal;
    }
    
    const hasRP = currentGrade >= 3;
    if (!hasRP) return '';
    
    let recuperaciones = [];
    for (let c = 1; c <= 3; c++) {
        let competenciaVals = [];
        
        for (let p = 1; p <= 4; p++) {
            const rpKey = `nota_${uid}_m${pageIndex}c${c}rp${p}`;
            const rpValStr = localStorage.getItem(rpKey);
            if (rpValStr !== null && rpValStr !== '') {
                const rpVal = parseFloat(rpValStr);
                if (!isNaN(rpVal)) competenciaVals.push(rpVal);
            }
        }
        
        if (competenciaVals.length > 0) {
            const suma = competenciaVals.reduce((a, b) => a + b, 0);
            const prom = Math.round(suma / competenciaVals.length);
            recuperaciones.push(prom);
        }
    }
    
    if (recuperaciones.length > 0) {
        const suma = recuperaciones.reduce((a, b) => a + b, 0);
        return Math.round(suma / recuperaciones.length);
    }
    
    return '';
}

// ============================================
// ✅ OBTENER ASISTENCIA POR UID
// ============================================
function getAsistenciaPorUid(uid, tipo) {
    if (!uid) return '';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const beforeAugustFirst = (month < 7) || (month === 7 && day < 1);
    const schoolYear = beforeAugustFirst ? `${year - 1}-${year}` : `${year}-${year + 1}`;
    
    const clave = `boletin_asistencia_data_${currentGrade}_${currentSection}_${currentTanda}_${schoolYear}`;
    const saved = localStorage.getItem(clave);
    if (!saved) return '';
    
    try {
        const datos = JSON.parse(saved);
        const est = datos.estudiantes.find(e => e.uid === uid);
        if (!est) return '';
        
        if (tipo === 'pctAsistencia') return est.pctAsistencia > 0 ? est.pctAsistencia + '%' : '';
        if (tipo === 'pctAusencia') return est.pctAusencia > 0 ? est.pctAusencia + '%' : '';
    } catch (e) {
        return '';
    }
    return '';
}

// ============================================
// ✅ OBTENER OBSERVACIONES POR UID
// ============================================
function getObservacionesPorUid(uid) {
    if (!uid) return '';
    const key = `obs_general_${uid}`;
    const val = localStorage.getItem(key);
    return val !== null && val !== '' ? val : '';
}

// ============================================
// GENERAR ENCABEZADO PÁGINA 1
// ============================================
function generateHeaderPage1() {
    let headerMaterias1 = '';
    const materias = getMateriasPagina1();
    
    for (let m of materias) {
        const prefijo = ACTA_MAP[currentGrade][m];
        const nombreMateria = NOMBRE_MATERIA[prefijo] || prefijo;
        headerMaterias1 += `<th colspan="2" class="materia-header">${nombreMateria}</th>`;
    }
    
    let headerRow1 = `<tr>
        <th rowspan="2" class="num-col-header">Nº de<br>orden</th>
        <th rowspan="2" class="name-col-header">Nombre(s) y apellido(s)</th>
        ${headerMaterias1}
    </tr>
    <tr>`;
    
    for (let m of materias) {
        headerRow1 += `<th class="sub-header-vertical">Final del<br>área</th>`;
        headerRow1 += `<th class="sub-header-vertical">Recuperación<br>final</th>`;
    }
    
    headerRow1 += `</tr>`;
    return headerRow1;
}

// ============================================
// GENERAR ENCABEZADO PÁGINA 2
// ============================================
function generateHeaderPage2() {
    let headerMaterias2 = '';
    const materias = getMateriasPagina2();
    
    for (let m of materias) {
        const prefijo = ACTA_MAP[currentGrade][m];
        const nombreMateria = NOMBRE_MATERIA[prefijo] || prefijo;
        headerMaterias2 += `<th colspan="2" class="materia-header">${nombreMateria}</th>`;
    }
    
    let headerRow2 = `<tr>
         <th rowspan="2" class="num-col-header">Nº de<br>orden</th>
         ${headerMaterias2}
         <th colspan="3" class="materia-header">Presencia y<br>Ausencia</th>
         <th rowspan="2" class="obs-col-header">Observaciones</th>
     </tr>
     <tr>`;
     
    for (let m of materias) {
        headerRow2 += `<th class="sub-header-vertical">Final del<br>área</th>`;
        headerRow2 += `<th class="sub-header-vertical">Recuperación<br>final</th>`;
    }
    
    headerRow2 += `<th class="sub-header-vertical">% de<br>Asistencia</th>`;
    headerRow2 += `<th class="sub-header-vertical">% de<br>Ausencia</th>`;
    headerRow2 += `<th class="sub-header-vertical">% de<br>Excusa</th>`;
    headerRow2 += `</tr>`;
    
    return headerRow2;
}

// ============================================
// GENERAR FILAS PÁGINA 1 (POR UID)
// ============================================
function generateRowsPage1() {
    let rowsPage1 = '';
    const materias = getMateriasPagina1();
    
    for (let i = 1; i <= TOTAL_ROWS; i++) {
        const nombre = getStudentName(i);
        const uid = getUidDeFila(i);
        let row = `<td class="num-col">${i}</td>`;
        
        row += `<td class="name-col"><input type="text" class="acta-input auto-field uppercase-input name-input" id="acta_nombre_${i}" readonly value="${nombre}"></td>`;
        
        for (let m of materias) {
            const prefijo = ACTA_MAP[currentGrade][m];
            
            const finalVal = uid ? getFinalGradePorUid(uid, m) : '';
            const recVal = uid ? getRecGradePorUid(uid, m) : '';
            
            row += `<td><input type="text" class="acta-input auto-field" id="acta_${prefijo}_final_${i}" readonly value="${finalVal}"></td>`;
            row += `<td><input type="text" class="acta-input auto-field" id="acta_${prefijo}_rec_${i}" readonly value="${recVal}"></td>`;
        }
        
        rowsPage1 += `<tr>${row}</tr>`;
    }
    
    return rowsPage1;
}

// ============================================
// GENERAR FILAS PÁGINA 2 (POR UID)
// ============================================
function generateRowsPage2() {
    let rowsPage2 = '';
    const materias = getMateriasPagina2();
    
    for (let i = 1; i <= TOTAL_ROWS; i++) {
        const uid = getUidDeFila(i);
        let row = `<td class="num-col">${i}</td>`;
        
        for (let m of materias) {
            const prefijo = ACTA_MAP[currentGrade][m];
            
            const finalVal = uid ? getFinalGradePorUid(uid, m) : '';
            const recVal = uid ? getRecGradePorUid(uid, m) : '';
            
            row += `<td><input type="text" class="acta-input auto-field" id="acta_${prefijo}_final_${i}" readonly value="${finalVal}"></td>`;
            row += `<td><input type="text" class="acta-input auto-field" id="acta_${prefijo}_rec_${i}" readonly value="${recVal}"></td>`;
        }
        
        const porAsis = uid ? getAsistenciaPorUid(uid, 'pctAsistencia') : '';
        const porAus = uid ? getAsistenciaPorUid(uid, 'pctAusencia') : '';
        
        row += `<td><input type="text" class="acta-input auto-field" id="acta_p_asis_${i}" readonly value="${porAsis}"></td>`;
        row += `<td><input type="text" class="acta-input auto-field" id="acta_p_aus_${i}" readonly value="${porAus}"></td>`;
        row += `<td><input type="text" class="acta-input auto-field" id="acta_p_exc_${i}" readonly value=""></td>`;
        
        const obsManual = uid ? (localStorage.getItem(`acta_obs_${uid}`) || '') : '';
        const obsAuto = uid ? getObservacionesPorUid(uid) : '';
        const obsFinal = obsManual || obsAuto;
        
        row += `<td class="obs-col"><input type="text" class="acta-input uppercase-input name-input" id="acta_obs_${i}" data-uid="${uid || ''}" oninput="this.value=this.value.toUpperCase(); saveActaData()" value="${obsFinal}"></td>`;
        
        rowsPage2 += `<tr>${row}</tr>`;
    }
    
    return rowsPage2;
}

// ============================================
// GENERAR ACTA DE RENDIMIENTO COMPLETA
// ============================================
function generateActaRendimiento() {
    const container = document.getElementById('actaContainer');
    if (!container) {
        console.error('❌ Contenedor no encontrado');
        return;
    }
    
    const headerRow1 = generateHeaderPage1();
    const headerRow2 = generateHeaderPage2();
    const rowsPage1 = generateRowsPage1();
    const rowsPage2 = generateRowsPage2();
    
    const gradeNames = {
        1: 'Primer Grado', 2: 'Segundo Grado', 3: 'Tercer Grado',
        4: 'Cuarto Grado', 5: 'Quinto Grado', 6: 'Sexto Grado'
    };
    
    const htmlPage1 = `
        <div class="student-page active" id="acta-page-1">
            <h2 class="acta-title">ACTA DE RENDIMIENTO DEL/DE LA ESTUDIANTE DE FIN DEL AÑO ESCOLAR</h2>
            
            <div class="acta-info-row">
                <div class="acta-info-item" style="flex: 3;">
                    <label>Centro educativo:</label>
                    <input type="text" class="acta-info-input" id="acta_centro" style="width: 60%;" oninput="saveActaData()">
                </div>
            </div>
            
            <div class="acta-info-row">
                <div class="acta-info-item" style="flex: 1;">
                    <label>Regional:</label>
                    <input type="text" class="acta-info-input" id="acta_regional" style="width: 50px;" oninput="saveActaData()">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Distrito Educativo:</label>
                    <input type="text" class="acta-info-input" id="acta_distrito" style="width: 50px;" oninput="saveActaData()">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Grado:</label>
                    <input type="text" class="acta-info-input" id="acta_grado" style="width: 80px;" readonly value="${gradeNames[currentGrade]}">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Sección:</label>
                    <input type="text" class="acta-info-input" id="acta_seccion" style="width: 40px;" readonly value="${currentSection}">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Tanda:</label>
                    <input type="text" class="acta-info-input" id="acta_tanda" style="width: 80px;" readonly value="${currentTanda}">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Año escolar:</label>
                    <span id="acta_year_display" style="font-weight:bold; color:#1a3a6b; margin-left: 5px;">${currentSchoolYear}</span>
                </div>
            </div>
            
            <div class="table-wrapper">
                <table class="acta-table">
                    <thead>${headerRow1}</thead>
                    <tbody>${rowsPage1}</tbody>
                </table>
            </div>
            
            <div class="acta-footer">
                <div class="acta-footer-row">
                    <label>Dado en:</label>
                    <input type="text" class="acta-footer-input" id="acta_lugar" style="width: 150px;" oninput="saveActaData()">
                    <label>, a los</label>
                    <input type="text" class="acta-footer-input" id="acta_dias" style="width: 40px;" oninput="saveActaData()" inputmode="numeric">
                    <label>días del mes de</label>
                    <input type="text" class="acta-footer-input" id="acta_mes" style="width: 100px;" oninput="saveActaData()">
                    <label>del año</label>
                    <input type="text" class="acta-footer-input" id="acta_anio_final" style="width: 60px;" oninput="saveActaData()" inputmode="numeric">
                </div>
                <div class="acta-footer-row">
                    <label>Director o Directora del centro educativo:</label>
                    <input type="text" class="acta-footer-input" id="acta_director" style="width: 300px;" oninput="saveActaData(); this.value=this.value.toUpperCase();">
                </div>
            </div>
        </div>
    `;
    
    const htmlPage2 = `
        <div class="student-page" id="acta-page-2">
            <h2 class="acta-title">ACTA DE RENDIMIENTO DEL/DE LA ESTUDIANTE DE FIN DEL AÑO ESCOLAR</h2>
            
            <div class="acta-info-row">
                <div class="acta-info-item" style="flex: 3;">
                    <label>Centro educativo:</label>
                    <input type="text" class="acta-info-input" id="acta_centro_2" style="width: 60%;" oninput="saveActaData()">
                </div>
            </div>
            
            <div class="acta-info-row">
                <div class="acta-info-item" style="flex: 1;">
                    <label>Regional:</label>
                    <input type="text" class="acta-info-input" id="acta_regional_2" style="width: 50px;" oninput="saveActaData()">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Distrito Educativo:</label>
                    <input type="text" class="acta-info-input" id="acta_distrito_2" style="width: 50px;" oninput="saveActaData()">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Grado:</label>
                    <input type="text" class="acta-info-input" id="acta_grado_2" style="width: 80px;" readonly value="${gradeNames[currentGrade]}">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Sección:</label>
                    <input type="text" class="acta-info-input" id="acta_seccion_2" style="width: 40px;" readonly value="${currentSection}">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Tanda:</label>
                    <input type="text" class="acta-info-input" id="acta_tanda_2" style="width: 80px;" readonly value="${currentTanda}">
                </div>
                <div class="acta-info-item" style="flex: 1;">
                    <label>Año escolar:</label>
                    <span id="acta_year_display_2" style="font-weight:bold; color:#1a3a6b; margin-left: 5px;">${currentSchoolYear}</span>
                </div>
            </div>
            
            <div class="table-wrapper">
                <table class="acta-table">
                    <thead>${headerRow2}</thead>
                    <tbody>${rowsPage2}</tbody>
                </table>
            </div>
            
            <div class="acta-footer">
                <div class="acta-footer-row">
                    <label>Dado en:</label>
                    <input type="text" class="acta-footer-input" id="acta_lugar_2" style="width: 150px;" oninput="saveActaData()">
                    <label>, a los</label>
                    <input type="text" class="acta-footer-input" id="acta_dias_2" style="width: 40px;" oninput="saveActaData()" inputmode="numeric">
                    <label>días del mes de</label>
                    <input type="text" class="acta-footer-input" id="acta_mes_2" style="width: 100px;" oninput="saveActaData()">
                    <label>del año</label>
                    <input type="text" class="acta-footer-input" id="acta_anio_final_2" style="width: 60px;" oninput="saveActaData()" inputmode="numeric">
                </div>
                <div class="acta-footer-row">
                    <label>Director o Directora del centro educativo:</label>
                    <input type="text" class="acta-footer-input" id="acta_director_2" style="width: 300px;" oninput="saveActaData(); this.value=this.value.toUpperCase();">
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = htmlPage1 + htmlPage2;
    
    loadActaData();
    updatePaginationUI();
    updatePageNumbers();
    
    console.log(`✅ Acta generada - ${currentGrade >= 4 ? 8 : 7} materias`);
}

// ============================================
// CARGAR DATOS GUARDADOS DEL ACTA
// ============================================
function loadActaData() {
    const saved = localStorage.getItem(getActaStorageKey());
    
    document.querySelectorAll('#actaContainer .acta-info-input:not([readonly]), #actaContainer .acta-footer-input').forEach(input => {
        input.value = '';
    });
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            for (const [id, value] of Object.entries(data)) {
                const el = document.getElementById(id);
                if (el) el.value = value;
            }
        } catch (e) {
            console.warn('Error al cargar datos del acta:', e);
        }
    }
    
    for (let i = 1; i <= TOTAL_ROWS; i++) {
        const uid = getUidDeFila(i);
        if (uid) {
            const obsKey = `acta_obs_${uid}`;
            const obsVal = localStorage.getItem(obsKey);
            const obsInput = document.getElementById(`acta_obs_${i}`);
            if (obsInput && obsVal !== null) {
                obsInput.value = obsVal;
            }
        }
    }
}

// ============================================
// GUARDAR DATOS DEL ACTA
// ============================================
function saveActaData() {
    const data = {};
    
    document.querySelectorAll('#actaContainer .acta-info-input:not([readonly]), #actaContainer .acta-footer-input').forEach(input => {
        if (input.id && input.value !== undefined) {
            data[input.id] = input.value;
        }
    });
    
    if (Object.keys(data).length > 0) {
        localStorage.setItem(getActaStorageKey(), JSON.stringify(data));
    }
    
    document.querySelectorAll('#actaContainer .obs-col input').forEach(input => {
        const uid = input.dataset.uid;
        if (uid) {
            const val = input.value || '';
            if (val) {
                localStorage.setItem(`acta_obs_${uid}`, val);
            } else {
                localStorage.removeItem(`acta_obs_${uid}`);
            }
        }
    });
}

// ============================================
// CLAVES DE ALMACENAMIENTO
// ============================================
function getGradeText(grade) {
    const texts = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to' };
    return texts[grade] || '3er';
}

function getActaStorageKey() {
    return `acta_data_${getGradeText(currentGrade)}_sec${currentSection}_v2`;
}

// ============================================
// NAVEGACIÓN DE PÁGINAS
// ============================================
function showPage(pageNum) {
    document.querySelectorAll('#actaContainer .student-page').forEach(p => {
        p.classList.remove('active');
    });
    
    const target = document.getElementById(`acta-page-${pageNum}`);
    if (target) target.classList.add('active');
    
    updatePaginationUI();
    updatePageNumbers();
}

function changePage(direction) {
    const newPage = currentPageNum + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPageNum = newPage;
        showPage(currentPageNum);
    }
}

function updatePaginationUI() {
    document.querySelectorAll('.page-current-display').forEach(span => {
        span.textContent = currentPageNum;
    });
    
    document.querySelectorAll('.page-total-display').forEach(span => {
        span.textContent = totalPages;
    });
    
    const prevBtnTop = document.getElementById('prevBtnTop');
    const nextBtnTop = document.getElementById('nextBtnTop');
    const prevBtnBottom = document.getElementById('prevBtnBottom');
    const nextBtnBottom = document.getElementById('nextBtnBottom');
    
    if (prevBtnTop) prevBtnTop.disabled = (currentPageNum === 1);
    if (nextBtnTop) nextBtnTop.disabled = (currentPageNum === totalPages);
    if (prevBtnBottom) prevBtnBottom.disabled = (currentPageNum === 1);
    if (nextBtnBottom) nextBtnBottom.disabled = (currentPageNum === totalPages);
}

function updatePageNumbers() {
    document.querySelectorAll('.page-number-display').forEach(el => {
        el.textContent = `Página ${currentPageNum} de ${totalPages}`;
    });
}

// ============================================
// SINCRONIZAR DATOS
// ============================================
function syncActaData() {
    aplicarDatosSincronizados();
    generateActaRendimiento();
    showModal('🔄 Sincronizado',
        'Los datos del Acta de Rendimiento han sido sincronizados correctamente.<br><br>' +
        '✅ Calificaciones leídas por <strong>UID</strong><br>' +
        '✅ Asistencia leída del <strong>Resumen Anual</strong><br>' +
        '✅ Nombres leídos del <strong>Registro de Estudiantes</strong><br>' +
        '✅ Tanda: <strong>' + currentTanda + '</strong>',
        'success');
}

function syncActa(grade, section) {
    if (grade !== undefined && grade >= 1 && grade <= 6) currentGrade = grade;
    if (section !== undefined) currentSection = section;
    
    localStorage.setItem('acta_grade', String(currentGrade));
    localStorage.setItem('acta_section', currentSection);
    localStorage.setItem('acta_tanda', currentTanda);
    
    updateGradeDisplay();
    generateActaRendimiento();
}

function updateGradeDisplay() {
    const gradeNames = {
        1: '1er Grado', 2: '2do Grado', 3: '3er Grado',
        4: '4to Grado', 5: '5to Grado', 6: '6to Grado'
    };
    
    const displayGrade = document.getElementById('gradeDisplay');
    const displaySection = document.getElementById('sectionDisplay');
    const displayTanda = document.getElementById('tandaDisplay');
    
    if (displayGrade) displayGrade.textContent = gradeNames[currentGrade] || '3er Grado';
    if (displaySection) displaySection.textContent = 'Sección ' + currentSection;
    if (displayTanda) displayTanda.textContent = currentTanda;
}

// ============================================
// IMPRIMIR
// ============================================
function printPage() {
    window.print();
}

// ============================================
// BORRAR DATOS
// ============================================
function clearAllData() {
    showModal(
        '⚠️ Confirmar Borrado',
        '¿Está seguro de que desea borrar TODOS los datos del Acta de Rendimiento?<br><br>Esta acción no se puede deshacer.',
        'danger'
    );
}

function confirmClearAllData() {
    localStorage.removeItem(getActaStorageKey());
    
    for (let i = 1; i <= TOTAL_ROWS; i++) {
        const uid = getUidDeFila(i);
        if (uid) {
            localStorage.removeItem(`acta_obs_${uid}`);
        }
    }
    
    generateActaRendimiento();
    closeModal();
    showModal('✅ Datos Borrados', 'Todos los datos del Acta de Rendimiento han sido eliminados.', 'success');
}

// ============================================
// MODAL
// ============================================
function showModal(title, message, type) {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').innerHTML = message;
    
    const icon = document.getElementById('modalIcon');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    
    if (type === 'danger') {
        icon.textContent = '⚠️';
        confirmBtn.style.display = 'inline-block';
        confirmBtn.textContent = 'Sí, borrar';
        confirmBtn.className = 'btn-danger-modal';
        modalCallback = confirmClearAllData;
    } else if (type === 'success') {
        icon.textContent = '✅';
        confirmBtn.style.display = 'none';
        modalCallback = null;
    } else {
        icon.textContent = 'ℹ️';
        confirmBtn.style.display = 'inline-block';
        confirmBtn.textContent = 'Aceptar';
        confirmBtn.className = '';
        confirmBtn.style.background = '#1a73e8';
        modalCallback = closeModal;
    }
    
    overlay.classList.add('active');
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    modalCallback = null;
}

// ============================================
// OBTENER AÑO ESCOLAR ACTUAL
// ============================================
function getCurrentSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const cutoffMonth = 7;
    const cutoffDay = 1;
    const beforeAugustFirst = (month < cutoffMonth) || (month === cutoffMonth && day < cutoffDay);
    return beforeAugustFirst ? `${year - 1}-${year}` : `${year}-${year + 1}`;
}

// ============================================
// ✅ INICIALIZACIÓN
// ============================================
function init() {
    console.log('📋 Inicializando Acta de Rendimiento (POR UID + TANDA)...');
    
    const sincronizado = aplicarDatosSincronizados();
    
    if (!sincronizado) {
        const savedGrade = localStorage.getItem('acta_grade');
        const savedSection = localStorage.getItem('acta_section');
        const savedTanda = localStorage.getItem('acta_tanda');
        
        if (savedGrade) {
            const grade = parseInt(savedGrade);
            if (grade >= 1 && grade <= 6) currentGrade = grade;
        }
        if (savedSection) currentSection = savedSection;
        if (savedTanda) currentTanda = savedTanda;
        
        currentSchoolYear = getCurrentSchoolYear();
    }
    
    updateGradeDisplay();
    
    const yearDisplay = document.getElementById('schoolYearDisplay');
    if (yearDisplay) yearDisplay.textContent = currentSchoolYear;
    
    generateActaRendimiento();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' && currentPageNum > 1) changePage(-1);
        else if (e.key === 'ArrowRight' && currentPageNum < totalPages) changePage(1);
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'datosSincronizados' || e.key === 'registrosSigerd' ||
            e.key === 'ordenAZActivo' || (e.key && e.key.startsWith('nota_')) ||
            (e.key && e.key.startsWith('boletin_asistencia_data_'))) {
            setTimeout(() => {
                aplicarDatosSincronizados();
                generateActaRendimiento();
            }, 300);
        }
    });
    
    document.addEventListener('formulariosActualizado', function(e) {
        setTimeout(() => {
            aplicarDatosSincronizados();
            generateActaRendimiento();
        }, 400);
    });
    
    if (_intervaloSync) clearInterval(_intervaloSync);
    _intervaloSync = setInterval(function() {
        const registros = localStorage.getItem('registrosSigerd');
        if (registros) {
            try {
                const hash = registros.length + '|' + registros.map(r => r.uid || '').join(',');
                if (hash !== _ultimoHashRegistros) {
                    _ultimoHashRegistros = hash;
                    aplicarDatosSincronizados();
                    generateActaRendimiento();
                }
            } catch (e) {}
        }
    }, 3000);
    
    console.log('✅ Acta de Rendimiento inicializada');
    console.log('📅 Año:', currentSchoolYear, '| Grado:', currentGrade, '| Sección:', currentSection, '| Tanda:', currentTanda);
    console.log('📄 Materias:', currentGrade >= 4 ? '8 (con Inglés)' : '7 (sin Inglés)');
}

// ============================================
// EVENTOS DEL MODAL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const overlay = document.getElementById('modalOverlay');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (modalCallback) modalCallback();
        });
    }
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
});

// ============================================
// INICIALIZAR AL CARGAR
// ============================================
document.addEventListener('DOMContentLoaded', init);

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================
window.syncActaData = syncActaData;
window.printPage = printPage;
window.clearAllData = clearAllData;
window.changePage = changePage;
window.showPage = showPage;
window.generateActaRendimiento = generateActaRendimiento;
window.saveActaData = saveActaData;
window.syncActa = syncActa;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;
window.getUidDeFila = getUidDeFila;
window.getFinalGradePorUid = getFinalGradePorUid;
window.getRecGradePorUid = getRecGradePorUid;

console.log('✅ Acta de Rendimiento cargada - POR UID + TANDA');
console.log('✅ CALCULA el final desde notas individuales');
console.log('✅ Inglés agregado para 4to-6to');