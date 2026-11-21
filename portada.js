/**
main.js - Registro de Grado
FUNCIONALIDADES:
Autocompletado de centros educativos (solo muestra el nombre, no el código)
Al seleccionar un centro, se llena automáticamente: código, regional y distrito
Al escribir un código en el campo "Código" y presionar ENTER o ESPACIO, se buscan los datos
El código completo del distrito (ej: "0101") contiene la regional (01) y el distrito (01)
Guardado automático en localStorage
VERIFICACIÓN DE AUTENTICACIÓN antes de redirigir
Redirección a REGISTRO-DE-GRADO.html
GRADO SELECCIONADO Y BLOQUEADO - No permite cambiar el grado
SECCIÓN Y TANDA BLOQUEADAS - Solo el administrador las asigna
VARIABLE DE DATOS: datosdelcentroeducativo (cargada desde datos-generales/datos-generales.js)
*/

// ============================================
// CONFIGURACIÓN DE RUTAS (DINÁMICA)
// ============================================
const RUTA_BASE = '';

// ============================================
// 📚 DETECCIÓN DE GRADO SELECCIONADO
// ============================================
let gradoSeleccionado = null;
let gradoBloqueado = false;
let seccionAsignada = '';
let tandaAsignada = '';

function obtenerGradoSeleccionado() {
    // 1. Verificar en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const gradoUrl = urlParams.get('grado');
    if (gradoUrl) {
        return decodeURIComponent(gradoUrl);
    }
    // 2. Verificar en localStorage
    const sesion = AuthSystem.obtenerSesion();
    if (sesion && sesion.cedula) {
        const gradoGuardado = AuthSystem.obtenerGradoSeleccionado(sesion.cedula);
        if (gradoGuardado) {
            return gradoGuardado;
        }
    }
    return null;
}

// ============================================
// 📌 CARGAR SECCIÓN Y TANDA
// ✅ CORREGIDO v2: La asignación se lee EN BLOQUE (sección + tanda juntas)
// de la primera fuente completa, para evitar mezclar datos
// de asignaciones distintas (ej: sección nueva con tanda vieja).
// ============================================
function cargarSeccionYTanda() {
    const seccionInput = document.getElementById('seccionAsignada');
    const tandaInput = document.getElementById('tandaAsignada');
    if (!seccionInput || !tandaInput) {
        console.warn('⚠️ No se encontraron los campos de sección y tanda');
        return { seccion: '', tanda: '' };
    }

    const candidatos = [];

    try {
        // 1. URL (MÁXIMA PRIORIDAD)
        const urlParams = new URLSearchParams(window.location.search);
        candidatos.push({
            nombre: 'URL',
            seccion: urlParams.get('seccion') ? decodeURIComponent(urlParams.get('seccion')) : '',
            tanda: urlParams.get('tanda') ? decodeURIComponent(urlParams.get('tanda')) : ''
        });

        // 2. minerd_grado_completo (asignación guardada por el login)
        const gradoCompleto = JSON.parse(localStorage.getItem('minerd_grado_completo') || 'null');
        if (gradoCompleto) {
            candidatos.push({
                nombre: 'minerd_grado_completo',
                seccion: gradoCompleto.seccion || '',
                tanda: gradoCompleto.tanda || ''
            });
        }

        // 3. datosSincronizados (última entrada al sistema)
        const datosSincronizados = JSON.parse(localStorage.getItem('datosSincronizados') || 'null');
        if (datosSincronizados) {
            candidatos.push({
                nombre: 'datosSincronizados',
                seccion: datosSincronizados.seccion || '',
                tanda: datosSincronizados.tanda || ''
            });
        }

        // 4. Claves individuales
        candidatos.push({
            nombre: 'claves individuales',
            seccion: localStorage.getItem('minerd_seccion_actual') || '',
            tanda: localStorage.getItem('minerd_tanda_actual') || ''
        });

        // 5. registroGradoData (último recurso)
        const registroGrado = JSON.parse(localStorage.getItem('registroGradoData') || 'null');
        if (registroGrado) {
            candidatos.push({
                nombre: 'registroGradoData',
                seccion: registroGrado.seccion || '',
                tanda: registroGrado.tanda || ''
            });
        }
    } catch (e) {
        console.warn('⚠️ Error cargando sección y tanda:', e);
    }

    // ✅ Elegir la primera fuente que tenga la asignación COMPLETA
    let elegido = candidatos.find(c => c.seccion && c.tanda);
    // Si ninguna está completa, tomar la primera que tenga al menos algo
    if (!elegido) elegido = candidatos.find(c => c.seccion || c.tanda);

    const seccion = elegido ? elegido.seccion : '';
    const tanda = elegido ? elegido.tanda : '';
    const fuente = elegido ? elegido.nombre : 'sin asignar';

    // Asignar valores a los campos y variables globales
    seccionAsignada = seccion;
    tandaAsignada = tanda;
    seccionInput.value = seccion || 'Sin asignar';
    tandaInput.value = tanda || 'Sin asignar';

    console.log(`📌 SECCIÓN FINAL: "${seccionInput.value}" | TANDA FINAL: "${tandaInput.value}" (fuente: ${fuente})`);

    // Aplicar estilos de bloqueo
    seccionInput.classList.add('campo-bloqueado-permanente');
    tandaInput.classList.add('campo-bloqueado-permanente');
    seccionInput.disabled = true;
    tandaInput.disabled = true;
    seccionInput.readOnly = true;
    tandaInput.readOnly = true;

    return { seccion, tanda };
}

// ============================================
// 📌 MOSTRAR BADGE DE ASIGNACIÓN COMPLETA
// ============================================
function mostrarBadgeAsignacionCompleta(grado, seccion, tanda) {
    const badge = document.getElementById('badgeAsignacionCompleta');
    const gradoTexto = document.getElementById('badgeGradoTexto');
    const seccionTexto = document.getElementById('badgeSeccionTexto');
    const tandaTexto = document.getElementById('badgeTandaTexto');

    if (!badge || !gradoTexto) return;

    console.log(`📌 Actualizando badge - Grado: "${grado}", Sección: "${seccion}", Tanda: "${tanda}"`);

    if (grado) {
        gradoTexto.textContent = grado;
        seccionTexto.textContent = seccion || 'Sin sección';
        tandaTexto.textContent = tanda || 'Sin tanda';
        badge.classList.add('visible');
        console.log(`📌 Badge actualizado: ${grado} | ${seccion || 'Sin sección'} | ${tanda || 'Sin tanda'}`);
    } else {
        badge.classList.remove('visible');
        console.log('📌 Badge oculto - No hay grado asignado');
    }
}

// ============================================
// 📌 BLOQUEAR GRADO EN EL SELECT
// ============================================
function bloquearGradoSelect(grado) {
    const gradoSelect = document.getElementById('grado');
    if (!gradoSelect) return;

    // Seleccionar el grado
    gradoSelect.value = grado;

    // Bloquear el select - NO permite cambiar
    gradoSelect.disabled = true;
    gradoSelect.classList.add('bloqueado');

    // Marcar como éxito
    gradoSelect.classList.remove('error');
    gradoSelect.classList.add('success');

    // Actualizar mensaje de error
    const errorSpan = document.getElementById('errorGrado');
    if (errorSpan) {
        errorSpan.textContent = '✅ Grado seleccionado y bloqueado';
        errorSpan.style.color = '#28a745';
    }

    // Actualizar el título
    actualizarGradoVisual(grado);

    // Mostrar badge completo con sección y tanda
    mostrarBadgeAsignacionCompleta(grado, seccionAsignada, tandaAsignada);

    // Disparar evento change para actualizar imagen
    gradoSelect.dispatchEvent(new Event('change'));

    console.log(`🔒 Grado bloqueado: ${grado}`);
}

// ============================================
// 📌 CAMBIAR DE GRADO (REDIRIGE A SELECCIÓN DE GRADO)
// ============================================
function cambiarGrado() {
    if (confirm('¿Desea cambiar de grado? Se guardarán los datos actuales.')) {
        // Guardar datos actuales
        guardarDatos();

        // Eliminar el grado seleccionado
        const sesion = AuthSystem.obtenerSesion();
        if (sesion && sesion.cedula) {
            AuthSystem.eliminarGradoSeleccionado(sesion.cedula);
        }

        // ✅ CORRECCIÓN CRÍTICA: Usar window.top para recargar la ventana completa y evitar el menú duplicado
        window.top.location.href = 'login.html?action=select_grado';
    }
}

// ============================================
// 📌 FUNCIÓN PARA GUARDAR DATOS (CON GRADO, SECCIÓN Y TANDA)
// ✅ CORREGIDO: No guarda el placeholder "Sin asignar" como dato real
// ============================================
function guardarDatos() {
    const grado = gradoSeleccionado || obtenerGradoSeleccionado();
    const sesion = AuthSystem.obtenerSesion();

    // ✅ Limpiar placeholder antes de guardar
    let seccionGuardar = seccionAsignada || document.getElementById('seccionAsignada')?.value || '';
    let tandaGuardar = tandaAsignada || document.getElementById('tandaAsignada')?.value || '';
    if (seccionGuardar === 'Sin asignar') seccionGuardar = '';
    if (tandaGuardar === 'Sin asignar') tandaGuardar = '';

    const datos = {
        centro: document.getElementById('centroEducativo')?.value || '',
        codigo: document.getElementById('codigo')?.value || '',
        grado: grado || document.getElementById('grado')?.value || '',
        seccion: seccionGuardar,
        tanda: tandaGuardar,
        regional: document.getElementById('regional')?.value || '',
        distrito: document.getElementById('distrito')?.value || '',
        anioInicio: document.getElementById('anioInicio')?.value || '',
        anioFin: document.getElementById('anioFin')?.value || '',
        formularioValidado: window.formularioValidado || false,
        camposBloqueados: window.camposBloqueados || false,
        timestamp: new Date().toISOString()
    };

    try {
        localStorage.setItem('registroGradoData', JSON.stringify(datos));
        console.log('💾 Datos guardados:', datos);
    } catch (e) {
        console.error('❌ Error al guardar:', e);
    }

    // Si hay grado y sesión, guardar en el sistema de grados
    if (grado && sesion && sesion.cedula) {
        AuthSystem.guardarDatosGrado(sesion.cedula, grado, datos);
        console.log(`💾 Datos guardados para ${grado}`);
    }
}

// ============================================
// 📌 CARGAR DATOS DEL GRADO
// ✅ CORREGIDO: El boletín del grado ya NO pisa la sección/tanda
// de la asignación actual (URL/login siempre manda)
// ============================================
function cargarDatosGrado() {
    const grado = gradoSeleccionado || obtenerGradoSeleccionado();
    const sesion = AuthSystem.obtenerSesion();
    if (grado && sesion && sesion.cedula) {
        const datos = AuthSystem.obtenerDatosGrado(sesion.cedula, grado);
        if (datos && datos.datos) {
            const d = datos.datos;
            if (d.centro) document.getElementById('centroEducativo').value = d.centro;
            if (d.codigo) document.getElementById('codigo').value = d.codigo;
            // ✅ Solo usar sección/tanda guardadas si NO hay asignación cargada
            if (d.seccion && !seccionAsignada) {
                seccionAsignada = d.seccion;
                document.getElementById('seccionAsignada').value = d.seccion;
            }
            if (d.tanda && !tandaAsignada) {
                tandaAsignada = d.tanda;
                document.getElementById('tandaAsignada').value = d.tanda;
            }
            if (d.regional) document.getElementById('regional').value = d.regional;
            if (d.distrito) document.getElementById('distrito').value = d.distrito;
            if (d.anioInicio) document.getElementById('anioInicio').value = d.anioInicio;
            if (d.anioFin) document.getElementById('anioFin').value = d.anioFin;
            if (d.formularioValidado !== undefined) {
                window.formularioValidado = d.formularioValidado;
            }
            if (d.camposBloqueados !== undefined) {
                window.camposBloqueados = d.camposBloqueados;
            }
            // Actualizar badge completo
            mostrarBadgeAsignacionCompleta(grado, seccionAsignada, tandaAsignada);
            // Aplicar estado de bloqueo de campos (solo si no está bloqueado por admin)
            if (window.camposBloqueados && !window.adminBloqueoActivo) {
                bloquearCamposFormulario();
            }
            console.log(`📂 Datos cargados para ${grado}`);
            return true;
        }
    }
    return false;
}

// ============================================
// 📌 BLOQUEAR CAMPOS DEL FORMULARIO (POR VALIDACIÓN)
// ============================================
function bloquearCamposFormulario() {
    // Si está bloqueado por admin, no aplicar este bloqueo
    if (window.adminBloqueoActivo) return;

    const camposBloqueables = [
        'centroEducativo',
        'codigo',
        'seccion',
        'tanda',
        'regional',
        'distrito',
        'anioInicio',
        'anioFin'
    ];

    camposBloqueables.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.disabled = true;
            campo.style.background = '#f0f0f0';
            campo.style.color = '#666';
            campo.style.cursor = 'not-allowed';
            campo.style.opacity = '0.8';
        }
    });

    // ✅ EL BOTÓN VALIDAR QUEDA VISIBLE PERO DESHABILITADO
    const btnValidar = document.getElementById('btnValidar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const buttonRow = document.getElementById('buttonRow');
    const buttonRowIngresar = document.getElementById('buttonRowIngresar');

    if (btnValidar) {
        btnValidar.disabled = true;
        btnValidar.textContent = '✅ Validado';
    }
    if (btnLimpiar) btnLimpiar.style.display = 'inline-block';
    if (buttonRow) {
        buttonRow.style.display = 'flex';
        buttonRow.style.justifyContent = 'center';
    }
    if (buttonRowIngresar) buttonRowIngresar.style.display = 'flex';

    window.camposBloqueados = true;
    window.formularioValidado = true;
    guardarDatos();
    mostrarMensaje('🔒 Campos bloqueados - Use "Limpiar Todo" para editar nuevamente', 'info');
    console.log('🔒 CAMPOS BLOQUEADOS POR VALIDACIÓN');
}

// ============================================
// 📌 DESBLOQUEAR CAMPOS DEL FORMULARIO (POR VALIDACIÓN)
// ============================================
function desbloquearCamposFormulario() {
    // Si está bloqueado por admin, no hacer nada
    if (window.adminBloqueoActivo) return;

    const camposBloqueables = [
        'centroEducativo',
        'codigo',
        'seccion',
        'tanda',
        'regional',
        'distrito',
        'anioInicio',
        'anioFin'
    ];

    camposBloqueables.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            // Si es sección o tanda, NO se desbloquean (son permanentes)
            if (id === 'seccion' || id === 'tanda') {
                campo.disabled = true;
                campo.style.background = '#f0f0f0';
                campo.style.color = '#666';
                campo.style.cursor = 'not-allowed';
                campo.style.opacity = '0.8';
                return;
            }
            campo.disabled = false;
            campo.style.background = '';
            campo.style.color = '';
            campo.style.cursor = '';
            campo.style.opacity = '';
        }
    });

    // Restaurar botón Validar
    const btnValidar = document.getElementById('btnValidar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const buttonRow = document.getElementById('buttonRow');
    const buttonRowIngresar = document.getElementById('buttonRowIngresar');

    if (btnValidar) {
        btnValidar.disabled = false;
        btnValidar.style.display = 'inline-block';
        btnValidar.textContent = '✅ Validar Campos';
    }
    if (btnLimpiar) btnLimpiar.style.display = 'inline-block';
    if (buttonRow) {
        buttonRow.style.display = 'flex';
        buttonRow.style.justifyContent = 'center';
    }
    if (buttonRowIngresar) buttonRowIngresar.style.display = 'none';

    window.camposBloqueados = false;
    window.formularioValidado = false;
    guardarDatos();
    mostrarMensaje('🔓 Campos desbloqueados - Puede editar los datos', 'exito');
    console.log('🔓 CAMPOS DESBLOQUEADOS POR VALIDACIÓN');
}

// ============================================
// 📌 DESBLOQUEAR AL EDITAR
// ============================================
function desbloquearAlEditar() {
    // Si los campos están bloqueados por validación (no por admin)
    if (window.camposBloqueados === true && !window.adminBloqueoActivo) {
        // Desbloquear campos
        window.camposBloqueados = false;
        window.formularioValidado = false;

        // Habilitar campos (excepto sección y tanda que son permanentes)
        const camposBloqueables = [
            'centroEducativo',
            'codigo',
            'regional',
            'distrito'
        ];
        camposBloqueables.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                campo.disabled = false;
                campo.style.background = '';
                campo.style.color = '';
                campo.style.cursor = '';
                campo.style.opacity = '';
            }
        });

        // Mostrar botón Validar
        const btnValidar = document.getElementById('btnValidar');
        const btnLimpiar = document.getElementById('btnLimpiar');
        const buttonRow = document.getElementById('buttonRow');
        const buttonRowIngresar = document.getElementById('buttonRowIngresar');

        if (btnValidar) {
            btnValidar.disabled = false;
            btnValidar.style.display = 'inline-block';
            btnValidar.textContent = '✅ Validar Campos';
        }
        if (btnLimpiar) btnLimpiar.style.display = 'inline-block';
        if (buttonRow) {
            buttonRow.style.display = 'flex';
            buttonRow.style.justifyContent = 'center';
        }
        if (buttonRowIngresar) buttonRowIngresar.style.display = 'none';

        // Limpiar mensajes de error
        document.querySelectorAll('.field-input, .field-select').forEach(campo => {
            if (campo.id !== 'grado' && campo.id !== 'seccionAsignada' && campo.id !== 'tandaAsignada') {
                campo.classList.remove('success');
            }
        });

        guardarDatos();
        mostrarMensaje('🔓 Campos desbloqueados - Puede editar y volver a validar', 'info');
        console.log('🔓 CAMPOS DESBLOQUEADOS POR EDICIÓN');
    }
}

// ============================================
// 📌 INICIALIZAR GRADO SELECCIONADO
// ============================================
function inicializarGrado() {
    gradoSeleccionado = obtenerGradoSeleccionado();

    // ✅ PRIMERO: Cargar sección y tanda
    const asignacion = cargarSeccionYTanda();
    console.log('📌 Asignación cargada:', asignacion);

    // ✅ SEGUNDO: Si hay grado, bloquear y mostrar badge
    if (gradoSeleccionado) {
        gradoBloqueado = true;
        bloquearGradoSelect(gradoSeleccionado);
        cargarDatosGrado();
        // ✅ TERCERO: Actualizar badge con todos los datos
        mostrarBadgeAsignacionCompleta(gradoSeleccionado, seccionAsignada, tandaAsignada);
        // Mostrar mensaje
        mostrarMensaje(`📚 Grado seleccionado: ${gradoSeleccionado}`, 'exito');
    } else {
        // Si no hay grado seleccionado, redirigir al login
        setTimeout(() => {
            if (!gradoSeleccionado) {
                alert('⚠️ No hay grado seleccionado. Redirigiendo al login...');
                window.location.href = 'login.html';
            }
        }, 500);
    }
}

// ============================================
// DOM ELEMENTOS
// ============================================
const centroInput = document.getElementById('centroEducativo');
const codigoInput = document.getElementById('codigo');
const anioInicio = document.getElementById('anioInicio');
const anioFin = document.getElementById('anioFin');
const gradoSelect = document.getElementById('grado');
const seccionAsignadaInput = document.getElementById('seccionAsignada');
const tandaAsignadaInput = document.getElementById('tandaAsignada');
const regionalSelect = document.getElementById('regional');
const distritoSelect = document.getElementById('distrito');
const btnValidar = document.getElementById('btnValidar');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnIngresar = document.getElementById('btnIngresar');
const portadaImg = document.getElementById('portadaImg');
const buttonRow = document.getElementById('buttonRow');
const buttonRowIngresar = document.getElementById('buttonRowIngresar');
const autocompleteItems = document.getElementById('autocompleteItems');

let formularioValidado = false;
let centrosFiltrados = [];
let itemSeleccionado = -1;
let buscandoPorCodigo = false;

// ============================================
// VARIABLE PARA BLOQUEO DE ADMIN
// ============================================
window.adminBloqueoActivo = false;

// ============================================
// VERIFICAR QUE LA VARIABLE datosdelcentroeducativo EXISTA
// ============================================
let datosGlobales = window.datosdelcentroeducativo || null;
if (!datosGlobales) {
    console.error('❌ ERROR: No se cargó la variable datosdelcentroeducativo');
    console.log('⚠️ Verifica que el archivo datos-generales/datos-generales.js se haya cargado correctamente');
} else {
    console.log('✅ datosdelcentroeducativo cargado:', datosGlobales.length, 'registros');
}

// ============================================
// FUNCIÓN PARA PARSEAR CAMPOS
// ============================================
function parsearCampoCentros(valor) {
    const str = String(valor).trim();
    if (!str) return { codigo: '', nombre: '' };
    const match = str.match(/^(\d+)\s*-\s*(.+)$/);
    if (match) {
        return { codigo: match[1].trim(), nombre: match[2].trim().toUpperCase() };
    }
    return { codigo: '', nombre: str.toUpperCase() };
}

function parsearCampoRegional(valor) {
    const str = String(valor).trim();
    if (!str) return { codigo: '', nombre: '' };
    const match = str.match(/^(\d+)\s*-\s*(.+)$/);
    if (match) {
        return { codigo: match[1].trim(), nombre: match[2].trim().toUpperCase() };
    }
    return { codigo: '', nombre: str.toUpperCase() };
}

function parsearCampoDistrito(valor) {
    const str = String(valor).trim();
    if (!str) return { codigo: '', nombre: '', regional: '', distrito: '' };
    const match = str.match(/^(\d+)\s*-\s*(.+)$/);
    if (match) {
        const codigoCompleto = match[1].trim();
        const nombre = match[2].trim().toUpperCase();
        const regional = codigoCompleto.substring(0, 2);
        const distrito = codigoCompleto.substring(2, 4);
        return { codigo: codigoCompleto, nombre: nombre, regional: regional, distrito: distrito };
    }
    return { codigo: '', nombre: str.toUpperCase(), regional: '', distrito: '' };
}

// ============================================
// CONSTRUIR MAPAS DE BÚSQUEDA
// ============================================
let mapaCentrosPorNombre = {};
let mapaCentrosPorCodigo = {};

function construirMapas() {
    const datos = window.datosdelcentroeducativo || null;
    if (!datos) {
        console.error('❌ datosdelcentroeducativo no está definido');
        return;
    }

    console.log('📊 Construyendo mapa de centros...');

    let contador = 0;
    datos.forEach((item) => {
        const centrosRaw = String(item["Centros"] || '').trim();
        const regionalRaw = String(item["Regional"] || '').trim();
        const distritoRaw = String(item["Distrito"] || '').trim();
        if (!centrosRaw) return;

        const { codigo: codigoCentro, nombre: nombreCentro } = parsearCampoCentros(centrosRaw);
        const { codigo: codigoRegional } = parsearCampoRegional(regionalRaw);
        const distritoData = parsearCampoDistrito(distritoRaw);

        if (nombreCentro !== '') {
            const data = {
                codigo: codigoCentro,
                nombre: nombreCentro,
                nombreCompleto: centrosRaw,
                regional: codigoRegional,
                regionalCompleto: regionalRaw,
                distritoCompleto: distritoRaw,
                distrito: distritoData.distrito || '',
                distritoNombre: distritoData.nombre || ''
            };
            if (!mapaCentrosPorNombre[nombreCentro]) {
                mapaCentrosPorNombre[nombreCentro] = data;
            }
            if (codigoCentro && !mapaCentrosPorCodigo[codigoCentro]) {
                mapaCentrosPorCodigo[codigoCentro] = data;
            }
            contador++;
        }
    });

    console.log('📌 Centros cargados:', contador);

    if (contador > 0) {
        mostrarMensaje(`✅ ${contador} centros educativos cargados`, 'exito');
    } else {
        console.warn('⚠️ No hay centros cargados.');
        mostrarMensaje('⚠️ No hay centros educativos en la base de datos', 'warning');
    }
}

// ============================================
// FUNCIONES DE BÚSQUEDA
// ============================================
function buscarCentroPorNombre(nombre) {
    const valor = String(nombre).trim().toUpperCase();
    if (!valor) return null;
    if (mapaCentrosPorNombre[valor]) return mapaCentrosPorNombre[valor];
    const valorSinEspacios = valor.replace(/\s+/g, '');
    for (const [nombreKey, data] of Object.entries(mapaCentrosPorNombre)) {
        if (nombreKey.replace(/\s+/g, '') === valorSinEspacios) return data;
    }
    for (const [nombreKey, data] of Object.entries(mapaCentrosPorNombre)) {
        if (nombreKey.includes(valor)) return data;
    }
    return null;
}

function buscarCentroPorCodigo(codigo) {
    const valor = String(codigo).trim();
    if (!valor) return null;
    if (mapaCentrosPorCodigo[valor]) return mapaCentrosPorCodigo[valor];
    for (const [codigoKey, data] of Object.entries(mapaCentrosPorCodigo)) {
        if (codigoKey.includes(valor)) return data;
    }
    return null;
}

// ============================================
// LLENAR CAMPOS CON DATOS DEL CENTRO
// ============================================
function llenarCamposConCentro(data) {
    if (!data) return false;

    if (data.codigo) {
        codigoInput.value = data.codigo;
        codigoInput.classList.remove('error');
        codigoInput.classList.add('success');
        const errorSpan = document.getElementById('errorCodigo');
        if (errorSpan) errorSpan.textContent = '✅ OK';
    }

    if (data.regional) {
        regionalSelect.value = data.regional;
        regionalSelect.classList.remove('error');
        regionalSelect.classList.add('success');
        const errorSpan = document.getElementById('errorRegional');
        if (errorSpan) errorSpan.textContent = '✅ OK';
    }

    if (data.distrito) {
        distritoSelect.value = data.distrito;
        distritoSelect.classList.remove('error');
        distritoSelect.classList.add('success');
        const errorSpan = document.getElementById('errorDistrito');
        if (errorSpan) errorSpan.textContent = '✅ OK';
    }

    centroInput.classList.remove('error');
    centroInput.classList.add('success');
    const errorSpanCentro = document.getElementById('errorCentroEducativo');
    if (errorSpanCentro) errorSpanCentro.textContent = '✅ Centro verificado';

    guardarDatos();
    return true;
}

// ============================================
// VALIDAR CENTRO Y LLENAR CAMPOS
// ============================================
function validarCentroYLlenarCampos() {
    if (buscandoPorCodigo) return;

    const centro = centroInput.value.trim();

    if (centro === '') {
        centroInput.classList.remove('error', 'success');
        const errorSpan = document.getElementById('errorCentroEducativo');
        if (errorSpan) errorSpan.textContent = '';
        codigoInput.value = '';
        regionalSelect.value = '';
        distritoSelect.value = '';
        return;
    }

    const data = buscarCentroPorNombre(centro);
    if (data) {
        llenarCamposConCentro(data);
        mostrarMensaje(`✅ Centro verificado: ${data.nombre}`, 'exito');
    } else {
        if (centro.length >= 3) {
            centroInput.classList.remove('success');
            centroInput.classList.add('error');
            const errorSpan = document.getElementById('errorCentroEducativo');
            if (errorSpan) errorSpan.textContent = '❌ Centro no encontrado';
            codigoInput.value = '';
            regionalSelect.value = '';
            distritoSelect.value = '';
            mostrarMensaje(`⚠️ "${centro}" no está registrado`, 'warning');
        }
    }
}

// ============================================
// BUSCAR POR CÓDIGO
// ============================================
function buscarYllenarPorCodigo() {
    const codigo = codigoInput.value.trim();

    if (codigo === '') {
        codigoInput.classList.remove('error', 'success');
        const errorSpan = document.getElementById('errorCodigo');
        if (errorSpan) errorSpan.textContent = '';
        return;
    }

    buscandoPorCodigo = true;
    const data = buscarCentroPorCodigo(codigo);

    if (data) {
        centroInput.value = data.nombre;
        centroInput.classList.remove('error');
        centroInput.classList.add('success');
        const errorSpanCentro = document.getElementById('errorCentroEducativo');
        if (errorSpanCentro) errorSpanCentro.textContent = '✅ Centro verificado';
        llenarCamposConCentro(data);
        mostrarMensaje(`✅ Centro encontrado: ${data.nombre}`, 'exito');
        autocompleteItems.classList.remove('show');
        autocompleteItems.innerHTML = '';
    } else {
        if (codigo.length >= 2) {
            codigoInput.classList.remove('success');
            codigoInput.classList.add('error');
            const errorSpan = document.getElementById('errorCodigo');
            if (errorSpan) errorSpan.textContent = '❌ Código no encontrado';
            mostrarMensaje(`⚠️ Código "${codigo}" no corresponde a ningún centro`, 'warning');
        }
    }

    setTimeout(() => { buscandoPorCodigo = false; }, 100);
}

// ============================================
// AUTOCOMPLETADO
// ============================================
function mostrarSugerencias(texto) {
    const valor = texto.trim().toUpperCase();
    if (valor.length < 2) {
        autocompleteItems.classList.remove('show');
        autocompleteItems.innerHTML = '';
        return;
    }

    const nombres = Object.keys(mapaCentrosPorNombre);
    centrosFiltrados = nombres.filter(n => n.includes(valor));

    if (centrosFiltrados.length === 0) {
        autocompleteItems.classList.remove('show');
        autocompleteItems.innerHTML = '';
        return;
    }

    const mostrar = centrosFiltrados.slice(0, 10);
    autocompleteItems.innerHTML = '';

    mostrar.forEach(nombre => {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = nombre;
        div.addEventListener('click', function() {
            seleccionarCentro(this.textContent);
        });
        autocompleteItems.appendChild(div);
    });

    autocompleteItems.classList.add('show');
    itemSeleccionado = -1;
}

function seleccionarCentro(nombre) {
    centroInput.value = nombre;
    autocompleteItems.classList.remove('show');
    autocompleteItems.innerHTML = '';
    validarCentroYLlenarCampos();
    centroInput.focus();
}

function actualizarHighlight(items) {
    items.forEach((item, index) => {
        if (index === itemSeleccionado) {
            item.classList.add('highlight');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('highlight');
        }
    });
}

// ============================================
// MAPEO DE GRADOS
// ============================================
const mapaGrados = {
    'Primer Grado': {
        imagen: '1ro-Imagen1.png',
        colorRegistro: '#E7733E',
        colorGrado: '#E7733E',
        colorNivel: '#F5A07A'
    },
    'Segundo Grado': {
        imagen: '2do-Imagen1.png',
        colorRegistro: '#001FA1',
        colorGrado: '#001FA1',
        colorNivel: '#6688CC'
    },
    'Tercer Grado': {
        imagen: '3ro-Imagen1.png',
        colorRegistro: '#115E3D',
        colorGrado: '#115E3D',
        colorNivel: '#6DA88A'
    },
    'Cuarto Grado': {
        imagen: '4to-Imagen1.png',
        colorRegistro: '#F113FF',
        colorGrado: '#F113FF',
        colorNivel: '#F99EFF'
    },
    'Quinto Grado': {
        imagen: '5to-Imagen1.png',
        colorRegistro: '#555900',
        colorGrado: '#555900',
        colorNivel: '#9A9E55'
    },
    'Sexto Grado': {
        imagen: '6to-Imagen1.png',
        colorRegistro: '#451703',
        colorGrado: '#451703',
        colorNivel: '#A67555'
    }
};

// ============================================
// ACTUALIZAR TÍTULO Y GRADO
// ============================================
function actualizarGradoVisual(grado) {
    const tituloCompleto = document.querySelector('.main-title');
    const datos = mapaGrados[grado];
    if (datos && grado !== '') {
        const nombreGrado = grado.replace(' Grado', '');
        tituloCompleto.innerHTML = `<span style="color: ${datos.colorRegistro};">REGISTRO</span><br /> <span style="color: ${datos.colorGrado}; font-weight: 900;">${nombreGrado}</span> <span style="color: ${datos.colorNivel}; font-size: 0.8em;"> Grado del Nivel Primario</span>`;
        mostrarImagenGrado(grado);
    } else {
        restaurarTituloDefault();
        mostrarImagenGrado('');
    }
}

function restaurarTituloDefault() {
    const tituloCompleto = document.querySelector('.main-title');
    tituloCompleto.innerHTML = `<span style="color: #1a2a4a;">REGISTRO</span><br /> <span style="color: #1a5a8a;">Seleccione un Grado</span> <span style="color: #2c3e50; font-size: 0.8em;"> del Nivel Primario</span>`;
}

function restaurarGradoDefault() {
    restaurarTituloDefault();
    mostrarImagenGrado('');
}

function mostrarImagenGrado(grado) {
    const datos = mapaGrados[grado];
    if (datos && grado !== '') {
        portadaImg.src = RUTA_BASE + 'img/' + datos.imagen;
        portadaImg.alt = 'Registro - ' + grado;
        portadaImg.className = 'portada-img visible';
        console.log('🖼️ Mostrando imagen para:', grado);
    } else {
        portadaImg.src = '';
        portadaImg.alt = 'Seleccione un grado';
        portadaImg.className = 'portada-img oculta';
    }
}

// ============================================
// ACTUALIZAR AÑO ESCOLAR
// ============================================
function actualizarAnioEscolar() {
    const fechaActual = new Date();
    const mes = fechaActual.getMonth();
    const dia = fechaActual.getDate();
    const anio = fechaActual.getFullYear();

    let anioInicioVal = anio;
    let anioFinVal = anio + 1;

    if (mes > 7 || (mes === 7 && dia >= 1)) {
        anioInicioVal = anio;
        anioFinVal = anio + 1;
    } else {
        anioInicioVal = anio - 1;
        anioFinVal = anio;
    }

    if (anioInicioVal > 2030) { anioInicioVal = 2030; anioFinVal = 2031; }
    if (anioInicioVal < 2025) { anioInicioVal = 2025; anioFinVal = 2026; }

    anioInicio.value = anioInicioVal;
    anioFin.value = anioFinVal;
}

// ============================================
// MENSAJE FLOTANTE
// ============================================
function mostrarMensaje(texto, tipo) {
    const mensajeAnterior = document.querySelector('.mensaje-flotante');
    if (mensajeAnterior) mensajeAnterior.remove();

    const mensaje = document.createElement('div');
    mensaje.className = `mensaje-flotante ${tipo} mostrar`;
    mensaje.textContent = texto;
    document.body.appendChild(mensaje);

    setTimeout(() => {
        mensaje.classList.remove('mostrar');
        setTimeout(() => mensaje.remove(), 500);
    }, 4000);
}

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================
function limpiarError(campo) {
    campo.classList.remove('error', 'success');
    const errorSpan = document.getElementById(campo.id + 'Error');
    if (errorSpan) errorSpan.textContent = '';
}

function marcarError(campo, mensaje) {
    campo.classList.add('error');
    campo.classList.remove('success');
    const errorSpan = document.getElementById(campo.id + 'Error');
    if (errorSpan) errorSpan.textContent = '❌ ' + mensaje;
}

function marcarExito(campo) {
    campo.classList.remove('error');
    campo.classList.add('success');
    const errorSpan = document.getElementById(campo.id + 'Error');
    if (errorSpan) errorSpan.textContent = '✅ OK';
}

function validarCampo(campo, tipo) {
    const valor = campo.value.trim();
    limpiarError(campo);
    switch (tipo) {
        case 'texto':
            if (valor === '') { marcarError(campo, 'Obligatorio'); return false; }
            if (valor.length < 3) { marcarError(campo, 'Mínimo 3'); return false; }
            marcarExito(campo);
            return true;
        case 'codigo':
            if (valor === '') { marcarError(campo, 'Obligatorio'); return false; }
            if (valor.length > 7) { marcarError(campo, 'Máximo 7'); return false; }
            if (!buscarCentroPorCodigo(valor)) {
                marcarError(campo, 'Código no registrado');
                return false;
            }
            marcarExito(campo);
            return true;
        case 'select':
            if (valor === '') { marcarError(campo, 'Seleccione'); return false; }
            marcarExito(campo);
            return true;
        default:
            return true;
    }
}

// ============================================
// VALIDAR TODOS LOS CAMPOS
// ============================================
function validarTodos() {
    // Si está bloqueado por admin, no hacer nada
    if (window.adminBloqueoActivo) {
        mostrarMensaje('🔒 Página en mantenimiento por el administrador', 'warning');
        return;
    }

    const centro = centroInput.value.trim();
    if (centro !== '' && !buscarCentroPorNombre(centro)) {
        mostrarMensaje('⚠️ El centro educativo no está registrado', 'warning');
        centroInput.focus();
        return;
    }

    let todoValido = true;

    if (!validarCampo(centroInput, 'texto')) todoValido = false;
    if (!validarCampo(codigoInput, 'codigo')) todoValido = false;
    // El grado YA está bloqueado, no se valida
    // Sección y Tanda NO se validan porque están bloqueadas por el admin
    if (!validarCampo(regionalSelect, 'select')) todoValido = false;
    if (!validarCampo(distritoSelect, 'select')) todoValido = false;

    if (todoValido) {
        window.formularioValidado = true;
        window.camposBloqueados = true;
        guardarDatos();

        // BLOQUEAR CAMPOS
        bloquearCamposFormulario();

        // ✅ EL BOTÓN VALIDAR SIGUE VISIBLE PERO DESHABILITADO
        const btnValidar = document.getElementById('btnValidar');
        if (btnValidar) {
            btnValidar.disabled = true;
            btnValidar.textContent = '✅ Validado';
        }

        // Mostrar botón Ingresar
        const buttonRow = document.getElementById('buttonRow');
        const buttonRowIngresar = document.getElementById('buttonRowIngresar');
        if (buttonRow) buttonRow.style.display = 'flex';
        if (buttonRowIngresar) buttonRowIngresar.style.display = 'flex';

        mostrarMensaje('✅ ¡Formulario validado correctamente!', 'exito');
    } else {
        mostrarMensaje('⚠️ Hay campos que requieren corrección', 'warning');
        const primerError = document.querySelector('.field-input.error, .field-select.error');
        if (primerError) primerError.focus();
    }
    return todoValido;
}

// ============================================
// LIMPIAR TODO
// ============================================
function limpiarTodo() {
    if (!confirm('¿Estás seguro de que quieres limpiar todos los campos?')) return;

    // Si está bloqueado por admin, no hacer nada
    if (window.adminBloqueoActivo) {
        mostrarMensaje('🔒 Página en mantenimiento por el administrador', 'warning');
        return;
    }

    // Desbloquear campos (excepto sección y tanda que son permanentes)
    const camposBloqueables = [
        'centroEducativo',
        'codigo',
        'regional',
        'distrito'
    ];
    camposBloqueables.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.disabled = false;
            campo.style.background = '';
            campo.style.color = '';
            campo.style.cursor = '';
            campo.style.opacity = '';
        }
    });

    // Limpiar valores
    centroInput.value = '';
    codigoInput.value = '';
    regionalSelect.value = '';
    distritoSelect.value = '';
    autocompleteItems.classList.remove('show');
    autocompleteItems.innerHTML = '';

    // Resetear estados
    window.formularioValidado = false;
    window.camposBloqueados = false;

    // Restaurar botón Validar
    const btnValidar = document.getElementById('btnValidar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const buttonRow = document.getElementById('buttonRow');
    const buttonRowIngresar = document.getElementById('buttonRowIngresar');

    if (btnValidar) {
        btnValidar.disabled = false;
        btnValidar.style.display = 'inline-block';
        btnValidar.textContent = '✅ Validar Campos';
    }
    if (btnLimpiar) btnLimpiar.style.display = 'inline-block';
    if (buttonRow) {
        buttonRow.style.display = 'flex';
        buttonRow.style.justifyContent = 'center';
    }
    if (buttonRowIngresar) buttonRowIngresar.style.display = 'none';

    document.querySelectorAll('.field-input, .field-select').forEach(campo => {
        if (campo.id !== 'grado' && campo.id !== 'seccionAsignada' && campo.id !== 'tandaAsignada') {
            campo.classList.remove('error', 'success');
            const errorSpan = document.getElementById(campo.id + 'Error');
            if (errorSpan) errorSpan.textContent = '';
        }
    });

    actualizarAnioEscolar();
    guardarDatos();
    mostrarMensaje('🧹 Todos los campos han sido limpiados - Puede validar nuevamente', 'exito');
}

// ============================================
// ENTRAR AL SISTEMA
// ✅ CORREGIDO: No envía el placeholder "Sin asignar" como dato real
// ============================================
function entrarAlSistema() {
    if (!window.formularioValidado) {
        mostrarMensaje('⚠️ Primero debe validar el formulario', 'warning');
        return;
    }

    if (typeof AuthSystem === 'undefined') {
        mostrarMensaje('⚠️ Sistema de autenticación no disponible', 'error');
        return;
    }

    const sesionActiva = AuthSystem.obtenerSesion();
    if (!sesionActiva) {
        mostrarMensaje('🔒 Debe iniciar sesión para acceder al sistema', 'warning');
        setTimeout(() => {
            if (confirm('No hay sesión activa. ¿Desea iniciar sesión?')) {
                window.location.href = 'login.html';
            }
        }, 500);
        return;
    }

    const validacionSesion = AuthSystem.validarSesionActiva();
    if (!validacionSesion.valido) {
        mostrarMensaje('🔒 ' + validacionSesion.motivo, 'error');
        setTimeout(() => {
            if (confirm(validacionSesion.motivo + '. ¿Desea iniciar sesión nuevamente?')) {
                window.location.href = 'login.html';
            }
        }, 500);
        return;
    }

    btnIngresar.disabled = true;
    btnIngresar.textContent = '⏳ Cargando...';
    mostrarMensaje('📥 Accediendo al sistema...', 'info');

    const grado = gradoSeleccionado || obtenerGradoSeleccionado();
    let seccion = seccionAsignada || document.getElementById('seccionAsignada')?.value || '';
    let tanda = tandaAsignada || document.getElementById('tandaAsignada')?.value || '';

    // ✅ Limpiar placeholder
    if (seccion === 'Sin asignar') seccion = '';
    if (tanda === 'Sin asignar') tanda = '';

    // ✅ Asegurar que el grado esté guardado en localStorage
    if (grado && sesionActiva.cedula) {
        AuthSystem.guardarGradoSeleccionado(sesionActiva.cedula, grado);
    }

    const datosSincronizacion = {
        grado: grado || gradoSelect.value,
        seccion: seccion,
        tanda: tanda,
        anioEscolar: anioInicio.value + '-' + anioFin.value,
        regional: regionalSelect.value,
        distrito: distritoSelect.value,
        centroEducativo: centroInput.value,
        codigoCentro: codigoInput.value,
        timestamp: new Date().toISOString(),
        docente: sesionActiva.nombre || 'No disponible',
        cedulaDocente: sesionActiva.cedula || 'No disponible'
    };

    try {
        localStorage.setItem('datosSincronizados', JSON.stringify(datosSincronizacion));
        console.log('✅ Datos sincronizados guardados:', datosSincronizacion);
    } catch (e) {
        console.error('❌ Error guardando datos sincronizados:', e);
    }

    guardarDatos();

    // ✅ Redirigir a REGISTRO-DE-GRADO.html con el grado, sección y tanda en la URL
    setTimeout(() => {
        let url = 'REGISTRO-DE-GRADO.html?';
        if (grado) url += 'grado=' + encodeURIComponent(grado);
        if (seccion) url += '&seccion=' + encodeURIComponent(seccion);
        if (tanda) url += '&tanda=' + encodeURIComponent(tanda);
        window.location.href = url;
    }, 800);
}

// ============================================
// EVENTOS
// ============================================
centroInput.addEventListener('blur', function() {
    const valor = this.value.trim();
    if (valor !== '') {
        validarCentroYLlenarCampos();
    } else {
        limpiarError(this);
        codigoInput.value = '';
        regionalSelect.value = '';
        distritoSelect.value = '';
    }
    setTimeout(() => {
        autocompleteItems.classList.remove('show');
        autocompleteItems.innerHTML = '';
    }, 200);
});

centroInput.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
    this.classList.remove('error', 'success');
    const errorSpan = document.getElementById('errorCentroEducativo');
    if (errorSpan) errorSpan.textContent = '';

    const valor = this.value.trim();
    mostrarSugerencias(valor);

    if (valor.length >= 3) {
        validarCentroYLlenarCampos();
    } else if (valor === '') {
        codigoInput.value = '';
        regionalSelect.value = '';
        distritoSelect.value = '';
        autocompleteItems.classList.remove('show');
        autocompleteItems.innerHTML = '';
    }
    guardarDatos();
});

centroInput.addEventListener('keydown', function(e) {
    const items = autocompleteItems.querySelectorAll('.item');
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        itemSeleccionado = Math.min(itemSeleccionado + 1, items.length - 1);
        actualizarHighlight(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        itemSeleccionado = Math.max(itemSeleccionado - 1, -1);
        actualizarHighlight(items);
    } else if (e.key === 'Enter') {
        if (itemSeleccionado >= 0 && items[itemSeleccionado]) {
            e.preventDefault();
            seleccionarCentro(items[itemSeleccionado].textContent);
            itemSeleccionado = -1;
        }
    } else if (e.key === 'Escape') {
        autocompleteItems.classList.remove('show');
        autocompleteItems.innerHTML = '';
        itemSeleccionado = -1;
    }
});

codigoInput.addEventListener('blur', function() {
    const valor = this.value.trim();
    if (valor !== '') {
        validarCampo(this, 'codigo');
    } else {
        limpiarError(this);
    }
});

codigoInput.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.classList.contains('error') || this.classList.contains('success')) {
        this.classList.remove('error', 'success');
        const errorSpan = document.getElementById('errorCodigo');
        if (errorSpan) errorSpan.textContent = '';
    }
    guardarDatos();
});

codigoInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const valor = this.value.trim();
        if (valor !== '') {
            buscarYllenarPorCodigo();
            validarCampo(this, 'codigo');
        }
    }
});

// Selects (EXCEPTO GRADO - ya está bloqueado)
regionalSelect.addEventListener('change', function() {
    validarCampo(this, 'select');
    guardarDatos();
});

distritoSelect.addEventListener('change', function() {
    validarCampo(this, 'select');
    guardarDatos();
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('.autocomplete-container')) {
        autocompleteItems.classList.remove('show');
        autocompleteItems.innerHTML = '';
    }
});

btnValidar.addEventListener('click', validarTodos);
btnLimpiar.addEventListener('click', limpiarTodo);
btnIngresar.addEventListener('click', entrarAlSistema);

window.addEventListener('beforeunload', function() {
    guardarDatos();
});

// ============================================
// 🔓 SISTEMA DE BLOQUEO DE CAMPOS (ADMIN)
// ============================================
function cargarEstadoBloqueo() {
    try {
        const datos = localStorage.getItem('minerd_bloqueo_campos');
        if (datos) {
            const config = JSON.parse(datos);
            return config.bloqueado === true;
        }
    } catch (e) {
        console.error('Error cargando bloqueo:', e);
    }
    return false;
}

function aplicarBloqueoAdmin(bloqueado) {
    window.adminBloqueoActivo = bloqueado;
    const mensajeMantenimiento = document.getElementById('mensajeMantenimientoAdmin');

    const camposBloqueables = [
        'centroEducativo',
        'codigo',
        'regional',
        'distrito'
    ];

    if (bloqueado) {
        if (mensajeMantenimiento) {
            mensajeMantenimiento.classList.add('visible');
            console.log('✅ Mensaje de mantenimiento MOSTRADO');
        } else {
            console.error('❌ No se encontró el elemento mensajeMantenimientoAdmin');
        }

        camposBloqueables.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                campo.disabled = true;
                campo.classList.add('admin-bloqueado');
            }
        });

        const btnValidar = document.getElementById('btnValidar');
        if (btnValidar) {
            btnValidar.disabled = true;
            btnValidar.textContent = '🔒 Bloqueado';
        }

        const buttonRowIngresar = document.getElementById('buttonRowIngresar');
        if (buttonRowIngresar) buttonRowIngresar.style.display = 'none';

        mostrarMensaje('🔒 Página en mantenimiento por el administrador', 'warning');
        console.log('🔒 PÁGINA EN MANTENIMIENTO POR ADMIN');
    } else {
        if (mensajeMantenimiento) {
            mensajeMantenimiento.classList.remove('visible');
            console.log('✅ Mensaje de mantenimiento OCULTADO');
        }

        camposBloqueables.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                if (!window.camposBloqueados) {
                    campo.disabled = false;
                    campo.classList.remove('admin-bloqueado');
                } else {
                    campo.classList.remove('admin-bloqueado');
                }
            }
        });

        const btnValidar = document.getElementById('btnValidar');
        if (btnValidar) {
            if (!window.camposBloqueados) {
                btnValidar.disabled = false;
                btnValidar.textContent = '✅ Validar Campos';
            } else {
                btnValidar.disabled = true;
                btnValidar.textContent = '✅ Validado';
            }
        }

        const buttonRowIngresar = document.getElementById('buttonRowIngresar');
        if (buttonRowIngresar && window.formularioValidado) {
            buttonRowIngresar.style.display = 'flex';
        } else if (buttonRowIngresar) {
            buttonRowIngresar.style.display = 'none';
        }

        mostrarMensaje('🔓 Página desbloqueada - Ya puede usar el sistema', 'exito');
        console.log('🔓 PÁGINA DESBLOQUEADA POR ADMIN');
    }
}

// ============================================
// 🔓 EVENTOS PARA DETECTAR EDICIÓN Y DESBLOQUEAR
// ============================================
const camposEdicion = ['centroEducativo', 'codigo', 'regional', 'distrito'];
camposEdicion.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
        campo.addEventListener('input', function() {
            if (window.camposBloqueados === true && !window.adminBloqueoActivo) {
                desbloquearAlEditar();
            }
        });
        campo.addEventListener('change', function() {
            if (window.camposBloqueados === true && !window.adminBloqueoActivo) {
                desbloquearAlEditar();
            }
        });
    }
});

// ============================================
// 📂 CARGAR DATOS GENERALES GUARDADOS (BASE)
// ✅ NUEVA FUNCIÓN: Se ejecuta ANTES de inicializarGrado() para que
// la asignación actual (URL/login) siempre tenga la última palabra.
// ⚠️ Aquí NO se restauran sección ni tanda: esos valores vienen
// únicamente de la asignación del administrador.
// ============================================
function cargarDatosGuardados() {
    try {
        const guardado = localStorage.getItem('registroGradoData');
        if (!guardado) return;

        const datos = JSON.parse(guardado);
        const gradoActual = obtenerGradoSeleccionado();

        // ✅ Detectar si el docente cambió de grado
        const cambioDeGrado = datos.grado && gradoActual && datos.grado !== gradoActual;

        // Restaurar datos del centro (siempre, porque suele ser el mismo)
        if (datos.centro) centroInput.value = datos.centro;
        if (datos.codigo) codigoInput.value = datos.codigo;
        if (datos.regional) regionalSelect.value = datos.regional;
        if (datos.distrito) distritoSelect.value = datos.distrito;
        if (datos.anioInicio) anioInicio.value = datos.anioInicio;
        if (datos.anioFin) anioFin.value = datos.anioFin;

        if (cambioDeGrado) {
            // ✅ El grado cambió: reiniciar estado de validación
            // (el nuevo grado debe validarse de nuevo)
            window.formularioValidado = false;
            window.camposBloqueados = false;
            console.log(`🔄 Grado cambió de "${datos.grado}" a "${gradoActual}" - validación reiniciada`);
        } else {
            if (datos.formularioValidado !== undefined) {
                window.formularioValidado = datos.formularioValidado;
            }
            if (datos.camposBloqueados !== undefined) {
                window.camposBloqueados = datos.camposBloqueados;
                if (window.camposBloqueados && !window.adminBloqueoActivo) {
                    bloquearCamposFormulario();
                }
            }
            if (window.formularioValidado && !window.camposBloqueados && !window.adminBloqueoActivo) {
                const buttonRow = document.getElementById('buttonRow');
                const buttonRowIngresar = document.getElementById('buttonRowIngresar');
                if (buttonRow) buttonRow.style.display = 'flex';
                if (buttonRowIngresar) buttonRowIngresar.style.display = 'flex';
            }
        }

        console.log('📂 Datos generales cargados desde localStorage');
    } catch (e) {
        console.error('❌ Error al cargar:', e);
    }
}

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ✅ CORREGIDO: Se invirtió el orden.
// ANTES: inicializarGrado() → carga de registroGradoData (pisaba la asignación)
// AHORA: cargarDatosGuardados() → inicializarGrado() (la asignación gana)
// ============================================
function inicializar() {
    construirMapas();
    actualizarAnioEscolar();
    setInterval(actualizarAnioEscolar, 60000);
    restaurarGradoDefault();

    // ✅ 1. PRIMERO: cargar datos generales guardados (base)
    cargarDatosGuardados();

    // ✅ 2. SEGUNDO: inicializar el grado seleccionado.
    // La asignación actual (URL / minerd_grado_actual) SOBREESCRIBE
    // los datos viejos cargados en el paso anterior.
    inicializarGrado();

    console.log('%c📚 Registro de Grado - Nivel Primario', 'font-size: 16px; font-weight: bold; color: #1a3a6b;');
    console.log('%c🇩🇴 Ministerio de Educación - República Dominicana', 'font-size: 12px; color: #555;');
    console.log('%c🔒 GRADO BLOQUEADO - Solo modificable desde el login', 'font-size: 12px; color: #dc3545;');
    console.log('%c🔒 SECCIÓN Y TANDA BLOQUEADAS - Solo el administrador las asigna', 'font-size: 12px; color: #dc3545;');
    console.log('%c📂 RUTA BASE DETECTADA: ' + RUTA_BASE, 'font-size: 12px; color: #FF6B6B;');
    console.log('%c✅ El botón Validar SIEMPRE es visible', 'font-size: 12px; color: #28a745;');
    console.log('%c🔄 Al editar un campo, se desbloquea automáticamente', 'font-size: 12px; color: #1a3a6b;');
    console.log('%c🔧 Mensaje de mantenimiento por admin listo', 'font-size: 12px; color: #ff6b6b;');

    setTimeout(() => {
        const totalCentros = Object.keys(mapaCentrosPorNombre).length;
        if (totalCentros > 0) {
            mostrarMensaje(`📋 ${totalCentros} centros educativos disponibles`, 'info');
        }
    }, 500);

    // Inicializar bloqueo de admin
    setTimeout(() => {
        const bloqueado = cargarEstadoBloqueo();
        aplicarBloqueoAdmin(bloqueado);
        console.log('🔓 Estado de bloqueo admin inicial:', bloqueado ? 'BLOQUEADO' : 'DESBLOQUEADO');

        window.addEventListener('configuracionCambiada', function(e) {
            if (e.detail && e.detail.bloqueoCampos !== undefined) {
                console.log('🔄 Cambio de configuración recibido:', e.detail.bloqueoCampos);
                aplicarBloqueoAdmin(e.detail.bloqueoCampos);
            }
        });

        window.addEventListener('storage', function(e) {
            if (e.key === 'minerd_bloqueo_campos') {
                try {
                    const datos = JSON.parse(e.newValue);
                    if (datos && datos.bloqueado !== undefined) {
                        console.log('🔄 Cambio detectado en otra pestaña:', datos.bloqueado);
                        aplicarBloqueoAdmin(datos.bloqueado);
                    }
                } catch (err) {
                    console.error('Error procesando storage event:', err);
                }
            }
        });

        let ultimoEstado = bloqueado;
        setInterval(() => {
            const nuevoEstado = cargarEstadoBloqueo();
            if (nuevoEstado !== ultimoEstado) {
                ultimoEstado = nuevoEstado;
                aplicarBloqueoAdmin(nuevoEstado);
                console.log('🔄 Estado actualizado por intervalo:', nuevoEstado ? 'BLOQUEADO' : 'DESBLOQUEADO');
            }
        }, 3000);
    }, 100);
}

// Ejecutar inicialización
inicializar();