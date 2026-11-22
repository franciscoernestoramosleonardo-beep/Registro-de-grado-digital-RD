/**
============================================
ASISTENCIA.JS - VERSIÓN DEFINITIVA
✅ FORMATO ROBUSTO CON PIPE: att|gX|sY|uid|dD|mM|tTANDA
   (la tanda va al final, no puede fallar el regex)
✅ PARSER UNIVERSAL: soporta 3 formatos
   1. NUEVO PIPE:    att|g3|sA|uid123|d5|m0|tMatutina
   2. INTERMEDIO:    att_g3_sA_tMatutina_uid123_d5_m0
   3. VIEJO:         att_uid123_d5_m0
✅ 45 FILAS FIJAS
✅ FILAS SIN ESTUDIANTES BLOQUEADAS
✅ LEE DE 'registrosSigerd'
✅ FILTRA POR GRADO, SECCIÓN Y TANDA
✅ NUNCA BORRA AUTOMÁTICAMENTE
✅ BORRADO SOLO EXPLÍCITO CON BACKSPACE
✅ FERIADOS Y DÍAS NO LABORABLES
✅ GUARDADO AUTOMÁTICO AL CERRAR/CAMBIAR PESTAÑA
✅ MODAL HORIZONTAL
============================================
*/

// ===== VARIABLES GLOBALES =====
let totalRows = 45;
const MAX_ROWS = 100;
const MIN_ROWS = 1;
let currentMonth = 0;
let currentSchoolYear = '2026-2027';
let currentGrade = 3;
let currentSection = 'A';
let currentTanda = 'Matutina';
let _grupoAnterior = '';
let _ultimoHashRegistros = '';

const MESES = [
    'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'
];
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

let feriadosNombresGlobal = {};
let feriadosDiasGlobal = [];

// ============================================
// 📊 FUNCIONES DE NORMALIZACIÓN
// ============================================

function normalizarTexto(texto) {
    return String(texto || '')
        .toUpperCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\./g, '')
        .replace(/°/g, '')
        .trim();
}

function getGradeTextAS(grade) {
    const texts = { 1: '1ER', 2: '2DO', 3: '3ER', 4: '4TO', 5: '5TO', 6: '6TO' };
    return texts[grade] || '3ER';
}

function getGradeFullText(grade) {
    const texts = { 1: 'Primer Grado', 2: 'Segundo Grado', 3: 'Tercer Grado', 4: 'Cuarto Grado', 5: 'Quinto Grado', 6: 'Sexto Grado' };
    return texts[grade] || 'Tercer Grado';
}

// ============================================
// 📊 DETECTAR GRADO, SECCIÓN Y TANDA
// ============================================

function obtenerGradoDesdePortada() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const gradoUrl = urlParams.get('grado');
        if (gradoUrl) return decodeURIComponent(gradoUrl);

        const datosSync = localStorage.getItem('datosSincronizados');
        if (datosSync) {
            try {
                const datos = JSON.parse(datosSync);
                if (datos && datos.grado) return datos.grado;
            } catch (e) {}
        }

        const registroGrado = localStorage.getItem('registroGradoData');
        if (registroGrado) {
            try {
                const datos = JSON.parse(registroGrado);
                if (datos && datos.grado) return datos.grado;
            } catch (e) {}
        }

        const minerdGrado = localStorage.getItem('minerd_grado_completo');
        if (minerdGrado) {
            try {
                const datos = JSON.parse(minerdGrado);
                if (datos && datos.grado) return datos.grado;
            } catch (e) {}
        }

        const registros = localStorage.getItem('registrosSigerd');
        if (registros) {
            try {
                const datos = JSON.parse(registros);
                if (Array.isArray(datos) && datos.length > 0 && datos[0].grado) {
                    return datos[0].grado;
                }
            } catch (e) {}
        }

        return 'Tercer Grado';
    } catch (e) {
        return 'Tercer Grado';
    }
}

function obtenerSeccionDesdePortada() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const seccionUrl = urlParams.get('seccion');
        if (seccionUrl) return decodeURIComponent(seccionUrl);

        const fuentes = [
            localStorage.getItem('datosSincronizados'),
            localStorage.getItem('registroGradoData'),
            localStorage.getItem('minerd_grado_completo')
        ];

        for (const fuente of fuentes) {
            if (fuente) {
                try {
                    const datos = JSON.parse(fuente);
                    if (datos && datos.seccion) return datos.seccion;
                } catch (e) { continue; }
            }
        }

        return 'A';
    } catch (e) {
        return 'A';
    }
}

function obtenerTandaDesdePortada() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const tandaUrl = urlParams.get('tanda');
        if (tandaUrl) return decodeURIComponent(tandaUrl);

        const fuentes = [
            localStorage.getItem('datosSincronizados'),
            localStorage.getItem('registroGradoData'),
            localStorage.getItem('minerd_grado_completo')
        ];

        for (const fuente of fuentes) {
            if (fuente) {
                try {
                    const datos = JSON.parse(fuente);
                    if (datos && datos.tanda) return datos.tanda;
                } catch (e) { continue; }
            }
        }

        return 'Matutina';
    } catch (e) {
        return 'Matutina';
    }
}

function obtenerGrupoActual() {
    const grado = obtenerGradoDesdePortada();
    const seccion = obtenerSeccionDesdePortada();
    const tanda = obtenerTandaDesdePortada();
    
    return {
        grado: grado ? grado.trim() : 'Tercer Grado',
        seccion: seccion ? seccion.trim() : 'A',
        tanda: tanda ? tanda.trim() : 'Matutina'
    };
}

// ============================================
// 📊 LEER ESTUDIANTES DE 'registrosSigerd'
// ============================================

function obtenerEstudiantesDesdeRegistros() {
    try {
        const stored = localStorage.getItem('registrosSigerd');
        if (!stored) return [];
        
        const registros = JSON.parse(stored);
        if (!Array.isArray(registros) || registros.length === 0) return [];
        
        const grupo = obtenerGrupoActual();
        const gradoActual = normalizarTexto(grupo.grado);
        const seccionActual = normalizarTexto(grupo.seccion);
        const tandaActual = normalizarTexto(grupo.tanda);
        
        const filtrados = registros.filter(registro => {
            const gradoRegistro = normalizarTexto(registro.grado);
            const seccionRegistro = normalizarTexto(registro.seccion);
            const tandaRegistro = normalizarTexto(registro.tanda);
            
            if (!gradoRegistro) return false;
            
            const coincideGrado = gradoRegistro === gradoActual;
            const coincideSeccion = seccionRegistro === seccionActual;
            const coincideTanda = !tandaRegistro || tandaRegistro === tandaActual;
            
            return coincideGrado && coincideSeccion && coincideTanda;
        });
        
        filtrados.sort((a, b) => (parseInt(a.orden) || 0) - (parseInt(b.orden) || 0));
        return filtrados;
        
    } catch (error) {
        console.error('❌ Error al leer "registrosSigerd":', error);
        return [];
    }
}

function obtenerCantidadEstudiantes() {
    return obtenerEstudiantesDesdeRegistros().length;
}

function actualizarContadorEstudiantes() {
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const count = estudiantes.length;
    const estudianteEl = document.getElementById('estudiantesCount');
    if (estudianteEl) {
        estudianteEl.textContent = `👨‍🎓 Estudiantes: ${count}`;
        if (count === 0) {
            estudianteEl.style.background = '#fff3e0';
            estudianteEl.style.borderColor = '#e65100';
            estudianteEl.style.color = '#e65100';
        } else {
            estudianteEl.style.background = '#e3f2fd';
            estudianteEl.style.borderColor = '#1565C0';
            estudianteEl.style.color = '#1565C0';
        }
    }
    return count;
}

// ============================================
// ✅ APLICAR DATOS SINCRONIZADOS
// ============================================

function aplicarDatosSincronizados() {
    try {
        const grupo = obtenerGrupoActual();
        
        const gradoMap = {
            'Primer Grado': 1, 'Segundo Grado': 2, 'Tercer Grado': 3,
            'Cuarto Grado': 4, 'Quinto Grado': 5, 'Sexto Grado': 6,
            '1ER': 1, '2DO': 2, '3ER': 3, '4TO': 4, '5TO': 5, '6TO': 6,
            '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
            'PRIMER GRADO': 1, 'SEGUNDO GRADO': 2, 'TERCER GRADO': 3,
            'CUARTO GRADO': 4, 'QUINTO GRADO': 5, 'SEXTO GRADO': 6
        };
        
        const gradoNormalizado = normalizarTexto(grupo.grado);
        const gradoNum = gradoMap[gradoNormalizado] || gradoMap[grupo.grado] || 3;
        
        currentGrade = gradoNum;
        currentSection = grupo.seccion;
        currentTanda = grupo.tanda;
        
        const datosSync = localStorage.getItem('datosSincronizados');
        if (datosSync) {
            try {
                const datos = JSON.parse(datosSync);
                if (datos.anioEscolar) currentSchoolYear = datos.anioEscolar;
            } catch (e) {}
        }
        
        actualizarInfoSincronizada();
        actualizarContadorEstudiantes();
        return true;
        
    } catch (e) {
        console.error('❌ Error aplicando datos sincronizados:', e);
        return false;
    }
}

function actualizarInfoSincronizada() {
    const gradeInfo = document.getElementById('syncGradeInfo');
    const sectionInfo = document.getElementById('syncSectionInfo');
    const tandaInfo = document.getElementById('syncTandaInfo');
    const yearInfo = document.getElementById('syncYearInfo');
    
    if (gradeInfo) gradeInfo.textContent = '📚 ' + getGradeFullText(currentGrade);
    if (sectionInfo) sectionInfo.textContent = '📝 Sección ' + currentSection;
    if (tandaInfo) tandaInfo.textContent = '🕐 ' + currentTanda;
    if (yearInfo) yearInfo.textContent = '📅 ' + currentSchoolYear;
    
    const schoolYearText = document.getElementById('schoolYearText');
    if (schoolYearText) schoolYearText.textContent = currentSchoolYear;
    
    actualizarContadorFeriados();
}

function syncData(grade, section, year, tanda) {
    if (grade !== undefined && grade >= 1 && grade <= 6) currentGrade = grade;
    if (section !== undefined) currentSection = section;
    if (year !== undefined) currentSchoolYear = year;
    if (tanda !== undefined) currentTanda = tanda;
    
    actualizarInfoSincronizada();
    generateAttendanceTable();
}

// ============================================
// FUNCIONES DE FECHAS
// ============================================

function getCurrentSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const beforeAugustFirst = (month < 7) || (month === 7 && day < 1);
    return beforeAugustFirst ? `${year - 1}-${year}` : `${year}-${year + 1}`;
}

function obtenerMesActualDelAñoEscolar() {
    const ahora = new Date();
    const mes = ahora.getMonth();
    const año = ahora.getFullYear();
    
    const añoEscolar = getCurrentSchoolYear();
    const añoInicio = parseInt(añoEscolar.split('-')[0]);
    
    let mesIndex;
    
    if (año === añoInicio) {
        if (mes >= 7) mesIndex = mes - 8;
        else if (mes <= 5) mesIndex = mes + 5;
        else mesIndex = 0;
    } else if (año === añoInicio + 1) {
        if (mes <= 5) mesIndex = mes + 5;
        else mesIndex = 0;
    } else {
        mesIndex = 0;
    }
    
    if (mesIndex < 0 || mesIndex > 10) mesIndex = 0;
    return mesIndex;
}

function getWeeksForMonth(year, month) {
    const weeks = [];
    let currentWeek = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const day = date.getDay();
        if (day >= 1 && day <= 5) {
            currentWeek.push({ date: d, dayName: DIAS_SEMANA[day - 1] });
            if (day === 5 || d === daysInMonth) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }
    }
    return weeks.slice(0, 5);
}

function getYearAndMonthForIndex(mesIndex) {
    const year = parseInt(currentSchoolYear.split('-')[0]);
    let mesNumerico;
    let añoReal;
    
    if (mesIndex >= 5) {
        mesNumerico = mesIndex - 4;
        añoReal = year + 1;
    } else {
        mesNumerico = mesIndex + 8;
        añoReal = year;
    }
    
    return { year: añoReal, month: mesNumerico - 1 };
}

// ============================================
// 📅 FUNCIONES DE FERIADOS
// ============================================

function obtenerFeriadosDelMesActual() {
    try {
        if (typeof window.obtenerFeriadosDelMes === 'function') {
            const feriados = window.obtenerFeriadosDelMes(currentMonth, currentSchoolYear);
            const { year: actualYear, month: monthValue } = getYearAndMonthForIndex(currentMonth);
            
            const feriadosFiltrados = feriados.filter(f => {
                const fecha = new Date(actualYear, monthValue, f.dia);
                const diaSemana = fecha.getDay();
                const esLaborable = diaSemana >= 1 && diaSemana <= 5;
                const mesCoincide = fecha.getMonth() === monthValue;
                const añoCoincide = fecha.getFullYear() === actualYear;
                return esLaborable && mesCoincide && añoCoincide;
            });
            
            feriadosNombresGlobal = {};
            feriadosDiasGlobal = [];
            feriadosFiltrados.forEach(f => {
                feriadosNombresGlobal[f.dia] = f.nombre;
                feriadosDiasGlobal.push(f.dia);
            });
            
            return feriadosFiltrados;
        }
        return [];
    } catch (e) {
        return [];
    }
}

function obtenerFeriadosComoDias(mesIndex) {
    if (feriadosDiasGlobal.length === 0 || mesIndex !== currentMonth) {
        obtenerFeriadosDelMesActual();
    }
    return feriadosDiasGlobal;
}

function obtenerNombreFeriado(dia) {
    return feriadosNombresGlobal[dia] || 'Feriado';
}

function actualizarContadorFeriados() {
    const feriadosInfo = document.getElementById('feriadosInfo');
    if (feriadosInfo) {
        const diasFeriados = obtenerFeriadosComoDias(currentMonth);
        feriadosInfo.textContent = `📅 ${diasFeriados.length} feriados`;
    }
}

// ============================================
// 💾 CLAVES PARA LOCALSTORAGE
// ✅ FORMATO ROBUSTO CON PIPE: att|gX|sY|uid|dD|mM|tTANDA
//    La tanda va al FINAL para evitar problemas con "_"
// ============================================

function getUidDeFila(rowNum) {
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const est = estudiantes.find(e => parseInt(e.orden) === rowNum);
    return est ? est.uid : null;
}

function getClaveAsistencia(uid, dia, mes) {
    if (!uid) return null;
    const tandaLimpia = (currentTanda || 'Matutina').replace(/\s+/g, '_');
    return `att|g${currentGrade}|s${currentSection}|uid${uid}|d${dia}|m${mes}|t${tandaLimpia}`;
}

// ✅ Parser universal: soporta 3 formatos
function parsearClaveAsistencia(key) {
    if (!key || !key.startsWith('att')) return null;
    
    // FORMATO NUEVO CON PIPE: att|g3|sA|uid123|d5|m0|tMatutina
    let match = key.match(/^att\|g(\d+)\|s([A-F])\|uid(.+?)\|d(\d+)\|m(\d+)\|t(.+)$/);
    if (match) {
        return {
            formato: 'nuevo_pipe',
            grado: parseInt(match[1]),
            seccion: match[2],
            uid: match[3],
            dia: parseInt(match[4]),
            mes: parseInt(match[5]),
            tanda: match[6]
        };
    }
    
    // FORMATO INTERMEDIO: att_g3_sA_tMatutina_uid123_d5_m0
    match = key.match(/^att_g(\d+)_s([A-F])_t(.+?)_(.+)_d(\d+)_m(\d+)$/);
    if (match) {
        return {
            formato: 'intermedio',
            grado: parseInt(match[1]),
            seccion: match[2],
            tanda: match[3],
            uid: match[4],
            dia: parseInt(match[5]),
            mes: parseInt(match[6])
        };
    }
    
    // FORMATO VIEJO: att_uid123_d5_m0
    match = key.match(/^att_(.+)_d(\d+)_m(\d+)$/);
    if (match) {
        return {
            formato: 'viejo',
            grado: null,
            seccion: null,
            tanda: null,
            uid: match[1],
            dia: parseInt(match[2]),
            mes: parseInt(match[3])
        };
    }
    
    return null;
}

function getNoLaborablesStorageKey(month) {
    return `no_laborables_${currentGrade}_${currentSection}_${currentTanda}_${currentSchoolYear}_m${month}`;
}

// ============================================
// 🧹 ELIMINAR ASISTENCIAS HUÉRFANAS
// ✅ DESACTIVADO PARA PROTEGER DATOS
// ============================================

function eliminarAsistenciasHuerfanas() {
    console.log('ℹ️ Limpieza de asistencias huérfanas DESACTIVADA para proteger datos');
    return;
}

// ============================================
// 🖼️ FOTO DEL ESTUDIANTE
// ============================================

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

// ============================================
// 📊 CONTEO DE ASISTENCIAS
// ============================================

function contarAsistenciasMes(uid, mes) {
    const totales = { P: 0, T: 0, A: 0, E: 0, total: 0 };
    if (!uid) return totales;
    
    const tandaActualNorm = (currentTanda || 'Matutina').replace(/\s+/g, '_');
    
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('att')) continue;
            
            const info = parsearClaveAsistencia(key);
            if (!info) continue;
            if (info.uid !== uid) continue;
            if (info.mes !== mes) continue;
            
            if (info.formato !== 'viejo') {
                if (info.grado !== currentGrade) continue;
                if (info.seccion !== currentSection) continue;
                if (info.tanda !== tandaActualNorm) continue;
            }
            
            const val = (localStorage.getItem(key) || '').toUpperCase();
            if (totales[val] !== undefined) totales[val]++;
            if (val === 'P' || val === 'T' || val === 'A' || val === 'E') totales.total++;
        }
    } catch (e) {}
    return totales;
}

function contarAsistenciasTodosLosMeses(uid) {
    const totales = { P: 0, T: 0, A: 0, E: 0, total: 0 };
    const porMes = {};
    if (!uid) return { totales, porMes };
    
    const tandaActualNorm = (currentTanda || 'Matutina').replace(/\s+/g, '_');
    
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('att')) continue;
            
            const info = parsearClaveAsistencia(key);
            if (!info) continue;
            if (info.uid !== uid) continue;
            
            if (info.formato !== 'viejo') {
                if (info.grado !== currentGrade) continue;
                if (info.seccion !== currentSection) continue;
                if (info.tanda !== tandaActualNorm) continue;
            }
            
            const mes = info.mes;
            const val = (localStorage.getItem(key) || '').toUpperCase();
            if (!porMes[mes]) porMes[mes] = { P: 0, T: 0, A: 0, E: 0, total: 0 };
            if (totales[val] !== undefined) totales[val]++;
            if (val === 'P' || val === 'T' || val === 'A' || val === 'E') {
                totales.total++;
                porMes[mes].total++;
                porMes[mes][val]++;
            }
        }
    } catch (e) {}
    return { totales, porMes };
}

// ============================================
// 👤 MODAL DE ESTUDIANTE
// ============================================

function mostrarModalEstudianteFila(row, nombre, uid) {
    const previo = document.getElementById('modalNombreEstudiante');
    if (previo) previo.remove();

    let estudiante = null;
    try {
        const stored = localStorage.getItem('registrosSigerd');
        if (stored) {
            const registros = JSON.parse(stored);
            if (Array.isArray(registros)) {
                estudiante = registros.find(r => r.uid === uid);
            }
        }
    } catch (e) {}

    const nombreCompleto = estudiante 
        ? `${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim()
        : (nombre || 'Sin nombre');
    const telefono = estudiante ? (estudiante.telefono || '') : '';
    const grado = estudiante ? (estudiante.grado || '') : '';
    const seccion = estudiante ? (estudiante.seccion || '') : '';
    const tanda = estudiante ? (estudiante.tanda || '') : '';
    const idEstudiante = estudiante ? (estudiante.id || '') : '';
    const edad = estudiante ? (estudiante.edad || '') : '';
    const fotoBase64 = leerFotoEstudiante(uid);

    const asistMes = contarAsistenciasMes(uid, currentMonth);
    const { totales: asistTotal, porMes } = contarAsistenciasTodosLosMeses(uid);

    const overlay = document.createElement('div');
    overlay.id = 'modalNombreEstudiante';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 20, 40, 0.75); backdrop-filter: blur(3px);
        display: flex; justify-content: center; align-items: flex-start;
        padding: 25px 20px 20px 20px;
        z-index: 99999; overflow-y: auto;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
        background: #ffffff; border-radius: 16px; padding: 0;
        max-width: 900px; width: 100%; overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 3px rgba(26,58,107,0.15);
        font-family: 'Times New Roman', Times, serif;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #1a3a6b 0%, #2a5a8b 100%);
        padding: 14px 24px; display: flex; align-items: center; gap: 14px;
        border-bottom: 4px solid #ffd700;
    `;
    header.innerHTML = `
        <span style="font-size: 26px;">👤</span>
        <div style="flex: 1; display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap;">
            <div style="color: #ffd700; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                Estudiante Nº ${row}
            </div>
            <div style="color: #ffffff; font-size: 17px; font-weight: 700;">
                ${nombreCompleto || 'Sin nombre'}
            </div>
        </div>
    `;

    const body = document.createElement('div');
    body.style.cssText = `
        padding: 20px 24px;
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 22px;
        align-items: start;
    `;

    const colIzq = document.createElement('div');
    colIzq.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const fotoContenedor = document.createElement('div');
    fotoContenedor.style.cssText = `
        width: 140px; height: 140px; margin: 0 auto;
        border: 3px solid #1a3a6b; border-radius: 14px;
        background: #f0f4fa; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(26,58,107,0.2);
    `;

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
        linea.style.cssText = `
            display: flex; flex-direction: column; gap: 2px;
            padding: 7px 10px; background: #f8fafc;
            border-radius: 8px; border-left: 3px solid #1a3a6b;
            font-size: 12px;
        `;
        linea.innerHTML = `
            <span style="color: #4a6a8a; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">${d.label}</span>
            <span style="color: #1a2a4a; font-weight: 700; word-break: break-word;">${d.valor}</span>
        `;
        colIzq.appendChild(linea);
    });

    body.appendChild(colIzq);

    const colDer = document.createElement('div');
    colDer.style.cssText = 'display: flex; flex-direction: column; gap: 14px;';

    const bloqueMes = document.createElement('div');
    bloqueMes.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            📊 Asistencia del mes: <span style="color: #e65100;">${MESES[currentMonth]}</span>
        </div>
    `;
    const gridMes = document.createElement('div');
    gridMes.style.cssText = `display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;`;
    const coloresMes = {
        P: { bg: '#e6f4ea', color: '#137333', label: 'Presente' },
        T: { bg: '#fff3e0', color: '#e65100', label: 'Tardanza' },
        A: { bg: '#fce8e6', color: '#c5221f', label: 'Ausente' },
        E: { bg: '#e8eaf6', color: '#3949ab', label: 'Excusa' }
    };
    ['P', 'T', 'A', 'E'].forEach(letra => {
        const c = coloresMes[letra];
        const cuadro = document.createElement('div');
        cuadro.style.cssText = `
            padding: 10px 6px; background: ${c.bg}; color: ${c.color};
            border-radius: 10px; text-align: center; font-weight: 700;
            border: 2px solid ${c.color}33;
        `;
        cuadro.innerHTML = `
            <div style="font-size: 24px; line-height: 1;">${asistMes[letra]}</div>
            <div style="font-size: 10px; letter-spacing: 0.5px; margin-top: 3px;">${c.label} (${letra})</div>
        `;
        gridMes.appendChild(cuadro);
    });
    const cuadroTotalMes = document.createElement('div');
    cuadroTotalMes.style.cssText = `
        padding: 10px 6px; background: #e8f0f8;
        color: #1a3a6b; border-radius: 10px; text-align: center;
        font-weight: 700; border: 2px solid #1a3a6b55;
    `;
    cuadroTotalMes.innerHTML = `
        <div style="font-size: 24px; line-height: 1;">${asistMes.total}</div>
        <div style="font-size: 10px; letter-spacing: 0.5px; margin-top: 3px;">TOTAL MES</div>
    `;
    gridMes.appendChild(cuadroTotalMes);
    bloqueMes.appendChild(gridMes);
    colDer.appendChild(bloqueMes);

    const bloqueGeneral = document.createElement('div');
    bloqueGeneral.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            🗓️ Total general (todos los meses)
        </div>
    `;
    const gridGeneral = document.createElement('div');
    gridGeneral.style.cssText = `display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;`;
    ['P', 'T', 'A', 'E'].forEach(letra => {
        const c = coloresMes[letra];
        const cuadro = document.createElement('div');
        cuadro.style.cssText = `
            padding: 10px 6px; background: ${c.bg}; color: ${c.color};
            border-radius: 10px; text-align: center; font-weight: 700;
            border: 2px solid ${c.color}33;
        `;
        cuadro.innerHTML = `
            <div style="font-size: 22px; line-height: 1;">${asistTotal[letra]}</div>
            <div style="font-size: 10px; letter-spacing: 0.5px; margin-top: 3px;">${c.label} (${letra})</div>
        `;
        gridGeneral.appendChild(cuadro);
    });
    const cuadroTotalGen = document.createElement('div');
    cuadroTotalGen.style.cssText = `
        padding: 10px 6px; background: linear-gradient(135deg, #1a3a6b, #2a5a8b);
        color: #ffd700; border-radius: 10px; text-align: center;
        font-weight: 700; border: 2px solid #ffd700;
    `;
    cuadroTotalGen.innerHTML = `
        <div style="font-size: 22px; line-height: 1;">${asistTotal.total}</div>
        <div style="font-size: 10px; letter-spacing: 0.5px; margin-top: 3px;">TOTAL</div>
    `;
    gridGeneral.appendChild(cuadroTotalGen);
    bloqueGeneral.appendChild(gridGeneral);
    colDer.appendChild(bloqueGeneral);

    const mesesConDatos = Object.keys(porMes).map(m => parseInt(m, 10)).sort((a, b) => a - b);
    if (mesesConDatos.length > 0) {
        const detalle = document.createElement('div');
        detalle.style.cssText = `
            background: #f8fafc; border-radius: 10px;
            padding: 10px 14px; border: 1px solid #dce4ec;
        `;
        let htmlDetalle = `<div style="font-weight: 700; color: #1a3a6b; margin-bottom: 6px; font-size: 12px;">📅 Detalle por mes:</div>`;
        htmlDetalle += `
            <div style="display: grid; grid-template-columns: 1fr auto auto auto auto; gap: 4px 14px; font-size: 11px;">
                <div style="font-weight: 700; color: #4a6a8a;">Mes</div>
                <div style="font-weight: 700; color: #137333; text-align: center;">P</div>
                <div style="font-weight: 700; color: #e65100; text-align: center;">T</div>
                <div style="font-weight: 700; color: #c5221f; text-align: center;">A</div>
                <div style="font-weight: 700; color: #3949ab; text-align: center;">E</div>
        `;
        mesesConDatos.forEach(m => {
            const d = porMes[m];
            const nombreMes = MESES[m] || `Mes ${m}`;
            const esMesActual = m === currentMonth;
            const peso = esMesActual ? '700' : '600';
            const fondo = esMesActual ? 'background: #fff8e1;' : '';
            htmlDetalle += `
                <div style="color: #1a2a4a; font-weight: ${peso}; ${fondo} padding: 2px 4px; border-radius: 4px;">${nombreMes}${esMesActual ? ' ★' : ''}</div>
                <div style="color: #137333; font-weight: 700; text-align: center; ${fondo} padding: 2px 4px; border-radius: 4px;">${d.P}</div>
                <div style="color: #e65100; font-weight: 700; text-align: center; ${fondo} padding: 2px 4px; border-radius: 4px;">${d.T}</div>
                <div style="color: #c5221f; font-weight: 700; text-align: center; ${fondo} padding: 2px 4px; border-radius: 4px;">${d.A}</div>
                <div style="color: #3949ab; font-weight: 700; text-align: center; ${fondo} padding: 2px 4px; border-radius: 4px;">${d.E}</div>
            `;
        });
        htmlDetalle += '</div>';
        detalle.innerHTML = htmlDetalle;
        colDer.appendChild(detalle);
    }

    if (asistTotal.total === 0) {
        const vacio = document.createElement('div');
        vacio.style.cssText = `
            text-align: center; padding: 10px; background: #fff3cd;
            border-radius: 8px; color: #856404; font-size: 12px;
            font-weight: 600;
        `;
        vacio.textContent = '⚠️ Este estudiante aún no tiene asistencias registradas.';
        colDer.appendChild(vacio);
    }

    body.appendChild(colDer);

    const btnCerrar = document.createElement('button');
    btnCerrar.textContent = '✕ CERRAR';
    btnCerrar.style.cssText = `
        display: block; width: calc(100% - 48px); margin: 0 24px 20px 24px;
        padding: 11px 20px; background: linear-gradient(135deg, #2a7a4a, #1a5a3a);
        color: white; border: none; border-radius: 50px; font-size: 14px;
        font-weight: 700; cursor: pointer; letter-spacing: 0.5px;
        font-family: 'Times New Roman', Times, serif;
        box-shadow: 0 4px 14px rgba(26,90,58,0.35);
    `;
    btnCerrar.onclick = function() { overlay.remove(); };

    box.appendChild(header);
    box.appendChild(body);
    box.appendChild(btnCerrar);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    const escHandler = function(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
}

window.mostrarModalEstudianteFila = mostrarModalEstudianteFila;
window.leerFotoEstudiante = leerFotoEstudiante;
window.contarAsistenciasMes = contarAsistenciasMes;
window.contarAsistenciasTodosLosMeses = contarAsistenciasTodosLosMeses;

// ============================================
// GENERAR TABLA PRINCIPAL
// ============================================

function generateAttendanceTable() {
    const container = document.getElementById('tabla-container');
    if (!container) return;
    
    const { year: actualYear, month: monthValue } = getYearAndMonthForIndex(currentMonth);
    const weeks = getWeeksForMonth(actualYear, monthValue);
    const weekColor = (currentMonth % 6) + 1;
    
    feriadosNombresGlobal = {};
    feriadosDiasGlobal = [];
    const diasFeriados = obtenerFeriadosComoDias(currentMonth);
    
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    
    let html = '<table>';
    html += '<thead>';
    html += '<tr>';
    html += `<th rowspan="2" style="width:35px; min-width:35px; max-width:35px;">Nº</th>`;
    for (let i = 0; i < weeks.length; i++) {
        if (weeks[i].length > 0) {
            const suffix = i === 0 ? 'ra.' : (i === 1 ? 'da.' : (i === 2 ? 'ra.' : 'ta.'));
            html += `<th colspan="${weeks[i].length}" class="att-week-header-${weekColor}">${i + 1}${suffix} Semana</th>`;
        }
    }
    html += `<th colspan="4" class="att-summary-header-${weekColor}">Resumen</th>`;
    html += '</tr>';
    html += '<tr>';
    for (let i = 0; i < weeks.length; i++) {
        for (let j = 0; j < weeks[i].length; j++) {
            html += `<th class="att-day-header">${weeks[i][j].dayName}</th>`;
        }
    }
    html += '<th class="att-day-header">P</th>';
    html += '<th class="att-day-header">T</th>';
    html += '<th class="att-day-header">A</th>';
    html += '<th class="att-day-header">E</th>';
    html += '</tr>';
    html += '<tr>';
    html += `<th class="att-date-cell" style="font-weight:bold;background:#f1f3f4;width:35px;min-width:35px;max-width:35px;">Fecha:</th>`;
    for (let i = 0; i < weeks.length; i++) {
        for (let j = 0; j < weeks[i].length; j++) {
            const date = weeks[i][j].date;
            const isFeriado = diasFeriados.includes(date);
            const nombreFeriado = isFeriado ? obtenerNombreFeriado(date) : '';
            const tooltip = isFeriado ? `title="🔴 FERIADO: ${nombreFeriado}"` : '';
            html += `<th class="att-date-cell${isFeriado ? ' feriado' : ''}" style="${isFeriado ? 'background:#fce4ec!important;color:#c62828!important;font-weight:bold!important;cursor:help!important;' : ''}" ${tooltip}>${date}</th>`;
        }
    }
    html += '<th></th><th></th><th></th><th></th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    
    for (let row = 1; row <= totalRows; row++) {
        const tieneEstudiante = row <= totalEstudiantes;
        const rowClass = tieneEstudiante ? '' : ' row-bloqueada';
        const uidFila = tieneEstudiante ? (estudiantes[row - 1] ? estudiantes[row - 1].uid : null) : null;
        
        html += `<tr class="${rowClass}" data-uid="${uidFila || ''}" data-row="${row}">`;
        
        const estudianteFila = tieneEstudiante ? estudiantes[row - 1] : null;
        const nombreEstudiante = estudianteFila 
            ? `${estudianteFila.nombre || ''} ${estudianteFila.apellido || ''}`.trim() 
            : '';
        const tituloNum = tieneEstudiante 
            ? `👤 ${nombreEstudiante || 'Sin nombre'} (clic para ver)` 
            : 'Sin estudiante registrado';
        const nombreEscapado = nombreEstudiante.replace(/"/g, '&quot;');
        
        html += `<td class="num-col ${tieneEstudiante ? 'num-col-clickeable' : 'num-col-bloqueado'}" 
            data-nombre="${nombreEscapado}"
            data-row="${row}"
            data-uid="${uidFila || ''}"
            title="${tituloNum}">${row}</td>`;
        
        for (let i = 0; i < weeks.length; i++) {
            for (let j = 0; j < weeks[i].length; j++) {
                const date = weeks[i][j].date;
                const isFeriado = diasFeriados.includes(date);
                const id = `att-r${row}-d${date}-m${currentMonth}`;
                
                if (!tieneEstudiante) {
                    html += `<td class="bloqueado-cell"><input type="text" maxlength="1" class="att-day-input att-bloqueado" id="${id}" readonly value="-" style="background:#f0f0f0!important;color:#999!important;cursor:not-allowed!important;border:none!important;" title="Sin estudiante registrado"></td>`;
                } else {
                    const feriadoClass = isFeriado ? ' att-feriado' : '';
                    const readonlyAttr = isFeriado ? 'readonly' : '';
                    const valueAttr = isFeriado ? 'value="F"' : '';
                    const bgColor = isFeriado ? 'background-color:#fce4ec!important;color:#c62828!important;font-weight:bold!important;' : '';
                    const nombreFeriado = isFeriado ? obtenerNombreFeriado(date) : '';
                    const tooltip = isFeriado ? `title="🔴 FERIADO: ${nombreFeriado}"` : '';
                    html += `<td class="${isFeriado ? 'feriado-cell' : ''}"><input type="text" maxlength="1" class="att-day-input${feriadoClass}" id="${id}" data-uid="${uidFila || ''}" data-dia="${date}" data-mes="${currentMonth}" ${readonlyAttr} ${valueAttr} style="${bgColor}" ${tooltip} oninput="validateAtt(this, ${row}, ${currentMonth})" onkeydown="handleAttNav(event)" placeholder="-"></td>`;
                }
            }
        }
        
        if (!tieneEstudiante) {
            html += `<td><input type="text" class="att-summary-input" id="sum-r${row}-P-m${currentMonth}" readonly value="-" style="background:#f0f0f0!important;color:#999!important;"></td>`;
            html += `<td><input type="text" class="att-summary-input" id="sum-r${row}-T-m${currentMonth}" readonly value="-" style="background:#f0f0f0!important;color:#999!important;"></td>`;
            html += `<td><input type="text" class="att-summary-input" id="sum-r${row}-A-m${currentMonth}" readonly value="-" style="background:#f0f0f0!important;color:#999!important;"></td>`;
            html += `<td><input type="text" class="att-summary-input" id="sum-r${row}-E-m${currentMonth}" readonly value="-" style="background:#f0f0f0!important;color:#999!important;"></td>`;
        } else {
            html += `<td><input type="text" class="att-summary-input presente" id="sum-r${row}-P-m${currentMonth}" readonly></td>`;
            html += `<td><input type="text" class="att-summary-input" id="sum-r${row}-T-m${currentMonth}" readonly></td>`;
            html += `<td><input type="text" class="att-summary-input ausente" id="sum-r${row}-A-m${currentMonth}" readonly></td>`;
            html += `<td><input type="text" class="att-summary-input" id="sum-r${row}-E-m${currentMonth}" readonly></td>`;
        }
        
        html += '</tr>';
    }
    
    html += `<tr class="total-row">`;
    html += `<td>Total</td>`;
    for (let i = 0; i < weeks.length; i++) {
        for (let j = 0; j < weeks[i].length; j++) {
            const date = weeks[i][j].date;
            html += `<td><span class="total-col" id="total-col-d${date}-m${currentMonth}">0</span></td>`;
        }
    }
    html += `<td></td><td></td><td></td><td></td>`;
    html += '</tr>';
    html += '</tbody></table>';
    
    container.innerHTML = html;
    
    if (container._numColHandler) {
        container.removeEventListener('click', container._numColHandler);
    }
    container._numColHandler = function(e) {
        const celdaNum = e.target.closest('.num-col-clickeable');
        if (celdaNum) {
            e.stopPropagation();
            const nombre = celdaNum.dataset.nombre || '';
            const row = celdaNum.dataset.row || '';
            const uid = celdaNum.dataset.uid || '';
            mostrarModalEstudianteFila(row, nombre, uid);
        }
    };
    container.addEventListener('click', container._numColHandler);
    
    document.getElementById('rowCountDisplay').textContent = `Filas: ${totalRows}`;
    actualizarContadorEstudiantes();
    
    eliminarAsistenciasHuerfanas();
    
    cargarDatosAsistencia();
    aplicarFeriadosConTooltips();
    cargarDiasNoLaborablesGuardados();
    actualizarInfoSincronizada();
    
    for (let row = 1; row <= totalRows; row++) {
        calculateRowTotals(row, currentMonth);
    }
    calculateColumnTotals(currentMonth);
    calculateWorkedDays();
    bloquearFilasSinEstudiantes();
}

// ============================================
// 🔒 BLOQUEAR FILAS SIN ESTUDIANTES
// ============================================

function bloquearFilasSinEstudiantes() {
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    
    for (let row = 1; row <= totalRows; row++) {
        const tieneEstudiante = row <= totalEstudiantes;
        const inputs = document.querySelectorAll(`#tabla-container input[id^="att-r${row}-d"][id$="-m${currentMonth}"]`);
        
        inputs.forEach(input => {
            if (!tieneEstudiante) {
                if (!input.classList.contains('att-feriado')) {
                    input.value = '-';
                    input.className = 'att-day-input att-bloqueado';
                    input.readOnly = true;
                    input.style.backgroundColor = '#f0f0f0';
                    input.style.color = '#999';
                    input.style.cursor = 'not-allowed';
                    input.style.border = 'none';
                    input.title = 'Sin estudiante registrado';
                    input.oninput = null;
                    input.onkeydown = null;
                }
            } else {
                if (!input.classList.contains('att-feriado') && !input.classList.contains('att-no-laborable')) {
                    if (input.readOnly && input.value === '-') {
                        input.value = '';
                        input.className = 'att-day-input';
                        input.readOnly = false;
                        input.style.backgroundColor = '';
                        input.style.color = '';
                        input.style.cursor = '';
                        input.style.border = '';
                        input.title = '';
                        input.oninput = function() { validateAtt(this, row, currentMonth); };
                        input.onkeydown = function(e) { handleAttNav(e); };
                    }
                }
            }
        });
        
        const pInput = document.getElementById(`sum-r${row}-P-m${currentMonth}`);
        const tInput = document.getElementById(`sum-r${row}-T-m${currentMonth}`);
        const aInput = document.getElementById(`sum-r${row}-A-m${currentMonth}`);
        const eInput = document.getElementById(`sum-r${row}-E-m${currentMonth}`);
        
        if (!tieneEstudiante) {
            [pInput, tInput, aInput, eInput].forEach(el => {
                if (el) {
                    el.value = '-';
                    el.style.background = '#f0f0f0';
                    el.style.color = '#999';
                }
            });
        } else {
            calculateRowTotals(row, currentMonth);
        }
    }
}

// ============================================
// VALIDACIÓN DE ASISTENCIA
// ✅ Borra explícitamente SOLO si el usuario quita el valor
// ============================================

function validateAtt(input, row, month) {
    if (input.classList.contains('att-bloqueado')) {
        input.value = '-';
        return;
    }
    
    const valorAnterior = input.dataset.valorAnterior || '';
    let val = input.value.toUpperCase().replace(/[^PATE-]/g, '');
    input.value = val;
    
    // Si el usuario BORRÓ el valor (antes tenía, ahora no) → borrar de localStorage
    if (valorAnterior && !val) {
        const uid = input.dataset.uid;
        const dia = input.dataset.dia;
        const mes = input.dataset.mes;
        if (uid && dia && mes !== undefined) {
            const key = getClaveAsistencia(uid, dia, mes);
            if (key) {
                localStorage.removeItem(key);
            }
        }
    }
    
    input.dataset.valorAnterior = val;
    
    if (val === '-') {
        input.classList.add('att-hyphen');
    } else {
        input.classList.remove('att-hyphen');
    }
    calculateRowTotals(row, month);
    calculateColumnTotals(month);
    calculateWorkedDays();
    guardarDatosAsistencia(month);
}

// ============================================
// TOTALES POR FILA
// ============================================

function calculateRowTotals(row, month) {
    let p = 0, t = 0, a = 0, e = 0;
    const inputs = document.querySelectorAll(`#tabla-container input[id^="att-r${row}-d"][id$="-m${month}"]`);
    inputs.forEach(input => {
        if (input.classList.contains('att-bloqueado') || input.classList.contains('att-feriado')) return;
        const val = input.value.toUpperCase();
        if (val === 'P') p++;
        else if (val === 'T') t++;
        else if (val === 'A') a++;
        else if (val === 'E') e++;
    });
    const pInput = document.getElementById(`sum-r${row}-P-m${month}`);
    const tInput = document.getElementById(`sum-r${row}-T-m${month}`);
    const aInput = document.getElementById(`sum-r${row}-A-m${month}`);
    const eInput = document.getElementById(`sum-r${row}-E-m${month}`);
    if (pInput && !pInput.classList.contains('att-bloqueado')) pInput.value = p || '';
    if (tInput && !tInput.classList.contains('att-bloqueado')) tInput.value = t || '';
    if (aInput && !aInput.classList.contains('att-bloqueado')) aInput.value = a || '';
    if (eInput && !eInput.classList.contains('att-bloqueado')) eInput.value = e || '';
}

// ============================================
// TOTALES POR COLUMNA
// ============================================

function calculateColumnTotals(month) {
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    const { year: actualYear, month: monthValue } = getYearAndMonthForIndex(currentMonth);
    const weeks = getWeeksForMonth(actualYear, monthValue);
    for (let i = 0; i < weeks.length; i++) {
        for (let j = 0; j < weeks[i].length; j++) {
            const date = weeks[i][j].date;
            let pCount = 0;
            for (let row = 1; row <= totalEstudiantes; row++) {
                const input = document.getElementById(`att-r${row}-d${date}-m${month}`);
                if (input && input.value.toUpperCase() === 'P') pCount++;
            }
            const totalEl = document.getElementById(`total-col-d${date}-m${month}`);
            if (totalEl) totalEl.textContent = pCount;
        }
    }
}

// ============================================
// DÍAS TRABAJADOS
// ============================================

function calculateWorkedDays() {
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    let maxMarks = 0;
    for (let row = 1; row <= totalEstudiantes; row++) {
        let marks = 0;
        const inputs = document.querySelectorAll(`#tabla-container input[id^="att-r${row}-d"][id$="-m${currentMonth}"]`);
        inputs.forEach(input => {
            const val = input.value.toUpperCase();
            if (val === 'P' || val === 'T' || val === 'A' || val === 'E') marks++;
        });
        if (marks > maxMarks) maxMarks = marks;
    }
    const daysWorked = document.getElementById('daysWorked');
    if (daysWorked) daysWorked.value = maxMarks;
}

// ============================================
// 💾 GUARDAR DATOS DE ASISTENCIA
// ✅ NUNCA BORRA
// ============================================

function guardarDatosAsistencia(month) {
    const container = document.getElementById('tabla-container');
    if (!container) return;
    
    const inputs = container.querySelectorAll('.att-day-input[data-uid]');
    let guardadas = 0;
    let saltadas = 0;
    
    inputs.forEach(input => {
        const uid = input.dataset.uid;
        const dia = input.dataset.dia;
        const mes = input.dataset.mes;
        
        if (!uid || !uid.trim()) { saltadas++; return; }
        if (!dia || mes === undefined) { saltadas++; return; }
        if (input.classList.contains('att-bloqueado')) { saltadas++; return; }
        if (input.classList.contains('att-feriado')) { saltadas++; return; }
        if (input.classList.contains('att-no-laborable')) { saltadas++; return; }
        
        const key = getClaveAsistencia(uid, dia, mes);
        if (!key) { saltadas++; return; }
        
        const val = input.value ? input.value.toUpperCase().trim() : '';
        
        // ✅ SOLO GUARDA — NUNCA BORRA en esta función
        if (val && val !== '-') {
            localStorage.setItem(key, val);
            guardadas++;
        } else {
            saltadas++;
        }
    });
    
    console.log(`💾 Asistencias ${MESES[month]}: ${guardadas} guardadas, ${saltadas} saltadas (NO borra)`);
}

// ============================================
// 📥 CARGAR DATOS DE ASISTENCIA
// ============================================

function cargarDatosAsistencia() {
    const container = document.getElementById('tabla-container');
    if (!container) return;
    
    const inputs = container.querySelectorAll('.att-day-input[data-uid]');
    let cargadas = 0;
    
    inputs.forEach(input => {
        const uid = input.dataset.uid;
        const dia = input.dataset.dia;
        const mes = input.dataset.mes;
        
        if (!uid || !dia || mes === undefined) return;
        if (input.classList.contains('att-bloqueado')) return;
        if (input.classList.contains('att-feriado')) return;
        if (input.classList.contains('att-no-laborable')) return;
        
        const key = getClaveAsistencia(uid, dia, mes);
        if (!key) return;
        
        const val = localStorage.getItem(key);
        if (val) {
            input.value = val;
            input.dataset.valorAnterior = val;
            cargadas++;
            if (val === '-') input.classList.add('att-hyphen');
        } else {
            input.dataset.valorAnterior = '';
        }
    });
    
    console.log(`📥 Asistencias cargadas para ${MESES[currentMonth]}: ${cargadas} campos`);
}

// ============================================
// 💾 GUARDAR DÍAS NO LABORABLES
// ============================================

function guardarDiasNoLaborables(dias) {
    const key = getNoLaborablesStorageKey(currentMonth);
    localStorage.setItem(key, JSON.stringify(dias));
}

function cargarDiasNoLaborablesGuardados() {
    const key = getNoLaborablesStorageKey(currentMonth);
    const saved = localStorage.getItem(key);
    
    if (!saved) {
        actualizarListaNoLaborables([]);
        return;
    }
    
    try {
        const dias = JSON.parse(saved);
        const feriadosDias = obtenerFeriadosComoDias(currentMonth);
        const noLaborables = dias.filter(d => !feriadosDias.includes(d));
        
        if (noLaborables.length > 0) {
            const estudiantes = obtenerEstudiantesDesdeRegistros();
            const totalEstudiantes = estudiantes.length;
            noLaborables.forEach(dia => {
                for (let row = 1; row <= totalEstudiantes; row++) {
                    const input = document.getElementById(`att-r${row}-d${dia}-m${currentMonth}`);
                    if (input) {
                        if (!feriadosDias.includes(dia) && !input.classList.contains('att-bloqueado')) {
                            input.value = 'D';
                            input.className = 'att-day-input att-no-laborable';
                            input.readOnly = true;
                            input.style.backgroundColor = '#e3f2fd';
                            input.style.color = '#1565C0';
                            input.style.cursor = 'not-allowed';
                            input.style.fontWeight = 'bold';
                            input.title = '🔵 Día no laborable';
                        }
                    }
                }
            });
            actualizarListaNoLaborables(noLaborables);
        } else {
            actualizarListaNoLaborables([]);
        }
    } catch (e) {
        console.warn('⚠️ Error al cargar días no laborables:', e);
    }
}

// ============================================
// CAMBIAR MES
// ============================================

function cambiarMes() {
    const selector = document.getElementById('monthSelector');
    const newMonth = parseInt(selector.value);
    
    guardarDatosAsistencia(currentMonth);
    
    currentMonth = newMonth;
    selector.value = currentMonth;
    
    feriadosNombresGlobal = {};
    feriadosDiasGlobal = [];
    
    generateAttendanceTable();
    
    setTimeout(() => calcularDiasTrabajadosConValidacion(), 100);
    setTimeout(() => mostrarInfoCronometro(), 200);
}

// ============================================
// NAVEGACIÓN POR TECLADO
// ============================================

function handleAttNav(e) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return;
    const input = e.target;
    
    if (input.classList.contains('att-bloqueado')) return;
    
    const td = input.closest('td');
    const tr = td.closest('tr');
    const tbody = tr.closest('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const currentRowIndex = rows.indexOf(tr);
    const rowInputs = Array.from(tr.querySelectorAll('.att-day-input:not(.att-bloqueado)'));
    const currentColIndex = rowInputs.indexOf(input);
    
    let nextRow = currentRowIndex;
    let nextCol = currentColIndex;
    let moved = false;
    
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        nextRow++;
        moved = true;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nextRow--;
        moved = true;
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextCol++;
        moved = true;
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextCol--;
        moved = true;
    }
    
    if (moved && nextRow >= 0 && nextRow < rows.length - 1) {
        const targetTr = rows[nextRow];
        const targetInputs = targetTr.querySelectorAll('.att-day-input:not(.att-bloqueado)');
        if (nextCol >= 0 && nextCol < targetInputs.length) {
            const targetInput = targetInputs[nextCol];
            if (!targetInput.classList.contains('att-bloqueado')) {
                targetInput.focus();
                targetInput.select();
            }
        }
    }
}

// ============================================
// AGREGAR / ELIMINAR FILA
// ============================================

function addRow() {
    mostrarToast('ℹ️ El sistema mantiene 45 filas fijas.');
}

function deleteRow() {
    mostrarToast('ℹ️ El sistema mantiene 45 filas fijas.');
}

// ============================================
// TOAST DE MENSAJES
// ============================================

function mostrarToast(mensaje) {
    const toastAnterior = document.querySelector('.toast-mensaje-asistencia');
    if (toastAnterior) toastAnterior.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-mensaje-asistencia';
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #1a2a4a; color: white; padding: 12px 28px;
        border-radius: 60px; font-family: 'Times New Roman', Times, serif;
        font-size: 0.9rem; box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        z-index: 99999; font-weight: 500; max-width: 90%; text-align: center;
    `;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// 📅 CALENDARIO INTERACTIVO
// ============================================

let modalCalendario = null;
let diasSeleccionadosTemp = [];
let feriadosDelMes = [];

function seleccionarDiasNoLaborables() {
    const workingDays = getWorkingDaysInMonth();
    const daysInMonth = getDaysInCurrentMonth();
    
    if (workingDays.length === 0) {
        alert('⚠️ No hay días laborables en este mes.');
        return;
    }
    
    const diasGuardados = obtenerDiasNoLaborablesActuales();
    diasSeleccionadosTemp = [...diasGuardados];
    feriadosDelMes = obtenerFeriadosDelMesActual();
    
    crearModalCalendario(daysInMonth, workingDays);
}

function getWorkingDaysInMonth() {
    const { year: actualYear, month: monthValue } = getYearAndMonthForIndex(currentMonth);
    const workingDays = [];
    const daysInMonth = new Date(actualYear, monthValue + 1, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(actualYear, monthValue, d);
        const day = date.getDay();
        if (day >= 1 && day <= 5) workingDays.push(d);
    }
    return workingDays;
}

function getDaysInCurrentMonth() {
    const { year: actualYear, month: monthValue } = getYearAndMonthForIndex(currentMonth);
    return new Date(actualYear, monthValue + 1, 0).getDate();
}

function crearModalCalendario(daysInMonth, workingDays) {
    if (modalCalendario) {
        document.body.removeChild(modalCalendario);
        modalCalendario = null;
    }
    
    const { year: actualYear, month: monthValue } = getYearAndMonthForIndex(currentMonth);
    const firstDayOfMonth = new Date(actualYear, monthValue, 1).getDay();
    
    const feriadosDelMesFiltrados = obtenerFeriadosDelMesActual();
    const feriadosDias = feriadosDelMesFiltrados.map(f => f.dia);
    const feriadosNombres = {};
    feriadosDelMesFiltrados.forEach(f => { feriadosNombres[f.dia] = f.nombre; });
    
    const overlay = document.createElement('div');
    overlay.id = 'calendarioOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; justify-content: center;
        align-items: center; z-index: 9999;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
        background: white; border-radius: 16px; padding: 25px;
        max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        font-family: 'Times New Roman', Times, serif;
    `;
    
    const title = document.createElement('h2');
    title.style.cssText = 'text-align: center; color: #1a2a4a; margin-bottom: 5px; font-size: 20px;';
    title.textContent = `📅 Seleccionar Días No Laborables`;
    
    const subtitle = document.createElement('p');
    subtitle.style.cssText = 'text-align: center; color: #666; margin-bottom: 8px; font-size: 14px;';
    subtitle.textContent = `${MESES[currentMonth]} ${actualYear}`;
    
    const legend = document.createElement('div');
    legend.style.cssText = `
        display: flex; justify-content: center; gap: 15px;
        margin-bottom: 12px; font-size: 12px; flex-wrap: wrap;
        padding: 8px; background: #f8f9fa; border-radius: 8px;
    `;
    legend.innerHTML = `
        <span><span style="display:inline-block;width:16px;height:16px;background:#1565C0;border-radius:4px;vertical-align:middle;border:1px solid #1565C0;"></span> Seleccionado</span>
        <span><span style="display:inline-block;width:16px;height:16px;background:#fce4ec;border:2px solid #c62828;border-radius:4px;vertical-align:middle;"></span> 🔴 Feriado</span>
        <span><span style="display:inline-block;width:16px;height:16px;background:#f5f5f5;border:1px solid #e0e0e0;border-radius:4px;vertical-align:middle;"></span> Fin de semana</span>
    `;
    
    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = `
        display: grid; grid-template-columns: repeat(7, 1fr);
        gap: 5px; margin: 8px 0;
    `;
    
    const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
    diasSemana.forEach(dia => {
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center; font-weight: bold; color: #1a2a4a;
            font-size: 12px; padding: 6px 0; background: #f0f2f5; border-radius: 4px;
        `;
        header.textContent = dia;
        gridContainer.appendChild(header);
    });
    
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding: 6px;';
        gridContainer.appendChild(empty);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        const isWorkingDay = workingDays.includes(day);
        const isFeriado = feriadosDias.includes(day);
        const isSelected = diasSeleccionadosTemp.includes(day);
        
        dayDiv.className = 'day-cell';
        
        let bgColor = 'white';
        let textColor = '#1a2a4a';
        let borderColor = '#e0e0e0';
        let cursor = 'pointer';
        let fontWeight = 'normal';
        
        if (isFeriado) {
            bgColor = '#fce4ec';
            textColor = '#c62828';
            borderColor = '#c62828';
            cursor = 'not-allowed';
            fontWeight = 'bold';
        } else if (isSelected) {
            bgColor = '#1565C0';
            textColor = 'white';
            borderColor = '#1565C0';
            fontWeight = 'bold';
        } else if (!isWorkingDay) {
            bgColor = '#f5f5f5';
            textColor = '#bbb';
            cursor = 'default';
        }
        
        dayDiv.style.cssText = `
            text-align: center; padding: 10px 0; border-radius: 6px;
            cursor: ${cursor}; font-size: 14px; font-weight: ${fontWeight};
            background: ${bgColor}; color: ${textColor};
            border: 2px solid ${borderColor};
            user-select: none; position: relative;
        `;
        
        dayDiv.textContent = day;
        
        if (isFeriado) {
            dayDiv.title = `🔴 FERIADO: ${feriadosNombres[day] || 'Feriado'}`;
            dayDiv.classList.add('feriado');
        } else if (isWorkingDay) {
            dayDiv.title = 'Haga clic para seleccionar/deseleccionar';
            dayDiv.onclick = function() {
                if (this.classList.contains('feriado')) return;
                
                const dayNum = parseInt(this.textContent);
                const index = diasSeleccionadosTemp.indexOf(dayNum);
                
                if (index > -1) {
                    diasSeleccionadosTemp.splice(index, 1);
                    this.classList.remove('selected');
                    this.style.background = 'white';
                    this.style.color = '#1a2a4a';
                    this.style.borderColor = '#e0e0e0';
                    this.style.fontWeight = 'normal';
                } else {
                    diasSeleccionadosTemp.push(dayNum);
                    this.classList.add('selected');
                    this.style.background = '#1565C0';
                    this.style.color = 'white';
                    this.style.borderColor = '#1565C0';
                    this.style.fontWeight = 'bold';
                }
                
                actualizarContadorSeleccionados();
            };
        } else {
            dayDiv.title = 'Fin de semana';
        }
        
        if (isSelected) dayDiv.classList.add('selected');
        
        gridContainer.appendChild(dayDiv);
    }
    
    const counterDiv = document.createElement('div');
    counterDiv.id = 'contadorSeleccionados';
    counterDiv.style.cssText = `
        text-align: center; font-size: 13px; color: #1a2a4a;
        padding: 8px; background: #f5f6f8; border-radius: 6px; margin: 8px 0;
    `;
    counterDiv.textContent = `📌 ${diasSeleccionadosTemp.length} días seleccionados | 🔴 ${feriadosDias.length} feriados (no editables)`;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex; gap: 8px; justify-content: center;
        margin-top: 12px; flex-wrap: wrap;
    `;
    
    const btnSelectAll = document.createElement('button');
    btnSelectAll.style.cssText = `
        background: #4A90D9; color: white; border: none; padding: 8px 20px;
        border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;
        font-family: 'Times New Roman', Times, serif; flex: 1; min-width: 100px;
    `;
    btnSelectAll.textContent = '✅ Seleccionar Todos';
    btnSelectAll.onclick = function() {
        diasSeleccionadosTemp = workingDays.filter(d => !feriadosDias.includes(d));
        actualizarCalendarioSeleccionados();
        actualizarContadorSeleccionados();
    };
    
    const btnClear = document.createElement('button');
    btnClear.style.cssText = `
        background: #e0e0e0; color: #333; border: none; padding: 8px 20px;
        border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;
        font-family: 'Times New Roman', Times, serif; flex: 1; min-width: 100px;
    `;
    btnClear.textContent = '🧹 Limpiar Selección';
    btnClear.onclick = function() {
        diasSeleccionadosTemp = [];
        actualizarCalendarioSeleccionados();
        actualizarContadorSeleccionados();
    };
    
    const btnSave = document.createElement('button');
    btnSave.style.cssText = `
        background: #28a745; color: white; border: none; padding: 8px 25px;
        border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;
        font-family: 'Times New Roman', Times, serif; flex: 1; min-width: 100px;
    `;
    btnSave.textContent = '💾 Guardar';
    btnSave.onclick = function() { guardarDiasSeleccionados(); };
    
    const btnCancel = document.createElement('button');
    btnCancel.style.cssText = `
        background: #dc3545; color: white; border: none; padding: 8px 20px;
        border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;
        font-family: 'Times New Roman', Times, serif; flex: 1; min-width: 80px;
    `;
    btnCancel.textContent = '✖ Cancelar';
    btnCancel.onclick = function() { cerrarModalCalendario(); };
    
    buttonContainer.appendChild(btnSelectAll);
    buttonContainer.appendChild(btnClear);
    buttonContainer.appendChild(btnSave);
    buttonContainer.appendChild(btnCancel);
    
    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(legend);
    container.appendChild(gridContainer);
    container.appendChild(counterDiv);
    container.appendChild(buttonContainer);
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    modalCalendario = overlay;
    
    overlay.onclick = function(e) {
        if (e.target === this) cerrarModalCalendario();
    };
}

function actualizarCalendarioSeleccionados() {
    const days = document.querySelectorAll('#calendarioOverlay .day-cell');
    const feriadosDias = feriadosDelMes.map(f => f.dia);
    
    days.forEach(dayDiv => {
        const dayNum = parseInt(dayDiv.textContent);
        if (!isNaN(dayNum) && !feriadosDias.includes(dayNum)) {
            const isSelected = diasSeleccionadosTemp.includes(dayNum);
            if (isSelected) {
                dayDiv.classList.add('selected');
                dayDiv.style.background = '#1565C0';
                dayDiv.style.color = 'white';
                dayDiv.style.borderColor = '#1565C0';
                dayDiv.style.fontWeight = 'bold';
            } else {
                dayDiv.classList.remove('selected');
                dayDiv.style.background = 'white';
                dayDiv.style.color = '#1a2a4a';
                dayDiv.style.borderColor = '#e0e0e0';
                dayDiv.style.fontWeight = 'normal';
            }
        }
    });
}

function actualizarContadorSeleccionados() {
    const counter = document.getElementById('contadorSeleccionados');
    if (counter) {
        const feriadosDias = feriadosDelMes.map(f => f.dia);
        counter.textContent = `📌 ${diasSeleccionadosTemp.length} días seleccionados | 🔴 ${feriadosDias.length} feriados (no editables)`;
    }
}

function guardarDiasSeleccionados() {
    if (diasSeleccionadosTemp.length === 0) {
        if (confirm('⚠️ No ha seleccionado ningún día. ¿Desea eliminar todos los días no laborables?')) {
            localStorage.removeItem(getNoLaborablesStorageKey(currentMonth));
            limpiarSoloNoLaborables();
            actualizarListaNoLaborables([]);
            aplicarFeriadosConTooltips();
            cerrarModalCalendario();
            
            for (let row = 1; row <= totalRows; row++) calculateRowTotals(row, currentMonth);
            calculateColumnTotals(currentMonth);
            calculateWorkedDays();
            
            alert('✅ Días no laborables eliminados correctamente.');
        }
        return;
    }
    
    guardarDiasNoLaborables(diasSeleccionadosTemp);
    aplicarDiasNoLaborables(diasSeleccionadosTemp);
    actualizarListaNoLaborables(diasSeleccionadosTemp);
    cerrarModalCalendario();
    
    alert(`✅ ${diasSeleccionadosTemp.length} días no laborables guardados:\n${diasSeleccionadosTemp.sort((a,b) => a-b).join(', ')}`);
}

function cerrarModalCalendario() {
    if (modalCalendario) {
        if (modalCalendario.parentNode) {
            document.body.removeChild(modalCalendario);
        }
        modalCalendario = null;
    }
}

// ============================================
// FUNCIONES DÍAS NO LABORABLES
// ============================================

function aplicarFeriadosConTooltips() {
    const feriadosDias = obtenerFeriadosComoDias(currentMonth);
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    
    const allInputs = document.querySelectorAll('#tabla-container .att-day-input');
    allInputs.forEach(input => {
        if (input.classList.contains('att-feriado')) {
            const id = input.id;
            if (id && id.startsWith('att-r')) {
                const parts = id.split('-');
                const diaStr = parts[2] ? parts[2].replace('d', '') : '';
                const dia = parseInt(diaStr);
                if (!isNaN(dia) && !feriadosDias.includes(dia)) {
                    input.value = '';
                    input.className = 'att-day-input';
                    input.readOnly = false;
                    input.style.backgroundColor = '';
                    input.style.color = '';
                    input.style.cursor = '';
                    input.style.fontWeight = '';
                    input.title = '';
                }
            }
        }
    });
    
    feriadosDias.forEach(dia => {
        const nombreFeriado = obtenerNombreFeriado(dia);
        for (let row = 1; row <= totalEstudiantes; row++) {
            const input = document.getElementById(`att-r${row}-d${dia}-m${currentMonth}`);
            if (input) {
                input.value = 'F';
                input.className = 'att-day-input att-feriado';
                input.readOnly = true;
                input.style.backgroundColor = '#fce4ec';
                input.style.color = '#c62828';
                input.style.cursor = 'help';
                input.style.fontWeight = 'bold';
                input.title = `🔴 FERIADO: ${nombreFeriado}`;
            }
        }
    });
}

function limpiarSoloNoLaborables() {
    const inputs = document.querySelectorAll('.att-no-laborable');
    const feriadosDias = obtenerFeriadosComoDias(currentMonth);
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    
    inputs.forEach(input => {
        const id = input.id;
        if (id && id.startsWith('att-r')) {
            const parts = id.split('-');
            const diaStr = parts[2] ? parts[2].replace('d', '') : '';
            const dia = parseInt(diaStr);
            
            if (!isNaN(dia) && !feriadosDias.includes(dia)) {
                const rowMatch = id.match(/att-r(\d+)-d/);
                if (rowMatch) {
                    const row = parseInt(rowMatch[1]);
                    if (row <= totalEstudiantes) {
                        input.value = '';
                        input.className = 'att-day-input';
                        input.readOnly = false;
                        input.style.backgroundColor = '';
                        input.style.color = '';
                        input.style.cursor = '';
                        input.style.fontWeight = '';
                        input.title = '';
                    }
                }
            }
        }
    });
}

function aplicarDiasNoLaborables(dias) {
    limpiarSoloNoLaborables();
    aplicarFeriadosConTooltips();
    
    if (!dias || dias.length === 0) return;
    
    const feriadosDias = obtenerFeriadosComoDias(currentMonth);
    const noLaborables = dias.filter(d => !feriadosDias.includes(d));
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    
    if (noLaborables.length === 0) return;
    
    noLaborables.forEach(dia => {
        for (let row = 1; row <= totalEstudiantes; row++) {
            const input = document.getElementById(`att-r${row}-d${dia}-m${currentMonth}`);
            if (input) {
                if (!feriadosDias.includes(dia)) {
                    input.value = 'D';
                    input.className = 'att-day-input att-no-laborable';
                    input.readOnly = true;
                    input.style.backgroundColor = '#e3f2fd';
                    input.style.color = '#1565C0';
                    input.style.cursor = 'not-allowed';
                    input.style.fontWeight = 'bold';
                    input.title = '🔵 Día no laborable';
                }
            }
        }
    });
    
    for (let row = 1; row <= totalEstudiantes; row++) calculateRowTotals(row, currentMonth);
    calculateColumnTotals(currentMonth);
    calculateWorkedDays();
}

function obtenerDiasNoLaborablesActuales() {
    const feriadosDias = obtenerFeriadosComoDias(currentMonth);
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    
    const noLaborables = [];
    const allInputs = document.querySelectorAll('#tabla-container .att-day-input');
    allInputs.forEach(input => {
        if (input.value === 'D' && !input.classList.contains('att-feriado')) {
            const id = input.id;
            if (id && id.startsWith('att-r')) {
                const parts = id.split('-');
                const diaStr = parts[2] ? parts[2].replace('d', '') : '';
                const dia = parseInt(diaStr);
                const rowMatch = id.match(/att-r(\d+)-d/);
                if (rowMatch) {
                    const row = parseInt(rowMatch[1]);
                    if (!isNaN(dia) && !feriadosDias.includes(dia) && !noLaborables.includes(dia) && row <= totalEstudiantes) {
                        noLaborables.push(dia);
                    }
                }
            }
        }
    });
    
    return noLaborables;
}

function actualizarListaNoLaborables(dias) {
    const listElement = document.getElementById('noLaborablesList');
    const infoElement = document.getElementById('noLaborablesInfo');
    const feriadosDias = obtenerFeriadosComoDias(currentMonth);
    
    const noLaborables = dias.filter(d => !feriadosDias.includes(d));
    
    if (noLaborables.length > 0) {
        const diasOrdenados = [...noLaborables].sort((a, b) => a - b);
        listElement.textContent = `📅 ${diasOrdenados.join(', ')}`;
        infoElement.textContent = `🔵 ${noLaborables.length} días no laborables`;
        infoElement.style.display = 'inline-block';
    } else {
        listElement.textContent = 'Ninguno seleccionado';
        infoElement.textContent = '🔵 0 días no laborables';
    }
}

function limpiarDiasNoLaborables() {
    const feriadosDias = obtenerFeriadosComoDias(currentMonth);
    const diasActuales = obtenerDiasNoLaborablesActuales().filter(d => !feriadosDias.includes(d));
    
    const mensaje = `🧹 LIMPIAR DATOS\n\n` +
                   `📅 Mes: ${MESES[currentMonth]}\n` +
                   `📌 Días no laborables: ${diasActuales.length > 0 ? diasActuales.sort((a,b) => a-b).join(', ') : 'Ninguno'}\n\n` +
                   `Seleccione qué desea limpiar:\n` +
                   `1️⃣ Solo días no laborables\n` +
                   `2️⃣ Solo datos de asistencia (P, A, T, E)\n` +
                   `3️⃣ Ambos (todo el mes)\n` +
                   `4️⃣ Cancelar\n\n` +
                   `⚠️ Esta acción no se puede deshacer.`;
    
    const opcion = prompt(mensaje, '1');
    
    if (opcion === null || opcion === '4') return;
    
    switch(opcion) {
        case '1': limpiarSoloNoLaborablesConConfirmacion(); break;
        case '2': limpiarSoloAsistenciaConConfirmacion(); break;
        case '3': limpiarTodoElMesConConfirmacion(); break;
        default: alert('❌ Opción no válida.'); break;
    }
}

function limpiarSoloNoLaborablesConConfirmacion() {
    const feriadosDias = obtenerFeriadosComoDias(currentMonth);
    const diasActuales = obtenerDiasNoLaborablesActuales().filter(d => !feriadosDias.includes(d));
    
    if (diasActuales.length === 0) {
        alert('ℹ️ No hay días no laborables para limpiar.');
        return;
    }
    
    if (!confirm(`⚠️ ¿Eliminar SOLO los días no laborables?\n\n📌 Días: ${diasActuales.sort((a,b) => a-b).join(', ')}`)) return;
    
    localStorage.removeItem(getNoLaborablesStorageKey(currentMonth));
    limpiarSoloNoLaborables();
    actualizarListaNoLaborables([]);
    aplicarFeriadosConTooltips();
    
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    for (let row = 1; row <= estudiantes.length; row++) calculateRowTotals(row, currentMonth);
    calculateColumnTotals(currentMonth);
    calculateWorkedDays();
    
    alert('✅ Días no laborables eliminados correctamente.');
}

function limpiarSoloAsistenciaConConfirmacion() {
    if (!confirm(`⚠️ ¿Eliminar TODOS los datos de asistencia (P, A, T, E) del mes ${MESES[currentMonth]}?`)) return;
    
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const tandaActualNorm = (currentTanda || 'Matutina').replace(/\s+/g, '_');
    
    estudiantes.forEach(est => {
        if (!est.uid) return;
        const claves = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('att')) continue;
            const info = parsearClaveAsistencia(key);
            if (!info) continue;
            if (info.uid !== est.uid) continue;
            if (info.mes !== currentMonth) continue;
            
            if (info.formato !== 'viejo') {
                if (info.grado !== currentGrade) continue;
                if (info.seccion !== currentSection) continue;
                if (info.tanda !== tandaActualNorm) continue;
            }
            
            claves.push(key);
        }
        claves.forEach(k => localStorage.removeItem(k));
    });
    
    const allInputs = document.querySelectorAll('#tabla-container .att-day-input');
    allInputs.forEach(input => {
        if (!input.classList.contains('att-feriado') && !input.classList.contains('att-no-laborable') && !input.classList.contains('att-bloqueado')) {
            input.value = '';
            input.dataset.valorAnterior = '';
            input.className = 'att-day-input';
            input.readOnly = false;
            input.style.backgroundColor = '';
            input.style.color = '';
            input.style.cursor = '';
            input.style.fontWeight = '';
            input.title = '';
        }
    });
    
    for (let row = 1; row <= estudiantes.length; row++) calculateRowTotals(row, currentMonth);
    calculateColumnTotals(currentMonth);
    calculateWorkedDays();
    
    alert('✅ Datos de asistencia eliminados correctamente.');
}

function limpiarTodoElMesConConfirmacion() {
    const feriadosDias = obtenerFeriadosComoDias(currentMonth);
    const diasActuales = obtenerDiasNoLaborablesActuales().filter(d => !feriadosDias.includes(d));
    
    let mensaje = `⚠️ ¿Eliminar TODOS los datos del mes ${MESES[currentMonth]}?\n\n`;
    mensaje += `📌 Días no laborables: ${diasActuales.length > 0 ? diasActuales.sort((a,b) => a-b).join(', ') : 'Ninguno'}\n`;
    mensaje += `📊 Datos de asistencia: TODOS (P, A, T, E)\n\n`;
    mensaje += `🔴 Los feriados se mantendrán.\n`;
    mensaje += `Esta acción no se puede deshacer.`;
    
    if (!confirm(mensaje)) return;
    
    localStorage.removeItem(getNoLaborablesStorageKey(currentMonth));
    
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const tandaActualNorm = (currentTanda || 'Matutina').replace(/\s+/g, '_');
    
    estudiantes.forEach(est => {
        if (!est.uid) return;
        const claves = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('att')) continue;
            const info = parsearClaveAsistencia(key);
            if (!info) continue;
            if (info.uid !== est.uid) continue;
            if (info.mes !== currentMonth) continue;
            
            if (info.formato !== 'viejo') {
                if (info.grado !== currentGrade) continue;
                if (info.seccion !== currentSection) continue;
                if (info.tanda !== tandaActualNorm) continue;
            }
            
            claves.push(key);
        }
        claves.forEach(k => localStorage.removeItem(k));
    });
    
    const allInputs = document.querySelectorAll('#tabla-container .att-day-input');
    allInputs.forEach(input => {
        if (!input.classList.contains('att-feriado') && !input.classList.contains('att-bloqueado')) {
            input.value = '';
            input.dataset.valorAnterior = '';
            input.className = 'att-day-input';
            input.readOnly = false;
            input.style.backgroundColor = '';
            input.style.color = '';
            input.style.cursor = '';
            input.style.fontWeight = '';
            input.title = '';
        }
    });
    
    aplicarFeriadosConTooltips();
    actualizarListaNoLaborables([]);
    
    for (let row = 1; row <= estudiantes.length; row++) calculateRowTotals(row, currentMonth);
    calculateColumnTotals(currentMonth);
    calculateWorkedDays();
    
    alert('✅ Todos los datos del mes han sido eliminados.');
}

// ============================================
// 📊 SINCRONIZAR CON CRONÓMETRO
// ============================================

function obtenerDiasLaborablesDelMes() {
    try {
        const stored = localStorage.getItem('diasLaborablesPorMes');
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (e) {
        return null;
    }
}

function getDiasEsperadosParaMes(mesIndex) {
    const data = obtenerDiasLaborablesDelMes();
    if (!data || !data.diasPorMes || !Array.isArray(data.diasPorMes)) return null;
    if (mesIndex >= 0 && mesIndex < data.diasPorMes.length) return data.diasPorMes[mesIndex].dias;
    return null;
}

function getTotalDiasEsperados() {
    const data = obtenerDiasLaborablesDelMes();
    if (data && data.totalDias) return data.totalDias;
    return null;
}

function calcularDiasTrabajadosConValidacion() {
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    let maxMarks = 0;
    for (let row = 1; row <= totalEstudiantes; row++) {
        let marks = 0;
        const inputs = document.querySelectorAll(`#tabla-container input[id^="att-r${row}-d"][id$="-m${currentMonth}"]`);
        inputs.forEach(input => {
            const val = input.value.toUpperCase();
            if (val === 'P' || val === 'T' || val === 'A' || val === 'E') marks++;
        });
        if (marks > maxMarks) maxMarks = marks;
    }
    
    const diasEsperados = getDiasEsperadosParaMes(currentMonth);
    const totalEsperados = getTotalDiasEsperados();
    
    const daysWorked = document.getElementById('daysWorked');
    if (daysWorked) {
        let texto = maxMarks;
        if (diasEsperados !== null) {
            texto = `${maxMarks} / ${diasEsperados}`;
            if (maxMarks > diasEsperados) {
                daysWorked.style.color = '#c5221f';
                daysWorked.style.fontWeight = 'bold';
            } else if (maxMarks === diasEsperados) {
                daysWorked.style.color = '#137333';
                daysWorked.style.fontWeight = 'bold';
            } else {
                daysWorked.style.color = '#b9770e';
                daysWorked.style.fontWeight = 'normal';
            }
        }
        daysWorked.value = texto;
    }
    
    return { registrados: maxMarks, esperados: diasEsperados, totalEsperados: totalEsperados };
}

function mostrarInfoCronometro() {
    const data = obtenerDiasLaborablesDelMes();
    if (!data) return;
    
    const rowControls = document.querySelector('.row-controls');
    if (!rowControls) return;
    
    const oldInfo = document.getElementById('cronometroInfo');
    if (oldInfo) oldInfo.remove();
    
    const infoDiv = document.createElement('span');
    infoDiv.id = 'cronometroInfo';
    infoDiv.className = 'sync-info';
    infoDiv.style.cssText = `
        background: #f0f4f8; border-color: #4A90D9; color: #1f4b66;
        font-size: 11px; padding: 4px 12px; border-radius: 4px;
        border: 1px solid #4A90D9; font-weight: 600; white-space: nowrap;
    `;
    
    const mesActual = MESES[currentMonth] || 'Mes';
    const diasEsperados = getDiasEsperadosParaMes(currentMonth);
    const totalDias = getTotalDiasEsperados();
    
    let texto = `📊 ${mesActual}: `;
    if (diasEsperados !== null) {
        texto += `${diasEsperados} días esperados`;
        if (totalDias !== null) texto += ` · ${totalDias} total`;
    } else {
        texto += 'sin datos del cronómetro';
    }
    
    infoDiv.textContent = texto;
    rowControls.appendChild(infoDiv);
}

window.calculateWorkedDays = function() { calcularDiasTrabajadosConValidacion(); };

function initSincronizacionCronometro() {
    mostrarInfoCronometro();
    setTimeout(() => calcularDiasTrabajadosConValidacion(), 300);
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'diasLaborablesPorMes') {
            mostrarInfoCronometro();
            calcularDiasTrabajadosConValidacion();
        }
    });
}

// ============================================
// 🔍 DIAGNÓSTICO
// ============================================

function diagnosticarSincronizacion() {
    console.log('========== DIAGNÓSTICO ==========');
    
    const att = Object.keys(localStorage).filter(k => k.startsWith('att'));
    console.log('📊 Total claves att:', att.length);
    console.log('📋 Primeras 10:', att.slice(0, 10));
    
    const porFormato = { nuevo_pipe: 0, intermedio: 0, viejo: 0 };
    const porGrupo = {};
    
    att.forEach(k => {
        const info = parsearClaveAsistencia(k);
        if (!info) return;
        porFormato[info.formato]++;
        
        if (info.formato !== 'viejo') {
            const grupoKey = `g${info.grado}_s${info.seccion}_t${info.tanda}`;
            porGrupo[grupoKey] = (porGrupo[grupoKey] || 0) + 1;
        }
    });
    
    console.log('📋 Por formato:', porFormato);
    console.log('📋 Por grupo:', porGrupo);
    
    const grupo = obtenerGrupoActual();
    console.log(`📌 Grupo actual: Grado="${grupo.grado}", Sección="${grupo.seccion}", Tanda="${grupo.tanda}"`);
    console.log('📌 Variables: currentGrade=' + currentGrade + ', currentSection=' + currentSection + ', currentTanda=' + currentTanda);
    
    console.log('========== FIN ==========');
}

function forzarSincronizacion() {
    aplicarDatosSincronizados();
    generateAttendanceTable();
    setTimeout(diagnosticarSincronizacion, 300);
    mostrarToast('🔄 Sincronización forzada completada');
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.syncData = syncData;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;
window.actualizarInfoSincronizada = actualizarInfoSincronizada;
window.cambiarMes = cambiarMes;
window.addRow = addRow;
window.deleteRow = deleteRow;
window.seleccionarDiasNoLaborables = seleccionarDiasNoLaborables;
window.limpiarDiasNoLaborables = limpiarDiasNoLaborables;
window.forzarSincronizacion = forzarSincronizacion;
window.diagnosticarSincronizacion = diagnosticarSincronizacion;
window.obtenerEstudiantesDesdeRegistros = obtenerEstudiantesDesdeRegistros;
window.validateAtt = validateAtt;
window.handleAttNav = handleAttNav;
window.calculateRowTotals = calculateRowTotals;
window.calculateColumnTotals = calculateColumnTotals;
window.guardarDatosAsistencia = guardarDatosAsistencia;
window.cargarDatosAsistencia = cargarDatosAsistencia;
window.getUidDeFila = getUidDeFila;
window.getClaveAsistencia = getClaveAsistencia;
window.parsearClaveAsistencia = parsearClaveAsistencia;
window.eliminarAsistenciasHuerfanas = eliminarAsistenciasHuerfanas;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ASISTENCIA cargando...');
    
    aplicarDatosSincronizados();
    
    const mesActual = obtenerMesActualDelAñoEscolar();
    currentMonth = mesActual;
    
    document.getElementById('schoolYearText').textContent = currentSchoolYear;
    
    const monthSelector = document.getElementById('monthSelector');
    if (monthSelector) monthSelector.value = currentMonth;
    
    document.getElementById('addRowBtn').addEventListener('click', addRow);
    document.getElementById('deleteRowBtn').addEventListener('click', deleteRow);
    
    const seleccionarBtn = document.getElementById('seleccionarDiasBtn');
    const limpiarBtn = document.getElementById('limpiarDiasBtn');
    
    if (seleccionarBtn) seleccionarBtn.addEventListener('click', seleccionarDiasNoLaborables);
    if (limpiarBtn) limpiarBtn.addEventListener('click', limpiarDiasNoLaborables);
    
    generateAttendanceTable();
    
    window.addEventListener('beforeunload', function() {
        try {
            guardarDatosAsistencia(currentMonth);
        } catch (e) {}
    });
    
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            try {
                guardarDatosAsistencia(currentMonth);
            } catch (e) {}
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'registrosSigerd') {
            setTimeout(() => { aplicarDatosSincronizados(); generateAttendanceTable(); }, 300);
        }
        if (e.key === 'datosSincronizados') {
            setTimeout(() => { aplicarDatosSincronizados(); generateAttendanceTable(); }, 300);
        }
    });
    
    document.addEventListener('formulariosActualizado', function(e) {
        setTimeout(() => { aplicarDatosSincronizados(); generateAttendanceTable(); }, 300);
    });
    
    setInterval(function() {
        const stored = localStorage.getItem('registrosSigerd');
        if (stored) {
            try {
                const registros = JSON.parse(stored);
                if (Array.isArray(registros)) {
                    const hash = registros.length + '|' + registros.map(r => r.uid || '').join(',');
                    if (hash !== _ultimoHashRegistros) {
                        _ultimoHashRegistros = hash;
                        aplicarDatosSincronizados();
                        generateAttendanceTable();
                    }
                }
            } catch (e) {}
        }
        
        const grupo = obtenerGrupoActual();
        const grupoActual = `${grupo.grado}|${grupo.seccion}|${grupo.tanda}`;
        if (grupoActual !== _grupoAnterior) {
            _grupoAnterior = grupoActual;
            aplicarDatosSincronizados();
            generateAttendanceTable();
        }
    }, 3000);
    
    setTimeout(initSincronizacionCronometro, 500);
    setTimeout(diagnosticarSincronizacion, 2000);
    
    console.log('✅ Inicialización completada');
});

// ============================================
// BOTÓN FLOTANTE
// ============================================

setTimeout(function() {
    if (!document.getElementById('btnSyncFlotante')) {
        const btn = document.createElement('button');
        btn.id = 'btnSyncFlotante';
        btn.textContent = '🔄 FORZAR SINCRONIZACIÓN';
        btn.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            background: #C8102E; color: white; border: none;
            padding: 12px 24px; border-radius: 50px;
            font-family: 'Times New Roman', Times, serif; font-size: 14px;
            font-weight: bold; cursor: pointer;
            box-shadow: 0 4px 15px rgba(200, 16, 46, 0.4);
        `;
        btn.onclick = function() { forzarSincronizacion(); };
        document.body.appendChild(btn);
    }
}, 1000);

console.log('📚 ASISTENCIA.js cargado - FORMATO PIPE ROBUSTO');