// ========================================================================
// CÓDIGO JAVASCRIPT COMPLETO - BOLETÍN (INFORME DE APRENDIZAJE)
// ✅ ASISTENCIA: SOPORTA 3 FORMATOS DE CLAVE
// ✅ CALIFICACIONES VINCULADAS POR UID
// ✅ SITUACIÓN SEGÚN NORMATIVA MINERD (ACTUALIZADA)
// ✅ C1, C2, C3 SOLO SI SU COMPETENCIA ESTÁ COMPLETA (4 períodos)
// ✅ REGLA RP: Si P < 65, cuenta el RP correspondiente
// ✅ CALIFICACIÓN FINAL DEL ÁREA solo si C1, C2 y C3 están completos
// ✅ 🆕 RECUPERACIÓN ESPECIAL: Si FINAL < 65 pero REC_ESPECIAL >= 65 → APROBADA
// ✅ 🆕 ORDEN DE APROBACIÓN: FINAL >= 65 → REC_FINAL >= 65 → REC_ESPECIAL >= 65
// ✅ OBSERVACIÓN GENERAL: Aparece si TODAS las calificaciones finales están completas
// ✅ MIGRACIÓN AUTOMÁTICA DE DATOS VIEJOS
// ✅ OBSERVACIONES POR PERÍODO (P1-P4)
// ✅ OBSERVACIONES GENERALES
// ✅ BROADCASTCHANNEL PARA COMUNICACIÓN ENTRE PESTAÑAS
// ========================================================================
(function() {
'use strict';
// ====================================================================
// VARIABLES GLOBALES
// ====================================================================
let currentGrade = 1;
let currentSeccion = 'A';
let currentTanda = 'Matutina';
let intervaloGrado = null;
let estudiantesLista = [];
let estudianteSeleccionado = null;
let indiceActual = -1;
let _ultimoHashRegistros = '';
let _procesando = false;
let _uidSeleccionadoAntes = null;
let _canalSync = null;
let _debugNotas = false;
const ASISTENCIA_MINIMA_PORCENTAJE = 70;
const NOTA_MINIMA_APROBATORIA = 65;
// ====================================================================
// ✅ PARSEAR CLAVE DE ASISTENCIA (soporta 3 formatos)
// ====================================================================
function parsearClaveAsistenciaBoletin(key) {
if (!key || !key.startsWith('att')) return null;
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
// ====================================================================
// ✅ FUNCIONES AUXILIARES DE LECTURA DE NOTAS
// ====================================================================
function leerNotaBoletin(uid, orden, materia, competencia, periodo, esRP) {
const sufijo = esRP ? `rp${periodo}` : `p${periodo}`;
const sufijoP = `p${periodo}`;
if (_debugNotas) {
console.log(`🔍 Buscando nota: UID=${uid}, Orden=${orden}, M=${materia}, C=${competencia}, P=${periodo}, RP=${esRP}`);
}
if (uid) {
const keyUID = `nota_${uid}_m${materia}c${competencia}${sufijo}`;
const valUID = localStorage.getItem(keyUID);
if (valUID !== null && valUID !== '') {
return valUID;
}
}
if (uid) {
const keyPrincipal = `evalNota_g${currentGrade}_s${currentSeccion}_m${materia}_r${orden}_c${competencia}_${sufijo}`;
const valPrincipal = localStorage.getItem(keyPrincipal);
if (valPrincipal !== null && valPrincipal !== '') {
localStorage.setItem(`nota_${uid}_m${materia}c${competencia}${sufijo}`, valPrincipal);
return valPrincipal;
}
}
if (uid) {
const keySinSufijo = `evalNota_g${currentGrade}_s${currentSeccion}_m${materia}_r${orden}_c${competencia}_${periodo}`;
const valSinSufijo = localStorage.getItem(keySinSufijo);
if (valSinSufijo !== null && valSinSufijo !== '') {
localStorage.setItem(`nota_${uid}_m${materia}c${competencia}${sufijo}`, valSinSufijo);
return valSinSufijo;
}
}
if (uid) {
const keyMayus = `evalNota_g${currentGrade}_s${currentSeccion}_m${materia}_r${orden}_c${competencia}_P${periodo}`;
const valMayus = localStorage.getItem(keyMayus);
if (valMayus !== null && valMayus !== '') {
localStorage.setItem(`nota_${uid}_m${materia}c${competencia}${sufijo}`, valMayus);
return valMayus;
}
}
if (uid && esRP) {
const keyMayusRP = `evalNota_g${currentGrade}_s${currentSeccion}_m${materia}_r${orden}_c${competencia}_RP${periodo}`;
const valMayusRP = localStorage.getItem(keyMayusRP);
if (valMayusRP !== null && valMayusRP !== '') {
localStorage.setItem(`nota_${uid}_m${materia}c${competencia}${sufijo}`, valMayusRP);
return valMayusRP;
}
}
if (uid) {
const keyGuion = `evalNota_g${currentGrade}_s${currentSeccion}_m${materia}_r${orden}_c${competencia}_p-${periodo}`;
const valGuion = localStorage.getItem(keyGuion);
if (valGuion !== null && valGuion !== '') {
localStorage.setItem(`nota_${uid}_m${materia}c${competencia}${sufijo}`, valGuion);
return valGuion;
}
}
if (uid) {
const keyVieja = `g${currentGrade}s${currentSeccion}m${materia}r${orden}c${competencia}${sufijoP}`;
const valVieja = localStorage.getItem(keyVieja);
if (valVieja !== null && valVieja !== '') {
localStorage.setItem(`nota_${uid}_m${materia}c${competencia}${sufijo}`, valVieja);
return valVieja;
}
if (esRP) {
const keyViejaRP = `g${currentGrade}s${currentSeccion}m${materia}r${orden}c${competencia}rp${periodo}`;
const valViejaRP = localStorage.getItem(keyViejaRP);
if (valViejaRP !== null && valViejaRP !== '') {
localStorage.setItem(`nota_${uid}_m${materia}c${competencia}${sufijo}`, valViejaRP);
return valViejaRP;
}
}
}
if (uid) {
const patrones = [
`evalNota_g${currentGrade}_s${currentSeccion}_m${materia}_r${orden}_c${competencia}_`,
`nota_${uid}_m${materia}c${competencia}`
];
for (let i = 0; i < localStorage.length; i++) {
const key = localStorage.key(i);
if (!key) continue;
for (const patron of patrones) {
if (key.startsWith(patron)) {
const resto = key.substring(patron.length).toLowerCase();
if (resto === sufijo.toLowerCase() ||
resto === `p${periodo}` ||
resto === `rp${periodo}` ||
resto === String(periodo)) {
const val = localStorage.getItem(key);
if (val !== null && val !== '') {
return val;
}
}
}
}
}
}
return null;
}
function leerRecFinalBoletin(uid, orden, materia) {
if (uid) {
const val = localStorage.getItem(`nota_${uid}_m${materia}rec_final`);
if (val !== null && val !== '') return val;
}
if (uid) {
const keyPrincipal = `evalRec_g${currentGrade}_s${currentSeccion}_m${materia}_r${orden}`;
const valPrincipal = localStorage.getItem(keyPrincipal);
if (valPrincipal !== null && valPrincipal !== '') {
localStorage.setItem(`nota_${uid}_m${materia}rec_final`, valPrincipal);
return valPrincipal;
}
const keyVieja = `g${currentGrade}s${currentSeccion}m${materia}r${orden}rec`;
const valVieja = localStorage.getItem(keyVieja);
if (valVieja !== null && valVieja !== '') {
localStorage.setItem(`nota_${uid}_m${materia}rec_final`, valVieja);
return valVieja;
}
}
return null;
}
// ====================================================================
// ✅ NUEVA FUNCIÓN: LEER RECUPERACIÓN ESPECIAL
// ====================================================================
function leerRecEspecialBoletin(uid, orden, materia) {
if (!uid) return null;
// 1. Formato principal por UID
const keyUID = `nota_${uid}_m${materia}rec_especial`;
const valUID = localStorage.getItem(keyUID);
if (valUID !== null && valUID !== '') return valUID;
// 2. Formato principal por grado/sección/fila
const keyPrincipal = `evalRecEsp_g${currentGrade}_s${currentSeccion}_m${materia}_r${orden}`;
const valPrincipal = localStorage.getItem(keyPrincipal);
if (valPrincipal !== null && valPrincipal !== '') {
localStorage.setItem(keyUID, valPrincipal);
return valPrincipal;
}
// 3. Formato viejo
const keyVieja = `g${currentGrade}s${currentSeccion}m${materia}r${orden}recesp`;
const valVieja = localStorage.getItem(keyVieja);
if (valVieja !== null && valVieja !== '') {
localStorage.setItem(keyUID, valVieja);
return valVieja;
}
// 4. Formato alternativo con guion bajo
const keyAlt = `nota_${uid}_m${materia}_rec_especial`;
const valAlt = localStorage.getItem(keyAlt);
if (valAlt !== null && valAlt !== '') return valAlt;
// 5. Búsqueda por prefijo
for (let i = 0; i < localStorage.length; i++) {
const key = localStorage.key(i);
if (!key) continue;
if (key.startsWith(`nota_${uid}_m${materia}`) && key.includes('rec_especial')) {
const val = localStorage.getItem(key);
if (val !== null && val !== '') return val;
}
}
return null;
}
// ====================================================================
// ✅ FUNCIÓN AUXILIAR: OBTENER VALOR DE UN PERÍODO
// ====================================================================
function obtenerValorPeriodoCompetencia(uid, orden, materia, competencia, periodo) {
const pValStr = leerNotaBoletin(uid, orden, materia, competencia, periodo, false);
const pVal = (pValStr !== null && pValStr !== '') ? parseFloat(pValStr) : null;
if (currentGrade < 3) {
if (pVal !== null && !isNaN(pVal)) {
return pVal > 100 ? 100 : pVal;
}
return null;
}
if (pVal !== null && !isNaN(pVal)) {
if (pVal >= NOTA_MINIMA_APROBATORIA) {
return pVal > 100 ? 100 : pVal;
} else {
const rpValStr = leerNotaBoletin(uid, orden, materia, competencia, periodo, true);
const rpVal = (rpValStr !== null && rpValStr !== '') ? parseFloat(rpValStr) : null;
if (rpVal !== null && !isNaN(rpVal)) {
return rpVal > 100 ? 100 : rpVal;
} else {
return null;
}
}
}
const rpValStr2 = leerNotaBoletin(uid, orden, materia, competencia, periodo, true);
const rpVal2 = (rpValStr2 !== null && rpValStr2 !== '') ? parseFloat(rpValStr2) : null;
if (rpVal2 !== null && !isNaN(rpVal2)) {
return rpVal2 > 100 ? 100 : rpVal2;
}
return null;
}
// ====================================================================
// ✅ FUNCIÓN AUXILIAR: CALCULAR C1, C2 o C3
// ====================================================================
function calcularCompetenciaSiCompleta(uid, orden, materia, competencia) {
const valores = [];
for (let p = 1; p <= 4; p++) {
const valor = obtenerValorPeriodoCompetencia(uid, orden, materia, competencia, p);
if (valor === null) return null;
valores.push(valor);
}
if (valores.length !== 4) return null;
const suma = valores.reduce((a, b) => a + b, 0);
let promedio = Math.round(suma / 4);
if (promedio > 100) promedio = 100;
return promedio;
}
// ====================================================================
// ✅ VERIFICAR SI UN PERÍODO ESTÁ COMPLETO
// ====================================================================
function verificarPeriodoCompleto(uid, periodoNum, totalMaterias, orden) {
try {
if (!uid) return false;
const ordenFinal = orden || parseInt(estudianteSeleccionado?.orden, 10) || 1;
const periodo = parseInt(periodoNum, 10);
if (isNaN(periodo) || periodo < 1 || periodo > 4) return false;
for (let m = 1; m <= totalMaterias; m++) {
for (let c = 1; c <= 3; c++) {
const nota = leerNotaBoletin(uid, ordenFinal, m, c, periodo, false);
if (nota === null || nota === '' || nota === undefined) {
return false;
}
const notaNum = parseFloat(nota);
if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
return false;
}
}
}
return true;
} catch (e) {
console.error('❌ Error verificando período completo:', e);
return false;
}
}
// ====================================================================
// FUNCIONES DE TEXTO A MAYÚSCULAS
// ====================================================================
function aplicarMayusculasATodosLosCampos() {
const inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
inputs.forEach(function(input) {
if (!input.readOnly && !input.disabled) {
if (!input._mayusListener) {
input._mayusListener = true;
input.addEventListener('input', function(e) {
const inicio = this.selectionStart;
const fin = this.selectionEnd;
const valorAnterior = this.value;
const valorMayusculas = this.value.toUpperCase();
if (valorAnterior !== valorMayusculas) {
this.value = valorMayusculas;
this.setSelectionRange(inicio, fin);
}
});
input.addEventListener('blur', function() {
if (this.value) this.value = this.value.toUpperCase();
});
}
if (input.value) input.value = input.value.toUpperCase();
}
});
}
function aplicarMayusculasACamposDinamicos() {
const inputsTabla = document.querySelectorAll('.input-observacion, .input-asistencia, .input-situacion');
inputsTabla.forEach(function(input) {
if (!input.readOnly && !input.disabled) {
input.removeEventListener('input', convertirAMayusculas);
input.addEventListener('input', convertirAMayusculas);
if (input.value) input.value = input.value.toUpperCase();
}
});
}
function convertirAMayusculas(e) {
const input = e.target;
const inicio = input.selectionStart;
const fin = input.selectionEnd;
const valorAnterior = input.value;
const valorMayusculas = input.value.toUpperCase();
if (valorAnterior !== valorMayusculas) {
input.value = valorMayusculas;
input.setSelectionRange(inicio, fin);
}
}
// ====================================================================
// ✅ DETECTAR GRADO, SECCIÓN Y TANDA
// ====================================================================
function obtenerGradoDesdePortada() {
try {
const urlParams = new URLSearchParams(window.location.search);
const gradoUrl = urlParams.get('grado');
if (gradoUrl) return decodeURIComponent(gradoUrl);
const datosSincronizados = localStorage.getItem('datosSincronizados');
if (datosSincronizados) {
const datos = JSON.parse(datosSincronizados);
if (datos && datos.grado) return datos.grado;
}
const registroGrado = localStorage.getItem('registroGradoData');
if (registroGrado) {
const datos = JSON.parse(registroGrado);
if (datos && datos.grado) return datos.grado;
}
if (typeof AuthSystem !== 'undefined') {
const sesion = AuthSystem.obtenerSesion();
if (sesion && sesion.cedula) {
const gradoGuardado = AuthSystem.obtenerGradoSeleccionado(sesion.cedula);
if (gradoGuardado) return gradoGuardado;
}
}
const gradoCompleto = localStorage.getItem('minerd_grado_completo');
if (gradoCompleto) {
const datos = JSON.parse(gradoCompleto);
if (datos && datos.grado) return datos.grado;
}
return null;
} catch (e) {
return null;
}
}
function obtenerSeccionDesdePortada() {
try {
const urlParams = new URLSearchParams(window.location.search);
const seccionUrl = urlParams.get('seccion');
if (seccionUrl) return decodeURIComponent(seccionUrl);
const datosSincronizados = localStorage.getItem('datosSincronizados');
if (datosSincronizados) {
const datos = JSON.parse(datosSincronizados);
if (datos && datos.seccion) return datos.seccion;
}
const registroGrado = localStorage.getItem('registroGradoData');
if (registroGrado) {
const datos = JSON.parse(registroGrado);
if (datos && datos.seccion) return datos.seccion;
}
const gradoCompleto = localStorage.getItem('minerd_grado_completo');
if (gradoCompleto) {
const datos = JSON.parse(gradoCompleto);
if (datos && datos.seccion) return datos.seccion;
}
return null;
} catch (e) {
return null;
}
}
function obtenerTandaDesdePortada() {
try {
const urlParams = new URLSearchParams(window.location.search);
const tandaUrl = urlParams.get('tanda');
if (tandaUrl) return decodeURIComponent(tandaUrl);
const datosSincronizados = localStorage.getItem('datosSincronizados');
if (datosSincronizados) {
const datos = JSON.parse(datosSincronizados);
if (datos && datos.tanda) return datos.tanda;
}
const registroGrado = localStorage.getItem('registroGradoData');
if (registroGrado) {
const datos = JSON.parse(registroGrado);
if (datos && datos.tanda) return datos.tanda;
}
const gradoCompleto = localStorage.getItem('minerd_grado_completo');
if (gradoCompleto) {
const datos = JSON.parse(gradoCompleto);
if (datos && datos.tanda) return datos.tanda;
}
return null;
} catch (e) {
return null;
}
}
function obtenerGrupoActual() {
const grado = obtenerGradoDesdePortada();
const seccion = obtenerSeccionDesdePortada();
const tanda = obtenerTandaDesdePortada();
return {
grado: (grado || 'Primer Grado').trim(),
seccion: (seccion || 'A').trim(),
tanda: (tanda || 'Matutina').trim()
};
}
// ====================================================================
// CONVERTIR NOMBRE DE GRADO A NÚMERO
// ====================================================================
function convertirGradoANumero(gradoTexto) {
if (!gradoTexto) return null;
const mapa = {
'Primer Grado': 1, 'Segundo Grado': 2, 'Tercer Grado': 3,
'Cuarto Grado': 4, 'Quinto Grado': 5, 'Sexto Grado': 6,
'1er Grado': 1, '2do Grado': 2, '3er Grado': 3,
'4to Grado': 4, '5to Grado': 5, '6to Grado': 6,
'1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
'PRIMER GRADO': 1, 'SEGUNDO GRADO': 2, 'TERCER GRADO': 3,
'CUARTO GRADO': 4, 'QUINTO GRADO': 5, 'SEXTO GRADO': 6
};
return mapa[gradoTexto] || null;
}
// ====================================================================
// CARGAR GRADO GUARDADO
// ====================================================================
function cargarGradoGuardado() {
try {
const grupo = obtenerGrupoActual();
const gradoNumerico = convertirGradoANumero(grupo.grado);
if (gradoNumerico && gradoNumerico >= 1 && gradoNumerico <= 6) {
currentGrade = gradoNumerico;
currentSeccion = grupo.seccion;
currentTanda = grupo.tanda;
localStorage.setItem('boletin_grado', currentGrade);
return;
}
const gradoGuardado = localStorage.getItem('boletin_grado');
if (gradoGuardado) {
currentGrade = parseInt(gradoGuardado, 10);
if (isNaN(currentGrade) || currentGrade < 1 || currentGrade > 6) currentGrade = 1;
}
} catch (e) {
currentGrade = 1;
}
}
function inicializarGradoBloqueado() {
const gradeDisplay = document.getElementById('gradeDisplay');
if (!gradeDisplay) return;
const nombresGrado = {
1: '1er Grado', 2: '2do Grado', 3: '3er Grado',
4: '4to Grado', 5: '5to Grado', 6: '6to Grado'
};
const colores = {
1: '#F7941D', 2: '#1E78C2', 3: '#299888',
4: '#FD82B3', 5: '#B9A044', 6: '#793007'
};
gradeDisplay.value = nombresGrado[currentGrade] || '1er Grado';
gradeDisplay.style.color = colores[currentGrade] || '#E91E8C';
}
// ====================================================================
// ✅ FILTRADO POR GRADO + SECCIÓN + TANDA
// ====================================================================
function filtrarEstudiantes(registros) {
const grupo = obtenerGrupoActual();
const gradoActual = grupo.grado.toUpperCase().trim();
const seccionActual = grupo.seccion.toUpperCase().trim();
const tandaActual = grupo.tanda.toUpperCase().trim();
return registros.filter(r => {
const gradoRegistro = (r.grado || '').toUpperCase().trim();
const seccionRegistro = (r.seccion || '').toUpperCase().trim();
const tandaRegistro = (r.tanda || '').toUpperCase().trim();
if (!gradoRegistro) return false;
return gradoRegistro === gradoActual &&
seccionRegistro === seccionActual &&
tandaRegistro === tandaActual;
});
}
// ====================================================================
// ✅ UTILIDADES PARA UID
// ====================================================================
function getClaveSituacion(uid) {
if (!uid) return null;
return `situacion_${uid}`;
}
function getClaveObsGeneral(uid) {
if (!uid) return null;
return `obs_general_${uid}`;
}
function getClaveObsPeriodo(uid, periodo) {
if (!uid) return null;
return `obs_${uid}_${periodo}`;
}
// ====================================================================
// ✅ MIGRACIÓN DE DATOS VIEJOS
// ====================================================================
function migrarDatosViejosABoletin() {
try {
const storageKey = getStorageKeyRegistro();
const saved = localStorage.getItem(storageKey);
if (!saved) return;
let dataVieja = {};
try { dataVieja = JSON.parse(saved); } catch (e) { return; }
const estudiantes = obtenerEstudiantesDesdeRegistros();
if (estudiantes.length === 0) return;
let migradas = 0;
const clavesMigrar = [];
estudiantes.forEach(est => {
const uid = est.uid;
const orden = parseInt(est.orden, 10);
if (!uid || !orden) return;
const situacionViejaKey = `g${currentGrade}s${currentSeccion}r${orden}situacion`;
const situacionNuevaKey = getClaveSituacion(uid);
if (dataVieja[situacionViejaKey] && !localStorage.getItem(situacionNuevaKey)) {
localStorage.setItem(situacionNuevaKey, dataVieja[situacionViejaKey]);
clavesMigrar.push(situacionViejaKey);
migradas++;
}
const idViejo = est.id || est.idEstudiante || est.cedula || `est_${orden}`;
['P1', 'P2', 'P3', 'P4'].forEach(periodo => {
const obsViejaKey = `g${currentGrade}s${currentSeccion}_${idViejo}_obs_${periodo}`;
const obsNuevaKey = getClaveObsPeriodo(uid, periodo);
if (dataVieja[obsViejaKey] && !localStorage.getItem(obsNuevaKey)) {
localStorage.setItem(obsNuevaKey, dataVieja[obsViejaKey]);
clavesMigrar.push(obsViejaKey);
migradas++;
}
});
const obsGenViejaKey = `g${currentGrade}s${currentSeccion}_${idViejo}_observacion_general`;
const obsGenNuevaKey = getClaveObsGeneral(uid);
if (dataVieja[obsGenViejaKey] && !localStorage.getItem(obsGenNuevaKey)) {
localStorage.setItem(obsGenNuevaKey, dataVieja[obsGenViejaKey]);
clavesMigrar.push(obsGenViejaKey);
migradas++;
}
});
clavesMigrar.forEach(k => { delete dataVieja[k]; });
if (migradas > 0) {
localStorage.setItem(storageKey, JSON.stringify(dataVieja));
console.log(`✅ ${migradas} datos migrados al formato por UID`);
}
} catch (e) {
console.warn('⚠️ Error migrando datos viejos:', e);
}
}
// ====================================================================
// ✅ ELIMINAR DATOS HUÉRFANOS
// ====================================================================
function eliminarDatosHuerfanosBoletin() {
try {
const stored = localStorage.getItem('registrosSigerd');
if (!stored) return;
let registros = [];
try { registros = JSON.parse(stored); } catch (e) { return; }
if (!Array.isArray(registros)) return;
const uidsValidos = new Set(registros.map(r => r.uid).filter(Boolean));
if (uidsValidos.size === 0) return;
const clavesAEliminar = [];
for (let i = 0; i < localStorage.length; i++) {
const key = localStorage.key(i);
if (!key) continue;
if (key.startsWith('situacion_')) {
const uid = key.replace('situacion_', '');
if (uid && !uidsValidos.has(uid)) clavesAEliminar.push(key);
}
else if (key.startsWith('obs_general_')) {
const uid = key.replace('obs_general_', '');
if (uid && !uidsValidos.has(uid)) clavesAEliminar.push(key);
}
else if (key.startsWith('obs_') && !key.startsWith('obs_general_')) {
const match = key.match(/^obs_([^_]+)_/);
if (match && match[1] && !uidsValidos.has(match[1])) clavesAEliminar.push(key);
}
}
clavesAEliminar.forEach(k => localStorage.removeItem(k));
if (clavesAEliminar.length > 0) {
console.log(`🗑️ ${clavesAEliminar.length} datos huérfanos del boletín eliminados`);
}
} catch (e) {
console.warn('⚠️ Error eliminando huérfanos:', e);
}
}
// ====================================================================
// OBTENER ESTUDIANTES
// ====================================================================
function obtenerEstudiantesDesdeRegistros() {
try {
const stored = localStorage.getItem('registrosSigerd');
if (!stored) return [];
const registros = JSON.parse(stored);
if (!Array.isArray(registros) || registros.length === 0) return [];
const filtrados = filtrarEstudiantes(registros);
filtrados.sort((a, b) => (parseInt(a.orden, 10) || 0) - (parseInt(b.orden, 10) || 0));
return filtrados;
} catch (e) {
return [];
}
}
// ====================================================================
// CARGAR LISTA DE ESTUDIANTES
// ====================================================================
function cargarEstudiantesDesdeListado() {
try {
const stored = localStorage.getItem('registrosSigerd');
if (!stored) {
estudiantesLista = [];
llenarSelectorEstudiantes();
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
return;
}
const registros = JSON.parse(stored);
if (!Array.isArray(registros) || registros.length === 0) {
estudiantesLista = [];
llenarSelectorEstudiantes();
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
return;
}
const registrosFiltrados = filtrarEstudiantes(registros);
let ordenAZ = false;
try {
const storedOrden = localStorage.getItem('ordenAZActivo');
if (storedOrden !== null) ordenAZ = JSON.parse(storedOrden);
} catch (e) {}
if (ordenAZ) {
registrosFiltrados.sort((a, b) => {
const nombreA = (a.nombre || '').toUpperCase();
const nombreB = (b.nombre || '').toUpperCase();
return nombreA.localeCompare(nombreB);
});
} else {
registrosFiltrados.sort((a, b) => (parseInt(a.orden, 10) || 0) - (parseInt(b.orden, 10) || 0));
}
const uidSeleccionadoAntes = estudianteSeleccionado ? estudianteSeleccionado.uid : null;
estudiantesLista = registrosFiltrados;
llenarSelectorEstudiantes();
if (uidSeleccionadoAntes) {
const nuevoIndice = estudiantesLista.findIndex(e => e.uid === uidSeleccionadoAntes);
if (nuevoIndice >= 0) {
indiceActual = nuevoIndice;
const selector = document.getElementById('selectorEstudiante');
if (selector) selector.value = nuevoIndice;
const est = estudiantesLista[nuevoIndice];
estudianteSeleccionado = {
id: est.id || est.idEstudiante || est.cedula || 'SIN ID',
nombre: est.nombre || 'Sin nombre',
apellido: est.apellido || 'Sin apellido',
orden: parseInt(est.orden, 10) || (nuevoIndice + 1),
uid: est.uid || '',
index: nuevoIndice
};
actualizarInfoEstudiante();
} else {
estudianteSeleccionado = null;
indiceActual = -1;
}
}
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
} catch (e) {
console.error('❌ Error cargando estudiantes:', e);
estudiantesLista = [];
llenarSelectorEstudiantes();
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
}
}
// ====================================================================
// LLENAR SELECTOR
// ====================================================================
function llenarSelectorEstudiantes() {
const selector = document.getElementById('selectorEstudiante');
if (!selector) return;
const valorActual = selector.value;
selector.innerHTML = '<option value="">-- Seleccionar estudiante --</option>';
if (estudiantesLista.length === 0) {
const grupo = obtenerGrupoActual();
let mensaje = `-- No hay estudiantes para: ${grupo.grado}, Sección ${grupo.seccion}, ${grupo.tanda} --`;
selector.innerHTML = `<option value="">${mensaje}</option>`;
actualizarInfoEstudiante();
return;
}
estudiantesLista.forEach(function(est, index) {
const option = document.createElement('option');
const nombre = est.nombre || 'Sin nombre';
const apellido = est.apellido || 'Sin apellido';
const id = est.id || est.idEstudiante || est.cedula || 'SIN ID';
const uid = est.uid || '';
const ordenReal = parseInt(est.orden, 10) || (index + 1);
option.value = index;
option.textContent = `${index + 1}. ${nombre} ${apellido} (${id})`;
option.dataset.id = id;
option.dataset.nombre = nombre;
option.dataset.apellido = apellido;
option.dataset.orden = ordenReal;
option.dataset.uid = uid;
selector.appendChild(option);
});
if (valorActual && selector.querySelector(`option[value="${valorActual}"]`)) {
selector.value = valorActual;
} else {
selector.value = '';
}
actualizarInfoEstudiante();
}
// ====================================================================
// ACTUALIZAR INFO ESTUDIANTE
// ====================================================================
function actualizarInfoEstudiante() {
const selector = document.getElementById('selectorEstudiante');
if (!selector) return;
const selectedIndex = selector.value;
if (selectedIndex === '' || selectedIndex === null || selectedIndex === undefined) {
estudianteSeleccionado = null;
indiceActual = -1;
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
return;
}
const option = selector.options[selector.selectedIndex];
if (!option || !option.dataset) {
estudianteSeleccionado = null;
indiceActual = -1;
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
return;
}
const nombre = option.dataset.nombre || 'Sin nombre';
const apellido = option.dataset.apellido || 'Sin apellido';
const id = option.dataset.id || 'SIN ID';
const orden = option.dataset.orden || '?';
const uid = option.dataset.uid || '';
estudianteSeleccionado = {
id: id,
nombre: nombre,
apellido: apellido,
orden: orden,
uid: uid,
index: parseInt(selectedIndex, 10)
};
indiceActual = parseInt(selectedIndex, 10);
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
}
// ====================================================================
// ACTUALIZAR INDICADOR Y BOTONES
// ====================================================================
function actualizarIndicadorPosicion() {
const posicionActual = document.getElementById('posicionActual');
const totalEstudiantes = document.getElementById('totalEstudiantes');
const indicador = document.getElementById('indicadorPosicion');
if (!posicionActual || !totalEstudiantes || !indicador) return;
if (estudiantesLista.length === 0 || indiceActual < 0 || indiceActual >= estudiantesLista.length) {
posicionActual.textContent = '0';
totalEstudiantes.textContent = estudiantesLista.length.toString();
indicador.style.display = 'none';
return;
}
posicionActual.textContent = (indiceActual + 1).toString();
totalEstudiantes.textContent = estudiantesLista.length.toString();
indicador.style.display = 'inline-block';
}
function actualizarBotonesFlecha() {
const btnAnterior = document.getElementById('btnAnterior');
const btnSiguiente = document.getElementById('btnSiguiente');
if (!btnAnterior || !btnSiguiente) return;
if (estudiantesLista.length === 0 || indiceActual < 0) {
btnAnterior.disabled = true;
btnSiguiente.disabled = true;
return;
}
btnAnterior.disabled = (indiceActual <= 0);
btnSiguiente.disabled = (indiceActual >= estudiantesLista.length - 1);
}
// ====================================================================
// NAVEGAR ESTUDIANTES
// ====================================================================
function navegarAnterior() {
if (indiceActual <= 0 || estudiantesLista.length === 0) {
mostrarMensaje('⚠️ Ya estás en el primer estudiante.', 'warning');
return;
}
if (estudianteSeleccionado) guardarObservacionesPorPeriodo();
const nuevoIndice = indiceActual - 1;
const estudiante = estudiantesLista[nuevoIndice];
if (!estudiante) return;
cargarEstudiantePorIndice(nuevoIndice, estudiante);
}
function navegarSiguiente() {
if (indiceActual >= estudiantesLista.length - 1 || estudiantesLista.length === 0) {
mostrarMensaje('⚠️ Ya estás en el último estudiante.', 'warning');
return;
}
if (estudianteSeleccionado) guardarObservacionesPorPeriodo();
const nuevoIndice = indiceActual + 1;
const estudiante = estudiantesLista[nuevoIndice];
if (!estudiante) return;
cargarEstudiantePorIndice(nuevoIndice, estudiante);
}
function cargarEstudiantePorIndice(indice, estudiante) {
if (!estudiante) return;
indiceActual = indice;
const selector = document.getElementById('selectorEstudiante');
if (selector) selector.value = indice;
const ordenReal = parseInt(estudiante.orden, 10) || (indice + 1);
estudianteSeleccionado = {
id: estudiante.id || estudiante.idEstudiante || estudiante.cedula || 'SIN ID',
nombre: estudiante.nombre || 'Sin nombre',
apellido: estudiante.apellido || 'Sin apellido',
orden: ordenReal,
uid: estudiante.uid || '',
index: indice
};
cargarEstudianteEnBoletin();
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
mostrarMensaje(`✅ Estudiante ${indice + 1} de ${estudiantesLista.length}: ${estudianteSeleccionado.nombre} ${estudianteSeleccionado.apellido}`, 'info');
}
function cargarEstudiantePorDefecto() {
if (estudiantesLista.length === 0) return;
if (estudianteSeleccionado && estudianteSeleccionado.uid) {
const idx = estudiantesLista.findIndex(e => e.uid === estudianteSeleccionado.uid);
if (idx >= 0) {
indiceActual = idx;
const selector = document.getElementById('selectorEstudiante');
if (selector) selector.value = idx;
return;
}
}
const estudiante = estudiantesLista[0];
if (!estudiante) return;
indiceActual = 0;
const ordenReal = parseInt(estudiante.orden, 10) || 1;
estudianteSeleccionado = {
id: estudiante.id || estudiante.idEstudiante || estudiante.cedula || 'SIN ID',
nombre: estudiante.nombre || 'Sin nombre',
apellido: estudiante.apellido || 'Sin apellido',
orden: ordenReal,
uid: estudiante.uid || '',
index: 0
};
const selector = document.getElementById('selectorEstudiante');
if (selector) selector.value = 0;
cargarEstudianteEnBoletin();
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
}
// ====================================================================
// ✅ CARGAR ESTUDIANTE EN EL BOLETÍN
// ====================================================================
function cargarEstudianteEnBoletin() {
if (!estudianteSeleccionado) {
mostrarMensaje('⚠️ Por favor, seleccione un estudiante primero.', 'warning');
return;
}
const campoId = document.getElementById('campoIdEstudiante');
const campoNombres = document.getElementById('campoNombres');
const campoApellidos = document.getElementById('campoApellidos');
const campoNumeroOrden = document.getElementById('campoNumeroOrden');
if (campoId) campoId.value = String(estudianteSeleccionado.id || '').toUpperCase();
if (campoNombres) campoNombres.value = String(estudianteSeleccionado.nombre || '').toUpperCase();
if (campoApellidos) campoApellidos.value = String(estudianteSeleccionado.apellido || '').toUpperCase();
if (campoNumeroOrden) {
campoNumeroOrden.value = estudianteSeleccionado.orden;
campoNumeroOrden.readOnly = true;
}
const uid = estudianteSeleccionado.uid;
const orden = parseInt(estudianteSeleccionado.orden, 10);
if (!uid) {
console.warn('⚠️ Estudiante sin UID.');
limpiarCasillasCalificacion();
limpiarAsistencia();
mostrarSituacionVacia();
limpiarTodasLasLineas();
limpiarObservacionesPorPeriodo();
return;
}
cargarCalificacionesDesdeRegistro(uid, orden);
cargarAsistenciaDesdeRegistro(uid, orden);
calcularYMostrarSituacion(uid, orden);
asignarYMostrarObservacion(uid, orden);
requestAnimationFrame(function() {
procesarObservacionesEstudianteIndividual(uid, orden);
cargarObservacionesPorPeriodoUI(uid);
});
}
function limpiarAsistencia() {
const inputsAsistencia = document.querySelectorAll('.input-asistencia');
inputsAsistencia.forEach(input => input.value = '');
}
function limpiarObservacionesPorPeriodo() {
const inputs = document.querySelectorAll('.input-observacion');
inputs.forEach(input => input.value = '');
}
// ====================================================================
// ✅ CARGAR CALIFICACIONES (INCLUYE RECUPERACIÓN ESPECIAL)
// ====================================================================
function cargarCalificacionesDesdeRegistro(uid, numeroOrden) {
try {
limpiarCasillasCalificacion();
console.log('🔍 Cargando calificaciones - UID:', uid, '| Orden:', numeroOrden,
'| Grado:', currentGrade, '| Sección:', currentSeccion);
const hasRP = currentGrade >= 3;
const periodsCount = 4;
let totalMaterias = (currentGrade >= 4) ? 8 : 7;
let notasEncontradas = 0;
for (let m = 1; m <= totalMaterias; m++) {
const promediosCompetencia = {};
for (let c = 1; c <= 3; c++) {
for (let p = 1; p <= periodsCount; p++) {
const pValStr = leerNotaBoletin(uid, numeroOrden, m, c, p, false);
const pVal = pValStr !== null && pValStr !== '' ? parseFloat(pValStr) : null;
let rpVal = null;
if (hasRP) {
const rpValStr = leerNotaBoletin(uid, numeroOrden, m, c, p, true);
rpVal = rpValStr !== null && rpValStr !== '' ? parseFloat(rpValStr) : null;
}
if (pVal !== null) notasEncontradas++;
const pCellId = `bol_m${m}_c${c}_p${p}`;
const pCell = document.getElementById(pCellId);
if (pCell) {
pCell.value = (pVal !== null && !isNaN(pVal)) ? pVal : '';
}
if (hasRP) {
const rpCellId = `bol_m${m}_c${c}_rp${p}`;
const rpCell = document.getElementById(rpCellId);
if (rpCell) {
rpCell.value = (rpVal !== null && !isNaN(rpVal)) ? rpVal : '';
}
}
}
const promedioCompetencia = calcularCompetenciaSiCompleta(uid, numeroOrden, m, c);
promediosCompetencia[c] = promedioCompetencia;
}
const avgC1 = promediosCompetencia[1] !== null ? promediosCompetencia[1] : '';
const avgC2 = promediosCompetencia[2] !== null ? promediosCompetencia[2] : '';
const avgC3 = promediosCompetencia[3] !== null ? promediosCompetencia[3] : '';
const avgC1Cell = document.getElementById(`bol_m${m}_avgc1`);
const avgC2Cell = document.getElementById(`bol_m${m}_avgc2`);
const avgC3Cell = document.getElementById(`bol_m${m}_avgc3`);
if (avgC1Cell) avgC1Cell.value = avgC1;
if (avgC2Cell) avgC2Cell.value = avgC2;
if (avgC3Cell) avgC3Cell.value = avgC3;
let finalGrade = '';
if (avgC1 !== '' && avgC2 !== '' && avgC3 !== '') {
finalGrade = Math.round((parseFloat(avgC1) + parseFloat(avgC2) + parseFloat(avgC3)) / 3);
if (finalGrade > 100) finalGrade = 100;
}
const finalCell = document.getElementById(`bol_m${m}_final`);
if (finalCell) finalCell.value = finalGrade;
const recVal = leerRecFinalBoletin(uid, numeroOrden, m);
const recCell = document.getElementById(`bol_m${m}_recfinal`);
if (recCell) {
recCell.value = (recVal !== null && recVal !== '') ? recVal : '';
}
// ✅ CARGAR RECUPERACIÓN ESPECIAL (3ro a 6to)
if (currentGrade >= 3) {
const recEspVal = leerRecEspecialBoletin(uid, numeroOrden, m);
const recEspCell = document.getElementById(`bol_m${m}_recespecial`);
if (recEspCell) {
recEspCell.value = (recEspVal !== null && recEspVal !== '') ? recEspVal : '';
}
}
}
console.log(`✅ ${notasEncontradas} notas encontradas para UID: ${uid}`);
setTimeout(function() {
configurarListenersCalificaciones();
}, 200);
} catch (e) {
console.error('❌ Error cargando calificaciones:', e);
}
}
function limpiarCasillasCalificacion() {
const inputs = document.querySelectorAll('.input-calificacion');
inputs.forEach(function(input) {
input.value = '';
});
}
// ====================================================================
// ✅ CARGAR ASISTENCIA (soporta 3 formatos)
// ====================================================================
function cargarAsistenciaDesdeRegistro(uid, numeroOrden) {
console.log('🔍 Cargando asistencia - UID:', uid, '| Orden:', numeroOrden,
'| Grado:', currentGrade, '| Sección:', currentSeccion, '| Tanda:', currentTanda);
try {
limpiarAsistencia();
const datosPeriodos = [
{ periodo: 1, p: 0, t: 0, a: 0, e: 0, asistencia: 0, ausencia: 0, diasReales: 0 },
{ periodo: 2, p: 0, t: 0, a: 0, e: 0, asistencia: 0, ausencia: 0, diasReales: 0 },
{ periodo: 3, p: 0, t: 0, a: 0, e: 0, asistencia: 0, ausencia: 0, diasReales: 0 },
{ periodo: 4, p: 0, t: 0, a: 0, e: 0, asistencia: 0, ausencia: 0, diasReales: 0 }
];
const mesAPeriodo = {
0: 1, 1: 1, 2: 1,
3: 2, 4: 2, 5: 2,
6: 3, 7: 3,
8: 4, 9: 4, 10: 4
};
let clavesEncontradas = 0;
const tandaActualNorm = (currentTanda || 'Matutina').replace(/\s+/g, '_');
for (let i = 0; i < localStorage.length; i++) {
const key = localStorage.key(i);
if (!key || !key.startsWith('att')) continue;
const info = parsearClaveAsistenciaBoletin(key);
if (!info) continue;
if (uid && info.uid !== uid) continue;
if (info.formato !== 'viejo') {
if (info.grado !== currentGrade) continue;
if (info.seccion !== currentSeccion) continue;
if (info.tanda !== tandaActualNorm) continue;
}
const mesIdx = info.mes;
if (mesIdx < 0 || mesIdx > 10) continue;
const periodoDestino = mesAPeriodo[mesIdx] || 0;
if (periodoDestino === 0) continue;
const val = String(localStorage.getItem(key) || '').toUpperCase();
if (val === 'P' || val === 'T' || val === 'A' || val === 'E') {
const idx = periodoDestino - 1;
if (val === 'P') datosPeriodos[idx].p++;
else if (val === 'T') datosPeriodos[idx].t++;
else if (val === 'A') datosPeriodos[idx].a++;
else if (val === 'E') datosPeriodos[idx].e++;
datosPeriodos[idx].diasReales++;
if (val === 'A') datosPeriodos[idx].ausencia++;
else datosPeriodos[idx].asistencia++;
clavesEncontradas++;
}
}
console.log(`✅ ${clavesEncontradas} asistencias encontradas para UID: ${uid}`);
let totalAsistenciaAnual = 0;
let totalAusenciaAnual = 0;
let totalDiasRealesAnual = 0;
for (let p = 0; p < 4; p++) {
totalAsistenciaAnual += datosPeriodos[p].asistencia;
totalAusenciaAnual += datosPeriodos[p].ausencia;
totalDiasRealesAnual += datosPeriodos[p].diasReales;
}
const tableBody = document.querySelector('.asistencia-tabla tbody');
if (tableBody) {
const rows = tableBody.querySelectorAll('tr');
for (let i = 0; i < Math.min(4, rows.length); i++) {
const row = rows[i];
const inputs = row.querySelectorAll('input');
if (inputs.length >= 2) {
inputs[0].value = datosPeriodos[i]?.asistencia || '';
inputs[1].value = datosPeriodos[i]?.ausencia || '';
}
}
if (rows.length > 0) {
const firstRow = rows[0];
const inputs = firstRow.querySelectorAll('input');
if (inputs.length >= 4 && totalDiasRealesAnual > 0) {
const totalPctAsist = Math.round((totalAsistenciaAnual / totalDiasRealesAnual) * 100);
const totalPctAus = Math.round((totalAusenciaAnual / totalDiasRealesAnual) * 100);
inputs[2].value = totalPctAsist > 0 ? totalPctAsist + '%' : '';
inputs[3].value = totalPctAus > 0 ? totalPctAus + '%' : '';
}
}
}
console.log(`✅ Asistencia cargada para UID: ${uid}`);
} catch (e) {
console.error('❌ Error cargando asistencia:', e);
}
}
// ====================================================================
// ✅ CALCULAR PORCENTAJE DE ASISTENCIA ANUAL
// ====================================================================
function calcularPorcentajeAsistenciaAnual(uid, numeroOrden) {
try {
let totalAsistencia = 0;
let totalDiasReales = 0;
const mesAPeriodo = {
0: 1, 1: 1, 2: 1,
3: 2, 4: 2, 5: 2,
6: 3, 7: 3,
8: 4, 9: 4, 10: 4
};
const tandaActualNorm = (currentTanda || 'Matutina').replace(/\s+/g, '_');
for (let i = 0; i < localStorage.length; i++) {
const key = localStorage.key(i);
if (!key || !key.startsWith('att')) continue;
const info = parsearClaveAsistenciaBoletin(key);
if (!info) continue;
if (uid && info.uid !== uid) continue;
if (info.formato !== 'viejo') {
if (info.grado !== currentGrade) continue;
if (info.seccion !== currentSeccion) continue;
if (info.tanda !== tandaActualNorm) continue;
}
if (!mesAPeriodo[info.mes]) continue;
const val = String(localStorage.getItem(key) || '').toUpperCase();
if (val === 'P' || val === 'T' || val === 'A' || val === 'E') {
totalDiasReales++;
if (val !== 'A') totalAsistencia++;
}
}
if (totalDiasReales === 0) return 0;
return Math.round((totalAsistencia / totalDiasReales) * 100);
} catch (e) {
console.error('❌ Error calculando porcentaje de asistencia:', e);
return 0;
}
}
// ====================================================================
// ✅ 🆕 OBTENER CALIFICACIÓN FINAL DE UNA MATERIA (CON REC ESPECIAL)
// ====================================================================
// Retorna un OBJETO con toda la info:
// {
//     final: 62,                    // Calificación final del área (0-100 o null)
//     recuperacionFinal: 68,        // Recuperación final (0-100 o null)
//     recuperacionEspecial: 75,     // Recuperación especial (0-100 o null)
//     aprobada: true,               // ¿Cuenta como APROBADA para la situación?
//     razon: 'final' | 'rec_final' | 'rec_especial' | 'reprobada' | 'incompleta',
//     finalOriginal: 62             // Calificación final original (sin considerar rec)
// }
// ====================================================================
function obtenerCalificacionFinalMateria(uid, numeroOrden, materia) {
try {
const c1 = calcularCompetenciaSiCompleta(uid, numeroOrden, materia, 1);
const c2 = calcularCompetenciaSiCompleta(uid, numeroOrden, materia, 2);
const c3 = calcularCompetenciaSiCompleta(uid, numeroOrden, materia, 3);
const resultado = {
final: null,
recuperacionFinal: null,
recuperacionEspecial: null,
aprobada: false,
razon: 'incompleta',
finalOriginal: null
};
// Si C1, C2 o C3 no están completas → no se puede calcular el final
if (c1 === null || c2 === null || c3 === null) {
// Intentar leer recuperaciones de todos modos
const recFinalStr = leerRecFinalBoletin(uid, numeroOrden, materia);
const recEspStr = leerRecEspecialBoletin(uid, numeroOrden, materia);
if (recFinalStr !== null && recFinalStr !== '') {
const recFinalNum = parseFloat(recFinalStr);
if (!isNaN(recFinalNum)) resultado.recuperacionFinal = recFinalNum > 100 ? 100 : recFinalNum;
}
if (recEspStr !== null && recEspStr !== '') {
const recEspNum = parseFloat(recEspStr);
if (!isNaN(recEspNum)) resultado.recuperacionEspecial = recEspNum > 100 ? 100 : recEspNum;
}
return resultado;
}
// Calcular final del área
let finalMateria = Math.round((c1 + c2 + c3) / 3);
if (finalMateria > 100) finalMateria = 100;
resultado.final = finalMateria;
resultado.finalOriginal = finalMateria;
// Leer recuperaciones
const recFinalStr = leerRecFinalBoletin(uid, numeroOrden, materia);
if (recFinalStr !== null && recFinalStr !== '') {
const recFinalNum = parseFloat(recFinalStr);
if (!isNaN(recFinalNum)) {
resultado.recuperacionFinal = recFinalNum > 100 ? 100 : recFinalNum;
}
}
const recEspStr = leerRecEspecialBoletin(uid, numeroOrden, materia);
if (recEspStr !== null && recEspStr !== '') {
const recEspNum = parseFloat(recEspStr);
if (!isNaN(recEspNum)) {
resultado.recuperacionEspecial = recEspNum > 100 ? 100 : recEspNum;
}
}
// ✅ LÓGICA DE APROBACIÓN (orden de prioridad):
// 1. Si FINAL >= 65 → APROBADA por final
if (finalMateria >= NOTA_MINIMA_APROBATORIA) {
resultado.aprobada = true;
resultado.razon = 'final';
return resultado;
}
// 2. Si FINAL < 65 pero REC_FINAL >= 65 → APROBADA por recuperación final
if (resultado.recuperacionFinal !== null &&
resultado.recuperacionFinal >= NOTA_MINIMA_APROBATORIA) {
resultado.aprobada = true;
resultado.razon = 'rec_final';
return resultado;
}
// 3. Si FINAL < 65 y REC_FINAL < 65 (o no hay) pero REC_ESPECIAL >= 65 → APROBADA
if (resultado.recuperacionEspecial !== null &&
resultado.recuperacionEspecial >= NOTA_MINIMA_APROBATORIA) {
resultado.aprobada = true;
resultado.razon = 'rec_especial';
return resultado;
}
// 4. No aprobó por ninguna vía → REPROBADA
resultado.aprobada = false;
resultado.razon = 'reprobada';
return resultado;
} catch (e) {
console.error('❌ Error obteniendo calificación final de materia:', e);
return {
final: null,
recuperacionFinal: null,
recuperacionEspecial: null,
aprobada: false,
razon: 'incompleta',
finalOriginal: null
};
}
}
// ====================================================================
// ✅ VERIFICAR SI TODAS LAS CALIFICACIONES FINALES ESTÁN COMPLETAS
// ====================================================================
function todasLasCalificacionesFinalesCompletas(uid, numeroOrden) {
try {
const totalMaterias = (currentGrade >= 4) ? 8 : 7;
for (let m = 1; m <= totalMaterias; m++) {
const calif = obtenerCalificacionFinalMateria(uid, numeroOrden, m);
if (calif.final === null) {
return false;
}
}
return true;
} catch (e) {
console.error('❌ Error verificando calificaciones finales:', e);
return false;
}
}
// ====================================================================
// DIVIDIR TEXTO EN LÍNEAS
// ====================================================================
function dividirTextoEnLineas(texto, maxCaracteresPorLinea) {
if (!texto) return [];
const limite = maxCaracteresPorLinea || 55;
if (texto.length <= limite) return [texto];
const lineas = [];
let textoRestante = texto.trim();
while (textoRestante.length > 0) {
if (textoRestante.length <= limite) {
lineas.push(textoRestante);
break;
}
let corte = limite;
while (corte > 0 && textoRestante[corte] !== ' ') corte--;
if (corte === 0) {
corte = limite;
while (corte < textoRestante.length && textoRestante[corte] !== ' ') corte++;
if (corte >= textoRestante.length) corte = textoRestante.length;
}
const linea = textoRestante.substring(0, corte).trim();
if (linea) lineas.push(linea);
textoRestante = textoRestante.substring(corte).trim();
}
return lineas;
}
// ====================================================================
// MOSTRAR OBSERVACIÓN GENERAL
// ====================================================================
function mostrarObservacionEnBoletin(uid, numeroOrden) {
try {
if (!uid) return;
const obsKey = getClaveObsGeneral(uid);
const frase = localStorage.getItem(obsKey) || '';
if (!frase) {
limpiarTodasLasLineas();
return;
}
const lineas = dividirTextoEnLineas(frase, 55);
if (currentGrade <= 2) {
const avanceLineas = document.querySelectorAll('.avance-linea input');
if (avanceLineas.length > 0) {
avanceLineas.forEach(input => input.value = '');
const maxLineas = Math.min(lineas.length, avanceLineas.length);
for (let i = 0; i < maxLineas; i++) {
avanceLineas[i].value = lineas[i];
}
}
} else {
const obsInputs = document.querySelectorAll('.observaciones-linea input');
if (obsInputs.length > 0) {
obsInputs.forEach(input => input.value = '');
const maxLineas = Math.min(lineas.length, obsInputs.length);
for (let i = 0; i < maxLineas; i++) {
obsInputs[i].value = lineas[i];
}
}
}
} catch (e) {
console.error('❌ Error mostrando observación:', e);
}
}
function limpiarTodasLasLineas() {
const avanceLineas = document.querySelectorAll('.avance-linea input');
avanceLineas.forEach(input => input.value = '');
const obsInputs = document.querySelectorAll('.observaciones-linea input');
obsInputs.forEach(input => input.value = '');
}
// ====================================================================
// ✅ ASIGNAR Y MOSTRAR OBSERVACIÓN GENERAL
// ====================================================================
function asignarYMostrarObservacion(uid, numeroOrden) {
try {
if (!uid) return;
const todasCompletas = todasLasCalificacionesFinalesCompletas(uid, numeroOrden);
if (!todasCompletas) {
console.log('ℹ️ No todas las calificaciones finales están completas. Observación NO generada.');
const obsKey = getClaveObsGeneral(uid);
localStorage.removeItem(obsKey);
limpiarTodasLasLineas();
return;
}
const totalMaterias = (currentGrade >= 4) ? 8 : 7;
let sumaFinales = 0;
let materiasConFinal = 0;
for (let m = 1; m <= totalMaterias; m++) {
const calif = obtenerCalificacionFinalMateria(uid, numeroOrden, m);
if (calif.final !== null) {
sumaFinales += calif.final;
materiasConFinal++;
}
}
if (materiasConFinal === 0) {
console.log('ℹ️ No hay calificaciones finales para asignar observación.');
const obsKey = getClaveObsGeneral(uid);
localStorage.removeItem(obsKey);
limpiarTodasLasLineas();
return;
}
const promedioFinal = Math.round(sumaFinales / materiasConFinal);
const situacionKey = getClaveSituacion(uid);
const situacion = localStorage.getItem(situacionKey) || '';
console.log(`📊 UID ${uid}: Promedio FINAL=${promedioFinal}, Situación=${situacion || 'No definida'}`);
let frase = '';
if (typeof generadorObservaciones !== 'undefined') {
frase = generadorObservaciones.obtenerFraseUnica(uid.toString(), promedioFinal, situacion);
} else {
frase = obtenerFraseFallback(promedioFinal);
}
const obsKey = getClaveObsGeneral(uid);
localStorage.setItem(obsKey, frase);
console.log(`📝 Observación general asignada: "${frase.substring(0, 60)}..."`);
mostrarObservacionEnBoletin(uid, numeroOrden);
} catch (e) {
console.error('❌ Error asignando observación:', e);
}
}
// ====================================================================
// ✅ 🆕 CALCULAR SITUACIÓN - CON RECUPERACIÓN ESPECIAL
// ====================================================================
// LÓGICA:
//   Para cada materia:
//     1. Si FINAL >= 65 → APROBADA
//     2. Si FINAL < 65 y REC_FINAL >= 65 → APROBADA
//     3. Si FINAL < 65 y REC_FINAL < 65 (o vacía) y REC_ESPECIAL >= 65 → APROBADA
//     4. En cualquier otro caso → REPROBADA
//
//   Contar aprobadas y reprobadas:
//     • Si asistencia < 70% → REPITENTE (sin importar notas)
//     • Si 0 reprobadas y asistencia >= 70% → PROMOVIDO
//     • Si 1-4 reprobadas y asistencia >= 70% → APLAZADO
//     • Si 5+ reprobadas y asistencia >= 70% → REPITENTE
// ====================================================================
function calcularYMostrarSituacion(uid, numeroOrden) {
console.log('🔍 Calculando situación - UID:', uid, '| Orden:', numeroOrden);
try {
if (!uid) {
mostrarSituacionVacia();
return;
}
let totalMaterias = (currentGrade >= 4) ? 8 : 7;
let materiasAprobadas = 0;
let materiasReprobadas = 0;
let materiasSinNota = 0;
let materiasSinCalificacionFinal = 0;
let notasPorMateria = [];
for (let m = 1; m <= totalMaterias; m++) {
const calif = obtenerCalificacionFinalMateria(uid, numeroOrden, m);
if (calif.final === null) {
// Verificar si tiene alguna nota
let tieneAlgunaNota = false;
for (let c = 1; c <= 3; c++) {
for (let p = 1; p <= 4; p++) {
const val = leerNotaBoletin(uid, numeroOrden, m, c, p, false);
if (val !== null && val !== '') {
tieneAlgunaNota = true;
break;
}
}
if (tieneAlgunaNota) break;
}
if (!tieneAlgunaNota) {
materiasSinNota++;
notasPorMateria.push({
materia: m,
nota: null,
estado: 'Sin nota',
final: null,
recFinal: null,
recEspecial: null,
razon: 'sin_nota'
});
} else {
materiasSinCalificacionFinal++;
notasPorMateria.push({
materia: m,
nota: null,
estado: 'Incompleta',
final: null,
recFinal: calif.recuperacionFinal,
recEspecial: calif.recuperacionEspecial,
razon: 'incompleta'
});
}
} else {
if (calif.aprobada) {
materiasAprobadas++;
notasPorMateria.push({
materia: m,
nota: calif.final,
estado: 'Aprobada',
final: calif.final,
recFinal: calif.recuperacionFinal,
recEspecial: calif.recuperacionEspecial,
razon: calif.razon
});
} else {
materiasReprobadas++;
notasPorMateria.push({
materia: m,
nota: calif.final,
estado: 'Reprobada',
final: calif.final,
recFinal: calif.recuperacionFinal,
recEspecial: calif.recuperacionEspecial,
razon: calif.razon
});
}
}
}
const materiasConNotas = materiasAprobadas + materiasReprobadas;
const porcentajeAsistencia = calcularPorcentajeAsistenciaAnual(uid, numeroOrden);
console.log(`📊 Total: ${totalMaterias} | Aprobadas: ${materiasAprobadas} | Reprobadas: ${materiasReprobadas} | Sin nota: ${materiasSinNota} | Incompletas: ${materiasSinCalificacionFinal} | Asistencia: ${porcentajeAsistencia}%`);
// 1. Si no hay ninguna nota, no se marca situación
if (materiasConNotas === 0 && materiasSinCalificacionFinal === 0) {
console.log('ℹ️ No hay calificaciones. No se marca ninguna situación.');
const situacionKey = getClaveSituacion(uid);
localStorage.removeItem(situacionKey);
mostrarSituacionVacia();
const obsKey = getClaveObsGeneral(uid);
localStorage.removeItem(obsKey);
limpiarTodasLasLineas();
return null;
}
// 2. Si faltan notas, se muestra "Pendiente"
if (materiasSinNota > 0 || materiasSinCalificacionFinal > 0) {
console.log(`⚠️ Faltan ${materiasSinNota} materia(s) sin nota y ${materiasSinCalificacionFinal} con calificación final incompleta. Situación PENDIENTE.`);
const situacionKey = getClaveSituacion(uid);
localStorage.removeItem(situacionKey);
const obsKey = getClaveObsGeneral(uid);
localStorage.removeItem(obsKey);
limpiarTodasLasLineas();
mostrarSituacionIncompleta({
aprobadas: materiasAprobadas,
reprobadas: materiasReprobadas,
sinNota: materiasSinNota,
sinCalificacionFinal: materiasSinCalificacionFinal,
total: totalMaterias,
detalle: notasPorMateria,
asistencia: porcentajeAsistencia
});
return null;
}
// 3. Determinar situación según normativa MINERD
let situacion = '';
let mensaje = '';
let icono = '';
let color = '';
if (porcentajeAsistencia < ASISTENCIA_MINIMA_PORCENTAJE) {
situacion = 'repitente';
icono = '🔄';
color = '#dc3545';
mensaje = `Repitente - Asistencia anual insuficiente (${porcentajeAsistencia}% < 70%). No cumple con el requisito mínimo de asistencia.`;
} else {
if (materiasReprobadas === 0) {
situacion = 'promovido';
icono = '🎓';
color = '#28a745';
mensaje = 'Promovido/a - Aprobó todas las áreas con calificaciones ≥ 65 (incluyendo recuperaciones).';
} else if (materiasReprobadas >= 1 && materiasReprobadas <= 4) {
situacion = 'aplazado';
icono = '📝';
color = '#ffc107';
mensaje = `Aplazado/a - Tiene ${materiasReprobadas} área(s) reprobada(s) incluso después de recuperaciones. Tiene oportunidad de recuperación pedagógica.`;
} else {
situacion = 'repitente';
icono = '🔄';
color = '#dc3545';
mensaje = `Repitente - Tiene ${materiasReprobadas} área(s) reprobada(s). No cumple con los requisitos mínimos de promoción.`;
}
}
const situacionKey = getClaveSituacion(uid);
localStorage.setItem(situacionKey, situacion);
const resultado = {
situacion: situacion,
mensaje: mensaje,
icono: icono,
color: color,
aprobadas: materiasAprobadas,
reprobadas: materiasReprobadas,
sinNota: 0,
sinCalificacionFinal: 0,
total: totalMaterias,
totalConNotas: materiasConNotas,
detalle: notasPorMateria,
asistencia: porcentajeAsistencia
};
actualizarRadioSituacion(situacion);
mostrarDetalleSituacion(resultado);
actualizarCondicionFinal(situacion, currentGrade);
actualizarObservacionPorSituacion(uid, numeroOrden);
console.log(`✅ Situación calculada: ${situacion.toUpperCase()} (${materiasReprobadas} reprobadas, asistencia ${porcentajeAsistencia}%)`);
return resultado;
} catch (e) {
console.error('❌ Error calculando situación:', e);
mostrarSituacionVacia();
return null;
}
}
function actualizarCondicionFinal(situacion, gradoActual) {
if (gradoActual < 3) {
const linea1 = document.getElementById('condicionFinalLinea1');
const linea2 = document.getElementById('condicionFinalLinea2');
const linea3 = document.getElementById('condicionFinalLinea3');
if (linea1) linea1.value = '';
if (linea2) linea2.value = '';
if (linea3) linea3.value = '';
return;
}
const linea1 = document.getElementById('condicionFinalLinea1');
const linea2 = document.getElementById('condicionFinalLinea2');
const linea3 = document.getElementById('condicionFinalLinea3');
if (!linea1 || !linea2 || !linea3) return;
linea1.value = '';
linea2.value = '';
linea3.value = '';
linea1.style.fontWeight = 'bold';
linea2.style.fontWeight = 'bold';
linea3.style.fontWeight = 'bold';
linea3.style.display = 'block';
let lineasTexto = [];
switch (situacion) {
case 'promovido':
linea1.style.color = '#28a745';
linea2.style.color = '#28a745';
linea3.style.color = '#28a745';
lineasTexto = [
'PROMOVIDO/A AL GRADO INMEDIATO SUPERIOR.',
'HA ALCANZADO SATISFACTORIAMENTE LAS COMPETENCIAS',
'ESTABLECIDAS PARA EL GRADO CURSADO.'
];
break;
case 'aplazado':
linea1.style.color = '#ffc107';
linea2.style.color = '#ffc107';
linea3.style.color = '#ffc107';
lineasTexto = [
'APLAZADO/A. PENDIENTE DE LA EVALUACIÓN COMPLEMENTARIA.',
'DEBE PRESENTARSE A LA RECUPERACIÓN PEDAGÓGICA PARA',
'SUPERAR LAS ÁREAS PENDIENTES.'
];
break;
case 'repitente':
linea1.style.color = '#dc3545';
linea2.style.color = '#dc3545';
linea3.style.color = '#dc3545';
lineasTexto = [
'REPITENTE. DEBE CURSAR NUEVAMENTE EL GRADO.',
'NO CUMPLE CON LOS REQUISITOS MÍNIMOS DE PROMOCIÓN',
'ESTABLECIDOS POR LA NORMATIVA MINERD.'
];
break;
default:
lineasTexto = ['', '', ''];
break;
}
linea1.value = lineasTexto[0] || '';
linea2.value = lineasTexto[1] || '';
linea3.value = lineasTexto[2] || '';
}
function actualizarRadioSituacion(situacion) {
document.querySelectorAll('input[name="situacion"]').forEach(radio => {
radio.checked = false;
radio.removeAttribute('checked');
const label = radio.closest('.situacion-radio');
if (label) {
label.style.border = 'none';
label.style.background = '#f8f9fa';
}
});
if (!situacion) return;
const radioMap = {
'promovido': 'radioPromovido',
'aplazado': 'radioAplazado',
'repitente': 'radioRepitente'
};
const radioId = radioMap[situacion];
if (radioId) {
const radio = document.getElementById(radioId);
if (radio) {
radio.checked = true;
const label = radio.closest('.situacion-radio');
if (label) {
const colores = {
'promovido': '#28a745',
'aplazado': '#ffc107',
'repitente': '#dc3545'
};
label.style.border = `2px solid ${colores[situacion]}`;
label.style.background = `${colores[situacion]}20`;
}
radio.dispatchEvent(new Event('change'));
}
}
}
// ====================================================================
// ✅ 🆕 MOSTRAR DETALLE DE SITUACIÓN (CON REC ESPECIAL)
// ====================================================================
function mostrarDetalleSituacion(resultado) {
const panel = document.getElementById('panelSituacionExterno');
if (!panel) return;
if (!resultado || !resultado.situacion) {
panel.style.display = 'none';
return;
}
const situacion = resultado.situacion;
const nombreEstudiante = estudianteSeleccionado
? `${estudianteSeleccionado.nombre} ${estudianteSeleccionado.apellido}`
: 'Estudiante';
const iconos = { 'promovido': '🎓', 'aplazado': '📝', 'repitente': '🔄' };
const etiquetas = { 'promovido': 'PROMOVIDO/A', 'aplazado': 'APLAZADO/A', 'repitente': 'REPITENTE' };
const colores = { 'promovido': '#28a745', 'aplazado': '#ffc107', 'repitente': '#dc3545' };
const mensajes = {
'promovido': 'Cumple con todos los requisitos de promoción según normativa MINERD.',
'aplazado': 'Tiene oportunidad de recuperación pedagógica en las áreas reprobadas.',
'repitente': 'Debe repetir el grado según normativa MINERD.'
};
let gridMaterias = '';
const nombresMaterias = (currentGrade >= 4)
? ['Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza',
'Lenguas Extranjeras (Inglés)', 'Educación Física', 'Formación Integral Humana y Religiosa', 'Educación Artística']
: ['Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza',
'Educación Física', 'Formación Integral, Humana y Religiosa', 'Educación Artística'];
if (resultado.detalle && resultado.detalle.length > 0) {
resultado.detalle.forEach((item, idx) => {
const nombre = nombresMaterias[idx] || `Área ${idx + 1}`;
const esAprobada = item.estado === 'Aprobada';
const esSinNota = item.estado === 'Sin nota';
const esIncompleta = item.estado === 'Incompleta';
let notaDisplay = '—';
if (item.nota !== null && !isNaN(item.nota)) {
notaDisplay = item.nota;
}
let clase = 'sin-nota';
if (esAprobada) clase = 'aprobada';
else if (!esSinNota && !esIncompleta) clase = 'reprobada';
else if (esIncompleta) clase = 'reprobada';
// 🆕 Indicador de razón de aprobación
let razonBadge = '';
if (item.razon === 'rec_final') {
razonBadge = ' <span style="font-size:10px; color:#e65100; font-weight:bold;" title="Aprobada por Recuperación Final">🔄 RF</span>';
} else if (item.razon === 'rec_especial') {
razonBadge = ' <span style="font-size:10px; color:#1565c0; font-weight:bold;" title="Aprobada por Recuperación Especial">🌟 RE</span>';
} else if (item.razon === 'final') {
razonBadge = ' <span style="font-size:10px; color:#28a745; font-weight:bold;" title="Aprobada por calificación final">✓</span>';
}
// 🆕 Info extra de recuperaciones
let recInfo = '';
if (item.final !== null && item.final < NOTA_MINIMA_APROBATORIA) {
if (item.recFinal !== null) {
recInfo += ` <span style="font-size:10px; color:#e65100;">RF:${item.recFinal}</span>`;
}
if (item.recEspecial !== null) {
recInfo += ` <span style="font-size:10px; color:#1565c0;">RE:${item.recEspecial}</span>`;
}
}
gridMaterias += `
<div class="materia-item ${clase}">
<span class="nombre">${nombre}${razonBadge}${recInfo}</span>
<span class="nota">${notaDisplay}</span>
</div>
`;
});
}
let statsHTML = `
<span class="aprobadas">✅ Aprobadas: ${resultado.aprobadas}</span>
<span class="reprobadas">❌ Reprobadas: ${resultado.reprobadas}</span>
<span class="total">📚 Total: ${resultado.total}</span>
<span class="asistencia-stat">📅 Asistencia: ${resultado.asistencia || 0}%</span>
`;
panel.innerHTML = `
<div class="panel-header">
<div class="titulo">
${iconos[situacion]} Situación Académica
<span class="badge-situacion ${situacion}">${etiquetas[situacion]}</span>
</div>
<div class="estudiante-info">👨‍🎓 ${nombreEstudiante}</div>
</div>
<div class="panel-body">
<div class="resumen">
<div class="estado ${situacion}">
${resultado.mensaje}
</div>
<div class="stats">
${statsHTML}
</div>
<div style="font-size:11px; color:#666; margin-top:8px; padding:6px 8px; background:#f0f4f8; border-radius:6px; line-height:1.5;">
<strong>Leyenda:</strong> ✓ Aprobada por final · 🔄 RF Aprobada por Rec. Final · 🌟 RE Aprobada por Rec. Especial
</div>
</div>
<div class="detalle-materias">
<div style="font-size: 12px; font-weight: 600; color: #555; margin-bottom: 6px;">
📋 Detalle por áreas curriculares (calificación final):
</div>
<div class="grid-materias">
${gridMaterias}
</div>
</div>
</div>
<div class="panel-footer">
${mensajes[situacion]}
${situacion === 'aplazado' ? ' 📌 Las áreas reprobadas deben ser recuperadas.' : ''}
</div>
`;
panel.style.display = 'block';
panel.style.borderColor = colores[situacion];
}
// ====================================================================
// ✅ 🆕 MOSTRAR SITUACIÓN INCOMPLETA (CON REC ESPECIAL)
// ====================================================================
function mostrarSituacionIncompleta(resultado) {
const panel = document.getElementById('panelSituacionExterno');
if (!panel) return;
const nombreEstudiante = estudianteSeleccionado
? `${estudianteSeleccionado.nombre} ${estudianteSeleccionado.apellido}`
: 'Estudiante';
let gridMaterias = '';
const nombresMaterias = (currentGrade >= 4)
? ['Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza',
'Lenguas Extranjeras (Inglés)', 'Educación Física', 'Formación Integral Humana y Religiosa', 'Educación Artística']
: ['Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza',
'Educación Física', 'Formación Integral, Humana y Religiosa', 'Educación Artística'];
if (resultado.detalle && resultado.detalle.length > 0) {
resultado.detalle.forEach((item, idx) => {
const nombre = nombresMaterias[idx] || `Área ${idx + 1}`;
const esAprobada = item.estado === 'Aprobada';
const esSinNota = item.estado === 'Sin nota';
const esIncompleta = item.estado === 'Incompleta';
let notaDisplay = '—';
if (item.nota !== null && !isNaN(item.nota)) {
notaDisplay = item.nota;
}
let clase = 'sin-nota';
if (esAprobada) clase = 'aprobada';
else if (!esSinNota && !esIncompleta) clase = 'reprobada';
else if (esIncompleta) clase = 'reprobada';
gridMaterias += `
<div class="materia-item ${clase}">
<span class="nombre">${nombre}</span>
<span class="nota">${notaDisplay}</span>
</div>
`;
});
}
let mensajePrincipal = '';
let razonHTML = '';
const partes = [];
if (resultado.sinNota > 0) partes.push(`<strong>${resultado.sinNota}</strong> materia(s) sin calificar`);
if (resultado.sinCalificacionFinal > 0) partes.push(`<strong>${resultado.sinCalificacionFinal}</strong> materia(s) con calificación final incompleta`);
mensajePrincipal = `⚠️ Aún no se puede determinar la situación del estudiante porque faltan ${partes.join(' y ')}.`;
razonHTML = '📌 Complete las calificaciones de todas las materias (las 3 competencias) para determinar la situación académica.';
panel.innerHTML = `
<div class="panel-header">
<div class="titulo">
⏳ Situación Pendiente
<span class="badge-situacion pendiente">PENDIENTE</span>
</div>
<div class="estudiante-info">👨‍🎓 ${nombreEstudiante}</div>
</div>
<div class="panel-body">
<div class="resumen">
<div class="estado pendiente">
${mensajePrincipal}
</div>
<div class="stats">
<span class="aprobadas">✅ Aprobadas: ${resultado.aprobadas}</span>
<span class="reprobadas">❌ Reprobadas: ${resultado.reprobadas}</span>
${resultado.sinNota > 0 ? `<span class="sin-nota-stat">⚪ Sin nota: ${resultado.sinNota}</span>` : ''}
${resultado.sinCalificacionFinal > 0 ? `<span class="sin-nota-stat">⚠️ Incompletas: ${resultado.sinCalificacionFinal}</span>` : ''}
<span class="total">📚 Total: ${resultado.total}</span>
<span class="asistencia-stat">📅 Asistencia: ${resultado.asistencia || 0}%</span>
</div>
</div>
<div class="detalle-materias">
<div style="font-size: 12px; font-weight: 600; color: #555; margin-bottom: 6px;">
📋 Detalle por áreas curriculares (calificación final):
</div>
<div class="grid-materias">
${gridMaterias}
</div>
</div>
</div>
<div class="panel-footer" style="background: #fff3cd; color: #856404;">
${razonHTML}
</div>
`;
panel.style.display = 'block';
panel.style.borderColor = '#ffc107';
document.querySelectorAll('input[name="situacion"]').forEach(radio => {
radio.checked = false;
radio.removeAttribute('checked');
const label = radio.closest('.situacion-radio');
if (label) {
label.style.border = 'none';
label.style.background = '#f8f9fa';
}
});
const linea1 = document.getElementById('condicionFinalLinea1');
const linea2 = document.getElementById('condicionFinalLinea2');
const linea3 = document.getElementById('condicionFinalLinea3');
if (linea1) linea1.value = '';
if (linea2) linea2.value = '';
if (linea3) linea3.value = '';
}
function mostrarSituacionVacia() {
const panel = document.getElementById('panelSituacionExterno');
if (panel) panel.style.display = 'none';
const linea1 = document.getElementById('condicionFinalLinea1');
const linea2 = document.getElementById('condicionFinalLinea2');
const linea3 = document.getElementById('condicionFinalLinea3');
if (linea1) linea1.value = '';
if (linea2) linea2.value = '';
if (linea3) linea3.value = '';
document.querySelectorAll('input[name="situacion"]').forEach(radio => {
radio.checked = false;
radio.removeAttribute('checked');
const label = radio.closest('.situacion-radio');
if (label) {
label.style.border = 'none';
label.style.background = '#f8f9fa';
}
});
limpiarTodasLasLineas();
}
function getStorageKeyRegistro() {
const gradeText = currentGrade === 1 ? '1er' :
(currentGrade === 2 ? '2do' :
(currentGrade === 3 ? '3er' :
(currentGrade === 4 ? '4to' :
(currentGrade === 5 ? '5to' : '6to'))));
return `registro_${gradeText}_sec${currentSeccion}_v25`;
}
// ====================================================================
// ✅ ACTUALIZAR OBSERVACIÓN POR SITUACIÓN
// ====================================================================
function actualizarObservacionPorSituacion(uid, numeroOrden) {
try {
if (!uid) return;
const obsKey = getClaveObsGeneral(uid);
const situacionKey = getClaveSituacion(uid);
const situacionActual = localStorage.getItem(situacionKey) || '';
const situacionGuardadaKey = `obs_situacion_${uid}`;
const situacionAnterior = localStorage.getItem(situacionGuardadaKey) || '';
if (!localStorage.getItem(obsKey) || situacionActual !== situacionAnterior) {
localStorage.removeItem(obsKey);
localStorage.setItem(situacionGuardadaKey, situacionActual);
asignarYMostrarObservacion(uid, numeroOrden);
} else {
console.log(`ℹ️ Observación sin cambios para UID ${uid} (situación: ${situacionActual})`);
mostrarObservacionEnBoletin(uid, numeroOrden);
}
} catch (e) {
console.error('❌ Error actualizando observación por situación:', e);
}
}
// ====================================================================
// ✅ OBSERVACIONES POR PERÍODO - GUARDAR
// ====================================================================
function guardarObservacionesPorPeriodo() {
try {
if (!estudianteSeleccionado || !estudianteSeleccionado.uid) return;
const uid = estudianteSeleccionado.uid;
const orden = parseInt(estudianteSeleccionado.orden, 10) || 1;
const totalMaterias = (currentGrade >= 4) ? 8 : 7;
const periodos = ['P1', 'P2', 'P3', 'P4'];
const inputs = document.querySelectorAll('.input-observacion');
inputs.forEach((input, index) => {
if (index < periodos.length) {
const periodo = periodos[index];
const periodoNum = periodo.replace('P', '');
const obsKey = getClaveObsPeriodo(uid, periodo);
const periodoCompleto = verificarPeriodoCompleto(uid, periodoNum, totalMaterias, orden);
if (periodoCompleto && input.value) {
localStorage.setItem(obsKey, input.value);
} else {
localStorage.removeItem(obsKey);
}
}
});
console.log(`✅ Observaciones por período guardadas para UID: ${uid}`);
} catch (e) {
console.error('❌ Error guardando observaciones por período:', e);
}
}
// ====================================================================
// ✅ OBSERVACIONES POR PERÍODO - CARGAR UI
// ====================================================================
function cargarObservacionesPorPeriodoUI(uid) {
try {
if (!uid) return;
const periodos = ['P1', 'P2', 'P3', 'P4'];
const inputs = document.querySelectorAll('.input-observacion');
if (inputs.length === 0) {
console.warn('⚠️ No hay inputs de observación disponibles');
return;
}
const totalMaterias = (currentGrade >= 4) ? 8 : 7;
const orden = parseInt(estudianteSeleccionado?.orden, 10) || 1;
inputs.forEach((input, index) => {
if (index < periodos.length) {
const periodo = periodos[index];
const periodoNum = periodo.replace('P', '');
const periodoCompleto = verificarPeriodoCompleto(uid, periodoNum, totalMaterias, orden);
if (periodoCompleto) {
const obsKey = getClaveObsPeriodo(uid, periodo);
const valorGuardado = localStorage.getItem(obsKey) || '';
input.value = valorGuardado;
} else {
localStorage.removeItem(getClaveObsPeriodo(uid, periodo));
input.value = '';
}
}
});
console.log(`✅ Observaciones por período cargadas en UI para UID: ${uid}`);
} catch (e) {
console.error('❌ Error cargando observaciones:', e);
}
}
// ====================================================================
// ✅ PROCESAR OBSERVACIONES INDIVIDUALES POR PERÍODO
// ====================================================================
function procesarObservacionesEstudianteIndividual(uid, numeroOrden) {
try {
if (!uid) return null;
if (typeof generadorPeriodo === 'undefined') {
console.warn('⚠️ generadorPeriodo no está cargado.');
return null;
}
const grupo = obtenerGrupoActual();
const gradoNum = convertirGradoANumero(grupo.grado) || currentGrade;
const seccion = grupo.seccion || currentSeccion;
const tanda = grupo.tanda || currentTanda;
const totalMaterias = (gradoNum >= 4) ? 8 : 7;
generadorPeriodo.cargarAsignaciones(gradoNum, seccion, tanda);
const resultados = generadorPeriodo.procesarEstudianteIndividualPorUid(
uid, gradoNum, seccion, tanda
);
console.log('🔍 Resultados observaciones por período:', resultados);
if (!resultados) {
console.warn('⚠️ No se obtuvieron resultados del generadorPeriodo');
return null;
}
const periodos = ['P1', 'P2', 'P3', 'P4'];
const inputs = document.querySelectorAll('.input-observacion');
inputs.forEach((input, index) => {
if (index < periodos.length) {
const periodo = periodos[index];
const periodoNum = periodo.replace('P', '');
const resultado = resultados[periodo];
const obsKey = getClaveObsPeriodo(uid, periodo);
const periodoCompleto = verificarPeriodoCompleto(uid, periodoNum, totalMaterias, numeroOrden);
if (periodoCompleto && resultado && resultado.frase) {
localStorage.setItem(obsKey, resultado.frase);
input.value = resultado.frase;
} else if (periodoCompleto) {
const existente = localStorage.getItem(obsKey) || '';
input.value = existente;
} else {
localStorage.removeItem(obsKey);
input.value = '';
}
}
});
generadorPeriodo.guardarAsignaciones(gradoNum, seccion, tanda);
console.log(`✅ Observaciones por período procesadas para UID: ${uid}`);
return resultados;
} catch (e) {
console.error('❌ Error procesando observaciones por período:', e);
return null;
}
}
// ====================================================================
// CONFIGURAR LISTENERS
// ====================================================================
function configurarListenersCalificaciones() {
const inputs = document.querySelectorAll('.input-calificacion');
inputs.forEach(function(input) {
if (!input._listenerAdded) {
input._listenerAdded = true;
input.addEventListener('change', function(e) {
if (estudianteSeleccionado && estudianteSeleccionado.uid) {
const uid = estudianteSeleccionado.uid;
const orden = parseInt(estudianteSeleccionado.orden, 10);
setTimeout(function() {
verificarYActualizarObservaciones(uid, orden);
calcularYMostrarSituacion(uid, orden);
}, 300);
}
});
}
});
}
// ====================================================================
// ✅ VERIFICAR OBSERVACIONES
// ====================================================================
function verificarYActualizarObservaciones(uid, numeroOrden) {
try {
if (!uid) return;
if (typeof generadorPeriodo === 'undefined') return;
const grupo = obtenerGrupoActual();
const gradoNum = convertirGradoANumero(grupo.grado) || currentGrade;
const totalMaterias = (gradoNum >= 4) ? 8 : 7;
const periodos = ['P1', 'P2', 'P3', 'P4'];
let periodosCompletos = [];
periodos.forEach((periodo) => {
const periodoNum = periodo.replace('P', '');
if (verificarPeriodoCompleto(uid, periodoNum, totalMaterias, numeroOrden)) {
periodosCompletos.push(periodo);
}
});
if (periodosCompletos.length > 0) {
procesarObservacionesEstudianteIndividual(uid, numeroOrden);
} else {
const inputs = document.querySelectorAll('.input-observacion');
inputs.forEach((input, index) => {
if (index < periodos.length) {
const periodo = periodos[index];
localStorage.removeItem(getClaveObsPeriodo(uid, periodo));
input.value = '';
}
});
}
} catch (e) {
console.error('❌ Error verificando observaciones:', e);
}
}
// ====================================================================
// SISTEMA DE OBSERVACIONES AUTOMÁTICAS (GENERAL)
// ====================================================================
function inicializarGeneradorObservaciones() {
if (typeof generadorObservaciones === 'undefined') {
console.warn('⚠️ generadorObservaciones no está definido.');
return;
}
const grupo = obtenerGrupoActual();
const gradoNum = convertirGradoANumero(grupo.grado) || currentGrade;
const seccion = grupo.seccion || currentSeccion;
const tanda = grupo.tanda || currentTanda;
generadorObservaciones.cargarAsignaciones(gradoNum, seccion, tanda);
}
function reiniciarObservaciones() {
const grupo = obtenerGrupoActual();
const gradoNum = convertirGradoANumero(grupo.grado) || currentGrade;
const seccion = grupo.seccion || currentSeccion;
const tanda = grupo.tanda || currentTanda;
if (typeof generadorObservaciones !== 'undefined') {
generadorObservaciones.reiniciar();
generadorObservaciones.guardarAsignaciones(gradoNum, seccion, tanda);
}
if (typeof generadorPeriodo !== 'undefined' && typeof generadorPeriodo.reiniciar === 'function') {
generadorPeriodo.reiniciar(gradoNum, seccion, tanda);
}
if (Array.isArray(estudiantesLista)) {
const periodos = ['P1', 'P2', 'P3', 'P4'];
estudiantesLista.forEach(est => {
if (!est.uid) return;
periodos.forEach(p => {
localStorage.removeItem(`obs_${est.uid}_${p}`);
});
localStorage.removeItem(`obs_general_${est.uid}`);
localStorage.removeItem(`obs_situacion_${est.uid}`);
});
}
console.log('🔄 Observaciones reiniciadas completamente.');
}
function obtenerFraseFallback(calificacion) {
const nota = parseFloat(calificacion);
if (nota >= 90) return '✅ Excelente desempeño académico. Continúa así.';
if (nota >= 70) return '📚 Buen rendimiento académico. Sigue esforzándote.';
return '📖 Requiere reforzar los contenidos. ¡Tú puedes lograrlo!';
}
function procesarObservacionesDeEstudiantes() {
if (!estudiantesLista || estudiantesLista.length === 0) return;
console.log(`📝 Procesando observaciones generales para ${estudiantesLista.length} estudiantes...`);
estudiantesLista.forEach((est, index) => {
const uid = est.uid;
if (!uid) return;
const orden = parseInt(est.orden, 10) || (index + 1);
asignarYMostrarObservacion(uid, orden);
});
}
function procesarObservacionesPorPeriodoCompleto() {
if (!estudiantesLista || estudiantesLista.length === 0) return;
if (typeof generadorPeriodo === 'undefined') {
console.warn('⚠️ generadorPeriodo no disponible');
return;
}
const grupo = obtenerGrupoActual();
const gradoNum = convertirGradoANumero(grupo.grado) || currentGrade;
const seccion = grupo.seccion || currentSeccion;
const tanda = grupo.tanda || currentTanda;
const totalMaterias = (gradoNum >= 4) ? 8 : 7;
generadorPeriodo.cargarAsignaciones(gradoNum, seccion, tanda);
estudiantesLista.forEach((est) => {
if (!est.uid) return;
const orden = parseInt(est.orden, 10) || 1;
const resultados = generadorPeriodo.procesarEstudianteIndividualPorUid(
est.uid, gradoNum, seccion, tanda
);
if (resultados) {
['P1', 'P2', 'P3', 'P4'].forEach(p => {
const periodoNum = p.replace('P', '');
const obsKey = `obs_${est.uid}_${p}`;
const periodoCompleto = verificarPeriodoCompleto(est.uid, periodoNum, totalMaterias, orden);
if (periodoCompleto && resultados[p] && resultados[p].frase) {
localStorage.setItem(obsKey, resultados[p].frase);
} else {
localStorage.removeItem(obsKey);
}
});
}
});
generadorPeriodo.guardarAsignaciones(gradoNum, seccion, tanda);
console.log('✅ Observaciones por período procesadas para todos.');
if (estudianteSeleccionado && estudianteSeleccionado.uid) {
cargarObservacionesPorPeriodoUI(estudianteSeleccionado.uid);
}
}
// ====================================================================
// ✅ RECARGAR DATOS DEL ESTUDIANTE SELECCIONADO
// ====================================================================
function recargarDatosEstudianteSeleccionado() {
if (!estudianteSeleccionado || !estudianteSeleccionado.uid) return;
const uid = estudianteSeleccionado.uid;
const estActualizado = estudiantesLista.find(e => e.uid === uid);
if (!estActualizado) {
console.warn('⚠️ Estudiante seleccionado ya no existe en la lista');
estudianteSeleccionado = null;
indiceActual = -1;
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
return;
}
const orden = parseInt(estActualizado.orden, 10);
const campoId = document.getElementById('campoIdEstudiante');
const campoNombres = document.getElementById('campoNombres');
const campoApellidos = document.getElementById('campoApellidos');
const campoNumeroOrden = document.getElementById('campoNumeroOrden');
if (campoId) campoId.value = String(estActualizado.id || '').toUpperCase();
if (campoNombres) campoNombres.value = String(estActualizado.nombre || '').toUpperCase();
if (campoApellidos) campoApellidos.value = String(estActualizado.apellido || '').toUpperCase();
if (campoNumeroOrden) campoNumeroOrden.value = orden;
estudianteSeleccionado.orden = orden;
estudianteSeleccionado.id = estActualizado.id || estActualizado.idEstudiante || estActualizado.cedula || 'SIN ID';
estudianteSeleccionado.nombre = estActualizado.nombre || 'Sin nombre';
estudianteSeleccionado.apellido = estActualizado.apellido || 'Sin apellido';
cargarCalificacionesDesdeRegistro(uid, orden);
cargarAsistenciaDesdeRegistro(uid, orden);
calcularYMostrarSituacion(uid, orden);
setTimeout(function() {
procesarObservacionesEstudianteIndividual(uid, orden);
cargarObservacionesPorPeriodoUI(uid);
mostrarObservacionEnBoletin(uid, orden);
}, 300);
console.log(`🔄 Datos recargados para UID: ${uid} (${estudianteSeleccionado.nombre} ${estudianteSeleccionado.apellido})`);
}
// ====================================================================
// ✅ BOTÓN "RECARGAR DATOS"
// ====================================================================
function agregarBotonRecargarDatos() {
const botonesContainer = document.querySelector('.botones-container');
if (!botonesContainer) return;
if (document.getElementById('btnRecargarDatos')) return;
const btn = document.createElement('button');
btn.id = 'btnRecargarDatos';
btn.className = 'btn btn-info';
btn.style.background = '#6f42c1';
btn.innerHTML = '🔄 Recargar Datos';
btn.title = 'Recarga los datos del estudiante seleccionado';
btn.addEventListener('click', function() {
cargarEstudiantesDesdeListado();
setTimeout(function() {
recargarDatosEstudianteSeleccionado();
mostrarMensaje('✅ Datos recargados correctamente', 'exito');
}, 300);
});
botonesContainer.appendChild(btn);
}
// ====================================================================
// GENERAR PDF
// ====================================================================
function generarPDFTodos() {
if (estudiantesLista.length === 0) {
mostrarMensaje('⚠️ No hay estudiantes registrados.', 'warning');
return;
}
const btn = document.getElementById('btnPDF');
btn.disabled = true;
btn.textContent = '⏳ Generando todos...';
const uidOriginal = estudianteSeleccionado ? estudianteSeleccionado.uid : null;
let estudiantesPendientes = estudiantesLista.slice();
let pdfsGenerados = 0;
function generarSiguiente() {
if (estudiantesPendientes.length === 0) {
btn.disabled = false;
btn.textContent = '📄 PDF Todos';
mostrarMensaje(`✅ ${pdfsGenerados} PDFs generados`, 'exito');
if (uidOriginal) {
const idx = estudiantesLista.findIndex(e => e.uid === uidOriginal);
if (idx >= 0) {
cargarEstudiantePorIndice(idx, estudiantesLista[idx]);
}
}
return;
}
const est = estudiantesPendientes.shift();
const nombre = est.nombre || 'Sin nombre';
const apellido = est.apellido || 'Sin apellido';
const id = est.id || est.idEstudiante || est.cedula || 'SIN_ID';
const uid = est.uid || '';
const orden = parseInt(est.orden, 10) || (estudiantesLista.indexOf(est) + 1);
const campoId = document.getElementById('campoIdEstudiante');
const campoNombres = document.getElementById('campoNombres');
const campoApellidos = document.getElementById('campoApellidos');
const campoNumeroOrden = document.getElementById('campoNumeroOrden');
if (campoId) campoId.value = String(id).toUpperCase();
if (campoNombres) campoNombres.value = String(nombre).toUpperCase();
if (campoApellidos) campoApellidos.value = String(apellido).toUpperCase();
if (campoNumeroOrden) campoNumeroOrden.value = orden;
if (uid) {
cargarCalificacionesDesdeRegistro(uid, orden);
cargarAsistenciaDesdeRegistro(uid, orden);
calcularYMostrarSituacion(uid, orden);
asignarYMostrarObservacion(uid, orden);
setTimeout(function() {
procesarObservacionesEstudianteIndividual(uid, orden);
cargarObservacionesPorPeriodoUI(uid);
}, 200);
}
setTimeout(function() {
exportarPDFSeleccionado(function() {
pdfsGenerados++;
setTimeout(generarSiguiente, 500);
});
}, 500);
}
generarSiguiente();
}
function exportarPDFSeleccionado(callback) {
const elemento = document.getElementById('documentoAExportar');
if (!elemento) {
if (callback) callback();
return;
}
const nombre = document.getElementById('campoNombres')?.value || 'Sin_nombre';
const apellido = document.getElementById('campoApellidos')?.value || 'Sin_apellido';
const id = document.getElementById('campoIdEstudiante')?.value || 'SIN_ID';
if (typeof html2pdf === 'undefined') {
mostrarMensaje('⚠️ Librería PDF no cargada.', 'warning');
window.print();
if (callback) callback();
return;
}
const opciones = {
margin: [0.15, 0.2, 0.15, 0.2],
filename: `Boletin_${nombre}_${apellido}_${id}.pdf`,
image: { type: 'jpeg', quality: 0.98 },
html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', letterRendering: true, allowTaint: true },
jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape', compress: true, putOnlyUsedFonts: true },
pagebreak: { mode: ['css', 'legacy'], before: '.page2' }
};
html2pdf().set(opciones).from(elemento).save()
.then(function() { if (callback) callback(); })
.catch(function(err) { console.error('Error PDF:', err); if (callback) callback(); });
}
function exportarPDFSeleccionadoBtn() {
if (!estudianteSeleccionado) {
mostrarMensaje('⚠️ Seleccione un estudiante primero.', 'warning');
return;
}
const campoNombres = document.getElementById('campoNombres');
if (!campoNombres || !campoNombres.value) {
mostrarMensaje('⚠️ Cargue el estudiante primero.', 'warning');
return;
}
const btn = document.getElementById('btnPDFSeleccionado');
btn.disabled = true;
btn.textContent = '⏳ Generando...';
exportarPDFSeleccionado(function() {
btn.disabled = false;
btn.textContent = '📄 PDF Seleccionado';
mostrarMensaje('✅ PDF generado', 'exito');
});
}
// ====================================================================
// SINCRONIZACIÓN
// ====================================================================
function sincronizarGradoDesdeRegistro() {
try {
const grupo = obtenerGrupoActual();
const gradoNumerico = convertirGradoANumero(grupo.grado);
if (!gradoNumerico || gradoNumerico < 1 || gradoNumerico > 6) return;
if (currentGrade !== gradoNumerico || currentSeccion !== grupo.seccion || currentTanda !== grupo.tanda) {
currentGrade = gradoNumerico;
currentSeccion = grupo.seccion;
currentTanda = grupo.tanda;
localStorage.setItem('boletin_grado', currentGrade);
actualizarGradoBloqueado();
actualizarSegunGrado();
aplicarClaseGrado();
mostrarMensajeGrado('📚 Grado actualizado: ' + grupo.grado);
if (estudianteSeleccionado && estudianteSeleccionado.uid) {
const orden = parseInt(estudianteSeleccionado.orden, 10);
cargarCalificacionesDesdeRegistro(estudianteSeleccionado.uid, orden);
cargarAsistenciaDesdeRegistro(estudianteSeleccionado.uid, orden);
calcularYMostrarSituacion(estudianteSeleccionado.uid, orden);
}
}
sincronizarDatosDelRegistro();
} catch (e) {
console.error('❌ Error sincronizando grado:', e);
}
}
function actualizarGradoBloqueado() {
const gradeDisplay = document.getElementById('gradeDisplay');
if (!gradeDisplay) return;
const nombresGrado = {
1: '1er Grado', 2: '2do Grado', 3: '3er Grado',
4: '4to Grado', 5: '5to Grado', 6: '6to Grado'
};
const colores = {
1: '#F7941D', 2: '#1E78C2', 3: '#299888',
4: '#FD82B3', 5: '#B9A044', 6: '#793007'
};
gradeDisplay.value = nombresGrado[currentGrade] || '1er Grado';
gradeDisplay.style.color = colores[currentGrade] || '#E91E8C';
}
// ====================================================================
// ✅ SINCRONIZAR DATOS DEL REGISTRO
// ====================================================================
function sincronizarDatosDelRegistro() {
try {
const datosSync = localStorage.getItem('datosSincronizados');
if (!datosSync) return;
const datos = JSON.parse(datosSync);
if (typeof AuthSystem !== 'undefined') {
const sesion = AuthSystem.obtenerSesion();
if (sesion && sesion.cedula) {
const nombreActualizado = AuthSystem.obtenerNombreDocente(sesion.cedula);
if (nombreActualizado && nombreActualizado !== datos.docente) {
datos.docente = nombreActualizado;
localStorage.setItem('datosSincronizados', JSON.stringify(datos));
}
}
}
var mapaCampos = {
'campoSeccion': datos.seccion,
'campoDocente': datos.docente,
'campoCentroEducativo': datos.centroEducativo,
'campoCodigoCentro': datos.codigoCentro,
'campoTanda': datos.tanda,
'campoDistritoEducativo': datos.distrito,
'campoRegionalEducacion': datos.regional
};
Object.keys(mapaCampos).forEach(function(idCampo) {
var valor = mapaCampos[idCampo];
if (valor) {
var input = document.getElementById(idCampo);
if (input) input.value = String(valor).toUpperCase();
}
});
sincronizarAnioEscolar(datos.anioEscolar);
} catch (e) {
console.error('❌ Error al sincronizar datos:', e);
}
}
function sincronizarAnioEscolar(anioEscolar) {
if (!anioEscolar) return;
var partes = String(anioEscolar).split('-');
if (partes.length !== 2) return;
var ultimos1 = partes[0].trim().slice(-2);
var ultimos2 = partes[1].trim().slice(-2);
var seccionAnio = document.querySelector('.anio-escolar');
if (!seccionAnio) return;
var inputsAnio = seccionAnio.querySelectorAll('input');
if (inputsAnio.length >= 1) inputsAnio[0].value = ultimos1;
if (inputsAnio.length >= 2) inputsAnio[1].value = ultimos2;
}
function aplicarDatosCentroAlBoletin() {
try {
var CLAVE_SYNC_BOLETIN = 'datos_centro_para_boletin';
var datosGuardados = localStorage.getItem(CLAVE_SYNC_BOLETIN);
if (!datosGuardados) return;
var datos = JSON.parse(datosGuardados);
if (datos.provincia) {
var campo = document.getElementById('campoProvincia');
if (campo) campo.value = String(datos.provincia).toUpperCase();
}
if (datos.municipio) {
var campo = document.getElementById('campoMunicipio');
if (campo) campo.value = String(datos.municipio).toUpperCase();
}
if (datos.telefono) {
var campo = document.getElementById('campoTelefonoCentro');
if (campo) campo.value = datos.telefono;
}
} catch (e) {
console.error('❌ Error al aplicar datos del centro:', e);
}
}
function aplicarClaseGrado() {
var elementos = document.querySelectorAll('.page, .document-wrapper');
for (var i = 0; i < elementos.length; i++) {
var el = elementos[i];
el.classList.remove('grado-1', 'grado-2', 'grado-3', 'grado-4', 'grado-5', 'grado-6');
}
var wrapper = document.querySelector('.document-wrapper');
var pages = document.querySelectorAll('.page');
if (wrapper) wrapper.classList.add('grado-' + currentGrade);
for (var j = 0; j < pages.length; j++) {
pages[j].classList.add('grado-' + currentGrade);
}
}
// ====================================================================
// GENERAR ELEMENTOS DEL BOLETÍN
// ====================================================================
function generarFirmaPeriodos() {
var contenedor = document.getElementById('firmaPeriodos');
if (!contenedor) return;
contenedor.innerHTML = '';
var periodos = ['Ago-Sept-Oct', 'Nov-Dic-Ene', 'Feb-Mar', 'Abr-May-Jun'];
for (var i = 0; i < periodos.length; i++) {
var linea = document.createElement('div');
linea.className = 'periodo-linea';
linea.innerHTML = '<span>' + periodos[i] + '</span><div class="linea"><input type="text" placeholder=""></div>';
contenedor.appendChild(linea);
}
}
function generarLineasAvance() {
var contenedor = document.getElementById('avanceLineas');
if (!contenedor) return;
contenedor.innerHTML = '';
for (var i = 0; i < 12; i++) {
var linea = document.createElement('div');
linea.className = 'avance-linea';
linea.innerHTML = '<input type="text" placeholder="">';
contenedor.appendChild(linea);
}
}
function generarObservacionesLineas() {
var contenedor = document.getElementById('observacionesLineas');
if (!contenedor) return;
contenedor.innerHTML = '';
for (var i = 0; i < 12; i++) {
var linea = document.createElement('div');
linea.className = 'observaciones-linea';
linea.innerHTML = '<input type="text" placeholder="">';
contenedor.appendChild(linea);
}
}
function generarCamposInfo() {
var contenedor = document.getElementById('camposInfo');
if (!contenedor) return;
contenedor.innerHTML = '';
var campos = [
{ tipo: 'dos', label1: 'Sección:', id1: 'campoSeccion', label2: 'Número de orden:', id2: 'campoNumeroOrden' },
{ tipo: 'uno', label: 'Nombre(s):', id: 'campoNombres' },
{ tipo: 'uno', label: 'Apellido(s):', id: 'campoApellidos' },
{ tipo: 'uno', label: 'ID estudiante', labelExtra: '(Número de identificación SIGERD):', id: 'campoIdEstudiante' },
{ tipo: 'uno', label: 'Docente:', id: 'campoDocente' },
{ tipo: 'uno', label: 'Centro educativo:', id: 'campoCentroEducativo' },
{ tipo: 'uno', label: 'Código del centro:', id: 'campoCodigoCentro' },
{ tipo: 'uno', label: 'Tanda:', id: 'campoTanda' },
{ tipo: 'uno', label: 'Teléfono del centro:', id: 'campoTelefonoCentro' },
{ tipo: 'uno', label: 'Distrito educativo:', id: 'campoDistritoEducativo' },
{ tipo: 'uno', label: 'Regional de educación:', id: 'campoRegionalEducacion' },
{ tipo: 'uno', label: 'Provincia:', id: 'campoProvincia' },
{ tipo: 'uno', label: 'Municipio:', id: 'campoMunicipio' }
];
for (var i = 0; i < campos.length; i++) {
var campo = campos[i];
var row = document.createElement('div');
if (campo.tipo === 'dos') {
row.className = 'campo-row dos-campos';
var group1 = document.createElement('div');
group1.className = 'campo-group';
group1.innerHTML = '<label>' + campo.label1 + '</label><div class="campo-linea"><input type="text" id="' + campo.id1 + '" placeholder=""></div>';
var group2 = document.createElement('div');
group2.className = 'campo-group';
group2.innerHTML = '<label>' + campo.label2 + '</label><div class="campo-linea"><input type="text" id="' + campo.id2 + '" placeholder="" readonly style="background:#f0f0f0; font-weight:bold;"></div>';
row.appendChild(group1);
row.appendChild(group2);
} else {
row.className = 'campo-row';
var labelHTML = '<label>' + campo.label + '</label>';
if (campo.labelExtra) labelHTML += '<span class="label-extra">' + campo.labelExtra + '</span>';
row.innerHTML = labelHTML + '<div class="campo-linea"><input type="text" id="' + campo.id + '" placeholder=""></div>';
}
contenedor.appendChild(row);
}
}
function generarTablaDesempeno() {
var contenedor = document.getElementById('tablaDesempenoContainer');
if (!contenedor) return;
if (currentGrade <= 2) {
generarTabla1ro2do(contenedor);
} else {
generarTabla3ro6to(contenedor);
}
setTimeout(function() {
aplicarMayusculasACamposDinamicos();
}, 100);
}
function generarTabla1ro2do(contenedor) {
var areas = [
'Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza',
'Educación Física', 'Formación Integral, Humana y Religiosa', 'Educación Artística'
];
var html = '<table class="tabla-1ro-2do"><thead><tr>';
html += '<th colspan="2" class="competencia-header">COMPETENCIAS FUNDAMENTALES</th>';
html += '<th colspan="4" class="competencia-header">Comunicativa</th>';
html += '<th colspan="4" class="competencia-header">Pensamiento Lógico, Creativo y Crítico; Resolución de Problemas; Científica y Tecnológica</th>';
html += '<th colspan="4" class="competencia-header">Ética y Ciudadana; Desarrollo Personal y Espiritual; Ambiental y de la Salud</th>';
html += '<th colspan="3" class="calif-final-header">Calificación final por competencia</th>';
html += '<th rowspan="2" class="th-vertical">Calificación<br>final del área</th>';
html += '<th rowspan="2" class="th-vertical-ultima">Calificación<br>recuperación final</th>';
html += '</tr><tr>';
html += '<th colspan="2" class="periodo-header">PERÍODOS</th>';
for (var p = 1; p <= 4; p++) html += '<th>P' + p + '</th>';
for (var p = 1; p <= 4; p++) html += '<th>P' + p + '</th>';
for (var p = 1; p <= 4; p++) html += '<th>P' + p + '</th>';
html += '<th>C1</th><th>C2</th><th>C3</th></tr></thead><tbody>';
for (var i = 0; i < areas.length; i++) {
var area = areas[i];
var materiaIndex = i + 1;
html += '<tr>';
if (i === 0) html += '<td class="area-label-cell" rowspan="' + areas.length + '">ÁREAS CURRICULARES</td>';
html += '<td class="area-nombre">' + area + '</td>';
for (var p = 1; p <= 4; p++) {
var claseExtra = (p === 4) ? ' borde-grueso-derecha' : '';
html += '<td class="celda-vacia' + claseExtra + '"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c1_p' + p + '" readonly></td>';
}
for (var p = 1; p <= 4; p++) {
var claseExtra = (p === 4) ? ' borde-grueso-derecha' : '';
html += '<td class="celda-vacia' + claseExtra + '"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c2_p' + p + '" readonly></td>';
}
for (var p = 1; p <= 4; p++) {
var claseExtra = (p === 4) ? ' borde-grueso-derecha' : '';
html += '<td class="celda-vacia' + claseExtra + '"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c3_p' + p + '" readonly></td>';
}
for (var j = 1; j <= 3; j++) {
var claseExtra = (j < 3) ? ' borde-grueso-derecha' : '';
html += '<td class="celda-vacia calif-final-data' + claseExtra + '"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_avgc' + j + '" readonly></td>';
}
html += '<td class="celda-vacia calif-num-data"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_final" readonly></td>';
html += '<td class="celda-vacia calif-cual-data"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_recfinal" readonly></td>';
html += '</tr>';
}
html += '</tbody></table>';
contenedor.innerHTML = html;
}
function generarTabla3ro6to(contenedor) {
var areas;
if (currentGrade >= 4) {
areas = ['Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza',
'Lenguas Extranjeras (Inglés)', 'Educación Física', 'Formación Integral Humana y Religiosa', 'Educación Artística'];
} else {
areas = ['Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza',
'Educación Física', 'Formación Integral, Humana y Religiosa', 'Educación Artística'];
}
var html = '<table class="tabla-3ro-6to"><thead><tr>';
html += '<th colspan="2" class="competencia-header">COMPETENCIAS FUNDAMENTALES</th>';
html += '<th colspan="8" class="competencia-header">Comunicativa</th>';
html += '<th colspan="8" class="competencia-header">Pensamiento Lógico, Creativo y Crítico; Resolución de Problemas; Científica y Tecnológica</th>';
html += '<th colspan="8" class="competencia-header">Ética y Ciudadana; Desarrollo Personal y Espiritual; Ambiental y de la Salud</th>';
html += '<th colspan="3" class="calif-final-header">Calificación final por competencia</th>';
html += '<th rowspan="2" class="th-vertical">Calificación<br>final del área</th>';
html += '<th rowspan="2" class="th-vertical">Calificación<br>recuperación final</th>';
html += '<th rowspan="2" class="th-vertical-ultima">Calificación<br>recuperación especial</th>';
html += '</tr><tr>';
html += '<th colspan="2" class="periodo-header">PERÍODOS</th>';
for (var c = 0; c < 3; c++) {
for (var p = 1; p <= 4; p++) {
html += '<th>P' + p + '</th>';
html += '<th class="rp-cell-header">RP' + p + '</th>';
}
}
html += '<th>C1</th><th>C2</th><th>C3</th></tr></thead><tbody>';
for (var i = 0; i < areas.length; i++) {
var area = areas[i];
var materiaIndex = i + 1;
html += '<tr>';
if (i === 0) html += '<td class="area-label-cell" rowspan="' + areas.length + '">ÁREAS CURRICULARES</td>';
html += '<td class="area-nombre">' + area + '</td>';
for (var p = 1; p <= 4; p++) {
html += '<td class="celda-vacia"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c1_p' + p + '" readonly></td>';
var claseRP = (p === 4) ? ' borde-grueso-derecha' : '';
html += '<td class="celda-vacia' + claseRP + '"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c1_rp' + p + '" readonly style="background:#fce8e6;"></td>';
}
for (var p = 1; p <= 4; p++) {
html += '<td class="celda-vacia"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c2_p' + p + '" readonly></td>';
var claseRP = (p === 4) ? ' borde-grueso-derecha' : '';
html += '<td class="celda-vacia' + claseRP + '"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c2_rp' + p + '" readonly style="background:#fce8e6;"></td>';
}
for (var p = 1; p <= 4; p++) {
html += '<td class="celda-vacia"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c3_p' + p + '" readonly></td>';
var claseRP = (p === 4) ? ' borde-grueso-derecha' : '';
html += '<td class="celda-vacia' + claseRP + '"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_c3_rp' + p + '" readonly style="background:#fce8e6;"></td>';
}
for (var j = 1; j <= 3; j++) {
var claseExtra = (j < 3) ? ' borde-grueso-derecha' : '';
html += '<td class="celda-vacia calif-final-data' + claseExtra + '"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_avgc' + j + '" readonly></td>';
}
html += '<td class="celda-vacia calif-num-data"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_final" readonly></td>';
html += '<td class="celda-vacia calif-cual-data"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_recfinal" readonly></td>';
html += '<td class="celda-vacia calif-cual-data"><input type="text" class="input-calificacion" id="bol_m' + materiaIndex + '_recespecial" readonly></td>';
html += '</tr>';
}
html += '</tbody></table>';
contenedor.innerHTML = html;
}
function generarObservaciones() {
var contenedor = document.getElementById('observacionesContainer');
if (!contenedor) return;
var periodos = ['P1', 'P2', 'P3', 'P4'];
var html = '';
if (currentGrade <= 2) {
html += '<div class="observaciones-section-1ro-2do">';
html += '<div class="observaciones-label-1ro-2do">OBSERVACIONES</div>';
html += '<table class="observaciones-tabla-1ro-2do">';
} else {
html += '<div class="observaciones-section-3ro-6to">';
html += '<div class="observaciones-label-3ro-6to">OBSERVACIONES</div>';
html += '<table class="observaciones-tabla-3ro-6to">';
}
for (var i = 0; i < periodos.length; i++) {
html += '<tr>';
html += '<td class="obs-label">' + periodos[i] + '</td>';
html += '<td><input type="text" class="input-observacion" placeholder="" id="obs_' + periodos[i] + '"></td>';
html += '</tr>';
}
html += '</table></div>';
contenedor.innerHTML = html;
setTimeout(function() { aplicarMayusculasACamposDinamicos(); }, 100);
}
function generarAsistencia() {
var contenedor = document.getElementById('asistenciaContainer');
if (!contenedor) return;
var periodos = ['P1', 'P2', 'P3', 'P4'];
var html = '<div class="asistencia-box">';
html += '<h4>Resumen de asistencia del/la estudiante</h4>';
html += '<table class="asistencia-tabla">';
html += '<thead>';
html += '<tr>';
html += '<th rowspan="2">Períodos</th>';
html += '<th rowspan="2">Asistencia</th>';
html += '<th rowspan="2">Ausencia</th>';
html += '<th colspan="2">% de Anual</th>';
html += '</tr>';
html += '<tr><th>Asistencia</th><th>Ausencia</th></tr>';
html += '</thead>';
html += '<tbody>';
for (var i = 0; i < periodos.length; i++) {
html += '<tr>';
html += '<td class="asistencia-celda-periodo">' + periodos[i] + '</td>';
html += '<td><input type="text" class="input-asistencia" placeholder=""></td>';
html += '<td><input type="text" class="input-asistencia" placeholder=""></td>';
if (i === 0) {
html += '<td rowspan="4"><input type="text" class="input-asistencia" placeholder=""></td>';
html += '<td rowspan="4"><input type="text" class="input-asistencia" placeholder=""></td>';
}
html += '</tr>';
}
html += '</tbody></table></div>';
contenedor.innerHTML = html;
setTimeout(function() { aplicarMayusculasACamposDinamicos(); }, 100);
}
function generarLeyenda() {
var contenedor = document.getElementById('leyendaContainer');
if (!contenedor) return;
var items = [
{ codigo: 'P1', texto: 'Período 1' },
{ codigo: 'P2', texto: 'Período 2' },
{ codigo: 'P3', texto: 'Período 3' },
{ codigo: 'P4', texto: 'Período 4' }
];
if (currentGrade >= 3) {
items.push(
{ codigo: 'RP1', texto: 'Recuperación pedagógica 1' },
{ codigo: 'RP2', texto: 'Recuperación pedagógica 2' },
{ codigo: 'RP3', texto: 'Recuperación pedagógica 3' },
{ codigo: 'RP4', texto: 'Recuperación pedagógica 4' }
);
}
items.push(
{ codigo: 'C1', texto: 'Competencia 1' },
{ codigo: 'C2', texto: 'Competencia 2' },
{ codigo: 'C3', texto: 'Competencia 3' }
);
var html = '<div class="leyenda-box">';
html += '<h4>Leyenda:</h4>';
html += '<div class="leyenda-items-container">';
for (var i = 0; i < items.length; i++) {
var item = items[i];
html += '<div class="leyenda-item">';
html += '<div class="icono">' + item.codigo + '</div>';
html += '<span>' + item.texto + '</span>';
html += '</div>';
}
html += '</div></div>';
contenedor.innerHTML = html;
}
function generarEscala() {
var contenedor = document.getElementById('escalaContainer');
if (!contenedor) return;
var escalas = [
{ rango: '89-100', descripcion: 'Evidencia que el estudiante ha alcanzado un desempeño <strong>destacado</strong> con relación a los aspectos evaluados de las competencias de cada área, durante los períodos y al finalizar el año escolar.' },
{ rango: '77-88', descripcion: 'Evidencia que el estudiante ha logrado, en general, los aprendizajes esperados con relación a los aspectos evaluados de las competencias de cada área, durante los períodos y al finalizar el año escolar.' },
{ rango: '65-76', descripcion: 'Evidencia que el estudiante aún se encuentra en <strong>proceso</strong> con relación a los aspectos evaluados de las competencias de cada área, durante los períodos y al finalizar el año escolar, mostrando un logro muy básico.' },
{ rango: 'Menos de 65', descripcion: 'Evidencia que el estudiante ha alcanzado un desempeño <strong>insuficiente</strong> con relación a los aspectos evaluados de las competencias de cada área, durante los períodos y al finalizar el año escolar.' }
];
var html = '<div class="escala-box">';
html += '<table class="escala-tabla">';
html += '<thead><tr><th>Escala numérica</th><th>Descripción</th></tr></thead>';
html += '<tbody>';
for (var i = 0; i < escalas.length; i++) {
html += '<tr>';
html += '<td class="rango">' + escalas[i].rango + '</td>';
html += '<td>' + escalas[i].descripcion + '</td>';
html += '</tr>';
}
html += '</tbody></table></div>';
contenedor.innerHTML = html;
}
function generarPortadaCompleta() {
var contenedor = document.getElementById('portadaCompletaContainer');
if (!contenedor) return;
contenedor.innerHTML = '';
var nombresArchivos = {
1: '1RO_p1_recorte.png', 2: '2DO_p1_recorte.png', 3: '3RO_p1_recorte.png',
4: '4TO_p1_recorte.png', 5: '5TO_p1_recorte.png', 6: '6TO_p1_recorte.png'
};
var nombreArchivo = nombresArchivos[currentGrade] || '1RO_p1_recorte.png';
// ✅ CORREGIDO: Ahora busca la imagen en la misma carpeta plana
var rutaImagen = nombreArchivo; 
var img = document.createElement('img');
img.src = rutaImagen;
img.alt = 'Portada - ' + currentGrade + 'to Grado';
img.onerror = function() {
this.style.display = 'none';
contenedor.innerHTML = '<p style="color:red; font-size:11px; text-align:center; border:1px solid red; padding:5px; background:#fff0f0;">⚠️ Imagen no encontrada: ' + rutaImagen + '</p>';
};
contenedor.appendChild(img);
}
function actualizarSegunGrado() {
actualizarSituacionBox();
actualizarCajasContenido();
generarTablaDesempeno();
generarObservaciones();
generarLeyenda();
generarPortadaCompleta();
}
function actualizarSituacionBox() {
var situacionBox = document.getElementById('situacionBox');
if (!situacionBox) return;
situacionBox.style.display = (currentGrade >= 3) ? 'block' : 'none';
}
function actualizarCajasContenido() {
var avanceBox = document.getElementById('avanceBox');
var observacionesBox = document.getElementById('observacionesBox');
if (!avanceBox || !observacionesBox) return;
if (currentGrade <= 2) {
avanceBox.style.display = 'block';
observacionesBox.style.display = 'none';
} else {
avanceBox.style.display = 'none';
observacionesBox.style.display = 'block';
}
}
// ====================================================================
// MENSAJES
// ====================================================================
function mostrarMensajeGrado(texto) {
const anterior = document.querySelector('.mensaje-grado-flotante');
if (anterior) anterior.remove();
const mensaje = document.createElement('div');
mensaje.className = 'mensaje-grado-flotante';
mensaje.textContent = texto;
mensaje.style.cssText =
'position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-100px); ' +
'background: #d4edda; color: #155724; padding: 15px 30px; border-radius: 10px; ' +
'font-weight: bold; font-size: 16px; z-index: 9999; border: 3px solid #28a745; ' +
'box-shadow: 0 4px 20px rgba(0,0,0,0.2); transition: all 0.5s ease; opacity: 0; ' +
'font-family: Arial, sans-serif;';
document.body.appendChild(mensaje);
setTimeout(function() {
mensaje.style.transform = 'translateX(-50%) translateY(0)';
mensaje.style.opacity = '1';
}, 100);
setTimeout(function() {
mensaje.style.transform = 'translateX(-50%) translateY(-100px)';
mensaje.style.opacity = '0';
setTimeout(function() { mensaje.remove(); }, 500);
}, 3000);
}
function mostrarMensaje(texto, tipo) {
const anterior = document.querySelector('.mensaje-grado-flotante');
if (anterior) anterior.remove();
const mensaje = document.createElement('div');
mensaje.className = 'mensaje-grado-flotante';
mensaje.textContent = texto;
const colores = {
'exito': { bg: '#d4edda', border: '#28a745', color: '#155724' },
'error': { bg: '#f8d7da', border: '#dc3545', color: '#721c24' },
'warning': { bg: '#fff3cd', border: '#ffc107', color: '#856404' },
'info': { bg: '#d1ecf1', border: '#17a2b8', color: '#0c5460' }
};
const estilo = colores[tipo] || colores['info'];
mensaje.style.cssText =
'position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-100px); ' +
'background: ' + estilo.bg + '; color: ' + estilo.color + '; padding: 15px 30px; ' +
'border-radius: 10px; font-weight: bold; font-size: 16px; z-index: 9999; ' +
'border: 3px solid ' + estilo.border + '; box-shadow: 0 4px 20px rgba(0,0,0,0.2); ' +
'transition: all 0.5s ease; opacity: 0; font-family: Arial, sans-serif;';
document.body.appendChild(mensaje);
setTimeout(function() {
mensaje.style.transform = 'translateX(-50%) translateY(0)';
mensaje.style.opacity = '1';
}, 100);
setTimeout(function() {
mensaje.style.transform = 'translateX(-50%) translateY(-100px)';
mensaje.style.opacity = '0';
setTimeout(function() { mensaje.remove(); }, 500);
}, 3000);
}
// ====================================================================
// CONFIGURAR BOTONES
// ====================================================================
function configurarBotones() {
var btnImprimir = document.getElementById('btnImprimir');
var btnLimpiar = document.getElementById('btnLimpiar');
var btnPDF = document.getElementById('btnPDF');
var btnPDFSeleccionado = document.getElementById('btnPDFSeleccionado');
var btnSeleccionar = document.getElementById('btnSeleccionar');
var selector = document.getElementById('selectorEstudiante');
var btnAnterior = document.getElementById('btnAnterior');
var btnSiguiente = document.getElementById('btnSiguiente');
var btnReiniciarObs = document.getElementById('btnReiniciarObservaciones');
if (btnImprimir) {
btnImprimir.addEventListener('click', function() {
if (!estudianteSeleccionado) {
mostrarMensaje('⚠️ Seleccione un estudiante primero.', 'warning');
return;
}
const campoNombres = document.getElementById('campoNombres');
if (!campoNombres || !campoNombres.value) {
mostrarMensaje('⚠️ Cargue el estudiante primero.', 'warning');
return;
}
window.print();
});
}
if (btnLimpiar) {
btnLimpiar.addEventListener('click', function() {
if (confirm('¿Limpiar el documento? Se recargará la página.')) {
try { localStorage.removeItem('boletin_grado'); } catch (e) {}
location.reload();
}
});
}
if (btnPDF) {
btnPDF.addEventListener('click', function() {
if (estudiantesLista.length === 0) {
mostrarMensaje('⚠️ No hay estudiantes registrados.', 'warning');
return;
}
if (confirm(`¿Generar PDF para todos los ${estudiantesLista.length} estudiantes?`)) {
generarPDFTodos();
}
});
}
if (btnPDFSeleccionado) btnPDFSeleccionado.addEventListener('click', exportarPDFSeleccionadoBtn);
if (btnSeleccionar) {
btnSeleccionar.addEventListener('click', function() {
cargarEstudianteEnBoletin();
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
});
}
if (selector) {
selector.addEventListener('change', function() {
if (estudianteSeleccionado) guardarObservacionesPorPeriodo();
actualizarInfoEstudiante();
if (estudianteSeleccionado) {
cargarEstudianteEnBoletin();
actualizarIndicadorPosicion();
actualizarBotonesFlecha();
}
});
}
if (btnAnterior) btnAnterior.addEventListener('click', navegarAnterior);
if (btnSiguiente) btnSiguiente.addEventListener('click', navegarSiguiente);
if (btnReiniciarObs) {
btnReiniciarObs.addEventListener('click', function() {
if (confirm('⚠️ ¿Reiniciar todas las observaciones (generales y por período)?')) {
reiniciarObservaciones();
setTimeout(function() {
procesarObservacionesDeEstudiantes();
procesarObservacionesPorPeriodoCompleto();
if (estudianteSeleccionado && estudianteSeleccionado.uid) {
const uid = estudianteSeleccionado.uid;
const orden = parseInt(estudianteSeleccionado.orden, 10);
procesarObservacionesEstudianteIndividual(uid, orden);
cargarObservacionesPorPeriodoUI(uid);
mostrarObservacionEnBoletin(uid, orden);
}
mostrarMensaje('✅ Observaciones reiniciadas correctamente.', 'exito');
}, 300);
}
});
}
document.addEventListener('focusout', function(e) {
if (e.target.classList.contains('input-observacion')) {
if (estudianteSeleccionado) guardarObservacionesPorPeriodo();
}
});
document.addEventListener('keydown', function(e) {
if (e.key === 'Enter' && e.target.classList.contains('input-observacion')) {
e.preventDefault();
if (estudianteSeleccionado) {
guardarObservacionesPorPeriodo();
const inputs = document.querySelectorAll('.input-observacion');
const currentIndex = Array.from(inputs).indexOf(e.target);
if (currentIndex < inputs.length - 1) inputs[currentIndex + 1].focus();
}
}
});
document.addEventListener('keydown', function(e) {
const tag = e.target.tagName.toLowerCase();
if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
if (e.key === 'ArrowLeft') { e.preventDefault(); navegarAnterior(); }
else if (e.key === 'ArrowRight') { e.preventDefault(); navegarSiguiente(); }
});
}
// ====================================================================
// ✅ INICIALIZACIÓN DEL CANAL DE SINCRONIZACIÓN
// ====================================================================
function inicializarCanalSync() {
if (typeof BroadcastChannel === 'undefined') {
console.warn('⚠️ BroadcastChannel no soportado. Se usará solo evento storage.');
return;
}
try {
_canalSync = new BroadcastChannel('sigerd_sync');
_canalSync.onmessage = function(e) {
if (e.data && e.data.tipo === 'actualizacion') {
console.log('📢 BroadcastChannel: actualización recibida');
cargarEstudiantesDesdeListado();
eliminarDatosHuerfanosBoletin();
setTimeout(function() {
recargarDatosEstudianteSeleccionado();
}, 400);
}
};
console.log('✅ BroadcastChannel inicializado');
} catch (e) {
console.warn('⚠️ Error inicializando BroadcastChannel:', e);
}
}
// ====================================================================
// ✅ INICIALIZACIÓN
// ====================================================================
function init() {
console.log('🚀 ===== INICIANDO BOLETÍN =====');
console.log('✅ Soporta 3 formatos de asistencia: pipe, intermedio, viejo');
console.log('✅ 🆕 Recuperación Especial considerada en la situación académica');
setTimeout(function() {
if (typeof generadorPeriodo !== 'undefined') {
console.log('✅ generadorPeriodo disponible');
} else {
console.warn('⚠️ generadorPeriodo NO está disponible');
}
if (typeof generadorObservaciones !== 'undefined') {
console.log('✅ generadorObservaciones disponible');
} else {
console.warn('⚠️ generadorObservaciones NO está disponible');
}
}, 500);
migrarDatosViejosABoletin();
eliminarDatosHuerfanosBoletin();
inicializarGeneradorObservaciones();
inicializarCanalSync();
cargarGradoGuardado();
inicializarGradoBloqueado();
generarFirmaPeriodos();
generarLineasAvance();
generarObservacionesLineas();
generarCamposInfo();
sincronizarDatosDelRegistro();
generarTablaDesempeno();
generarObservaciones();
generarAsistencia();
generarLeyenda();
generarEscala();
generarPortadaCompleta();
configurarBotones();
actualizarSegunGrado();
aplicarClaseGrado();
agregarBotonRecargarDatos();
setTimeout(function() {
aplicarMayusculasATodosLosCampos();
aplicarMayusculasACamposDinamicos();
}, 200);
cargarEstudiantesDesdeListado();
setTimeout(function() {
cargarEstudiantePorDefecto();
setTimeout(function() {
procesarObservacionesDeEstudiantes();
procesarObservacionesPorPeriodoCompleto();
if (estudianteSeleccionado && estudianteSeleccionado.uid) {
const uid = estudianteSeleccionado.uid;
const orden = parseInt(estudianteSeleccionado.orden, 10);
procesarObservacionesEstudianteIndividual(uid, orden);
cargarObservacionesPorPeriodoUI(uid);
}
}, 500);
}, 300);
setTimeout(aplicarDatosCentroAlBoletin, 800);
if (intervaloGrado) clearInterval(intervaloGrado);
intervaloGrado = setInterval(function() {
if (_procesando) return;
_procesando = true;
try {
sincronizarGradoDesdeRegistro();
cargarEstudiantesDesdeListado();
eliminarDatosHuerfanosBoletin();
} finally {
_procesando = false;
}
}, 3000);
window.addEventListener('storage', function(e) {
if (e.key === 'datosSincronizados') {
sincronizarGradoDesdeRegistro();
sincronizarDatosDelRegistro();
}
if (e.key === 'datos_centro_para_boletin') aplicarDatosCentroAlBoletin();
if (e.key === 'registrosSigerd' || e.key === 'ordenAZActivo') {
cargarEstudiantesDesdeListado();
setTimeout(function() {
recargarDatosEstudianteSeleccionado();
}, 500);
}
if (e.key === 'minerd_contrasenas_docentes') {
sincronizarDatosDelRegistro();
}
if (e.key && e.key.startsWith('att')) {
if (estudianteSeleccionado && estudianteSeleccionado.uid) {
const uid = estudianteSeleccionado.uid;
const orden = parseInt(estudianteSeleccionado.orden, 10);
cargarAsistenciaDesdeRegistro(uid, orden);
setTimeout(function() {
calcularYMostrarSituacion(uid, orden);
}, 200);
}
}
if (e.key && (e.key.startsWith('nota_') ||
e.key.startsWith('situacion_') || e.key.startsWith('evalNota_') ||
e.key.startsWith('evalRec_') || e.key.startsWith('evalRecEsp_'))) {
if (estudianteSeleccionado && estudianteSeleccionado.uid) {
const uid = estudianteSeleccionado.uid;
const orden = parseInt(estudianteSeleccionado.orden, 10);
cargarCalificacionesDesdeRegistro(uid, orden);
calcularYMostrarSituacion(uid, orden);
setTimeout(function() {
procesarObservacionesEstudianteIndividual(uid, orden);
cargarObservacionesPorPeriodoUI(uid);
}, 400);
}
}
});
window.addEventListener('nombreDocenteActualizado', function(e) {
sincronizarDatosDelRegistro();
});
document.addEventListener('formulariosActualizado', function(e) {
console.log('🔄 Evento formulariosActualizado recibido');
cargarEstudiantesDesdeListado();
eliminarDatosHuerfanosBoletin();
setTimeout(function() {
recargarDatosEstudianteSeleccionado();
}, 500);
});
setInterval(function() {
const stored = localStorage.getItem('registrosSigerd');
if (stored) {
try {
const registros = JSON.parse(stored);
if (Array.isArray(registros)) {
const hash = JSON.stringify(registros.map(r => ({
uid: r.uid || '',
nombre: r.nombre || '',
apellido: r.apellido || '',
id: r.id || '',
orden: r.orden || ''
})));
if (hash !== _ultimoHashRegistros) {
_ultimoHashRegistros = hash;
cargarEstudiantesDesdeListado();
setTimeout(function() {
recargarDatosEstudianteSeleccionado();
}, 300);
}
}
} catch (e) {}
}
}, 3000);
console.log('✅ ===== BOLETÍN INICIALIZADO =====');
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
} else {
init();
}
})();