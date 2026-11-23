/**
RESUMEN ANUAL DE ASISTENCIA - VERSIÓN POR UID
✅ Lee asistencias por UID (no por fila)
✅ Migración automática de datos viejos
✅ Eliminación de asistencias huérfanas
✅ 45 filas fijas (filas sin estudiante bloqueadas)
✅ Muestra estudiantes sin datos
✅ Guarda datos para el Boletín CON uid
✅ Sincronización automática con Formulario
✅ NUEVO: Clic en Nº abre MODAL HORIZONTAL
   con FOTO + TELÉFONO + ASISTENCIA DEL MES + TOTAL GENERAL
*/

// ============================================
// CONFIGURACIÓN
// ============================================
const MESES_INDICES = [
    { idx: 0, nombre: 'Agosto' },
    { idx: 1, nombre: 'Septiembre' },
    { idx: 2, nombre: 'Octubre' },
    { idx: 3, nombre: 'Noviembre' },
    { idx: 4, nombre: 'Diciembre' },
    { idx: 5, nombre: 'Enero' },
    { idx: 6, nombre: 'Febrero' },
    { idx: 7, nombre: 'Marzo' },
    { idx: 8, nombre: 'Abril' },
    { idx: 9, nombre: 'Mayo' },
    { idx: 10, nombre: 'Junio' }
];

const PERIODOS_MESES = {
    P1: { meses: [0, 1, 2], nombre: 'Agosto-Octubre' },
    P2: { meses: [3, 4, 5], nombre: 'Noviembre-Enero' },
    P3: { meses: [6, 7], nombre: 'Febrero-Marzo' },
    P4: { meses: [8, 9, 10], nombre: 'Abril-Junio' }
};

const MES_A_PERIODO = {
    0: 'P1', 1: 'P1', 2: 'P1',
    3: 'P2', 4: 'P2', 5: 'P2',
    6: 'P3', 7: 'P3',
    8: 'P4', 9: 'P4', 10: 'P4'
};

const MONTH_PREFIX_MAP = {
    0: 'ago', 1: 'sep', 2: 'oct', 3: 'nov', 4: 'dic',
    5: 'ene', 6: 'feb', 7: 'mar', 8: 'abr', 9: 'may', 10: 'jun'
};

let currentGrade = 3;
let currentSection = 'A';
let currentTanda = 'Matutina';
let currentPageNum = 1;
const totalPages = 2;
let currentSchoolYear = '2025-2026';
let modalCallback = null;
let totalRows = 45;
const MAX_ROWS = 100;
const MIN_ROWS = 1;
let _intervaloSync = null;
let _ultimoHashRegistros = '';
let _migracionRealizada = false;

// ============================================
// FUNCIONES DE NORMALIZACIÓN
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

function getGradeText(grade) {
    const texts = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to' };
    return texts[grade] || '3er';
}

function getGradeFullText(grade) {
    const texts = { 1: 'Primer Grado', 2: 'Segundo Grado', 3: 'Tercer Grado', 4: 'Cuarto Grado', 5: 'Quinto Grado', 6: 'Sexto Grado' };
    return texts[grade] || 'Tercer Grado';
}

// ============================================
// DETECTAR GRADO, SECCIÓN Y TANDA
// ============================================
function obtenerGradoDesdePortada() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const gradoUrl = urlParams.get('grado');
        if (gradoUrl) return decodeURIComponent(gradoUrl);

        const fuentes = [
            localStorage.getItem('datosSincronizados'),
            localStorage.getItem('registroGradoData'),
            localStorage.getItem('minerd_grado_completo')
        ];

        for (const fuente of fuentes) {
            if (fuente) {
                try {
                    const datos = JSON.parse(fuente);
                    if (datos && datos.grado) return datos.grado;
                } catch (e) { continue; }
            }
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
    } catch (e) { return 'A'; }
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
    } catch (e) { return 'Matutina'; }
}

function getCurrentSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const beforeAugustFirst = (month < 7) || (month === 7 && day < 1);
    return beforeAugustFirst ? `${year - 1}-${year}` : `${year}-${year + 1}`;
}

function mapearGrado(gradoTexto) {
    const gradoMap = {
        'Primer Grado': 1, 'Segundo Grado': 2, 'Tercer Grado': 3,
        'Cuarto Grado': 4, 'Quinto Grado': 5, 'Sexto Grado': 6,
        '1ER': 1, '2DO': 2, '3ER': 3, '4TO': 4, '5TO': 5, '6TO': 6,
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
        'PRIMER GRADO': 1, 'SEGUNDO GRADO': 2, 'TERCER GRADO': 3,
        'CUARTO GRADO': 4, 'QUINTO GRADO': 5, 'SEXTO GRADO': 6
    };
    const normalizado = normalizarTexto(gradoTexto);
    return gradoMap[normalizado] || gradoMap[gradoTexto] || 3;
}

// ============================================
// OBTENER ESTUDIANTES DESDE registrosSigerd
// ============================================
function obtenerEstudiantesDesdeRegistros() {
    try {
        const stored = localStorage.getItem('registrosSigerd');
        if (!stored) return [];
        
        const registros = JSON.parse(stored);
        if (!Array.isArray(registros) || registros.length === 0) return [];
        
        const gradoActual = normalizarTexto(getGradeFullText(currentGrade));
        const seccionActual = normalizarTexto(currentSection);
        const tandaActual = normalizarTexto(currentTanda);
        
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
        
        console.log(`✅ ${filtrados.length} estudiantes encontrados`);
        return filtrados;
    } catch (e) {
        console.warn('⚠️ Error obteniendo estudiantes:', e);
        return [];
    }
}

// ============================================
// 🖼️ FOTO Y DATOS DEL ESTUDIANTE
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

// ============================================
// 📊 CONTAR ASISTENCIA (MES y GENERAL)
// ============================================
function contarAsistenciasPorUid(uid, mesIndex) {
    const totales = { P: 0, T: 0, A: 0, E: 0, total: 0 };
    if (!uid) return totales;
    
    const prefijo = `att_${uid}_`;
    const sufijo = `_m${mesIndex}`;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(prefijo) && key.endsWith(sufijo)) {
            const val = String(localStorage.getItem(key) || '').toUpperCase();
            if (totales[val] !== undefined) totales[val]++;
            if (val === 'P' || val === 'T' || val === 'A' || val === 'E') totales.total++;
        }
    }
    return totales;
}

function contarAsistenciasTodosLosMeses(uid) {
    const totales = { P: 0, T: 0, A: 0, E: 0, total: 0 };
    const porMes = {};
    if (!uid) return { totales, porMes };
    
    const prefijo = `att_${uid}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!key.startsWith(prefijo)) continue;
        
        const match = key.match(/^att_([^_]+)_d\d+_m(\d+)$/);
        if (!match || match[1] !== uid) continue;
        
        const mes = parseInt(match[2], 10);
        const val = String(localStorage.getItem(key) || '').toUpperCase();
        
        if (!porMes[mes]) porMes[mes] = { P: 0, T: 0, A: 0, E: 0, total: 0 };
        
        if (totales[val] !== undefined) totales[val]++;
        if (val === 'P' || val === 'T' || val === 'A' || val === 'E') {
            totales.total++;
            porMes[mes].total++;
            porMes[mes][val]++;
        }
    }
    return { totales, porMes };
}

// ============================================
// ✅ MIGRACIÓN DE ASISTENCIAS VIEJAS → UID
// ============================================
function migrarAsistenciasViejas() {
    if (_migracionRealizada) return;
    _migracionRealizada = true;
    
    try {
        const estudiantes = obtenerEstudiantesDesdeRegistros();
        if (estudiantes.length === 0) return;
        
        const clavesViejas = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('att_datos_')) {
                clavesViejas.push(key);
            }
        }
        
        if (clavesViejas.length === 0) {
            console.log('ℹ️ No hay datos viejos que migrar');
            return;
        }
        
        let migradas = 0;
        
        clavesViejas.forEach(claveVieja => {
            try {
                const dataVieja = JSON.parse(localStorage.getItem(claveVieja) || '{}');
                if (!dataVieja || typeof dataVieja !== 'object') return;
                
                const match = claveVieja.match(/_m(\d+)$/);
                if (!match) return;
                const mesIdx = parseInt(match[1]);
                
                estudiantes.forEach(est => {
                    const uid = est.uid;
                    const orden = parseInt(est.orden);
                    if (!uid || !orden) return;
                    
                    for (const [key, value] of Object.entries(dataVieja)) {
                        if (key.includes(`r${orden}-d`) && key.endsWith(`-m${mesIdx}`)) {
                            const diaMatch = key.match(/r\d+-d(\d+)-m\d+/);
                            if (diaMatch) {
                                const dia = diaMatch[1];
                                const nuevaKey = `att_${uid}_d${dia}_m${mesIdx}`;
                                const val = String(value).toUpperCase();
                                
                                if (val && val !== '-' && val !== '' && !localStorage.getItem(nuevaKey)) {
                                    localStorage.setItem(nuevaKey, val);
                                    migradas++;
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.warn('⚠️ Error migrando clave:', claveVieja, e);
            }
        });
        
        if (migradas > 0) {
            console.log(`✅ ${migradas} asistencias migradas al formato por UID`);
        }
        
        clavesViejas.forEach(k => localStorage.removeItem(k));
        console.log(`🗑️ ${clavesViejas.length} claves viejas eliminadas`);
        
    } catch (e) {
        console.warn('⚠️ Error en migración:', e);
    }
}

// ============================================
// ✅ ELIMINAR ASISTENCIAS HUÉRFANAS
// ============================================
function eliminarAsistenciasHuerfanas() {
    try {
        const estudiantes = obtenerEstudiantesDesdeRegistros();
        const uidsValidos = new Set(estudiantes.map(e => e.uid).filter(Boolean));
        
        const clavesAEliminar = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('att_')) {
                const match = key.match(/^att_([^_]+)_d\d+_m\d+$/);
                if (match) {
                    const uid = match[1];
                    if (!uidsValidos.has(uid)) {
                        clavesAEliminar.push(key);
                    }
                }
            }
        }
        
        clavesAEliminar.forEach(k => localStorage.removeItem(k));
        if (clavesAEliminar.length > 0) {
            console.log(`🗑️ ${clavesAEliminar.length} asistencias huérfanas eliminadas`);
        }
    } catch (e) {
        console.warn('⚠️ Error eliminando huérfanas:', e);
    }
}

// ============================================
// ✅ CONTAR MARCAS POR UID Y MES
// ============================================
function contarMarcasPorUid(uid, monthIdx) {
    let p = 0, t = 0, a = 0, e = 0;
    
    if (!uid) return { P: 0, T: 0, A: 0, E: 0 };
    
    const prefijo = `att_${uid}_`;
    const sufijo = `_m${monthIdx}`;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(prefijo) && key.endsWith(sufijo)) {
            const val = String(localStorage.getItem(key) || '').toUpperCase();
            if (val === 'P') p++;
            else if (val === 'T') t++;
            else if (val === 'A') a++;
            else if (val === 'E') e++;
        }
    }
    
    return { P: p, T: t, A: a, E: e };
}

// ============================================
// 👤 MODAL HORIZONTAL DEL ESTUDIANTE
// ============================================
function mostrarModalEstudianteAnual(row, uid) {
    console.log('🎬 mostrarModalEstudianteAnual:', row, uid);
    
    const previo = document.getElementById('modalEstudianteAnual');
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
    
    // Mes actual del año escolar
    const mesActualIdx = obtenerMesActualDelAñoEscolar();
    const asistMes = contarAsistenciasPorUid(uid, mesActualIdx);
    const { totales: asistTotal, porMes } = contarAsistenciasTodosLosMeses(uid);
    const nombreMesActual = MESES_INDICES[mesActualIdx]?.nombre || 'Mes Actual';
    
    const overlay = document.createElement('div');
    overlay.id = 'modalEstudianteAnual';
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
        animation: slideDown 0.3s ease;
    `;
    
    // ---------- ENCABEZADO ----------
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
    
    // ---------- CUERPO ----------
    const body = document.createElement('div');
    body.style.cssText = `
        padding: 20px 24px;
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 22px;
        align-items: start;
    `;
    
    // ============ COLUMNA IZQUIERDA ============
    const colIzq = document.createElement('div');
    colIzq.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
    
    // Foto
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
    
    // Datos
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
    
    // ============ COLUMNA DERECHA ============
    const colDer = document.createElement('div');
    colDer.style.cssText = 'display: flex; flex-direction: column; gap: 14px;';
    
    // ---- ASISTENCIA DEL MES ACTUAL ----
    const bloqueMes = document.createElement('div');
    bloqueMes.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            📊 Asistencia del mes: <span style="color: #e65100;">${nombreMesActual}</span>
        </div>
    `;
    const gridMes = document.createElement('div');
    gridMes.style.cssText = `
        display: grid; grid-template-columns: repeat(5, 1fr);
        gap: 8px;
    `;
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
    
    // ---- TOTAL GENERAL ----
    const bloqueGeneral = document.createElement('div');
    bloqueGeneral.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            🗓️ Total general (todos los meses)
        </div>
    `;
    const gridGeneral = document.createElement('div');
    gridGeneral.style.cssText = `
        display: grid; grid-template-columns: repeat(5, 1fr);
        gap: 8px;
    `;
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
    
    // ---- DETALLE POR MES ----
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
            const nombreMes = MESES_INDICES[m]?.nombre || `Mes ${m}`;
            const esMesActual = m === mesActualIdx;
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
    
    // Mensaje si no hay datos
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
    
    // ---------- BOTÓN CERRAR ----------
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

window.mostrarModalEstudianteAnual = mostrarModalEstudianteAnual;
window.leerFotoEstudiante = leerFotoEstudiante;
window.obtenerEstudiantePorUid = obtenerEstudiantePorUid;
window.contarAsistenciasPorUid = contarAsistenciasPorUid;
window.contarAsistenciasTodosLosMeses = contarAsistenciasTodosLosMeses;

// ============================================
// OBTENER MES ACTUAL DEL AÑO ESCOLAR
// ============================================
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

// ============================================
// SINCRONIZAR DATOS
// ============================================
function aplicarDatosSincronizados() {
    try {
        const gradoTexto = obtenerGradoDesdePortada();
        const seccion = obtenerSeccionDesdePortada();
        const tanda = obtenerTandaDesdePortada();
        const gradoNum = mapearGrado(gradoTexto);
        
        currentGrade = gradoNum;
        currentSection = seccion;
        currentTanda = tanda;
        currentSchoolYear = getCurrentSchoolYear();

        localStorage.setItem('annualAtt_grade', String(currentGrade));
        localStorage.setItem('annualAtt_section', currentSection);
        localStorage.setItem('annualAtt_tanda', currentTanda);

        updateGradeDisplay();
        actualizarContadorEstudiantes();
        
        const schoolYearDisplay = document.getElementById('schoolYearDisplay');
        if (schoolYearDisplay) {
            schoolYearDisplay.textContent = currentSchoolYear;
        }

        console.log('✅ Resumen Anual sincronizado');
        return true;
    } catch (e) {
        console.error('❌ Error aplicando datos sincronizados:', e);
        return false;
    }
}

function updateGradeDisplay() {
    const displayGrade = document.getElementById('currentGradeDisplay');
    const displaySection = document.getElementById('currentSectionDisplay');
    const displayTanda = document.getElementById('currentTandaDisplay');
    
    if (displayGrade) displayGrade.textContent = getGradeFullText(currentGrade);
    if (displaySection) displaySection.textContent = currentSection || 'A';
    if (displayTanda) displayTanda.textContent = currentTanda || 'Matutina';
}

function actualizarContadorEstudiantes() {
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const count = estudiantes.length;

    const badges = document.querySelectorAll('.estudiantes-count-badge');
    badges.forEach(badge => {
        badge.textContent = `👨‍🎓 ${count} estudiantes`;
        if (count === 0) {
            badge.style.background = '#fff3e0';
            badge.style.borderColor = '#e65100';
            badge.style.color = '#e65100';
        } else {
            badge.style.background = '#e3f2fd';
            badge.style.borderColor = '#1565C0';
            badge.style.color = '#1565C0';
        }
    });
    return count;
}

// ============================================
// CALCULAR ASISTENCIA ANUAL (POR UID)
// ============================================
function calculateAnnualAttendance() {
    totalRows = getRowCount();
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    
    console.log(`📊 Calculando asistencia anual para ${totalEstudiantes} estudiantes`);
    
    const acumuladores = {};
    for (let i = 1; i <= totalRows; i++) {
        acumuladores[i] = { P: 0, T: 0, A: 0, E: 0, uid: null };
    }
    
    let totalDiasTrabajadosAnio = 0;
    const estudiantesConDatos = Math.min(totalEstudiantes, totalRows);
    
    for (let i = 1; i <= estudiantesConDatos; i++) {
        acumuladores[i].uid = estudiantes[i - 1].uid;
    }
    
    for (let idx = 0; idx <= 10; idx++) {
        const prefix = MONTH_PREFIX_MAP[idx];
        
        let maxMarks = 0;
        for (let i = 1; i <= estudiantesConDatos; i++) {
            const uid = acumuladores[i].uid;
            if (!uid) continue;
            const conteo = contarMarcasPorUid(uid, idx);
            const marks = conteo.P + conteo.T + conteo.A + conteo.E;
            if (marks > maxMarks) maxMarks = marks;
        }
        
        totalDiasTrabajadosAnio += maxMarks;
        
        for (let i = 1; i <= estudiantesConDatos; i++) {
            const uid = acumuladores[i].uid;
            if (!uid) continue;
            
            const conteo = contarMarcasPorUid(uid, idx);
            
            acumuladores[i].P += conteo.P;
            acumuladores[i].T += conteo.T;
            acumuladores[i].A += conteo.A;
            acumuladores[i].E += conteo.E;
            
            const asisEl = document.getElementById(`ann_${prefix}_asis_${i}`);
            const tardEl = document.getElementById(`ann_${prefix}_tard_${i}`);
            const ausEl = document.getElementById(`ann_${prefix}_aus_${i}`);
            const excEl = document.getElementById(`ann_${prefix}_exc_${i}`);
            
            if (asisEl) asisEl.value = conteo.P > 0 ? conteo.P : '';
            if (tardEl) tardEl.value = conteo.T > 0 ? conteo.T : '';
            if (ausEl) ausEl.value = conteo.A > 0 ? conteo.A : '';
            if (excEl) excEl.value = conteo.E > 0 ? conteo.E : '';
        }
        
        for (let i = estudiantesConDatos + 1; i <= totalRows; i++) {
            const asisEl = document.getElementById(`ann_${prefix}_asis_${i}`);
            const tardEl = document.getElementById(`ann_${prefix}_tard_${i}`);
            const ausEl = document.getElementById(`ann_${prefix}_aus_${i}`);
            const excEl = document.getElementById(`ann_${prefix}_exc_${i}`);
            
            if (asisEl) asisEl.value = '-';
            if (tardEl) tardEl.value = '-';
            if (ausEl) ausEl.value = '-';
            if (excEl) excEl.value = '-';
        }
    }
    
    for (let i = 1; i <= totalRows; i++) {
        const totalP = acumuladores[i].P;
        const totalT = acumuladores[i].T;
        const totalA = acumuladores[i].A;
        const totalE = acumuladores[i].E;
        const totalAsistenciaEfectiva = totalP + totalT + totalE;
        
        const resAsis = document.getElementById(`ann_res_asis_${i}`);
        const resTard = document.getElementById(`ann_res_tard_${i}`);
        const resAus = document.getElementById(`ann_res_aus_${i}`);
        const resExc = document.getElementById(`ann_res_exc_${i}`);
        
        if (i <= estudiantesConDatos) {
            if (resAsis) resAsis.value = totalP > 0 ? totalP : '';
            if (resTard) resTard.value = totalT > 0 ? totalT : '';
            if (resAus) resAus.value = totalA > 0 ? totalA : '';
            if (resExc) resExc.value = totalE > 0 ? totalE : '';
        } else {
            if (resAsis) resAsis.value = '-';
            if (resTard) resTard.value = '-';
            if (resAus) resAus.value = '-';
            if (resExc) resExc.value = '-';
        }
        
        const porAsis = document.getElementById(`ann_por_asis_${i}`);
        const porAus = document.getElementById(`ann_por_aus_${i}`);
        
        if (i <= estudiantesConDatos && totalDiasTrabajadosAnio > 0) {
            if (porAsis) {
                const pct = Math.round((totalAsistenciaEfectiva / totalDiasTrabajadosAnio) * 100);
                porAsis.value = pct > 0 ? pct + '%' : '';
            }
            if (porAus) {
                const pct = Math.round((totalA / totalDiasTrabajadosAnio) * 100);
                porAus.value = pct > 0 ? pct + '%' : '';
            }
        } else {
            if (porAsis) porAsis.value = '-';
            if (porAus) porAus.value = '-';
        }
    }
    
    const workedDisplay = document.getElementById('workedDaysDisplay');
    if (workedDisplay) {
        workedDisplay.textContent = totalDiasTrabajadosAnio || '0';
    }
    
    console.log(`✅ Cálculo completado: ${totalDiasTrabajadosAnio} días`);
    
    setTimeout(() => {
        guardarDatosAsistenciaParaBoletin();
    }, 500);
}

// ============================================
// ✅ GUARDAR DATOS PARA EL BOLETÍN
// ============================================
function guardarDatosAsistenciaParaBoletin() {
    console.log('📤 Guardando datos para el Boletín...');
    
    try {
        const estudiantes = obtenerEstudiantesDesdeRegistros();
        const totalEstudiantes = estudiantes.length;
        
        const acumuladores = {};
        for (let i = 0; i < totalEstudiantes; i++) {
            acumuladores[i] = {
                P1: { P: 0, T: 0, A: 0, E: 0 },
                P2: { P: 0, T: 0, A: 0, E: 0 },
                P3: { P: 0, T: 0, A: 0, E: 0 },
                P4: { P: 0, T: 0, A: 0, E: 0 }
            };
        }
        
        for (let idx = 0; idx <= 10; idx++) {
            const periodoKey = MES_A_PERIODO[idx];
            if (!periodoKey) continue;
            
            for (let i = 0; i < totalEstudiantes; i++) {
                const uid = estudiantes[i].uid;
                if (!uid) continue;
                
                const conteo = contarMarcasPorUid(uid, idx);
                acumuladores[i][periodoKey].P += conteo.P;
                acumuladores[i][periodoKey].T += conteo.T;
                acumuladores[i][periodoKey].A += conteo.A;
                acumuladores[i][periodoKey].E += conteo.E;
            }
        }
        
        const datosBoletin = {
            timestamp: new Date().toISOString(),
            grado: currentGrade,
            seccion: currentSection,
            tanda: currentTanda,
            anioEscolar: currentSchoolYear,
            periodosInfo: {
                P1: { meses: 'Agosto-Octubre', cantidad: 3 },
                P2: { meses: 'Noviembre-Enero', cantidad: 3 },
                P3: { meses: 'Febrero-Marzo', cantidad: 2 },
                P4: { meses: 'Abril-Junio', cantidad: 3 }
            },
            estudiantes: []
        };
        
        for (let i = 0; i < totalEstudiantes; i++) {
            const est = estudiantes[i];
            
            const totalP = acumuladores[i].P1.P + acumuladores[i].P2.P + acumuladores[i].P3.P + acumuladores[i].P4.P;
            const totalT = acumuladores[i].P1.T + acumuladores[i].P2.T + acumuladores[i].P3.T + acumuladores[i].P4.T;
            const totalA = acumuladores[i].P1.A + acumuladores[i].P2.A + acumuladores[i].P3.A + acumuladores[i].P4.A;
            const totalE = acumuladores[i].P1.E + acumuladores[i].P2.E + acumuladores[i].P3.E + acumuladores[i].P4.E;
            
            const totalAsistenciaEfectiva = totalP + totalT + totalE;
            const diasReales = totalP + totalT + totalA + totalE;
            
            let pctAsist = 0, pctAus = 0;
            if (diasReales > 0) {
                pctAsist = Math.round((totalAsistenciaEfectiva / diasReales) * 100);
                pctAus = Math.round((totalA / diasReales) * 100);
            }
            
            datosBoletin.estudiantes.push({
                uid: est.uid || '',
                orden: i + 1,
                id: est.id || est.idEstudiante || '',
                nombre: est.nombre || '',
                apellido: est.apellido || '',
                P: totalP, T: totalT, A: totalA, E: totalE,
                asistencia: totalAsistenciaEfectiva,
                ausencia: totalA,
                diasReales: diasReales,
                pctAsistencia: pctAsist,
                pctAusencia: pctAus,
                periodos: {
                    P1: crearPeriodo(acumuladores[i].P1),
                    P2: crearPeriodo(acumuladores[i].P2),
                    P3: crearPeriodo(acumuladores[i].P3),
                    P4: crearPeriodo(acumuladores[i].P4)
                }
            });
        }
        
        const clave = `boletin_asistencia_data_${currentGrade}_${currentSection}_${currentTanda}_${currentSchoolYear}`;
        localStorage.setItem(clave, JSON.stringify(datosBoletin));
        
        console.log(`✅ Datos guardados para el Boletín: ${datosBoletin.estudiantes.length} estudiantes`);
        return datosBoletin;
        
    } catch (e) {
        console.error('❌ Error guardando datos para boletín:', e);
        return null;
    }
}

function crearPeriodo(acc) {
    return {
        P: acc.P, T: acc.T, A: acc.A, E: acc.E,
        asistencia: acc.P + acc.T + acc.E,
        ausencia: acc.A,
        diasReales: acc.P + acc.T + acc.A + acc.E
    };
}

// ============================================
// GENERAR TABLA ANUAL
// ============================================
function generateAnnualAttendanceTable() {
    const container = document.getElementById('annualAttendanceContainer');
    if (!container) return;
    
    totalRows = getRowCount();
    const headerClass = getHeaderClass(currentGrade);
    const estudiantes = obtenerEstudiantesDesdeRegistros();
    const totalEstudiantes = estudiantes.length;
    
    // Mapa orden → info estudiante
    const infoPorFila = {};
    estudiantes.forEach(est => {
        const orden = parseInt(est.orden);
        if (orden > 0) {
            infoPorFila[orden] = {
                uid: est.uid,
                nombre: `${est.nombre || ''} ${est.apellido || ''}`.trim()
            };
        }
    });
    
    let rowsPage1 = '';
    const mesesPagina1 = ['ago', 'sep', 'oct', 'nov', 'dic', 'ene', 'feb'];
    
    for (let i = 1; i <= totalRows; i++) {
        const tieneEstudiante = i <= totalEstudiantes;
        const rowClass = tieneEstudiante ? '' : ' row-bloqueada';
        const inputStyle = tieneEstudiante ? '' : ' style="background:#f0f0f0!important;color:#999!important;"';
        const inputValue = tieneEstudiante ? '' : ' value="-"';
        const info = infoPorFila[i];
        const numClass = tieneEstudiante ? 'num-col num-col-clickeable' : 'num-col bloqueado';
        const numAttrs = tieneEstudiante 
            ? ` data-row="${i}" data-uid="${info.uid || ''}" title="👤 ${info.nombre || 'Estudiante'} (clic para ver)"`
            : '';
        
        let row = `<td class="${numClass}"${numAttrs}>${i}</td>`;
        mesesPagina1.forEach(m => {
            row += `<td><input type="text" class="ann-att-input asis${tieneEstudiante ? '' : ' bloqueado'}" id="ann_${m}_asis_${i}" readonly${inputValue}${inputStyle}></td>`;
            row += `<td><input type="text" class="ann-att-input tard${tieneEstudiante ? '' : ' bloqueado'}" id="ann_${m}_tard_${i}" readonly${inputValue}${inputStyle}></td>`;
            row += `<td><input type="text" class="ann-att-input aus${tieneEstudiante ? '' : ' bloqueado'}" id="ann_${m}_aus_${i}" readonly${inputValue}${inputStyle}></td>`;
            row += `<td><input type="text" class="ann-att-input exc${tieneEstudiante ? '' : ' bloqueado'}" id="ann_${m}_exc_${i}" readonly${inputValue}${inputStyle}></td>`;
        });
        rowsPage1 += `<tr class="${rowClass}">${row}</tr>`;
    }
    
    let rowsPage2 = '';
    const mesesPagina2 = ['mar', 'abr', 'may', 'jun'];
    
    for (let i = 1; i <= totalRows; i++) {
        const tieneEstudiante = i <= totalEstudiantes;
        const rowClass = tieneEstudiante ? '' : ' row-bloqueada';
        const inputStyle = tieneEstudiante ? '' : ' style="background:#f0f0f0!important;color:#999!important;"';
        const inputValue = tieneEstudiante ? '' : ' value="-"';
        const info = infoPorFila[i];
        const numClass = tieneEstudiante ? 'num-col num-col-clickeable' : 'num-col bloqueado';
        const numAttrs = tieneEstudiante 
            ? ` data-row="${i}" data-uid="${info.uid || ''}" title="👤 ${info.nombre || 'Estudiante'} (clic para ver)"`
            : '';
        
        let row = `<td class="${numClass}"${numAttrs}>${i}</td>`;
        mesesPagina2.forEach(m => {
            row += `<td><input type="text" class="ann-att-input asis${tieneEstudiante ? '' : ' bloqueado'}" id="ann_${m}_asis_${i}" readonly${inputValue}${inputStyle}></td>`;
            row += `<td><input type="text" class="ann-att-input tard${tieneEstudiante ? '' : ' bloqueado'}" id="ann_${m}_tard_${i}" readonly${inputValue}${inputStyle}></td>`;
            row += `<td><input type="text" class="ann-att-input aus${tieneEstudiante ? '' : ' bloqueado'}" id="ann_${m}_aus_${i}" readonly${inputValue}${inputStyle}></td>`;
            row += `<td><input type="text" class="ann-att-input exc${tieneEstudiante ? '' : ' bloqueado'}" id="ann_${m}_exc_${i}" readonly${inputValue}${inputStyle}></td>`;
        });
        row += `<td><input type="text" class="ann-att-input res-asis${tieneEstudiante ? '' : ' bloqueado'}" id="ann_res_asis_${i}" readonly${inputValue}${inputStyle}></td>`;
        row += `<td><input type="text" class="ann-att-input res-tard${tieneEstudiante ? '' : ' bloqueado'}" id="ann_res_tard_${i}" readonly${inputValue}${inputStyle}></td>`;
        row += `<td><input type="text" class="ann-att-input res-aus${tieneEstudiante ? '' : ' bloqueado'}" id="ann_res_aus_${i}" readonly${inputValue}${inputStyle}></td>`;
        row += `<td><input type="text" class="ann-att-input res-exc${tieneEstudiante ? '' : ' bloqueado'}" id="ann_res_exc_${i}" readonly${inputValue}${inputStyle}></td>`;
        row += `<td><input type="text" class="ann-att-input por-asis${tieneEstudiante ? '' : ' bloqueado'}" id="ann_por_asis_${i}" readonly${inputValue}${inputStyle}></td>`;
        row += `<td><input type="text" class="ann-att-input por-aus${tieneEstudiante ? '' : ' bloqueado'}" id="ann_por_aus_${i}" readonly${inputValue}${inputStyle}></td>`;
        rowsPage2 += `<tr class="${rowClass}">${row}</tr>`;
    }
    
    const htmlPage1 = `
        <div class="student-page active" id="annual-page-1">
            <h3>
                📊 Resumen Anual de Asistencia (Página 1)
                <span class="auto-sync-badge">🔄 AUTO</span>
                <span class="estudiantes-count-badge">👨‍🎓 ${totalEstudiantes} estudiantes</span>
            </h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" class="${headerClass}" style="width:32px;">Nº</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Agosto</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Septiembre</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Octubre</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Noviembre</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Diciembre</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Enero</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Febrero</th>
                        </tr>
                        <tr>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                        </tr>
                    </thead>
                    <tbody>${rowsPage1}</tbody>
                </table>
            </div>
        </div>
    `;
    
    const htmlPage2 = `
        <div class="student-page" id="annual-page-2">
            <h3>
                📊 Resumen Anual de Asistencia (Página 2)
                <span class="auto-sync-badge">🔄 AUTO</span>
                <span class="estudiantes-count-badge">👨‍🎓 ${totalEstudiantes} estudiantes</span>
            </h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" class="${headerClass}" style="width:32px;">Nº</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Marzo</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Abril</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Mayo</th>
                            <th colspan="4" class="att-week-header-${currentGrade}">Junio</th>
                            <th colspan="4" class="att-summary-header-${currentGrade}">Resumen Anual</th>
                            <th colspan="2" class="att-summary-header-${currentGrade}">% Anual</th>
                        </tr>
                        <tr>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">Asist.</th><th class="att-day-header">Tard.</th><th class="att-day-header">Aus.</th><th class="att-day-header">Exc.</th>
                            <th class="att-day-header">% Asist.</th><th class="att-day-header">% Aus.</th>
                        </tr>
                    </thead>
                    <tbody>${rowsPage2}</tbody>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = htmlPage1 + htmlPage2;
    
    // ✅ DELEGACIÓN DE EVENTOS - CLIC EN Nº
    if (container._numColHandler) {
        container.removeEventListener('click', container._numColHandler);
    }
    container._numColHandler = function(e) {
        const celdaNum = e.target.closest('.num-col-clickeable');
        if (celdaNum) {
            e.stopPropagation();
            const row = celdaNum.dataset.row || '';
            const uid = celdaNum.dataset.uid || '';
            console.log('👤 Clic en Nº', row, '- UID:', uid);
            mostrarModalEstudianteAnual(row, uid);
        }
    };
    container.addEventListener('click', container._numColHandler);
    
    const rowCountDisplay = document.getElementById('rowCountDisplay');
    if (rowCountDisplay) rowCountDisplay.textContent = `Filas: ${totalRows}`;
    
    setTimeout(() => {
        calculateAnnualAttendance();
        updatePaginationUI();
        updatePageNumbers();
    }, 100);
}

function getHeaderClass(grade) {
    const classes = {
        1: 'student-header-1', 2: 'student-header-2', 3: 'student-header-3',
        4: 'student-header-4', 5: 'student-header-5', 6: 'student-header-6'
    };
    return classes[grade] || 'student-header-3';
}

// ============================================
// NAVEGACIÓN
// ============================================
function showPage(pageNum) {
    document.querySelectorAll('#annualAttendanceContainer .student-page').forEach(p => {
        p.classList.remove('active');
    });
    
    const target = document.getElementById(`annual-page-${pageNum}`);
    if (target) target.classList.add('active');
    
    currentPageNum = pageNum;
    updatePaginationUI();
    updatePageNumbers();
}

function changePage(direction) {
    const newPage = currentPageNum + direction;
    if (newPage >= 1 && newPage <= totalPages) showPage(newPage);
}

function updatePaginationUI() {
    const elements = [
        document.getElementById('currentPage'),
        document.getElementById('currentPage2')
    ];
    elements.forEach(el => { if (el) el.textContent = currentPageNum; });
    
    const totalElements = [
        document.getElementById('totalPages'),
        document.getElementById('totalPages2')
    ];
    totalElements.forEach(el => { if (el) el.textContent = totalPages; });
    
    const navButtons = [
        document.getElementById('prevBtn'), document.getElementById('prevBtn2'),
        document.getElementById('nextBtn'), document.getElementById('nextBtn2')
    ];
    
    navButtons.forEach(btn => {
        if (btn) {
            if (btn.id.includes('prev')) btn.disabled = (currentPageNum === 1);
            else if (btn.id.includes('next')) btn.disabled = (currentPageNum === totalPages);
        }
    });
}

function updatePageNumbers() {
    const pageNumbers = document.querySelectorAll('.page-number');
    pageNumbers.forEach(el => {
        el.textContent = `Página ${currentPageNum} de ${totalPages}`;
    });
}

// ============================================
// CLAVES
// ============================================
function getRowCountKey() {
    return `rowCount_${currentGrade}_sec${currentSection}_v25`;
}

function getRowCount() {
    const saved = localStorage.getItem(getRowCountKey());
    if (saved) {
        const val = parseInt(saved);
        if (val >= MIN_ROWS && val <= MAX_ROWS) return val;
    }
    return 45;
}

function setRowCount(val) {
    localStorage.setItem(getRowCountKey(), String(val));
}

// ============================================
// FILAS
// ============================================
function addRow() {
    totalRows = getRowCount();
    if (totalRows >= MAX_ROWS) {
        alert(`⚠️ Ya se alcanzó el máximo de ${MAX_ROWS} filas.`);
        return;
    }
    totalRows++;
    setRowCount(totalRows);
    generateAnnualAttendanceTable();
}

function deleteRow() {
    totalRows = getRowCount();
    if (totalRows <= MIN_ROWS) {
        alert(`⚠️ El registro debe tener al menos ${MIN_ROWS} fila.`);
        return;
    }
    if (confirm(`⚠️ ¿Eliminar la última fila (${totalRows})?`)) {
        totalRows--;
        setRowCount(totalRows);
        generateAnnualAttendanceTable();
    }
}

// ============================================
// RECALCULAR
// ============================================
function recalculateAttendance() {
    calculateAnnualAttendance();
    showModal('🔄 Recalculado',
        'Los datos han sido recalculados.<br><br>' +
        '✅ Porcentaje: <strong>(P + T + E) / Días Reales × 100</strong><br><br>' +
        '✅ Datos guardados para el Boletín.',
        'success'
    );
}

function printPage() {
    window.print();
}

function clearAllData() {
    showModal('🗑️ Confirmar Borrado', '¿Borrar todos los datos?', 'danger');
}

function confirmClearAllData() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('annual_att_data_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    generateAnnualAttendanceTable();
    closeModal();
    showModal('✅ Datos Borrados', 'Datos eliminados.', 'success');
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

document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const overlay = document.getElementById('modalOverlay');
    if (confirmBtn) confirmBtn.addEventListener('click', function() { if (modalCallback) modalCallback(); });
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', function(e) { if (e.target === this) closeModal(); });
});

// ============================================
// INICIALIZACIÓN
// ============================================
function init() {
    console.log('🚀 Resumen Anual - POR UID');
    
    aplicarDatosSincronizados();
    migrarAsistenciasViejas();
    eliminarAsistenciasHuerfanas();
    
    const addBtn = document.getElementById('addRowBtn');
    const deleteBtn = document.getElementById('deleteRowBtn');
    if (addBtn) addBtn.addEventListener('click', addRow);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteRow);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const isPrev = this.id.includes('prev');
            changePage(isPrev ? -1 : 1);
        });
    });
    
    totalRows = getRowCount();
    generateAnnualAttendanceTable();
    
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('att_')) {
            setTimeout(calculateAnnualAttendance, 300);
        }
        if (e.key === 'registrosSigerd' || e.key === 'datosSincronizados') {
            setTimeout(() => {
                aplicarDatosSincronizados();
                eliminarAsistenciasHuerfanas();
                generateAnnualAttendanceTable();
            }, 300);
        }
    });
    
    document.addEventListener('formulariosActualizado', function(e) {
        setTimeout(() => {
            aplicarDatosSincronizados();
            eliminarAsistenciasHuerfanas();
            generateAnnualAttendanceTable();
        }, 400);
    });
    
    if (_intervaloSync) clearInterval(_intervaloSync);
    _intervaloSync = setInterval(function() {
        const gradoTexto = obtenerGradoDesdePortada();
        const seccion = obtenerSeccionDesdePortada();
        const nuevoGrado = mapearGrado(gradoTexto);
        if (nuevoGrado !== currentGrade || seccion !== currentSection) {
            aplicarDatosSincronizados();
            generateAnnualAttendanceTable();
        }
        
        const stored = localStorage.getItem('registrosSigerd');
        if (stored) {
            try {
                const registros = JSON.parse(stored);
                if (Array.isArray(registros)) {
                    const hash = registros.length + '|' + registros.map(r => r.uid || '').join(',');
                    if (hash !== _ultimoHashRegistros) {
                        _ultimoHashRegistros = hash;
                        actualizarContadorEstudiantes();
                        generateAnnualAttendanceTable();
                    }
                }
            } catch (e) {}
        }
    }, 3000);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' && currentPageNum > 1) { changePage(-1); e.preventDefault(); }
        else if (e.key === 'ArrowRight' && currentPageNum < totalPages) { changePage(1); e.preventDefault(); }
    });
    
    console.log('✅ Resumen Anual listo');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================
window.recalculateAttendance = recalculateAttendance;
window.printPage = printPage;
window.clearAllData = clearAllData;
window.changePage = changePage;
window.showPage = showPage;
window.calculateAnnualAttendance = calculateAnnualAttendance;
window.generateAnnualAttendanceTable = generateAnnualAttendanceTable;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;
window.addRow = addRow;
window.deleteRow = deleteRow;
window.actualizarContadorEstudiantes = actualizarContadorEstudiantes;
window.guardarDatosAsistenciaParaBoletin = guardarDatosAsistenciaParaBoletin;
window.migrarAsistenciasViejas = migrarAsistenciasViejas;
window.eliminarAsistenciasHuerfanas = eliminarAsistenciasHuerfanas;
window.contarMarcasPorUid = contarMarcasPorUid;
window.obtenerEstudiantesDesdeRegistros = obtenerEstudiantesDesdeRegistros;

console.log('✅ Resumen Anual cargado - POR UID + MODAL HORIZONTAL');