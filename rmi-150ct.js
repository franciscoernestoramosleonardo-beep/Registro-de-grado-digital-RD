/**
============================================
RMI-15OCT - RESUMEN DE MATRÍCULA INICIAL (VERSIÓN ROBUSTA)
✅ Detecta Grado/Sección/Tanda automáticamente
✅ Calcula edades exactas desde Fecha Nacimiento
✅ Tablas con estructura oficial completa MINERD
✅ Edades dinámicas según el grado actual
✅ Barra superior con grado/sección/tanda/año visibles
✅ FIX: Tabla 3 y TOTAL siempre cuadran (0 explícito)
✅ NEAE: reconoce los valores exactos del <select> del FORMULARIO
✅ Cuadro 4: nivel educativo del tutor AUTOMÁTICO desde reg.tutorEscolaridad
============================================
*/

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
const STORAGE_KEY = 'registrosSigerd';
let currentConfig = {
    grade: 3,
    section: 'A',
    tanda: 'MATUTINA',
    year: '2025-2026'
};

// Configuración oficial MINERD con rango de edades DINÁMICO
const GRADO_CONFIG = {
    1: {
        nombre: '1er Grado',
        edadOficial: 6,
        min: 5,
        max: 7,
        edadesTabla1: [5, 6, 7, 8, 9, 10, 11, 12],
        edadesTabla2: [8, 9, 10, 11, 12, 13, 14, 15]
    },
    2: {
        nombre: '2do Grado',
        edadOficial: 7,
        min: 6,
        max: 8,
        edadesTabla1: [6, 7, 8, 9, 10, 11, 12, 13],
        edadesTabla2: [9, 10, 11, 12, 13, 14, 15, 16]
    },
    3: {
        nombre: '3er Grado',
        edadOficial: 8,
        min: 7,
        max: 9,
        edadesTabla1: [7, 8, 9, 10, 11, 12, 13, 14],
        edadesTabla2: [10, 11, 12, 13, 14, 15, 16]
    },
    4: {
        nombre: '4to Grado',
        edadOficial: 9,
        min: 8,
        max: 10,
        edadesTabla1: [8, 9, 10, 11, 12, 13, 14, 15],
        edadesTabla2: [11, 12, 13, 14, 15, 16, 17]
    },
    5: {
        nombre: '5to Grado',
        edadOficial: 10,
        min: 9,
        max: 11,
        edadesTabla1: [9, 10, 11, 12, 13, 14, 15, 16],
        edadesTabla2: [12, 13, 14, 15, 16, 17]
    },
    6: {
        nombre: '6to Grado',
        edadOficial: 11,
        min: 10,
        max: 12,
        edadesTabla1: [10, 11, 12, 13, 14, 15, 16, 17],
        edadesTabla2: [13, 14, 15, 16, 17]
    }
};

// IDs estándar de la Tabla 3 (NEAE)
const NEAE_IDS = [
    'asc_visual', 'asc_auditiva', 'asc_fisicomotora', 'asc_intelectual', 'asc_otra',
    'nasc_deaprendizaje', 'nasc_socioafectiva', 'nasc_otra'
];

// ✅ IDs del Cuadro 4 (Nivel educativo) — mapeo valor → ID de fila
const ESCOLARIDAD_MAP = {
    'SIN ESCOLARIDAD': 'sinescolaridad',
    'PRIMARIA INCOMPLETA': 'primariaincompleta',
    'PRIMARIA COMPLETA': 'primariacompleta',
    'SECUNDARIA INCOMPLETA': 'secundariaincompleta',
    'SECUNDARIA COMPLETA': 'secundariacompleta',
    'SUPERIOR INCOMPLETO': 'superiorincompleto',
    'SUPERIOR COMPLETO': 'superiorcompleto',
    'DESCONOCIDO': 'desconocido'
};

const ESCOLARIDAD_IDS = [
    'sinescolaridad', 'primariaincompleta', 'primariacompleta',
    'secundariaincompleta', 'secundariacompleta',
    'superiorincompleto', 'superiorcompleto', 'desconocido'
];

// ============================================
// UTILIDADES
// ============================================
function normalizar(txt) {
    if (!txt) return '';
    return String(txt).toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function extraerNumero(texto) {
    if (!texto) return null;
    if (typeof texto === 'number') return texto;
    const match = String(texto).match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

function calcularEdadReal(fechaNacStr) {
    if (!fechaNacStr) return null;
    let partes;
    if (fechaNacStr.includes('/')) {
        partes = fechaNacStr.split('/');
        return new Date(partes[2], partes[1] - 1, partes[0]);
    } else if (fechaNacStr.includes('-')) {
        partes = fechaNacStr.split('-');
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }
    return null;
}

function obtenerEdadEnAnios(fechaNacimientoDate) {
    if (!fechaNacimientoDate || isNaN(fechaNacimientoDate)) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimientoDate.getFullYear();
    const m = hoy.getMonth() - fechaNacimientoDate.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimientoDate.getDate())) {
        edad--;
    }
    return edad;
}

function gradoToNum(gradoTxt) {
    const n = normalizar(gradoTxt);
    if (n.includes('PRIMER') || n.includes('1ER')) return 1;
    if (n.includes('SEGUNDO') || n.includes('2DO')) return 2;
    if (n.includes('TERCER') || n.includes('3ER')) return 3;
    if (n.includes('CUARTO') || n.includes('4TO')) return 4;
    if (n.includes('QUINTO') || n.includes('5TO')) return 5;
    if (n.includes('SEXTO') || n.includes('6TO')) return 6;
    if (/^[1-6]$/.test(n)) return parseInt(n, 10);
    return null;
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

/**
 * Clasifica el valor NEAE del <select> del FORMULARIO
 */
function clasificarNEAE(neaeValor) {
    if (!neaeValor) return null;
    const n = normalizar(neaeValor);
    if (n === '' || n === 'NINGUNA' || n === 'NO APLICA' || n === 'NINGUNA / NO APLICA' || n === '— NINGUNA / NO APLICA —') {
        return null;
    }

    if (n === 'VISUAL') return { key: 'asc_visual', tipo: 'asociada' };
    if (n === 'AUDITIVA') return { key: 'asc_auditiva', tipo: 'asociada' };
    if (n === 'FISICO-MOTORA' || n === 'FISICOMOTORA') return { key: 'asc_fisicomotora', tipo: 'asociada' };
    if (n === 'INTELECTUAL') return { key: 'asc_intelectual', tipo: 'asociada' };
    if (n === 'ASOCIADA-OTRA' || n === 'ASOCIADAOTRA') return { key: 'asc_otra', tipo: 'asociada' };
    if (n === 'APRENDIZAJE') return { key: 'nasc_deaprendizaje', tipo: 'no-asociada' };
    if (n === 'SOCIOAFECTIVA') return { key: 'nasc_socioafectiva', tipo: 'no-asociada' };
    if (n === 'NO-ASOCIADA-OTRA' || n === 'NOASOCIADAOTRA') return { key: 'nasc_otra', tipo: 'no-asociada' };

    // Fallback texto libre
    if (n.includes('APRENDIZAJE') || n.includes('DISLEXIA') || n.includes('DISCALCULIA')) {
        return { key: 'nasc_deaprendizaje', tipo: 'no-asociada' };
    }
    if (n.includes('SOCIOAFECTIVA') || n.includes('CONDUCTA') || n.includes('EMOCIONAL')) {
        return { key: 'nasc_socioafectiva', tipo: 'no-asociada' };
    }
    if (n.includes('VISUAL') || n.includes('CIEGO')) {
        return { key: 'asc_visual', tipo: 'asociada' };
    }
    if (n.includes('AUDITIV') || n.includes('SORDO')) {
        return { key: 'asc_auditiva', tipo: 'asociada' };
    }
    if (n.includes('MOTORA') || n.includes('FISIC')) {
        return { key: 'asc_fisicomotora', tipo: 'asociada' };
    }
    if (n.includes('INTELECTUAL') || n.includes('COGNITIV')) {
        return { key: 'asc_intelectual', tipo: 'asociada' };
    }
    if (n.includes('NO ASOCIADA')) {
        return { key: 'nasc_otra', tipo: 'no-asociada' };
    }

    return { key: 'asc_otra', tipo: 'asociada' };
}

/**
 * ✅ Clasifica el valor de escolaridad del tutor → ID de fila del Cuadro 4
 */
function clasificarEscolaridad(valor) {
    if (!valor) return null;
    const n = normalizar(valor);
    if (n === '') return null;
    if (ESCOLARIDAD_MAP[n]) return ESCOLARIDAD_MAP[n];

    // Fallback de migración
    if (n.includes('SIN') && n.includes('ESCOLARIDAD')) return 'sinescolaridad';
    if (n.includes('PRIMARIA') && n.includes('INC')) return 'primariaincompleta';
    if (n.includes('PRIMARIA') && n.includes('COMP')) return 'primariacompleta';
    if (n.includes('SECUNDARIA') && n.includes('INC')) return 'secundariaincompleta';
    if (n.includes('SECUNDARIA') && n.includes('COMP')) return 'secundariacompleta';
    if (n.includes('SUPERIOR') && n.includes('INC')) return 'superiorincompleto';
    if (n.includes('SUPERIOR') && n.includes('COMP')) return 'superiorcompleto';
    if (n.includes('DESCONOCIDO') || n.includes('NO SE')) return 'desconocido';

    return null;
}

// ============================================
// DETECCIÓN DE CONTEXTO
// ============================================
function detectarContextoActual() {
    const params = new URLSearchParams(window.location.search);
    let g = params.get('grado');
    let s = params.get('seccion');
    let t = params.get('tanda');

    if (!g) {
        try {
            const syncData = JSON.parse(localStorage.getItem('datosSincronizados') || '{}');
            if (syncData.grado) g = syncData.grado;
            if (syncData.seccion) s = syncData.seccion;
            if (syncData.tanda) t = syncData.tanda;
        } catch (e) {}
    }

    const gradoNum = g ? gradoToNum(g) : 3;

    return {
        gradoNum: gradoNum || 3,
        gradoTxt: g || '3ER GRADO',
        seccion: (s || 'A').toUpperCase(),
        tanda: (t || 'MATUTINA').toUpperCase()
    };
}

// ============================================
// ACTUALIZAR BARRA DE INFO
// ============================================
function actualizarBarraInfo(ctx) {
    const gradeDisplay = document.getElementById('gradeDisplayRMI');
    const sectionDisplay = document.getElementById('sectionDisplayRMI');
    const tandaDisplay = document.getElementById('tandaDisplayRMI');
    const yearDisplay = document.getElementById('schoolYearDisplayRMI');

    if (gradeDisplay) gradeDisplay.textContent = GRADO_CONFIG[ctx.gradoNum].nombre;
    if (sectionDisplay) sectionDisplay.textContent = 'Sección ' + ctx.seccion;
    if (tandaDisplay) tandaDisplay.textContent = formatearTanda(ctx.tanda);
    if (yearDisplay) yearDisplay.textContent = currentConfig.year;
}

// ============================================
// PROCESAMIENTO PRINCIPAL
// ============================================
function procesarDatos() {
    console.log('🔄 Iniciando procesamiento de datos...');

    const ctx = detectarContextoActual();
    currentConfig.grade = ctx.gradoNum;
    currentConfig.section = ctx.seccion;
    currentConfig.tanda = ctx.tanda;

    actualizarBarraInfo(ctx);

    let todosLosRegistros = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) todosLosRegistros = JSON.parse(raw);
    } catch (e) {
        console.error('Error leyendo localStorage', e);
    }

    if (!Array.isArray(todosLosRegistros) || todosLosRegistros.length === 0) {
        console.warn('⚠️ No hay datos en registrosSigerd');
        generarEstructuraTablas(ctx.gradoNum);
        limpiarTablas();
        return;
    }

    const estudiantesFiltrados = todosLosRegistros.filter(est => {
        const estGrado = gradoToNum(est.grado);
        const estSeccion = normalizar(est.seccion);
        const estTanda = normalizar(est.tanda);

        return estGrado === ctx.gradoNum &&
               estSeccion === ctx.seccion &&
               estTanda === ctx.tanda;
    });

    console.log(`📊 Total registros: ${todosLosRegistros.length}`);
    console.log(`✅ Filtrados (${ctx.gradoNum}° ${ctx.seccion} ${ctx.tanda}): ${estudiantesFiltrados.length}`);

    generarEstructuraTablas(ctx.gradoNum);

    if (estudiantesFiltrados.length === 0) {
        console.warn('⚠️ Sin estudiantes para este grupo');
        limpiarTablas();
        return;
    }

    const configGrado = GRADO_CONFIG[ctx.gradoNum];
    const conteo = {
        c1_m: {}, c1_f: {},
        c2_m: {}, c2_f: {},
        c3: {},
        c4: {}  // ✅ NUEVO: contador de escolaridad del tutor
    };

    // Inicializar NEAE
    NEAE_IDS.forEach(id => {
        conteo.c3[id] = { m: 0, f: 0 };
    });

    // ✅ Inicializar Cuadro 4
    ESCOLARIDAD_IDS.forEach(id => {
        conteo.c4[id] = 0;
    });

    // Procesar cada estudiante
    estudiantesFiltrados.forEach(est => {
        let edad = null;
        if (est.fechaNac) {
            const fechaObj = calcularEdadReal(est.fechaNac);
            edad = obtenerEdadEnAnios(fechaObj);
        }
        if (edad === null && est.edad) {
            edad = extraerNumero(est.edad);
        }
        if (edad === null) return;

        const sexo = normalizar(est.sexo);
        const esMasc = sexo.includes('MASC');
        const esFem = sexo.includes('FEM');
        if (!esMasc && !esFem) return;

        const col = esMasc ? 'm' : 'f';

        // ---- Cuadro 1 ----
        if (configGrado.edadesTabla1.includes(edad)) {
            const key = 'c1_' + col;
            if (!conteo[key][edad]) conteo[key][edad] = 0;
            conteo[key][edad]++;
        }

        // ---- Cuadro 2: sobreedad ----
        if (edad > configGrado.max && configGrado.edadesTabla2.includes(edad)) {
            const key = 'c2_' + col;
            if (!conteo[key][edad]) conteo[key][edad] = 0;
            conteo[key][edad]++;
        }

        // ---- Cuadro 3: NEAE ----
        const clasif = clasificarNEAE(est.neae);
        if (clasif && clasif.key && conteo.c3[clasif.key]) {
            if (col === 'm') conteo.c3[clasif.key].m++;
            else conteo.c3[clasif.key].f++;
        }

        // ---- ✅ Cuadro 4: Nivel educativo del tutor ----
        const idEscolaridad = clasificarEscolaridad(est.tutorEscolaridad);
        if (idEscolaridad && conteo.c4[idEscolaridad] !== undefined) {
            conteo.c4[idEscolaridad]++;
        }
    });

    // Llenar las tablas
    llenarTabla1(conteo.c1_m, conteo.c1_f);
    llenarTabla2(conteo.c2_m, conteo.c2_f);
    llenarTabla3(conteo.c3);
    llenarTabla4(conteo.c4);

    console.log('✅ Procesamiento completo');
}

// ============================================
// GENERAR ESTRUCTURA DE TABLAS
// ============================================
function generarEstructuraTablas(gradoNum) {
    const config = GRADO_CONFIG[gradoNum];

    // ═══ TABLA 1 ═══
    const edadesT1 = config.edadesTabla1;
    let htmlT1 = `<table>
        <thead>
            <tr>
                <th class="num-row" rowspan="2">Edad</th>
                <th class="col-cantidad" colspan="2">Cantidad</th>
            </tr>
            <tr>
                <th class="sub-col">Masc.</th>
                <th class="sub-col">Fem.</th>
            </tr>
        </thead>
        <tbody>`;

    edadesT1.forEach(edad => {
        htmlT1 += `<tr>
            <td>${edad}</td>
            <td><input type="number" class="c1-m" data-tabla="1" data-fila="${edad}" data-col="masc" data-age="${edad}" readonly></td>
            <td><input type="number" class="c1-f" data-tabla="1" data-fila="${edad}" data-col="fem" data-age="${edad}" readonly></td>
        </tr>`;
    });

    htmlT1 += `<tr class="fila-total">
        <td>TOTAL</td>
        <td><input type="number" id="t1-total-m" data-tabla="1" data-fila="total" data-col="masc" readonly></td>
        <td><input type="number" id="t1-total-f" data-tabla="1" data-fila="total" data-col="fem" readonly></td>
    </tr></tbody></table>`;

    const c1 = document.querySelector('#cuadro1 .cuadro-body');
    if (c1) c1.innerHTML = htmlT1;

    // ═══ TABLA 2 ═══
    const edadesT2 = config.edadesTabla2;
    let htmlT2 = `<table>
        <thead>
            <tr>
                <th class="num-row" rowspan="2">Edad</th>
                <th class="col-cantidad" colspan="2">Cantidad</th>
            </tr>
            <tr>
                <th class="sub-col">Masc.</th>
                <th class="sub-col">Fem.</th>
            </tr>
        </thead>
        <tbody>`;

    edadesT2.forEach(edad => {
        htmlT2 += `<tr>
            <td>${edad}</td>
            <td><input type="number" class="c2-m" data-tabla="2" data-fila="${edad}" data-col="masc" data-age="${edad}" readonly></td>
            <td><input type="number" class="c2-f" data-tabla="2" data-fila="${edad}" data-col="fem" data-age="${edad}" readonly></td>
        </tr>`;
    });

    htmlT2 += `<tr class="fila-total">
        <td>TOTAL</td>
        <td><input type="number" id="t2-total-m" data-tabla="2" data-fila="total" data-col="masc" readonly></td>
        <td><input type="number" id="t2-total-f" data-tabla="2" data-fila="total" data-col="fem" readonly></td>
    </tr></tbody></table>`;

    const c2 = document.querySelector('#cuadro2 .cuadro-body');
    if (c2) c2.innerHTML = htmlT2;

    // ═══ TABLA 3 ═══
    let htmlT3 = '<table>';

    htmlT3 += `<thead>
        <tr>
            <th style="width:40%;" rowspan="2">Asociada a discapacidad</th>
            <th class="col-cantidad" colspan="2">Cantidad</th>
        </tr>
        <tr>
            <th class="sub-col">Masc.</th>
            <th class="sub-col">Fem.</th>
        </tr>
    </thead>
    <tbody>`;

    const discapacidades = [
        { label: 'Visual', id: 'asc_visual' },
        { label: 'Auditiva', id: 'asc_auditiva' },
        { label: 'Físico-Motora', id: 'asc_fisicomotora' },
        { label: 'Intelectual', id: 'asc_intelectual' },
        { label: 'Otra', id: 'asc_otra' }
    ];

    discapacidades.forEach(item => {
        htmlT3 += `<tr>
            <td class="td-left">${item.label}</td>
            <td><input type="number" id="${item.id}-m" data-tabla="3" data-fila="${item.id}" data-col="masc" value="0" readonly></td>
            <td><input type="number" id="${item.id}-f" data-tabla="3" data-fila="${item.id}" data-col="fem" value="0" readonly></td>
        </tr>`;
    });

    htmlT3 += '</tbody>';

    htmlT3 += `<thead>
        <tr><th class="sub-header" colspan="3">No asociada a discapacidad</th></tr>
        <tr>
            <th style="width:40%;" rowspan="2">No asociada a discapacidad</th>
            <th class="col-cantidad" colspan="2">Cantidad</th>
        </tr>
        <tr>
            <th class="sub-col">Masc.</th>
            <th class="sub-col">Fem.</th>
        </tr>
    </thead>
    <tbody>`;

    const noDiscapacidades = [
        { label: 'De aprendizaje', id: 'nasc_deaprendizaje' },
        { label: 'Socioafectiva', id: 'nasc_socioafectiva' },
        { label: 'Otra', id: 'nasc_otra' }
    ];

    noDiscapacidades.forEach(item => {
        htmlT3 += `<tr>
            <td class="td-left">${item.label}</td>
            <td><input type="number" id="${item.id}-m" data-tabla="3" data-fila="${item.id}" data-col="masc" value="0" readonly></td>
            <td><input type="number" id="${item.id}-f" data-tabla="3" data-fila="${item.id}" data-col="fem" value="0" readonly></td>
        </tr>`;
    });

    htmlT3 += `<tr class="fila-total">
        <td class="td-left">TOTAL</td>
        <td><input type="number" id="t3-total-m" data-tabla="3" data-fila="total" data-col="masc" value="0" readonly></td>
        <td><input type="number" id="t3-total-f" data-tabla="3" data-fila="total" data-col="fem" value="0" readonly></td>
    </tr></tbody></table>`;

    const c3 = document.querySelector('#cuadro3 .cuadro-body');
    if (c3) c3.innerHTML = htmlT3;

    // ═══ TABLA 4 ═══
    const niveles = [
        { label: 'Sin escolaridad', id: 'sinescolaridad' },
        { label: 'Primaria incompleta', id: 'primariaincompleta' },
        { label: 'Primaria completa', id: 'primariacompleta' },
        { label: 'Secundaria incompleta', id: 'secundariaincompleta' },
        { label: 'Secundaria completa', id: 'secundariacompleta' },
        { label: 'Superior incompleto', id: 'superiorincompleto' },
        { label: 'Superior completo', id: 'superiorcompleto' },
        { label: 'Desconocido', id: 'desconocido' }
    ];

    let htmlT4 = `<table>
        <thead>
            <tr>
                <th class="num-row">Nivel</th>
                <th class="col-cantidad">Cantidad</th>
            </tr>
        </thead>
        <tbody>`;

    niveles.forEach(nivel => {
        htmlT4 += `<tr>
            <td class="td-left">${nivel.label}</td>
            <td><input type="number" class="c4-input" id="c4-${nivel.id}" data-tabla="4" data-fila="${nivel.id}" data-col="cantidad" value="0" readonly></td>
        </tr>`;
    });

    htmlT4 += `<tr class="fila-total">
        <td class="td-left">TOTAL</td>
        <td><input type="number" id="t4-total" data-tabla="4" data-fila="total" data-col="cantidad" value="0" readonly></td>
    </tr></tbody></table>`;

    const c4 = document.querySelector('#cuadro4 .cuadro-body');
    if (c4) c4.innerHTML = htmlT4;
}

// ============================================
// LLENAR TABLA 1
// ============================================
function llenarTabla1(datosM, datosF) {
    let sumM = 0, sumF = 0;

    document.querySelectorAll('.c1-m, .c1-f').forEach(i => i.value = '');

    for (const [age, count] of Object.entries(datosM)) {
        const input = document.querySelector(`.c1-m[data-age="${age}"]`);
        if (input) { input.value = count; sumM += count; }
    }
    for (const [age, count] of Object.entries(datosF)) {
        const input = document.querySelector(`.c1-f[data-age="${age}"]`);
        if (input) { input.value = count; sumF += count; }
    }

    const tM = document.getElementById('t1-total-m');
    const tF = document.getElementById('t1-total-f');
    if (tM) tM.value = sumM;
    if (tF) tF.value = sumF;
}

// ============================================
// LLENAR TABLA 2
// ============================================
function llenarTabla2(datosM, datosF) {
    let sumM = 0, sumF = 0;

    document.querySelectorAll('.c2-m, .c2-f').forEach(i => i.value = '');

    for (const [age, count] of Object.entries(datosM)) {
        const input = document.querySelector(`.c2-m[data-age="${age}"]`);
        if (input) { input.value = count; sumM += count; }
    }
    for (const [age, count] of Object.entries(datosF)) {
        const input = document.querySelector(`.c2-f[data-age="${age}"]`);
        if (input) { input.value = count; sumF += count; }
    }

    const tM = document.getElementById('t2-total-m');
    const tF = document.getElementById('t2-total-f');
    if (tM) tM.value = sumM;
    if (tF) tF.value = sumF;
}

// ============================================
// LLENAR TABLA 3
// ============================================
function llenarTabla3(datos) {
    let sumM = 0, sumF = 0;

    NEAE_IDS.forEach(key => {
        const vals = datos[key] || { m: 0, f: 0 };
        const vM = vals.m || 0;
        const vF = vals.f || 0;

        const inputM = document.getElementById(`${key}-m`);
        const inputF = document.getElementById(`${key}-f`);

        if (inputM) inputM.value = vM;
        if (inputF) inputF.value = vF;

        sumM += vM;
        sumF += vF;
    });

    const tM = document.getElementById('t3-total-m');
    const tF = document.getElementById('t3-total-f');
    if (tM) tM.value = sumM;
    if (tF) tF.value = sumF;

    console.log('📊 Tabla 3 → TOTAL M:', sumM, '| TOTAL F:', sumF);
}

// ============================================
// ✅ LLENAR TABLA 4 (Nivel educativo del tutor)
// ============================================
function llenarTabla4(datos) {
    let total = 0;

    ESCOLARIDAD_IDS.forEach(id => {
        const cantidad = datos[id] || 0;
        const input = document.getElementById(`c4-${id}`);
        if (input) input.value = cantidad;
        total += cantidad;
    });

    const t = document.getElementById('t4-total');
    if (t) t.value = total;

    console.log('📊 Tabla 4 → TOTAL:', total, '| Detalle:', datos);
}

// ============================================
// LIMPIAR
// ============================================
function limpiarTablas() {
    document.querySelectorAll('.c1-m, .c1-f').forEach(i => i.value = '');
    const t1M = document.getElementById('t1-total-m');
    const t1F = document.getElementById('t1-total-f');
    if (t1M) t1M.value = 0;
    if (t1F) t1F.value = 0;

    document.querySelectorAll('.c2-m, .c2-f').forEach(i => i.value = '');
    const t2M = document.getElementById('t2-total-m');
    const t2F = document.getElementById('t2-total-f');
    if (t2M) t2M.value = 0;
    if (t2F) t2F.value = 0;

    NEAE_IDS.forEach(id => {
        const iM = document.getElementById(`${id}-m`);
        const iF = document.getElementById(`${id}-f`);
        if (iM) iM.value = 0;
        if (iF) iF.value = 0;
    });
    const t3M = document.getElementById('t3-total-m');
    const t3F = document.getElementById('t3-total-f');
    if (t3M) t3M.value = 0;
    if (t3F) t3F.value = 0;

    // ✅ Limpiar Cuadro 4
    ESCOLARIDAD_IDS.forEach(id => {
        const inp = document.getElementById(`c4-${id}`);
        if (inp) inp.value = 0;
    });
    const t4 = document.getElementById('t4-total');
    if (t4) t4.value = 0;
}

function limpiarDatos() {
    if (!confirm('¿Estás seguro de que deseas eliminar todos los datos ingresados?')) return;
    limpiarTablas();
    console.log('🗑️ Datos limpiados');
}
window.limpiarDatos = limpiarDatos;

function imprimirPagina() {
    window.print();
}
window.imprimirPagina = imprimirPagina;

// ============================================
// DIAGNÓSTICO
// ============================================
function diagnosticarTabla3() {
    console.log('═══════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO TABLA 3 (NEAE)');
    console.log('═══════════════════════════════════');

    let sumaM = 0, sumaF = 0;
    const filas = [];

    NEAE_IDS.forEach(id => {
        const iM = document.getElementById(`${id}-m`);
        const iF = document.getElementById(`${id}-f`);
        const vM = iM ? (parseInt(iM.value) || 0) : 'X';
        const vF = iF ? (parseInt(iF.value) || 0) : 'X';

        if (typeof vM === 'number') sumaM += vM;
        if (typeof vF === 'number') sumaF += vF;

        filas.push({ ID: id, M: vM, F: vF });
    });

    console.table(filas);

    const tM = parseInt(document.getElementById('t3-total-m')?.value) || 0;
    const tF = parseInt(document.getElementById('t3-total-f')?.value) || 0;

    console.log('Suma calculada  → M:', sumaM, '| F:', sumaF);
    console.log('Total en el DOM → M:', tM, '| F:', tF);
    console.log('¿Cuadra?', sumaM === tM && sumaF === tF ? '✅ SÍ' : '❌ NO');

    return { sumaM, sumaF, tM, tF };
}
window.diagnosticarTabla3 = diagnosticarTabla3;

function diagnosticarTabla4() {
    console.log('═══════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO TABLA 4 (Escolaridad)');
    console.log('═══════════════════════════════════');

    let suma = 0;
    const filas = [];

    ESCOLARIDAD_IDS.forEach(id => {
        const inp = document.getElementById(`c4-${id}`);
        const v = inp ? (parseInt(inp.value) || 0) : 'X';
        if (typeof v === 'number') suma += v;
        filas.push({ ID: id, Cantidad: v });
    });

    console.table(filas);

    const t = parseInt(document.getElementById('t4-total')?.value) || 0;

    console.log('Suma calculada  →', suma);
    console.log('Total en el DOM →', t);
    console.log('¿Cuadra?', suma === t ? '✅ SÍ' : '❌ NO');

    return { suma, t };
}
window.diagnosticarTabla4 = diagnosticarTabla4;

// ============================================
// INICIALIZACIÓN
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 RMI-15OCT Listo.');

    const ctx = detectarContextoActual();

    generarEstructuraTablas(ctx.gradoNum);
    actualizarBarraInfo(ctx);
    limpiarTablas();

    setTimeout(procesarDatos, 300);
});

// Escuchar cambios
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === 'datosSincronizados') {
        console.log('🔄 Cambio detectado. Actualizando...');
        procesarDatos();
    }
});

// Exponer globalmente
window.forzarRecarga = procesarDatos;
window.procesarDatos = procesarDatos;
window.detectarContextoActual = detectarContextoActual;
window.clasificarNEAE = clasificarNEAE;
window.clasificarEscolaridad = clasificarEscolaridad;