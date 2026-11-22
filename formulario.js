// ======== FORMULARIO.js ========
// Script principal para el formulario de registro
// ✅ MODIFICADO: SOLO Nombre y Apellido son OBLIGATORIOS
// Los demás campos (parentesco, sexo, fecha, nacionalidad, emergencia, tutor) son OPCIONALES
// ✅ NUEVO: Reordenamiento ALFABÉTICO AUTOMÁTICO al agregar/eliminar/editar
// ✅ NUEVO: Elimina notas de evaluación al eliminar estudiante
// ✅ NUEVO: Emite evento para sincronizar con Registro-evalucion.js
// ✅ NUEVO: VALIDACIÓN DE EDAD POR GRADO con modal de advertencia
// ✅ NUEVO: NEAE como <select> con categorías oficiales (Migración incluida)
// ✅ NUEVO: Enfermedades y Medicamentos como CHECKLISTS (Migración incluida)
// ✅ NUEVO: Nivel de ESCOLARIDAD del tutor
// ✅ NUEVO: OCUPACIÓN u oficio del tutor
// ✅ FIX ANTIDUPLICADO: limpia y reconstruye claves de fila (evalNota_*/evalRec_*) al eliminar/reordenar

const FormularioSigerd = (function() {
    'use strict';

    // ======== VARIABLES PRIVADAS ========
    let datosParajeBarrio = null;
    let contadorOrden = 1;
    let registros = [];
    let modoEdicion = false;
    let indiceEdicion = -1;
    let busquedaActual = '';
    let ordenAZActivo = false;
    let fotoBase64Global = null;
    let fotoProcesadaGlobal = false;
    let fotoModificadaGlobal = false;
    let fotoNombreArchivoGlobal = null;
    let sistemaFotoInicializado = false;

    // ======== CONSTANTES ========
    const NACIONALIDAD_POR_DEFECTO = 'DOMINICANO/A';
    const NACIONALIDADES_PRINCIPALES = ['DOMINICANO/A', 'HAITIANO/A'];
    const NACIONALIDADES_RESTO = [
        'AFRICANO/A', 'ANTIGUANO/A', 'ARGENTINO/A', 'ASIÁTICO/A',
        'BAHAMEÑO/A', 'BARBADENSE', 'BELICEÑO/A', 'BOLIVIANO/A',
        'BRASILEÑO/A', 'CANADIENSE', 'CHILENO/A', 'COLOMBIANO/A',
        'COSTARRICENSE', 'CUBANO/A', 'DOMINIQUÉS/A', 'ECUATORIANO/A',
        'EUROPEO/A', 'GRANADINO/A', 'GUATEMALTECO/A', 'GUYANÉS/A',
        'HONDUREÑO/A', 'JAMAICANO/A', 'MEXICANO/A', 'NICARAGÜENSE',
        'OCEANIANO/A', 'OTRO', 'PANAMEÑO/A', 'PARAGUAYO/A',
        'PERUANO/A', 'SALVADOREÑO/A', 'SANCRISTOBALEÑO/A',
        'SANTALUCENSE/A', 'SANVICENTINO/A', 'SURINAMÉS/A',
        'TRINITARIO/A', 'URUGUAYO/A', 'VENEZOLANO/A'
    ];
    const NACIONALIDADES = [...NACIONALIDADES_PRINCIPALES, ...NACIONALIDADES_RESTO];
    const PARENTESCOS = [
        'PADRE', 'MADRE', 'TUTOR(A)', 'ABUELO(A)', 'HERMANO(A)',
        'TÍO(A)', 'PRIMO(A)', 'VECINO(A)', 'AMIGO(A)', 'ENCARGADO(A)', 'OTRO'
    ];

    const NEAE_VALORES_VALIDOS = [
        'VISUAL', 'AUDITIVA', 'FISICO-MOTORA', 'INTELECTUAL', 'ASOCIADA-OTRA',
        'APRENDIZAJE', 'SOCIOAFECTIVA', 'NO-ASOCIADA-OTRA'
    ];

    const ESCOLARIDAD_VALORES_VALIDOS = [
        'SIN ESCOLARIDAD',
        'PRIMARIA INCOMPLETA',
        'PRIMARIA COMPLETA',
        'SECUNDARIA INCOMPLETA',
        'SECUNDARIA COMPLETA',
        'SUPERIOR INCOMPLETO',
        'SUPERIOR COMPLETO',
        'DESCONOCIDO'
    ];

    const OCUPACION_VALORES_VALIDOS = [
        'MÉDICO', 'MÉDICA', 'MAESTRO', 'MAESTRA', 'OBRERO', 'OBRERA',
        'VASTENDER', 'HOTELERO', 'HOTELERA', 'ALBAÑIL',
        'INGENIERO', 'INGENIERA', 'AMA DE CASA', 'ESTUDIANTE',
        'ENFERMERO', 'ENFERMERA', 'MOTO TAXI', 'OTROS OFICIO'
    ];

    const EDADES_POR_GRADO = {
        1: { oficial: 6, min: 5, max: 7, nombre: '1er Grado' },
        2: { oficial: 7, min: 6, max: 8, nombre: '2do Grado' },
        3: { oficial: 8, min: 7, max: 9, nombre: '3er Grado' },
        4: { oficial: 9, min: 8, max: 10, nombre: '4to Grado' },
        5: { oficial: 10, min: 9, max: 11, nombre: '5to Grado' },
        6: { oficial: 11, min: 10, max: 12, nombre: '6to Grado' }
    };

    let edadConfirmada = false;
    let edadActualDetectada = null;

    let elementos = {};

    // ============================================
    // ✅ UTILIDADES
    // ============================================
    function esc(valor) {
        if (!valor && valor !== 0) return '';
        return String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function generarUID() {
        return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function esFechaValida(dia, mes, ano) {
        const d = parseInt(dia, 10);
        const m = parseInt(mes, 10);
        const a = parseInt(ano, 10);
        if (!d || !m || !a) return false;
        if (m < 1 || m > 12) return false;
        const ultimoDia = new Date(a, m, 0).getDate();
        return d >= 1 && d <= ultimoDia;
    }

    function obtenerFecha() {
        const now = new Date();
        const dia = String(now.getDate()).padStart(2, '0');
        const mes = String(now.getMonth() + 1).padStart(2, '0');
        const anio = now.getFullYear();
        const hora = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${anio} ${hora}:${min}`;
    }

    function obtenerCampo(item, campo) {
        if (!item || typeof item !== 'object') return '';
        const clave = Object.keys(item).find(k =>
            k.trim().toLowerCase() === campo.trim().toLowerCase()
        );
        return clave ? String(item[clave] || '').trim() : '';
    }

    function obtenerSeleccionTexto(select) {
        if (!select || select.selectedIndex <= 0) return '';
        return select.options[select.selectedIndex]?.text || '';
    }

    function normalizarTexto(texto) {
        if (!texto) return '';
        return texto
            .toUpperCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // ============================================
    // ✅ NEAE - NORMALIZACIÓN
    // ============================================
    function normalizarNEAE(valorGuardado) {
        const valor = String(valorGuardado || '').toUpperCase().trim();
        if (valor === '') return '';
        if (NEAE_VALORES_VALIDOS.includes(valor)) return valor;
        if (valor.includes('VISUAL') || valor.includes('CIEGO')) return 'VISUAL';
        if (valor.includes('AUDITIV') || valor.includes('SORDO')) return 'AUDITIVA';
        if (valor.includes('MOTORA') || valor.includes('FISIC')) return 'FISICO-MOTORA';
        if (valor.includes('INTELECTUAL') || valor.includes('COGNITIV')) return 'INTELECTUAL';
        if (valor.includes('APRENDIZAJE') || valor.includes('DISLEXIA') || valor.includes('DISCALCULIA')) return 'APRENDIZAJE';
        if (valor.includes('SOCIOAFECTIVA') || valor.includes('CONDUCTA') || valor.includes('EMOCIONAL')) return 'SOCIOAFECTIVA';
        if (valor.includes('NO ASOCIADA') || valor.includes('NO-ASOCIADA')) return 'NO-ASOCIADA-OTRA';
        return 'ASOCIADA-OTRA';
    }

    // ============================================
    // ✅ ESCOLARIDAD - NORMALIZACIÓN
    // ============================================
    function normalizarEscolaridad(valorGuardado) {
        const valor = String(valorGuardado || '').toUpperCase().trim();
        if (valor === '') return '';
        if (ESCOLARIDAD_VALORES_VALIDOS.includes(valor)) return valor;
        if (valor.includes('SIN') && valor.includes('ESCOLARIDAD')) return 'SIN ESCOLARIDAD';
        if (valor.includes('PRIMARIA') && valor.includes('INC')) return 'PRIMARIA INCOMPLETA';
        if (valor.includes('PRIMARIA') && valor.includes('COMP')) return 'PRIMARIA COMPLETA';
        if (valor.includes('SECUNDARIA') && valor.includes('INC')) return 'SECUNDARIA INCOMPLETA';
        if (valor.includes('SECUNDARIA') && valor.includes('COMP')) return 'SECUNDARIA COMPLETA';
        if (valor.includes('SUPERIOR') && valor.includes('INC')) return 'SUPERIOR INCOMPLETO';
        if (valor.includes('SUPERIOR') && valor.includes('COMP')) return 'SUPERIOR COMPLETO';
        if (valor.includes('DESCONOCIDO') || valor.includes('NO SE')) return 'DESCONOCIDO';
        return '';
    }

    // ============================================
    // ✅ OCUPACIÓN - NORMALIZACIÓN
    // ============================================
    function normalizarOcupacion(valorGuardado) {
        const valor = String(valorGuardado || '').toUpperCase().trim();
        if (valor === '') return '';
        if (OCUPACION_VALORES_VALIDOS.includes(valor)) return valor;
        if (valor.includes('MEDIC') || valor.includes('DOCTOR')) return valor.endsWith('A') ? 'MÉDICA' : 'MÉDICO';
        if (valor.includes('MAESTR') || valor.includes('PROFESOR') || valor.includes('DOCENTE')) return valor.endsWith('A') ? 'MAESTRA' : 'MAESTRO';
        if (valor.includes('OBRER')) return valor.endsWith('A') ? 'OBRERA' : 'OBRERO';
        if (valor.includes('INGENIER')) return valor.endsWith('A') ? 'INGENIERA' : 'INGENIERO';
        if (valor.includes('ENFERMER')) return valor.endsWith('A') ? 'ENFERMERA' : 'ENFERMERO';
        if (valor.includes('HOTELER')) return valor.endsWith('A') ? 'HOTELERA' : 'HOTELERO';
        if (valor.includes('AMA DE CASA')) return 'AMA DE CASA';
        if (valor.includes('ESTUDIANTE')) return 'ESTUDIANTE';
        if (valor.includes('VASTENDER')) return 'VASTENDER';
        if (valor.includes('ALBAÑIL') || valor.includes('ALBANIL')) return 'ALBAÑIL';
        if (valor.includes('MOTO') || valor.includes('TAXI')) return 'MOTO TAXI';
        return 'OTROS OFICIO';
    }

    // ============================================
    // ✅ CHECKLISTS DE SALUD
    // ============================================
    function obtenerValoresChecklist(tipo) {
        const checks = document.querySelectorAll(`input[data-tipo="${tipo}"]:checked`);
        const valores = [];
        checks.forEach(chk => {
            if (chk.value === 'OTRA') return;
            valores.push(chk.value);
        });
        const otraCheck = document.querySelector(`input[data-tipo="${tipo}"][value="OTRA"]`);
        const otraInput = tipo === 'enfermedad'
            ? elementos.enfermedadesOtra
            : elementos.medicamentosOtra;
        if (otraCheck && otraCheck.checked && otraInput) {
            const texto = otraInput.value.trim().toUpperCase();
            if (texto !== '') valores.push(texto);
            else valores.push('OTRA');
        }
        return valores.join(', ');
    }

    function aplicarValoresChecklist(tipo, valorGuardado) {
        document.querySelectorAll(`input[data-tipo="${tipo}"]`).forEach(chk => chk.checked = false);
        const otraInput = tipo === 'enfermedad'
            ? elementos.enfermedadesOtra
            : elementos.medicamentosOtra;
        if (otraInput) {
            otraInput.value = '';
            otraInput.style.display = 'none';
        }
        if (!valorGuardado || String(valorGuardado).trim() === '') return;
        const valores = String(valorGuardado).toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
        valores.forEach(val => {
            const match = Array.from(document.querySelectorAll(`input[data-tipo="${tipo}"]`))
                .find(chk => chk.value === val);
            if (match) {
                match.checked = true;
            } else {
                const otraCheck = document.querySelector(`input[data-tipo="${tipo}"][value="OTRA"]`);
                if (otraCheck) {
                    otraCheck.checked = true;
                    if (otraInput) {
                        if (otraInput.value.trim() !== '') {
                            otraInput.value = otraInput.value.trim() + ', ' + val;
                        } else {
                            otraInput.value = val;
                        }
                        otraInput.style.display = 'block';
                    }
                }
            }
        });
    }

    function inicializarChecklistsSalud() {
        if (elementos.checkEnfermedadOtra && elementos.enfermedadesOtra) {
            elementos.checkEnfermedadOtra.addEventListener('change', function() {
                elementos.enfermedadesOtra.style.display = this.checked ? 'block' : 'none';
                if (!this.checked) elementos.enfermedadesOtra.value = '';
                else elementos.enfermedadesOtra.focus();
            });
        }
        if (elementos.checkMedicamentoOtra && elementos.medicamentosOtra) {
            elementos.checkMedicamentoOtra.addEventListener('change', function() {
                elementos.medicamentosOtra.style.display = this.checked ? 'block' : 'none';
                if (!this.checked) elementos.medicamentosOtra.value = '';
                else elementos.medicamentosOtra.focus();
            });
        }
        if (elementos.enfermedadesOtra) formatearMayusculas(elementos.enfermedadesOtra);
        if (elementos.medicamentosOtra) formatearMayusculas(elementos.medicamentosOtra);
    }

    // ============================================
    // ✅ GESTIÓN DE GRUPO
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
            if (typeof AuthSystem !== 'undefined') {
                const sesion = AuthSystem.obtenerSesion();
                if (sesion && sesion.cedula) {
                    const gradoGuardado = AuthSystem.obtenerGradoSeleccionado(sesion.cedula);
                    if (gradoGuardado) return gradoGuardado;
                }
            }
            return null;
        } catch (e) {
            console.warn('⚠️ Error obteniendo grado:', e);
            return null;
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
            return null;
        } catch (e) { return null; }
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
            return null;
        } catch (e) { return null; }
    }

    function obtenerGrupoActual() {
        const grado = obtenerGradoDesdePortada();
        const seccion = obtenerSeccionDesdePortada();
        const tanda = obtenerTandaDesdePortada();
        return {
            grado: (grado || 'PRIMER GRADO').trim().toUpperCase(),
            seccion: (seccion || 'A').trim().toUpperCase(),
            tanda: (tanda || 'MATUTINA').trim().toUpperCase()
        };
    }

    function obtenerRegistrosFiltrados() {
        const grupo = obtenerGrupoActual();
        const gradoActual = grupo.grado;
        const seccionActual = grupo.seccion;
        const tandaActual = grupo.tanda;
        return registros.filter(r => {
            const gradoRegistro = (r.grado || '').trim().toUpperCase();
            const seccionRegistro = (r.seccion || '').trim().toUpperCase();
            const tandaRegistro = (r.tanda || '').trim().toUpperCase();
            if (!gradoRegistro) return false;
            return gradoRegistro === gradoActual &&
                   seccionRegistro === seccionActual &&
                   tandaRegistro === tandaActual;
        });
    }

    function convertirGradoANumero(gradoTexto) {
        if (!gradoTexto) return null;
        const normalizado = String(gradoTexto).toUpperCase().trim();
        const mapa = {
            'PRIMER GRADO': 1, 'SEGUNDO GRADO': 2, 'TERCER GRADO': 3,
            'CUARTO GRADO': 4, 'QUINTO GRADO': 5, 'SEXTO GRADO': 6,
            '1ER GRADO': 1, '2DO GRADO': 2, '3ER GRADO': 3,
            '4TO GRADO': 4, '5TO GRADO': 5, '6TO GRADO': 6,
            '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6
        };
        return mapa[normalizado] || null;
    }

    // ============================================
    // ✅ FIX ANTIDUPLICADO: Borra claves de fila (evalNota_*/evalRec_*)
    // del grupo actual. Se reconstruirán desde UID.
    // ============================================
    function borrarClavesDeFilaDelGrupo(gradoTexto, seccion) {
        const gradoNum = convertirGradoANumero(gradoTexto);
        if (!gradoNum) return 0;
        const prefijoNota = `evalNota_g${gradoNum}_s${seccion}_`;
        const prefijoRec = `evalRec_g${gradoNum}_s${seccion}_`;
        const claves = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith(prefijoNota) || key.startsWith(prefijoRec))) {
                claves.push(key);
            }
        }
        claves.forEach(k => localStorage.removeItem(k));
        return claves.length;
    }

    // ============================================
    // ✅ FIX ANTIDUPLICADO: Reconstruye claves de fila desde UID
    // Se llama después de reasignar órdenes.
    // ============================================
    function reconstruirClavesDeFilaDesdeUID() {
        try {
            const grupo = obtenerGrupoActual();
            const gradoNum = convertirGradoANumero(grupo.grado);
            if (!gradoNum) return;
            // 1. Borrar TODAS las claves de fila del grupo
            borrarClavesDeFilaDelGrupo(grupo.grado, grupo.seccion);
            // 2. Reescribir desde las claves UID de cada estudiante
            const registrosFiltrados = obtenerRegistrosFiltrados();
            registrosFiltrados.forEach(reg => {
                if (!reg.uid) return;
                const ordenActual = parseInt(reg.orden);
                if (!ordenActual) return;
                const prefijoUID = `nota_${reg.uid}_`;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (!key || !key.startsWith(prefijoUID)) continue;
                    const valor = localStorage.getItem(key);
                    if (valor === null || valor === '') continue;
                    const resto = key.substring(prefijoUID.length); // mXcYpZ / mXcYrpZ / mXrec_final
                    const match = resto.match(/^m(\d+)c(\d+)(rp?\d+|rec_final)$/);
                    if (!match) continue;
                    const materia = parseInt(match[1]);
                    const comp = parseInt(match[2]);
                    const sufijo = match[3];
                    let nuevaKey;
                    if (sufijo === 'rec_final') {
                        nuevaKey = `evalRec_g${gradoNum}_s${grupo.seccion}_m${materia}_r${ordenActual}`;
                    } else {
                        nuevaKey = `evalNota_g${gradoNum}_s${grupo.seccion}_m${materia}_r${ordenActual}_c${comp}_${sufijo}`;
                    }
                    localStorage.setItem(nuevaKey, valor);
                }
            });
        } catch (e) {
            console.error('❌ Error reconstruyendo claves de fila:', e);
        }
    }

    function estaOrdenadoAlfabeticamente() {
        const filtrados = obtenerRegistrosFiltrados();
        if (filtrados.length < 2) return true;
        const copia = [...filtrados].sort((a, b) => {
            const nombreA = `${(a.nombre || '').toUpperCase()} ${(a.apellido || '').toUpperCase()}`.trim();
            const nombreB = `${(b.nombre || '').toUpperCase()} ${(b.apellido || '').toUpperCase()}`.trim();
            return nombreA.localeCompare(nombreB, 'es');
        });
        for (let i = 0; i < filtrados.length; i++) {
            const actual = filtrados[i];
            const ordenado = copia[i];
            const uidActual = actual.uid || `${actual.nombre}|${actual.apellido}|${actual.id}`;
            const uidOrdenado = ordenado.uid || `${ordenado.nombre}|${ordenado.apellido}|${ordenado.id}`;
            if (uidActual !== uidOrdenado) return false;
        }
        return true;
    }

    function actualizarBotonOrdenarAZ() {
        if (!elementos.btnOrdenarAZ) return;
        const filtrados = obtenerRegistrosFiltrados();
        if (filtrados.length === 0) {
            elementos.btnOrdenarAZ.disabled = false;
            elementos.btnOrdenarAZ.classList.remove('activo');
            elementos.btnOrdenarAZ.textContent = '🔤 Ordenar A-Z (Nombre)';
            return;
        }
        const yaOrdenado = estaOrdenadoAlfabeticamente();
        if (yaOrdenado && ordenAZActivo) {
            elementos.btnOrdenarAZ.disabled = true;
            elementos.btnOrdenarAZ.classList.add('activo');
            elementos.btnOrdenarAZ.textContent = '✅ Ordenado A-Z';
        } else {
            elementos.btnOrdenarAZ.disabled = false;
            elementos.btnOrdenarAZ.classList.remove('activo');
            elementos.btnOrdenarAZ.textContent = '🔤 Ordenar A-Z (Nombre)';
        }
    }

    function actualizarBadges() {
        const grupo = obtenerGrupoActual();
        const badgeGrado = document.getElementById('gradoMostrado');
        const badgeSeccion = document.getElementById('seccionMostrado');
        const badgeTanda = document.getElementById('tandaMostrado');
        if (badgeGrado) badgeGrado.textContent = grupo.grado;
        if (badgeSeccion) badgeSeccion.textContent = grupo.seccion;
        if (badgeTanda) badgeTanda.textContent = grupo.tanda;
    }

    function normalizarNacionalidad(valor) {
        if (!valor) return NACIONALIDAD_POR_DEFECTO;
        const nac = valor.trim().toUpperCase();
        if (NACIONALIDADES.includes(nac)) return nac;
        const encontradaExacta = NACIONALIDADES.find(n => n.toUpperCase() === nac);
        if (encontradaExacta) return encontradaExacta;
        const conSufijo = nac + '/A';
        if (NACIONALIDADES.includes(conSufijo)) return conSufijo;
        if (nac.endsWith('/A')) {
            const sinSufijo = nac.slice(0, -2);
            if (NACIONALIDADES.includes(sinSufijo)) return sinSufijo;
        }
        const nacNorm = normalizarTexto(nac);
        const encontradaParcial = NACIONALIDADES.find(n =>
            normalizarTexto(n).includes(nacNorm) ||
            nacNorm.includes(normalizarTexto(n))
        );
        if (encontradaParcial) return encontradaParcial;
        return NACIONALIDAD_POR_DEFECTO;
    }

    function aplicarNacionalidad(valorGuardado) {
        const nacGuardada = (valorGuardado || '').trim();
        const opciones = elementos.nacionalidadSelect.options;
        for (let i = 0; i < opciones.length; i++) {
            if (opciones[i].value === nacGuardada) {
                elementos.nacionalidadSelect.selectedIndex = i;
                return true;
            }
        }
        const nacNorm = normalizarTexto(nacGuardada);
        for (let i = 0; i < opciones.length; i++) {
            const optText = normalizarTexto(opciones[i].text);
            const optVal = normalizarTexto(opciones[i].value);
            if (optText === nacNorm || optVal === nacNorm) {
                elementos.nacionalidadSelect.selectedIndex = i;
                return true;
            }
        }
        const norm = normalizarNacionalidad(nacGuardada);
        for (let i = 0; i < opciones.length; i++) {
            if (opciones[i].value === norm) {
                elementos.nacionalidadSelect.selectedIndex = i;
                return true;
            }
        }
        elementos.nacionalidadSelect.selectedIndex = 1;
        return false;
    }

    function validarIDEnTiempoReal() {
        const id = elementos.idInput.value.trim();
        const grupo = obtenerGrupoActual();
        if (id === '') {
            limpiarValidacionID();
            return true;
        }
        if (!/^\d+$/.test(id)) {
            mostrarErrorID('❌ Solo se permiten dígitos numéricos', 'Solo números');
            return false;
        }
        if (id.length < 6 || id.length > 8) {
            const msg = id.length < 6 ?
                `❌ Mínimo 6 dígitos (actual: ${id.length})` :
                `❌ Máximo 8 dígitos (actual: ${id.length})`;
            mostrarErrorID(`❌ El ID debe tener entre 6 y 8 dígitos (actual: ${id.length})`, msg);
            return false;
        }
        const idDuplicado = registros.some((r, idx) => {
            if (idx === indiceEdicion) return false;
            const rGrupo = obtenerGrupoActualRegistro(r);
            return r.id === id &&
                   rGrupo.grado === grupo.grado &&
                   rGrupo.seccion === grupo.seccion &&
                   rGrupo.tanda === grupo.tanda;
        });
        if (idDuplicado) {
            mostrarErrorID(`❌ El ID "${id}" ya está registrado en este grupo.`, `❌ ID duplicado: "${id}"`);
            return false;
        }
        mostrarExitoID();
        return true;
    }

    function obtenerGrupoActualRegistro(registro) {
        return {
            grado: (registro.grado || '').trim().toUpperCase(),
            seccion: (registro.seccion || '').trim().toUpperCase(),
            tanda: (registro.tanda || '').trim().toUpperCase()
        };
    }

    function mostrarErrorID(errorMsg, hintMsg) {
        const input = elementos.idInput;
        input.classList.add('error');
        input.classList.remove('valido');
        input.style.borderColor = '#b33c3c';
        input.style.boxShadow = '0 0 0 4px rgba(179, 60, 60, 0.12)';
        elementos.idError.textContent = errorMsg;
        elementos.idError.style.display = 'block';
        elementos.idHint.style.color = '#b33c3c';
        elementos.idHint.textContent = hintMsg;
        input.setCustomValidity('Error en ID');
        input.title = errorMsg;
    }

    function mostrarExitoID() {
        const input = elementos.idInput;
        input.classList.remove('error');
        input.classList.add('valido');
        input.style.borderColor = '#28a745';
        input.style.boxShadow = '0 0 0 4px rgba(40, 167, 69, 0.15)';
        elementos.idError.style.display = 'none';
        elementos.idError.textContent = '';
        elementos.idHint.style.color = '#28a745';
        elementos.idHint.textContent = '✅ ID válido';
        input.setCustomValidity('');
        input.title = '';
    }

    function limpiarValidacionID() {
        const input = elementos.idInput;
        input.classList.remove('error', 'valido');
        input.style.borderColor = '#d3e0ea';
        input.style.boxShadow = 'none';
        elementos.idError.style.display = 'none';
        elementos.idError.textContent = '';
        elementos.idHint.style.color = '#4c7a94';
        elementos.idHint.textContent = '6 a 8 dígitos numéricos (opcional)';
        input.setCustomValidity('');
        input.title = '';
    }

    function verificarIDValido() {
        const id = elementos.idInput.value.trim();
        if (id === '') {
            limpiarValidacionID();
            return true;
        }
        const valido = validarIDEnTiempoReal();
        if (!valido) elementos.idInput.focus();
        return valido;
    }

    function validarTelefono(valor) {
        const limpio = valor.replace(/\D/g, '');
        if (limpio.length === 0) return { valido: true };
        if (limpio.length !== 10) {
            return { valido: false, mensaje: 'El teléfono debe tener 10 dígitos' };
        }
        const prefijo = limpio.slice(0, 3);
        if (!['809', '829', '849'].includes(prefijo)) {
            return { valido: false, mensaje: 'El teléfono debe comenzar con 809, 829 o 849' };
        }
        return { valido: true };
    }

    function validarCedula(valor) {
        const limpio = valor.replace(/\D/g, '');
        if (limpio.length === 0) return { valido: true };
        if (limpio.length !== 11) {
            return { valido: false, mensaje: 'La cédula debe tener 11 dígitos (formato: 000-0000000-0)' };
        }
        return { valido: true };
    }

    // ============================================
    // ✅ VALIDACIÓN MODIFICADA: SOLO Nombre y Apellido obligatorios
    // Los demás campos son opcionales (solo se validan formatos si tienen valor)
    // ============================================
    function validarFormularioCompleto() {
        // ID: opcional, pero si tiene valor debe ser válido
        if (elementos.idInput.value.trim() !== '') {
            if (!verificarIDValido()) return false;
        }

        // ✅ NOMBRE - OBLIGATORIO
        const nombre = elementos.nombreInput.value.trim();
        if (!nombre) {
            mostrarMensaje('❌ El campo "Nombre" es obligatorio.', 'error');
            elementos.nombreInput.focus();
            return false;
        }

        // ✅ APELLIDO - OBLIGATORIO
        const apellido = elementos.apellidoInput.value.trim();
        if (!apellido) {
            mostrarMensaje('❌ El campo "Apellido" es obligatorio.', 'error');
            elementos.apellidoInput.focus();
            return false;
        }

        // ============================================
        // ⬇️ A PARTIR DE AQUÍ TODOS LOS CAMPOS SON OPCIONALES
        // Solo se validan formatos SI el usuario ingresó algún valor
        // ============================================

        // Teléfono del estudiante: opcional, pero si tiene valor debe ser válido
        const telEstudiante = validarTelefono(elementos.telefonoInput.value);
        if (!telEstudiante.valido) {
            mostrarMensaje(`❌ Teléfono del estudiante: ${telEstudiante.mensaje}`, 'error');
            elementos.telefonoInput.focus();
            return false;
        }

        // Teléfono de emergencia: opcional, pero si tiene valor debe ser válido
        const emergenciaTelefono = elementos.emergenciaTelefonoInput.value.trim();
        if (emergenciaTelefono !== '') {
            const telEmergencia = validarTelefono(emergenciaTelefono);
            if (!telEmergencia.valido) {
                mostrarMensaje(`❌ Teléfono de emergencia: ${telEmergencia.mensaje}`, 'error');
                elementos.emergenciaTelefonoInput.focus();
                return false;
            }
        }

        // Teléfono del tutor: opcional, pero si tiene valor debe ser válido
        const tutorTelefono = elementos.tutorTelefono.value.trim();
        if (tutorTelefono !== '') {
            const telTutor = validarTelefono(tutorTelefono);
            if (!telTutor.valido) {
                mostrarMensaje(`❌ Teléfono del tutor: ${telTutor.mensaje}`, 'error');
                elementos.tutorTelefono.focus();
                return false;
            }
        }

        // Cédula del tutor: opcional, pero si tiene valor debe ser válida
        const cedula = validarCedula(elementos.tutorCedula.value);
        if (!cedula.valido) {
            mostrarMensaje(`❌ ${cedula.mensaje}`, 'error');
            elementos.tutorCedula.focus();
            return false;
        }

        // Fecha de nacimiento: opcional, pero si se ingresó algún componente debe ser fecha válida completa
        const diaNac = elementos.diaNacimiento.value;
        const mesNac = elementos.mesNacimiento.value;
        const anoNac = elementos.anoNacimiento.value;
        const algunComponenteFecha = diaNac || mesNac || anoNac;
        if (algunComponenteFecha) {
            if (!esFechaValida(diaNac, mesNac, anoNac)) {
                mostrarMensaje('❌ La fecha de nacimiento está incompleta o no es válida.', 'error');
                return false;
            }
        }

        return true;
    }

    function reasignarOrdenes() {
        const filtrados = obtenerRegistrosFiltrados();
        if (filtrados.length === 0) return;
        filtrados.sort((a, b) => {
            const nombreA = `${(a.nombre || '').toUpperCase()} ${(a.apellido || '').toUpperCase()}`.trim();
            const nombreB = `${(b.nombre || '').toUpperCase()} ${(b.apellido || '').toUpperCase()}`.trim();
            return nombreA.localeCompare(nombreB, 'es');
        });
        filtrados.forEach((registro, idx) => {
            registro.orden = (idx + 1).toString();
        });
    }

    function actualizarContadorOrden() {
        const registrosFiltrados = obtenerRegistrosFiltrados();
        if (registrosFiltrados.length === 0) {
            contadorOrden = 1;
        } else {
            const maxOrden = Math.max(...registrosFiltrados.map(r => parseInt(r.orden) || 0));
            contadorOrden = maxOrden + 1;
        }
        try { localStorage.setItem('ordenCounter', contadorOrden.toString()); } catch (e) {}
        elementos.ordenInput.value = contadorOrden;
    }

    function guardarEstadoOrden() {
        try { localStorage.setItem('ordenAZActivo', JSON.stringify(ordenAZActivo)); } catch (e) {}
    }

    function cargarEstadoOrden() {
        try {
            const stored = localStorage.getItem('ordenAZActivo');
            if (stored !== null) ordenAZActivo = JSON.parse(stored);
        } catch (e) {}
        actualizarBotonOrdenarAZ();
        return ordenAZActivo;
    }

    function cargarRegistrosDesdeStorage() {
        try {
            const stored = localStorage.getItem('registrosSigerd');
            if (stored) {
                registros = JSON.parse(stored);
                if (!Array.isArray(registros)) registros = [];
            } else {
                registros = [];
            }
        } catch (e) {
            console.error('❌ Error cargando registros:', e);
            registros = [];
        }
        let migrado = false;
        registros.forEach(reg => {
            if (!reg.uid) {
                reg.uid = generarUID();
                migrado = true;
            }
            if (reg.neae !== undefined && reg.neae !== null) {
                const neaeNorm = normalizarNEAE(reg.neae);
                if (neaeNorm !== reg.neae) { reg.neae = neaeNorm; migrado = true; }
            }
            if (reg.enfermedades !== undefined && typeof reg.enfermedades === 'string') {
                const norm = reg.enfermedades.toUpperCase().trim();
                if (norm !== reg.enfermedades) { reg.enfermedades = norm; migrado = true; }
            }
            if (reg.medicamentos !== undefined && typeof reg.medicamentos === 'string') {
                const norm = reg.medicamentos.toUpperCase().trim();
                if (norm !== reg.medicamentos) { reg.medicamentos = norm; migrado = true; }
            }
            if (reg.tutorEscolaridad !== undefined && reg.tutorEscolaridad !== null && reg.tutorEscolaridad !== '') {
                const escNorm = normalizarEscolaridad(reg.tutorEscolaridad);
                if (escNorm !== reg.tutorEscolaridad) { reg.tutorEscolaridad = escNorm; migrado = true; }
            }
            if (reg.tutorOcupacion !== undefined && reg.tutorOcupacion !== null && reg.tutorOcupacion !== '') {
                const ocuNorm = normalizarOcupacion(reg.tutorOcupacion);
                if (ocuNorm !== reg.tutorOcupacion) { reg.tutorOcupacion = ocuNorm; migrado = true; }
            }
        });
        if (migrado) console.log('🔄 Migración aplicada');
        if (registros.length > 0) {
            reasignarOrdenes();
            guardarRegistrosEnStorage();
        } else {
            contadorOrden = 1;
            try { localStorage.setItem('ordenCounter', contadorOrden.toString()); } catch (e) {}
            elementos.ordenInput.value = contadorOrden;
        }
        actualizarContadorOrden();
        cargarEstadoOrden();
        renderizarTabla();
    }

    function guardarRegistrosEnStorage() {
        try {
            localStorage.setItem('registrosSigerd', JSON.stringify(registros));
        } catch (e) {
            console.error('❌ Error guardando registros:', e);
            mostrarMensaje('❌ Error al guardar los registros. El almacenamiento podría estar lleno.', 'error');
            return;
        }
        renderizarTabla();
        actualizarContadorOrden();
        actualizarBotonOrdenarAZ();
    }

    function eliminarNotasDeEstudiante(uid) {
        if (!uid) return 0;
        let eliminadas = 0;
        try {
            const claves = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                if (key.startsWith(`nota_${uid}_`)) claves.push(key);
                if (key.startsWith(`att_${uid}_`)) claves.push(key);
                if (key === `situacion_${uid}`) claves.push(key);
                if (key === `obs_general_${uid}`) claves.push(key);
                if (key.startsWith(`obs_${uid}_`)) claves.push(key);
                if (key === `acta_obs_${uid}`) claves.push(key);
                if (key === `foto_${uid}`) claves.push(key);
            }
            claves.forEach(k => { localStorage.removeItem(k); eliminadas++; });
        } catch (e) {}
        return eliminadas;
    }

    function eliminarRegistro(index) {
        if (index < 0 || index >= registros.length) return;
        const reg = registros[index];
        const nombreCompleto = `${reg.nombre || ''} ${reg.apellido || ''}`.trim() || 'Sin nombre';
        if (confirm(`¿Estás seguro de que deseas eliminar el registro #${reg.orden} - ${nombreCompleto}?`)) {
            const uidEliminado = reg.uid;
            const grupoEliminado = {
                grado: (reg.grado || '').trim(),
                seccion: (reg.seccion || '').trim()
            };
            if (uidEliminado) {
                eliminarFotoAlEliminar(uidEliminado);
                eliminarNotasDeEstudiante(uidEliminado);
            }
            // ✅ FIX ANTIDUPLICADO: borrar claves de fila del grupo y reconstruir desde UID
            borrarClavesDeFilaDelGrupo(grupoEliminado.grado, grupoEliminado.seccion);
            registros.splice(index, 1);
            reasignarOrdenes();
            reconstruirClavesDeFilaDesdeUID();
            guardarRegistrosEnStorage();
            if (modoEdicion && indiceEdicion === index) {
                cancelarEdicion();
            } else if (modoEdicion && indiceEdicion > index) {
                indiceEdicion--;
            }
            actualizarContadorOrden();
            actualizarBotonOrdenarAZ();
            emitirEventoActualizacion();
            mostrarMensaje(`✅ Registro #${reg.orden} eliminado exitosamente.`, 'success');
        }
    }

    function limpiarHistorial() {
        if (registros.length === 0) {
            mostrarMensaje('No hay registros para eliminar.', 'info');
            return;
        }
        if (confirm('¿Estás seguro de que deseas eliminar TODOS los registros del historial?')) {
            registros.forEach(reg => {
                if (reg.uid) {
                    eliminarFotoAlEliminar(reg.uid);
                    eliminarNotasDeEstudiante(reg.uid);
                }
            });
            // ✅ FIX ANTIDUPLICADO: borrar TODAS las claves de fila
            const clavesFila = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('evalNota_') || key.startsWith('evalRec_'))) {
                    clavesFila.push(key);
                }
            }
            clavesFila.forEach(k => localStorage.removeItem(k));
            registros = [];
            guardarRegistrosEnStorage();
            contadorOrden = 1;
            try { localStorage.setItem('ordenCounter', contadorOrden.toString()); } catch (e) {}
            elementos.ordenInput.value = contadorOrden;
            ordenAZActivo = false;
            guardarEstadoOrden();
            if (elementos.btnOrdenarAZ) {
                elementos.btnOrdenarAZ.classList.remove('activo');
                elementos.btnOrdenarAZ.disabled = false;
                elementos.btnOrdenarAZ.textContent = '🔤 Ordenar A-Z (Nombre)';
                elementos.btnOrdenarAZ.title = '';
            }
            renderizarTabla();
            emitirEventoActualizacion();
            mostrarMensaje('✅ Historial eliminado completamente.', 'success');
        }
    }

    // ============================================
    // ✅ RENDERIZADO DE TABLA (ORDEN VERIFICADO)
    // ============================================
    function renderizarTabla() {
        const registrosFiltrados = obtenerRegistrosFiltrados();
        if (registrosFiltrados.length === 0) {
            elementos.totalRegistros.textContent = 'Total: 0 registros';
            const mensaje = 'No hay registros para este grado, sección y tanda';
            elementos.tablaBody.innerHTML = `<tr class="fila-vacia"><td colspan="37">${mensaje}</td></tr>`;
            actualizarContadorOrden();
            actualizarBotonOrdenarAZ();
            return;
        }
        elementos.totalRegistros.textContent = `Total: ${registrosFiltrados.length} registros`;
        elementos.tablaBody.innerHTML = '';
        let registrosMostrar = [...registrosFiltrados];
        if (ordenAZActivo) {
            registrosMostrar.sort((a, b) => {
                const nombreA = `${(a.nombre || '').toUpperCase()} ${(a.apellido || '').toUpperCase()}`.trim();
                const nombreB = `${(b.nombre || '').toUpperCase()} ${(b.apellido || '').toUpperCase()}`.trim();
                return nombreA.localeCompare(nombreB, 'es');
            });
        } else {
            registrosMostrar.sort((a, b) => (parseInt(a.orden) || 0) - (parseInt(b.orden) || 0));
        }
        registrosMostrar.forEach((reg, posicionVisual) => {
            const tr = document.createElement('tr');
            const idxReal = registros.indexOf(reg);
            tr.dataset.idx = idxReal;
            const miniaturaFoto = obtenerMiniaturaFoto(reg.uid, reg.nombre, reg.apellido);
            const miniaturaHTML = miniaturaFoto.outerHTML;
            const nuevoInscrito = reg.nuevoInscrito || '-';
            const retirado = reg.retirado || '-';
            const condicion = reg.condicion || '-';
            const preprimario = reg.preprimario || '-';

            tr.innerHTML = `
                <td><strong>${posicionVisual + 1}</strong></td>
                <td>${esc(reg.id)}</td>
                <td>${miniaturaHTML}</td>
                <td>${esc(reg.nombre)}</td>
                <td>${esc(reg.apellido)}</td>
                <td>${esc(reg.grado)}</td>
                <td>${esc(reg.seccion)}</td>
                <td>${esc(reg.tanda)}</td>
                <td>${esc(reg.nacionalidad)}</td>
                <td>${esc(reg.parentesco)}</td>
                <td>${esc(reg.sexo)}</td>
                <td>${esc(reg.fechaNac)}</td>
                <td>${esc(reg.edad)}</td>
                <td>${esc(reg.libro)}</td>
                <td>${esc(reg.folio)}</td>
                <td>${esc(reg.direccion)}</td>
                <td>${esc(reg.provincia)}</td>
                <td>${esc(reg.municipio)}</td>
                <td>${esc(reg.barrio)}</td>
                <td>${esc(reg.telefono)}</td>
                <td>${nuevoInscrito}</td>
                <td>${retirado}</td>
                <td>${condicion}</td>
                <td>${preprimario}</td>
                <td>${esc(reg.neae)}</td>
                <td>${esc(reg.enfermedades)}</td>
                <td>${esc(reg.medicamentos)}</td>
                <td>${esc(reg.emergenciaNombre)}</td>
                <td>${esc(reg.emergenciaTelefono)}</td>
                <td>${esc(reg.tutorTipo)}</td>
                <td>${esc(reg.tutorCedula)}</td>
                <td>${esc(reg.tutorTelefono)}</td>
                <td>${esc(reg.tutorDireccion)}</td>
                <td>${esc(reg.tutorEscolaridad || '-')}</td>
                <td>${esc(reg.tutorOcupacion || '-')}</td>
                <td style="font-size:0.65rem;color:#6b8a9e;">${esc(reg.fecha)}</td>
                <td>
                    <button type="button" class="btn-eliminar-fila" data-idx="${idxReal}" title="Eliminar este registro">🗑️</button>
                </td>
            `;
            tr.addEventListener('click', function(e) {
                if (e.target.closest('.btn-eliminar-fila')) return;
                const idx = parseInt(this.dataset.idx);
                if (!isNaN(idx) && idx >= 0 && idx < registros.length) {
                    cargarRegistroParaEditar(idx);
                }
            });
            const btnEliminar = tr.querySelector('.btn-eliminar-fila');
            btnEliminar.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.dataset.idx);
                if (!isNaN(idx) && idx >= 0 && idx < registros.length) {
                    eliminarRegistro(idx);
                }
            });
            elementos.tablaBody.appendChild(tr);
        });
        actualizarContadorOrden();
        actualizarBotonOrdenarAZ();
    }

    function cargarRegistroParaEditar(index) {
        if (index < 0 || index >= registros.length) return;
        const reg = registros[index];
        modoEdicion = true;
        indiceEdicion = index;
        elementos.ordenInput.value = reg.orden;
        elementos.idInput.value = reg.id || '';
        elementos.nombreInput.value = reg.nombre || '';
        elementos.apellidoInput.value = reg.apellido || '';
        aplicarNacionalidad(reg.nacionalidad);
        elementos.parentescoSelect.value = reg.parentesco || '';
        if (reg.sexo === 'FEMENINO') {
            elementos.sexoFemenino.checked = true;
            elementos.sexoMasculino.checked = false;
        } else if (reg.sexo === 'MASCULINO') {
            elementos.sexoFemenino.checked = false;
            elementos.sexoMasculino.checked = true;
        } else {
            elementos.sexoFemenino.checked = false;
            elementos.sexoMasculino.checked = false;
        }
        elementos.telefonoInput.value = reg.telefono || '';
        elementos.direccionEstudianteInput.value = reg.direccion || '';
        elementos.tutorTipo.value = reg.tutorTipo || '';
        elementos.tutorCedula.value = reg.tutorCedula || '';
        elementos.tutorDireccion.value = reg.tutorDireccion || '';
        elementos.tutorTelefono.value = reg.tutorTelefono || '';
        if (elementos.tutorEscolaridad) {
            const escNorm = normalizarEscolaridad(reg.tutorEscolaridad);
            elementos.tutorEscolaridad.value = escNorm || '';
        }
        if (elementos.tutorOcupacion) {
            const ocuNorm = normalizarOcupacion(reg.tutorOcupacion);
            elementos.tutorOcupacion.value = ocuNorm || '';
        }
        elementos.libroInput.value = reg.libro || '';
        elementos.folioInput.value = reg.folio || '';

        if (elementos.neaeInput) {
            const neaeNorm = normalizarNEAE(reg.neae);
            elementos.neaeInput.value = neaeNorm || '';
            const existe = Array.from(elementos.neaeInput.options).some(opt => opt.value === neaeNorm);
            if (!existe && neaeNorm !== '') {
                elementos.neaeInput.value = '';
            }
        }

        aplicarValoresChecklist('enfermedad', reg.enfermedades);
        aplicarValoresChecklist('medicamento', reg.medicamentos);

        elementos.emergenciaNombreInput.value = reg.emergenciaNombre || '';
        elementos.emergenciaTelefonoInput.value = reg.emergenciaTelefono || '';
        elementos.nuevoDiaSelect.value = reg.nuevoDia || '';
        elementos.nuevoMesSelect.value = reg.nuevoMes || '';
        elementos.nuevoAnioSelect.value = reg.nuevoAnio || '';
        elementos.retiradoDiaSelect.value = reg.retiradoDia || '';
        elementos.retiradoMesSelect.value = reg.retiradoMes || '';
        elementos.retiradoAnioSelect.value = reg.retiradoAnio || '';
        document.querySelectorAll('input[name="condicion"]').forEach(cb => {
            cb.checked = (cb.value === reg.condicion);
        });
        document.querySelectorAll('input[name="preprimario"]').forEach(cb => {
            cb.checked = (cb.value === reg.preprimario);
        });
        if (reg.fechaNac) {
            const partes = reg.fechaNac.split('/');
            if (partes.length === 3) {
                elementos.diaNacimiento.value = partes[0];
                elementos.mesNacimiento.value = String(parseInt(partes[1], 10));
                elementos.anoNacimiento.value = parseInt(partes[2], 10);
                calcularEdad();
            }
        }
        if (reg.provincia) {
            elementos.provinciaSelect.value = reg.provincia;
            cargarMunicipios(reg.provincia);
            setTimeout(() => {
                if (reg.municipio) {
                    elementos.municipioSelect.value = reg.municipio;
                    cargarBarrios(reg.municipio);
                    setTimeout(() => {
                        if (reg.barrio) elementos.barrioSelect.value = reg.barrio;
                    }, 50);
                }
            }, 50);
        }
        if (reg.uid) cargarFotoAlEditar(reg.uid);
        const container = document.querySelector('.form-container');
        if (container) container.classList.add('modo-edicion');
        elementos.btnGuardar.style.display = 'none';
        elementos.btnActualizar.style.display = 'inline-flex';
        elementos.btnCancelarEdicion.style.display = 'inline-flex';
        mostrarFormulario();
        setTimeout(() => aplicarNacionalidad(reg.nacionalidad), 100);
        setTimeout(() => aplicarNacionalidad(reg.nacionalidad), 400);
        document.querySelectorAll('#tablaBody tr').forEach(tr => {
            tr.classList.remove('seleccionado');
            if (parseInt(tr.dataset.idx) === index) tr.classList.add('seleccionado');
        });
        setTimeout(validarIDEnTiempoReal, 100);
    }

    function cancelarEdicion() {
        modoEdicion = false;
        indiceEdicion = -1;
        const container = document.querySelector('.form-container');
        if (container) container.classList.remove('modo-edicion');
        elementos.btnGuardar.style.display = 'inline-flex';
        elementos.btnActualizar.style.display = 'none';
        elementos.btnCancelarEdicion.style.display = 'none';
        limpiarFormulario();
        limpiarValidacionID();
        elementos.sexoFemenino.checked = false;
        elementos.sexoMasculino.checked = false;
        document.querySelectorAll('input[name="condicion"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('input[name="preprimario"]').forEach(cb => cb.checked = false);
        actualizarContadorOrden();
        document.querySelectorAll('#tablaBody tr').forEach(tr => tr.classList.remove('seleccionado'));
    }

    function construirObjetoRegistro() {
        const grupo = obtenerGrupoActual();
        const sexo = elementos.sexoFemenino.checked ? 'FEMENINO' :
                     elementos.sexoMasculino.checked ? 'MASCULINO' : '';
        const diaNac = elementos.diaNacimiento.value;
        const mesNac = elementos.mesNacimiento.value;
        const anoNac = elementos.anoNacimiento.value;
        const fechaNac = (diaNac && mesNac && anoNac)
            ? `${diaNac}/${String(parseInt(mesNac, 10)).padStart(2, '0')}/${anoNac}`
            : '';
        let condicion = '';
        document.querySelectorAll('input[name="condicion"]').forEach(cb => {
            if (cb.checked) condicion = cb.value;
        });
        let preprimario = '';
        document.querySelectorAll('input[name="preprimario"]').forEach(cb => {
            if (cb.checked) preprimario = cb.value;
        });
        const nuevoDia = elementos.nuevoDiaSelect.value || '';
        const nuevoMes = elementos.nuevoMesSelect.value || '';
        const nuevoAnio = elementos.nuevoAnioSelect.value || '';
        const retiradoDia = elementos.retiradoDiaSelect.value || '';
        const retiradoMes = elementos.retiradoMesSelect.value || '';
        const retiradoAnio = elementos.retiradoAnioSelect.value || '';
        const nuevoInscrito = (nuevoDia && nuevoMes && nuevoAnio) ?
            `${nuevoDia}/${nuevoMes}/${nuevoAnio}` : '';
        const retirado = (retiradoDia && retiradoMes && retiradoAnio) ?
            `${retiradoDia}/${retiradoMes}/${retiradoAnio}` : '';
        return {
            id: elementos.idInput.value.trim(),
            grado: grupo.grado,
            seccion: grupo.seccion,
            tanda: grupo.tanda,
            aceptaEdad: edadConfirmada,
            edadDetectada: edadActualDetectada ? edadActualDetectada.edad : null,
            nombre: elementos.nombreInput.value.trim().toUpperCase(),
            apellido: elementos.apellidoInput.value.trim().toUpperCase(),
            nacionalidad: elementos.nacionalidadSelect.value,
            sexo: sexo,
            parentesco: elementos.parentescoSelect.value,
            fechaNac: fechaNac,
            edad: elementos.edadInput.value,
            direccion: elementos.direccionEstudianteInput.value.trim().toUpperCase(),
            provincia: obtenerSeleccionTexto(elementos.provinciaSelect),
            municipio: obtenerSeleccionTexto(elementos.municipioSelect),
            barrio: obtenerSeleccionTexto(elementos.barrioSelect),
            telefono: elementos.telefonoInput.value,
            tutorTipo: elementos.tutorTipo.value.trim().toUpperCase(),
            tutorCedula: elementos.tutorCedula.value,
            tutorDireccion: elementos.tutorDireccion.value.trim().toUpperCase(),
            tutorTelefono: elementos.tutorTelefono.value,
            tutorEscolaridad: (elementos.tutorEscolaridad?.value || '').trim().toUpperCase(),
            tutorOcupacion: (elementos.tutorOcupacion?.value || '').trim().toUpperCase(),
            libro: elementos.libroInput.value.trim().toUpperCase(),
            folio: elementos.folioInput.value.trim().toUpperCase(),
            nuevoDia: nuevoDia,
            nuevoMes: nuevoMes,
            nuevoAnio: nuevoAnio,
            nuevoInscrito: nuevoInscrito,
            retiradoDia: retiradoDia,
            retiradoMes: retiradoMes,
            retiradoAnio: retiradoAnio,
            retirado: retirado,
            condicion: condicion,
            preprimario: preprimario,
            neae: (elementos.neaeInput?.value || '').trim().toUpperCase(),
            enfermedades: obtenerValoresChecklist('enfermedad'),
            medicamentos: obtenerValoresChecklist('medicamento'),
            emergenciaNombre: elementos.emergenciaNombreInput.value.trim().toUpperCase(),
            emergenciaTelefono: elementos.emergenciaTelefonoInput.value
        };
    }

    async function guardarRegistro() {
        if (!validarFormularioCompleto()) return;
        if (!edadConfirmada && edadActualDetectada && edadActualDetectada.tipo !== 'ok') {
            mostrarMensaje('❌ Debe aceptar la edad del estudiante antes de guardar.', 'error');
            mostrarModalEdad(
                edadActualDetectada.edad,
                edadActualDetectada.config,
                edadActualDetectada.tipo,
                edadActualDetectada.diferencia
            );
            return;
        }
        const datos = construirObjetoRegistro();
        const uid = generarUID();
        const registro = { ...datos, uid: uid, orden: '0', fecha: obtenerFecha() };
        let fotoParaGuardar = null;
        if (window.fotoSistema && window.fotoSistema.getBase64 && window.fotoSistema.getProcesada && window.fotoSistema.getProcesada()) {
            fotoParaGuardar = window.fotoSistema.getBase64();
        }
        if (fotoParaGuardar && window.fotoSistema && window.fotoSistema.guardarEnLocalStorage) {
            window.fotoSistema.guardarEnLocalStorage(uid, '0', registro.nombre, registro.apellido, fotoParaGuardar);
            registro.foto = true;
        }
        registros.push(registro);
        reasignarOrdenes();
        // ✅ FIX ANTIDUPLICADO: reconstruir claves de fila desde UID tras reordenar
        reconstruirClavesDeFilaDesdeUID();
        guardarRegistrosEnStorage();
        emitirEventoActualizacion();
        const registroGuardado = registros.find(r => r.uid === uid);
        const ordenFinal = registroGuardado ? registroGuardado.orden : '?';
        mostrarMensaje(`✅ Registro guardado exitosamente.\n\nNúmero de orden: ${ordenFinal}\nID: ${registro.id || '(sin ID)'}\nNombre: ${registro.nombre} ${registro.apellido}\nGrado: ${registro.grado}\nSección: ${registro.seccion}\nTanda: ${registro.tanda}\nEdad: ${registro.edad || '(no especificada)'}`, 'success');
        limpiarFormulario();
        limpiarValidacionID();
        actualizarBotonOrdenarAZ();
    }

    async function actualizarRegistro() {
        if (indiceEdicion < 0 || indiceEdicion >= registros.length) {
            mostrarMensaje('❌ Error: No se encontró el registro a actualizar.', 'error');
            return;
        }
        if (!validarFormularioCompleto()) return;
        if (!edadConfirmada && edadActualDetectada && edadActualDetectada.tipo !== 'ok') {
            mostrarMensaje('❌ Debe aceptar la edad del estudiante antes de actualizar.', 'error');
            mostrarModalEdad(
                edadActualDetectada.edad,
                edadActualDetectada.config,
                edadActualDetectada.tipo,
                edadActualDetectada.diferencia
            );
            return;
        }
        const original = registros[indiceEdicion];
        const datos = construirObjetoRegistro();
        const uid = original.uid || generarUID();
        let fotoParaGuardar = null;
        if (window.fotoSistema && window.fotoSistema.getBase64 && window.fotoSistema.getProcesada && 
            window.fotoSistema.getModificada && window.fotoSistema.getModificada()) {
            fotoParaGuardar = window.fotoSistema.getBase64();
        }
        const registroActualizado = { ...datos, uid: uid, orden: original.orden, fecha: original.fecha || obtenerFecha() };
        if (fotoParaGuardar && window.fotoSistema && window.fotoSistema.guardarEnLocalStorage) {
            window.fotoSistema.guardarEnLocalStorage(uid, registroActualizado.orden, registroActualizado.nombre, registroActualizado.apellido, fotoParaGuardar);
            registroActualizado.foto = true;
        } else {
            try {
                const fotoExistente = window.fotoSistema && window.fotoSistema.leerBase64 ? 
                    window.fotoSistema.leerBase64(uid) : null;
                if (fotoExistente) registroActualizado.foto = true;
            } catch (e) {}
        }
        registros[indiceEdicion] = registroActualizado;
        reasignarOrdenes();
        // ✅ FIX ANTIDUPLICADO: reconstruir claves de fila desde UID tras reordenar
        reconstruirClavesDeFilaDesdeUID();
        guardarRegistrosEnStorage();
        emitirEventoActualizacion();
        mostrarMensaje(`✅ Registro #${registroActualizado.orden} actualizado y reordenado exitosamente.`, 'success');
        cancelarEdicion();
        actualizarBotonOrdenarAZ();
    }

    function buscarEstudiante(termino) {
        if (!termino || termino.trim() === '') {
            limpiarFormulario();
            limpiarValidacionID();
            actualizarContadorOrden();
            return;
        }
        const busq = normalizarTexto(termino);
        const registrosFiltrados = obtenerRegistrosFiltrados();
        const encontrados = registrosFiltrados.filter(r =>
            normalizarTexto(r.id || '').includes(busq) ||
            normalizarTexto(r.nombre || '').includes(busq) ||
            normalizarTexto(r.apellido || '').includes(busq)
        );
        if (encontrados.length === 0) {
            mostrarMensaje(`No se encontró ningún estudiante con: "${termino}"`, 'info');
            return;
        }
        if (encontrados.length === 1) {
            const index = registros.indexOf(encontrados[0]);
            cargarRegistroParaEditar(index);
        } else {
            mostrarTabla();
            document.querySelectorAll('#tablaBody tr').forEach(tr => {
                tr.classList.remove('seleccionado');
                const idx = parseInt(tr.dataset.idx);
                if (!isNaN(idx) && idx >= 0 && idx < registros.length) {
                    const reg = registros[idx];
                    if (normalizarTexto(reg.id || '').includes(busq) ||
                        normalizarTexto(reg.nombre || '').includes(busq) ||
                        normalizarTexto(reg.apellido || '').includes(busq)) {
                        tr.classList.add('seleccionado');
                    }
                }
            });
            mostrarMensaje(`Se encontraron ${encontrados.length} coincidencias. Selecciona una en la tabla.`, 'info');
        }
    }

    function formatearCedula(input) {
        let val = input.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);
        let formatted = '';
        if (val.length > 0) {
            formatted = val.slice(0, 3);
            if (val.length > 3) formatted += '-' + val.slice(3, 10);
            if (val.length > 10) formatted += '-' + val.slice(10, 11);
        }
        input.value = formatted;
        const validacion = validarCedula(val);
        if (!validacion.valido && val.length > 0) input.setCustomValidity(validacion.mensaje);
        else input.setCustomValidity('');
    }

    function formatearTelefono(input) {
        let val = input.value.replace(/\D/g, '');
        if (val.length > 10) val = val.slice(0, 10);
        let formatted = '';
        if (val.length > 0) {
            formatted = val.slice(0, 3);
            if (val.length > 3) formatted += '-' + val.slice(3, 6);
            if (val.length > 6) formatted += '-' + val.slice(6, 10);
        }
        input.value = formatted;
        const validacion = validarTelefono(val);
        if (!validacion.valido && val.length > 0) input.setCustomValidity(validacion.mensaje);
        else input.setCustomValidity('');
    }

    function formatearMayusculas(input) {
        if (!input) return;
        input.addEventListener('input', function() {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.toUpperCase();
            this.setSelectionRange(start, end);
        });
        input.addEventListener('blur', function() {
            this.value = this.value.toUpperCase();
        });
    }

    function calcularEdad() {
        const dia = elementos.diaNacimiento.value;
        const mes = elementos.mesNacimiento.value;
        const ano = elementos.anoNacimiento.value;
        if (!dia || !mes || !ano) {
            elementos.edadInput.value = '';
            edadConfirmada = false;
            edadActualDetectada = null;
            return;
        }
        if (!esFechaValida(dia, mes, ano)) {
            elementos.edadInput.value = 'Fecha inválida';
            edadConfirmada = false;
            edadActualDetectada = null;
            return;
        }
        const fechaNac = new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, parseInt(dia, 10));
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mesActual = hoy.getMonth();
        const diaActual = hoy.getDate();
        if (mesActual < fechaNac.getMonth() ||
            (mesActual === fechaNac.getMonth() && diaActual < fechaNac.getDate())) {
            edad--;
        }
        elementos.edadInput.value = edad + ' años';
        validarEdadContraGrado(edad);
    }

    function validarEdadContraGrado(edad) {
        const grupo = obtenerGrupoActual();
        const gradoNum = convertirGradoANumero(grupo.grado);
        if (!gradoNum || !EDADES_POR_GRADO[gradoNum]) {
            edadConfirmada = true;
            return;
        }
        const config = EDADES_POR_GRADO[gradoNum];
        const enRango = edad >= config.min && edad <= config.max;
        if (enRango) {
            edadConfirmada = true;
            edadActualDetectada = { edad, config, tipo: 'ok' };
            actualizarEstadoEdadVerde(edad, config);
            habilitarBotonGuardar();
            return;
        }
        const tipo = edad < config.min ? 'bajo' : 'sobre';
        const diferencia = Math.abs(edad - config.oficial);
        edadActualDetectada = { edad, config, tipo, diferencia };
        edadConfirmada = false;
        bloquearBotonGuardar();
        mostrarModalEdad(edad, config, tipo, diferencia);
    }

    function mostrarModalEdad(edad, config, tipo, diferencia) {
        const modal = document.getElementById('modalEdadOverlay');
        if (!modal) return;
        const nombreEl = document.getElementById('modalEdadNombre');
        const gradoEl = document.getElementById('modalEdadGrado');
        const edadEl = document.getElementById('modalEdadEdad');
        const esperadaEl = document.getElementById('modalEdadEsperada');
        const rangoEl = document.getElementById('modalEdadRango');
        const diferenciaEl = document.getElementById('modalEdadDiferencia');
        const tipoEl = document.getElementById('modalEdadTipo');
        const iconoEl = document.getElementById('modalEdadIcono');
        const tituloEl = document.getElementById('modalEdadTitulo');
        const checkbox = document.getElementById('modalEdadCheckbox');
        const btnAceptar = document.getElementById('modalEdadAceptar');
        const btnCancelar = document.getElementById('modalEdadCancelar');
        const nombreEstudiante = elementos.nombreInput.value.trim() || '(sin nombre)';
        if (nombreEl) nombreEl.textContent = nombreEstudiante;
        if (gradoEl) gradoEl.textContent = config.nombre;
        if (edadEl) edadEl.textContent = edad + ' años';
        if (esperadaEl) esperadaEl.textContent = config.oficial + ' años';
        if (rangoEl) rangoEl.textContent = `${config.min} - ${config.max} años`;
        if (diferenciaEl) {
            const signo = tipo === 'sobre' ? '+' : '-';
            diferenciaEl.textContent = `${signo}${diferencia} año(s)`;
        }
        if (tipo === 'sobre') {
            if (tipoEl) { tipoEl.textContent = '⚠️ SOBRE-EDAD'; tipoEl.style.color = '#dc3545'; }
            if (iconoEl) iconoEl.textContent = '⚠️';
            if (tituloEl) { tituloEl.textContent = 'Advertencia: Estudiante en SOBRE-EDAD'; tituloEl.style.color = '#dc3545'; }
        } else {
            if (tipoEl) { tipoEl.textContent = '⚠️ BAJO-EDAD'; tipoEl.style.color = '#f0a500'; }
            if (iconoEl) iconoEl.textContent = '⚠️';
            if (tituloEl) { tituloEl.textContent = 'Advertencia: Estudiante en BAJO-EDAD'; tituloEl.style.color = '#f0a500'; }
        }
        if (checkbox) checkbox.checked = false;
        if (btnAceptar) { btnAceptar.disabled = true; btnAceptar.style.opacity = '0.5'; btnAceptar.style.cursor = 'not-allowed'; }
        if (checkbox) {
            checkbox.onchange = function() {
                if (btnAceptar) {
                    btnAceptar.disabled = !this.checked;
                    btnAceptar.style.opacity = this.checked ? '1' : '0.5';
                    btnAceptar.style.cursor = this.checked ? 'pointer' : 'not-allowed';
                }
            };
        }
        if (btnAceptar) {
            btnAceptar.onclick = function() {
                if (!checkbox || !checkbox.checked) return;
                edadConfirmada = true;
                habilitarBotonGuardar();
                cerrarModalEdad();
                mostrarMensaje('✅ Edad aceptada. Puede guardar el registro.', 'success');
            };
        }
        if (btnCancelar) {
            btnCancelar.onclick = function() {
                edadConfirmada = false;
                cerrarModalEdad();
                mostrarMensaje('❌ Debe aceptar la edad para continuar con el registro.', 'error');
            };
        }
        modal.classList.add('active');
    }

    function cerrarModalEdad() {
        const modal = document.getElementById('modalEdadOverlay');
        if (modal) modal.classList.remove('active');
    }

    function bloquearBotonGuardar() {
        if (elementos.btnGuardar) {
            elementos.btnGuardar.disabled = true;
            elementos.btnGuardar.style.opacity = '0.5';
            elementos.btnGuardar.style.cursor = 'not-allowed';
        }
    }

    function habilitarBotonGuardar() {
        if (elementos.btnGuardar) {
            elementos.btnGuardar.disabled = false;
            elementos.btnGuardar.style.opacity = '1';
            elementos.btnGuardar.style.cursor = 'pointer';
        }
    }

    function actualizarEstadoEdadVerde(edad, config) {
        const hint = document.getElementById('edadHint');
        if (!hint) return;
        hint.textContent = `✅ Edad correcta para ${config.nombre} (${config.min}-${config.max} años)`;
        hint.style.color = '#28a745';
        hint.style.fontWeight = '600';
        setTimeout(() => {
            if (hint) {
                hint.textContent = 'Selecciona día, mes y año (opcional)';
                hint.style.color = '';
                hint.style.fontWeight = '';
            }
        }, 3000);
    }

    function cargarProvincias() {
        if (!datosParajeBarrio || datosParajeBarrio.length === 0) {
            elementos.provinciaSelect.innerHTML = '<option value="" disabled selected>No hay datos disponibles</option>';
            return 0;
        }
        const provincias = [...new Set(datosParajeBarrio.map(item => obtenerCampo(item, 'Provincia')).filter(Boolean))].sort();
        elementos.provinciaSelect.innerHTML = '<option value="" disabled selected>Seleccionar provincia</option>';
        provincias.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            elementos.provinciaSelect.appendChild(opt);
        });
        return provincias.length;
    }

    function cargarMunicipios(provincia) {
        elementos.municipioSelect.innerHTML = '<option value="" disabled selected>Seleccionar municipio</option>';
        elementos.barrioSelect.innerHTML = '<option value="" disabled selected>Primero selecciona municipio</option>';
        if (!provincia || !datosParajeBarrio || datosParajeBarrio.length === 0) return;
        const municipios = [...new Set(datosParajeBarrio.filter(item => obtenerCampo(item, 'Provincia') === provincia).map(item => obtenerCampo(item, 'Municipio')).filter(Boolean))].sort();
        municipios.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            elementos.municipioSelect.appendChild(opt);
        });
    }

    function cargarBarrios(municipio) {
        elementos.barrioSelect.innerHTML = '<option value="" disabled selected>Seleccionar barrio</option>';
        if (!municipio || !datosParajeBarrio || datosParajeBarrio.length === 0) return;
        const barrios = [...new Set(datosParajeBarrio.filter(item => obtenerCampo(item, 'Municipio') === municipio).map(item => obtenerCampo(item, 'Barrio/Paraje')).filter(Boolean))].sort();
        barrios.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            elementos.barrioSelect.appendChild(opt);
        });
    }

    function llenarSelectDias(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Día</option>';
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement('option');
            const valor = String(i).padStart(2, '0');
            opt.value = valor;
            opt.textContent = valor;
            select.appendChild(opt);
        }
    }

    function llenarSelectMeses(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Mes</option>';
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        meses.forEach((mes, index) => {
            const opt = document.createElement('option');
            opt.value = String(index + 1);
            opt.textContent = mes;
            select.appendChild(opt);
        });
    }

    function llenarSelectAnios(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Año</option>';
        const anoActual = new Date().getFullYear();
        for (let i = anoActual; i >= 1900; i--) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            select.appendChild(opt);
        }
    }

    function llenarTodosLosSelectsDeFechas() {
        llenarSelectDias('diaNacimiento');
        llenarSelectMeses('mesNacimiento');
        llenarSelectAnios('anoNacimiento');
        llenarSelectDias('nuevoDia');
        llenarSelectMeses('nuevoMes');
        llenarSelectAnios('nuevoAnio');
        llenarSelectDias('retiradoDia');
        llenarSelectMeses('retiradoMes');
        llenarSelectAnios('retiradoAnio');
    }

    function configurarRadiosExclusivos(nombreGrupo) {
        const radios = document.querySelectorAll(`input[name="${nombreGrupo}"]`);
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    radios.forEach(other => {
                        if (other !== this) other.checked = false;
                    });
                }
            });
        });
    }

    function mostrarMensaje(mensaje, tipo = 'info') {
        let contenedor = document.getElementById('mensajesSistema');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'mensajesSistema';
            contenedor.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; max-width: 90%; text-align: center; pointer-events: none;';
            document.body.appendChild(contenedor);
        }
        const div = document.createElement('div');
        div.style.cssText = 'padding: 12px 24px; border-radius: 8px; font-family: "Segoe UI", sans-serif; font-size: 14px; font-weight: 600; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); margin-bottom: 10px; pointer-events: auto; animation: slideUp 0.3s ease; white-space: pre-line; text-align: left; max-width: 500px;';
        const colores = {
            error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
            success: { bg: '#d4edda', border: '#28a745', text: '#155724' },
            warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404' },
            info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' }
        };
        const estilo = colores[tipo] || colores.info;
        div.style.background = estilo.bg;
        div.style.border = `3px solid ${estilo.border}`;
        div.style.color = estilo.text;
        div.textContent = mensaje;
        contenedor.appendChild(div);
        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transition = 'opacity 0.3s ease';
            setTimeout(() => { if (div.parentNode) div.remove(); }, 300);
        }, 4000);
    }

    function inicializarSistemaFoto() {
        if (sistemaFotoInicializado) return;
        const fotoInput = document.getElementById('inputFoto');
        const fotoImagen = document.getElementById('fotoImagen');
        const fotoPreview = document.getElementById('fotoPreview');
        const btnEliminarFoto = document.getElementById('btnEliminarFoto');
        if (!fotoInput || !fotoImagen || !fotoPreview) {
            setTimeout(inicializarSistemaFoto, 500);
            return;
        }
        function redimensionarImagen2x2(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        try {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const tamaño = 130;
                            canvas.width = tamaño;
                            canvas.height = tamaño;
                            const lado = Math.min(img.width, img.height);
                            const offsetX = (img.width - lado) / 2;
                            const offsetY = (img.height - lado) / 2;
                            ctx.clearRect(0, 0, tamaño, tamaño);
                            ctx.drawImage(img, offsetX, offsetY, lado, lado, 0, 0, tamaño, tamaño);
                            resolve(canvas.toDataURL('image/jpeg', 0.92));
                        } catch (error) { reject(error); }
                    };
                    img.onerror = function() { reject(new Error('Error al cargar la imagen')); };
                    img.src = e.target.result;
                };
                reader.onerror = function() { reject(new Error('Error al leer el archivo')); };
                reader.readAsDataURL(file);
            });
        }
        async function procesarFoto(file) {
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!tiposPermitidos.includes(file.type)) {
                mostrarMensaje('❌ Solo se permiten JPG, JPEG, PNG o WEBP.', 'error');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                mostrarMensaje('❌ La imagen no debe superar los 5MB.', 'error');
                return false;
            }
            try {
                const imagenRedimensionada = await redimensionarImagen2x2(file);
                fotoBase64Global = imagenRedimensionada;
                fotoProcesadaGlobal = true;
                fotoModificadaGlobal = true;
                fotoNombreArchivoGlobal = file.name;
                const img = document.getElementById('fotoImagen');
                const placeholder = document.querySelector('.foto-placeholder');
                if (img) { img.src = imagenRedimensionada; img.style.display = 'block'; img.classList.add('mostrar'); }
                if (placeholder) placeholder.style.display = 'none';
                mostrarMensaje('✅ Foto 2x2 lista', 'success');
                return true;
            } catch (e) {
                mostrarMensaje('❌ Error al procesar la imagen.', 'error');
                return false;
            }
        }
        function eliminarFoto() {
            fotoBase64Global = null;
            fotoProcesadaGlobal = false;
            fotoModificadaGlobal = false;
            fotoNombreArchivoGlobal = null;
            const img = document.getElementById('fotoImagen');
            const placeholder = document.querySelector('.foto-placeholder');
            if (img) { img.src = ''; img.style.display = 'none'; img.classList.remove('mostrar'); }
            if (placeholder) placeholder.style.display = 'block';
            const input = document.getElementById('inputFoto');
            if (input) input.value = '';
        }
        function guardarFotoLocalStorage(uid, orden, nombre, apellido, base64Data) {
            try {
                const key = `foto_${uid}`;
                const data = { uid, orden, nombre: (nombre || '').toUpperCase(), apellido: (apellido || '').toUpperCase(), base64: base64Data, fecha: new Date().toISOString() };
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) { return false; }
        }
        function leerFotoLocalStorage(uid) {
            try {
                const data = localStorage.getItem(`foto_${uid}`);
                if (data) {
                    const datos = JSON.parse(data);
                    if (datos && datos.base64) return datos.base64;
                }
            } catch (e) {}
            return null;
        }
        function cargarFotoLocalStorage(uid) {
            const base64 = leerFotoLocalStorage(uid);
            if (base64) {
                const img = document.getElementById('fotoImagen');
                const placeholder = document.querySelector('.foto-placeholder');
                if (img) {
                    img.src = base64;
                    img.style.display = 'block';
                    img.classList.add('mostrar');
                    fotoBase64Global = base64;
                    fotoProcesadaGlobal = true;
                    fotoModificadaGlobal = false;
                }
                if (placeholder) placeholder.style.display = 'none';
                return true;
            }
            return false;
        }
        function eliminarFotoLocalStorage(uid) {
            try { localStorage.removeItem(`foto_${uid}`); return true; } catch (e) { return false; }
        }
        function crearMiniaturaFoto(uid, nombre, apellido) {
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; margin: 0 auto;';
            const base64 = uid ? leerFotoLocalStorage(uid) : null;
            if (base64) {
                const img = document.createElement('img');
                img.src = base64;
                img.style.cssText = 'width: 40px; height: 40px; border-radius: 4px; object-fit: cover; border: 1px solid #d3e0ea;';
                img.alt = `Foto ${nombre} ${apellido}`;
                img.title = `${nombre} ${apellido}`;
                container.appendChild(img);
                return container;
            }
            const div = document.createElement('div');
            div.textContent = '📷';
            div.style.cssText = 'width: 40px; height: 40px; border-radius: 4px; border: 1px dashed #d3e0ea; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #b0c8d8; background: #fafbfc;';
            container.appendChild(div);
            return container;
        }
        fotoInput.addEventListener('change', async function(e) {
            if (this.files && this.files[0]) await procesarFoto(this.files[0]);
        });
        if (btnEliminarFoto) {
            btnEliminarFoto.addEventListener('click', function() {
                if (confirm('¿Eliminar la foto?')) eliminarFoto();
            });
        }
        if (fotoPreview) {
            fotoPreview.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.borderColor = '#28a745';
                this.style.boxShadow = '0 0 0 4px rgba(40, 167, 69, 0.2)';
            });
            fotoPreview.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.style.borderColor = '#1a4e69';
                this.style.boxShadow = 'none';
            });
            fotoPreview.addEventListener('drop', async function(e) {
                e.preventDefault();
                this.style.borderColor = '#1a4e69';
                this.style.boxShadow = 'none';
                const files = e.dataTransfer.files;
                if (files && files[0]) { fotoInput.files = files; await procesarFoto(files[0]); }
            });
        }
        window.fotoSistema = {
            getBase64: () => fotoBase64Global,
            getProcesada: () => fotoProcesadaGlobal,
            getModificada: () => fotoModificadaGlobal,
            getNombre: () => fotoNombreArchivoGlobal,
            procesarFoto, eliminarFoto,
            guardarEnLocalStorage: guardarFotoLocalStorage,
            leerBase64: leerFotoLocalStorage,
            cargarDesdeLocalStorage: cargarFotoLocalStorage,
            eliminarDeLocalStorage: eliminarFotoLocalStorage,
            crearMiniatura: crearMiniaturaFoto,
            mostrarMensaje
        };
        sistemaFotoInicializado = true;
    }

    function cargarFotoAlEditar(uid) {
        try {
            if (uid && window.fotoSistema && window.fotoSistema.cargarDesdeLocalStorage) {
                return window.fotoSistema.cargarDesdeLocalStorage(uid);
            }
        } catch (e) {}
        return false;
    }

    function eliminarFotoAlEliminar(uid) {
        try {
            if (uid && window.fotoSistema && window.fotoSistema.eliminarDeLocalStorage) {
                return window.fotoSistema.eliminarDeLocalStorage(uid);
            }
        } catch (e) {}
        return false;
    }

    function obtenerMiniaturaFoto(uid, nombre, apellido) {
        try {
            if (uid && window.fotoSistema && window.fotoSistema.crearMiniatura) {
                return window.fotoSistema.crearMiniatura(uid, nombre, apellido);
            }
        } catch (e) {}
        const div = document.createElement('div');
        div.textContent = '📷';
        div.style.cssText = 'width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto;';
        return div;
    }

    function mostrarTabla() {
        elementos.seccionFormulario.style.display = 'none';
        elementos.seccionTabla.style.display = 'block';
        renderizarTabla();
    }

    function mostrarFormulario() {
        elementos.seccionTabla.style.display = 'none';
        elementos.seccionFormulario.style.display = 'block';
    }

    function limpiarFormulario() {
        edadConfirmada = false;
        edadActualDetectada = null;
        habilitarBotonGuardar();
        cerrarModalEdad();
        elementos.idInput.value = '';
        limpiarValidacionID();
        elementos.nombreInput.value = '';
        elementos.apellidoInput.value = '';
        elementos.nacionalidadSelect.value = NACIONALIDAD_POR_DEFECTO;
        elementos.parentescoSelect.value = '';
        elementos.sexoFemenino.checked = false;
        elementos.sexoMasculino.checked = false;
        elementos.telefonoInput.value = '';
        elementos.direccionEstudianteInput.value = '';
        elementos.tutorTipo.value = '';
        elementos.tutorCedula.value = '';
        elementos.tutorDireccion.value = '';
        elementos.tutorTelefono.value = '';
        if (elementos.tutorEscolaridad) elementos.tutorEscolaridad.value = '';
        if (elementos.tutorOcupacion) elementos.tutorOcupacion.value = '';
        elementos.diaNacimiento.value = '';
        elementos.mesNacimiento.value = '';
        elementos.anoNacimiento.value = '';
        elementos.edadInput.value = '';
        elementos.provinciaSelect.value = '';
        elementos.municipioSelect.innerHTML = '<option value="" disabled selected>Primero selecciona provincia</option>';
        elementos.barrioSelect.innerHTML = '<option value="" disabled selected>Selecciona municipio primero</option>';
        if (elementos.libroInput) elementos.libroInput.value = '';
        if (elementos.folioInput) elementos.folioInput.value = '';
        if (elementos.neaeInput) elementos.neaeInput.value = '';
        document.querySelectorAll('input[data-tipo="enfermedad"], input[data-tipo="medicamento"]').forEach(chk => chk.checked = false);
        if (elementos.enfermedadesOtra) { elementos.enfermedadesOtra.value = ''; elementos.enfermedadesOtra.style.display = 'none'; }
        if (elementos.medicamentosOtra) { elementos.medicamentosOtra.value = ''; elementos.medicamentosOtra.style.display = 'none'; }
        if (elementos.emergenciaNombreInput) elementos.emergenciaNombreInput.value = '';
        if (elementos.emergenciaTelefonoInput) elementos.emergenciaTelefonoInput.value = '';
        if (elementos.nuevoDiaSelect) elementos.nuevoDiaSelect.value = '';
        if (elementos.nuevoMesSelect) elementos.nuevoMesSelect.value = '';
        if (elementos.nuevoAnioSelect) elementos.nuevoAnioSelect.value = '';
        if (elementos.retiradoDiaSelect) elementos.retiradoDiaSelect.value = '';
        if (elementos.retiradoMesSelect) elementos.retiradoMesSelect.value = '';
        if (elementos.retiradoAnioSelect) elementos.retiradoAnioSelect.value = '';
        document.querySelectorAll('input[name="condicion"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('input[name="preprimario"]').forEach(cb => cb.checked = false);
        elementos.idInput.setCustomValidity('');
        elementos.tutorCedula.setCustomValidity('');
        elementos.telefonoInput.setCustomValidity('');
        elementos.tutorTelefono.setCustomValidity('');
        elementos.busquedaInput.value = '';
        busquedaActual = '';
        elementos.idInput.title = '';
        document.querySelectorAll('#tablaBody tr').forEach(tr => tr.classList.remove('seleccionado'));
        if (window.fotoSistema && window.fotoSistema.getBase64 && window.fotoSistema.getBase64()) {
            window.fotoSistema.eliminarFoto();
        }
    }

    function verificarOrigen() {
        const urlParams = new URLSearchParams(window.location.search);
        const origen = urlParams.get('origen');
        const accion = urlParams.get('accion');
        const grado = urlParams.get('grado');
        const seccion = urlParams.get('seccion');
        const tanda = urlParams.get('tanda');
        const nombre = urlParams.get('nombre');
        const fecha = urlParams.get('fecha');
        const btnRetornar = document.getElementById('btnRetornarCumple');
        const badgeEstado = document.getElementById('badgeEstado');
        const badgeGrupo = document.getElementById('badgeGrupo');
        const gradoMostrado = document.getElementById('gradoMostrado');
        const seccionMostrado = document.getElementById('seccionMostrado');
        const tandaMostrado = document.getElementById('tandaMostrado');
        if (origen === 'cumpleaños') {
            if (btnRetornar) { btnRetornar.classList.add('visible'); btnRetornar.classList.remove('oculto'); }
            if (badgeEstado) { badgeEstado.textContent = '🎂 Desde Cumpleaños'; badgeEstado.classList.add('badge-cumple'); }
            if (badgeGrupo) badgeGrupo.classList.add('badge-grupo-cumple');
            if (grado && gradoMostrado) gradoMostrado.textContent = decodeURIComponent(grado);
            if (seccion && seccionMostrado) seccionMostrado.textContent = decodeURIComponent(seccion);
            if (tanda && tandaMostrado) tandaMostrado.textContent = decodeURIComponent(tanda);
            if (accion === 'editar' && nombre) {
                const nombreInput = document.getElementById('nombre');
                const apellidoInput = document.getElementById('apellido');
                if (nombreInput) {
                    const nombreCompleto = decodeURIComponent(nombre);
                    const partes = nombreCompleto.split(' ');
                    nombreInput.value = partes[0] || '';
                    if (apellidoInput) apellidoInput.value = partes.slice(1).join(' ') || '';
                }
                if (fecha) {
                    const fechaParts = decodeURIComponent(fecha).split('-');
                    if (fechaParts.length === 3) {
                        const diaSelect = document.getElementById('diaNacimiento');
                        const mesSelect = document.getElementById('mesNacimiento');
                        const anioSelect = document.getElementById('anoNacimiento');
                        if (diaSelect) diaSelect.value = parseInt(fechaParts[2], 10);
                        if (mesSelect) mesSelect.value = parseInt(fechaParts[1], 10);
                        if (anioSelect) anioSelect.value = parseInt(fechaParts[0], 10);
                        calcularEdad();
                    }
                }
                mostrarMensaje('✏️ Editando estudiante desde Alertas de Cumpleaños', 'info');
            } else if (accion === 'agregar') {
                mostrarMensaje('📝 Agregando estudiante desde Alertas de Cumpleaños', 'info');
            }
        } else {
            if (btnRetornar) { btnRetornar.classList.remove('visible'); btnRetornar.classList.add('oculto'); btnRetornar.style.display = 'none'; }
            if (badgeEstado) { badgeEstado.textContent = '📋 NUEVO REGISTRO'; badgeEstado.classList.remove('badge-cumple'); }
            if (badgeGrupo) badgeGrupo.classList.remove('badge-grupo-cumple');
        }
        if (btnRetornar) {
            btnRetornar.addEventListener('click', function() {
                const gradoText = gradoMostrado?.textContent || 'No asignado';
                const seccionText = seccionMostrado?.textContent || 'A';
                const tandaText = tandaMostrado?.textContent || 'Matutina';
                window.location.href = `ALERTAS DE CUMPLEANOS.html?grado=${encodeURIComponent(gradoText)}&seccion=${encodeURIComponent(seccionText)}&tanda=${encodeURIComponent(tandaText)}`;
            });
        }
    }

    function cargarNacionalidades() {
        elementos.nacionalidadSelect.innerHTML = '<option value="" disabled>Seleccionar nacionalidad</option>';
        NACIONALIDADES.forEach(function(nac) {
            const opt = document.createElement('option');
            opt.value = nac;
            opt.textContent = nac;
            elementos.nacionalidadSelect.appendChild(opt);
        });
        elementos.nacionalidadSelect.value = NACIONALIDAD_POR_DEFECTO;
    }

    function cargarParentescos() {
        elementos.parentescoSelect.innerHTML = '<option value="" disabled selected>Seleccionar parentesco</option>';
        PARENTESCOS.forEach(function(parentesco) {
            const opt = document.createElement('option');
            opt.value = parentesco;
            opt.textContent = parentesco;
            elementos.parentescoSelect.appendChild(opt);
        });
    }

    function llenarDias() {
        elementos.diaNacimiento.innerHTML = '<option value="">Día</option>';
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement('option');
            opt.value = String(i).padStart(2, '0');
            opt.textContent = String(i).padStart(2, '0');
            elementos.diaNacimiento.appendChild(opt);
        }
    }

    function llenarAnos() {
        elementos.anoNacimiento.innerHTML = '<option value="">Año</option>';
        const anoActual = new Date().getFullYear();
        for (let i = anoActual; i >= 1900; i--) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            elementos.anoNacimiento.appendChild(opt);
        }
    }

    function cargarDatosEjemplo() {
        datosParajeBarrio = [
            { "Provincia": "AZUA", "Municipio": "AZUA", "Barrio/Paraje": "LOS CARTONES" },
            { "Provincia": "AZUA", "Municipio": "PADRE LAS CASAS", "Barrio/Paraje": "LAS CAÑAS" },
            { "Provincia": "DISTRITO NACIONAL", "Municipio": "SANTO DOMINGO", "Barrio/Paraje": "GAZCUE" },
            { "Provincia": "SANTO DOMINGO", "Municipio": "SANTO DOMINGO NORTE", "Barrio/Paraje": "VILLA MELLA" },
            { "Provincia": "SANTIAGO", "Municipio": "SANTIAGO", "Barrio/Paraje": "LOS PRADOS" },
            { "Provincia": "LA ALTAGRACIA", "Municipio": "HIGUEY", "Barrio/Paraje": "EL TAMARINDO" },
            { "Provincia": "PUERTO PLATA", "Municipio": "PUERTO PLATA", "Barrio/Paraje": "LOS DOMINGUEZ" },
            { "Provincia": "SAN CRISTOBAL", "Municipio": "SAN CRISTOBAL", "Barrio/Paraje": "LAVAPIE" },
            { "Provincia": "SAN PEDRO DE MACORIS", "Municipio": "SAN PEDRO DE MACORIS", "Barrio/Paraje": "PLACER BONITO" },
            { "Provincia": "LA ROMANA", "Municipio": "LA ROMANA", "Barrio/Paraje": "VILLA VERDE" },
            { "Provincia": "DUARTE", "Municipio": "SAN FRANCISCO DE MACORIS", "Barrio/Paraje": "VILLA OLIMPICA" },
            { "Provincia": "MONTE PLATA", "Municipio": "MONTE PLATA", "Barrio/Paraje": "VIETNAM" },
            { "Provincia": "HATO MAYOR", "Municipio": "HATO MAYOR", "Barrio/Paraje": "PUERTO RICO" },
            { "Provincia": "EL SEIBO", "Municipio": "EL SEIBO", "Barrio/Paraje": "LOS CAJULIES" },
            { "Provincia": "PERAVIA", "Municipio": "BANI", "Barrio/Paraje": "30 DE MAYO" }
        ];
        inicializarFormulario();
    }

    function cargarDatosDesdeVariable() {
        if (typeof window.parajebarrio !== 'undefined' && Array.isArray(window.parajebarrio) && window.parajebarrio.length > 0) {
            datosParajeBarrio = window.parajebarrio;
            inicializarFormulario();
            return true;
        }
        if (typeof parajebarrio !== 'undefined' && Array.isArray(parajebarrio) && parajebarrio.length > 0) {
            datosParajeBarrio = parajebarrio;
            inicializarFormulario();
            return true;
        }
        return false;
    }

    function inicializarFormulario() {
        elementos = {
            seccionFormulario: document.getElementById('seccionFormulario'),
            seccionTabla: document.getElementById('seccionTabla'),
            ordenInput: document.getElementById('orden'),
            idInput: document.getElementById('idEstudiante'),
            nombreInput: document.getElementById('nombre'),
            apellidoInput: document.getElementById('apellido'),
            nacionalidadSelect: document.getElementById('nacionalidad'),
            parentescoSelect: document.getElementById('parentescoEstudiante'),
            idError: document.getElementById('idError'),
            idHint: document.getElementById('idHint'),
            sexoFemenino: document.getElementById('sexoFemenino'),
            sexoMasculino: document.getElementById('sexoMasculino'),
            diaNacimiento: document.getElementById('diaNacimiento'),
            mesNacimiento: document.getElementById('mesNacimiento'),
            anoNacimiento: document.getElementById('anoNacimiento'),
            edadInput: document.getElementById('edad'),
            provinciaSelect: document.getElementById('provincia'),
            municipioSelect: document.getElementById('municipio'),
            barrioSelect: document.getElementById('barrio'),
            telefonoInput: document.getElementById('telefono'),
            direccionEstudianteInput: document.getElementById('direccionEstudiante'),
            tutorTipo: document.getElementById('tutorTipo'),
            tutorCedula: document.getElementById('tutorCedula'),
            tutorDireccion: document.getElementById('tutorDireccion'),
            tutorTelefono: document.getElementById('tutorTelefono'),
            tutorEscolaridad: document.getElementById('tutorEscolaridad'),
            tutorOcupacion: document.getElementById('tutorOcupacion'),
            tablaBody: document.getElementById('tablaBody'),
            totalRegistros: document.getElementById('totalRegistros'),
            busquedaInput: document.getElementById('busquedaEstudiante'),
            btnGuardar: document.getElementById('btnGuardar'),
            btnActualizar: document.getElementById('btnActualizar'),
            btnCancelarEdicion: document.getElementById('btnCancelarEdicion'),
            btnOrdenarAZ: document.getElementById('btnOrdenarAZ'),
            libroInput: document.getElementById('libro'),
            folioInput: document.getElementById('folio'),
            neaeInput: document.getElementById('neae'),
            checklistEnfermedades: document.getElementById('checklistEnfermedades'),
            checklistMedicamentos: document.getElementById('checklistMedicamentos'),
            enfermedadesOtra: document.getElementById('enfermedadesOtra'),
            medicamentosOtra: document.getElementById('medicamentosOtra'),
            checkEnfermedadOtra: document.getElementById('checkEnfermedadOtra'),
            checkMedicamentoOtra: document.getElementById('checkMedicamentoOtra'),
            emergenciaNombreInput: document.getElementById('emergenciaNombre'),
            emergenciaTelefonoInput: document.getElementById('emergenciaTelefono'),
            nuevoDiaSelect: document.getElementById('nuevoDia'),
            nuevoMesSelect: document.getElementById('nuevoMes'),
            nuevoAnioSelect: document.getElementById('nuevoAnio'),
            retiradoDiaSelect: document.getElementById('retiradoDia'),
            retiradoMesSelect: document.getElementById('retiradoMes'),
            retiradoAnioSelect: document.getElementById('retiradoAnio')
        };

        for (const [key, el] of Object.entries(elementos)) {
            if (!el) console.warn(`⚠️ Elemento no encontrado: ${key}`);
        }

        if (!datosParajeBarrio || datosParajeBarrio.length === 0) datosParajeBarrio = [];

        cargarNacionalidades();
        cargarParentescos();
        llenarDias();
        llenarAnos();
        llenarTodosLosSelectsDeFechas();

        elementos.diaNacimiento.addEventListener('change', calcularEdad);
        elementos.mesNacimiento.addEventListener('change', calcularEdad);
        elementos.anoNacimiento.addEventListener('change', calcularEdad);

        cargarRegistrosDesdeStorage();

        const totalProvincias = cargarProvincias();
        if (totalProvincias === 0) {
            elementos.provinciaSelect.innerHTML = '<option value="" disabled selected>Provincias no disponibles</option>';
            elementos.municipioSelect.innerHTML = '<option value="" disabled selected>No disponible</option>';
            elementos.barrioSelect.innerHTML = '<option value="" disabled selected>No disponible</option>';
        }

        elementos.provinciaSelect.addEventListener('change', function() { cargarMunicipios(this.value); });
        elementos.municipioSelect.addEventListener('change', function() { cargarBarrios(this.value); });

        const camposMayusculas = [
            elementos.nombreInput, elementos.apellidoInput, elementos.tutorTipo,
            elementos.tutorDireccion, elementos.direccionEstudianteInput,
            elementos.libroInput, elementos.folioInput,
            elementos.emergenciaNombreInput
        ];
        camposMayusculas.forEach(input => { if (input) formatearMayusculas(input); });

        inicializarChecklistsSalud();

        elementos.tutorCedula.addEventListener('input', function() { formatearCedula(this); });
        elementos.telefonoInput.addEventListener('input', function() { formatearTelefono(this); });
        elementos.tutorTelefono.addEventListener('input', function() { formatearTelefono(this); });
        if (elementos.emergenciaTelefonoInput) {
            elementos.emergenciaTelefonoInput.addEventListener('input', function() { formatearTelefono(this); });
        }

        elementos.idInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 8);
            if (this.value.trim() === '') limpiarValidacionID();
            else validarIDEnTiempoReal();
        });
        elementos.idInput.addEventListener('blur', function() {
            if (this.value.trim() === '') limpiarValidacionID();
            else validarIDEnTiempoReal();
            this.title = '';
        });
        elementos.idInput.addEventListener('focus', function() { this.title = ''; });
        elementos.idInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                limpiarValidacionID();
                this.title = '';
                this.blur();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.value.trim() === '' || validarIDEnTiempoReal()) elementos.nombreInput.focus();
            }
        });

        elementos.busquedaInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') buscarEstudiante(this.value);
        });

        document.getElementById('btnBuscar')?.addEventListener('click', function() {
            buscarEstudiante(elementos.busquedaInput.value);
        });

        document.getElementById('btnLimpiarBusqueda')?.addEventListener('click', function() {
            elementos.busquedaInput.value = '';
            busquedaActual = '';
            limpiarFormulario();
            limpiarValidacionID();
            actualizarContadorOrden();
            document.querySelectorAll('#tablaBody tr').forEach(tr => tr.classList.remove('seleccionado'));
        });

        document.getElementById('btnVerHistorial')?.addEventListener('click', mostrarTabla);
        document.getElementById('btnVolverFormulario')?.addEventListener('click', function() {
            mostrarFormulario();
            cancelarEdicion();
            limpiarValidacionID();
        });

        elementos.btnGuardar.addEventListener('click', guardarRegistro);
        elementos.btnActualizar.addEventListener('click', actualizarRegistro);
        elementos.btnCancelarEdicion.addEventListener('click', cancelarEdicion);

        document.getElementById('btnResetOrden')?.addEventListener('click', function() {
            const registrosFiltrados = obtenerRegistrosFiltrados();
            if (registrosFiltrados.length > 0) {
                mostrarMensaje('❌ No se puede reiniciar el conteo porque existen registros guardados para este grado.\n\nPara reiniciar, primero debes limpiar el historial con el botón "Limpiar historial".', 'error');
                return;
            }
            if (confirm('¿Reiniciar el conteo del número de orden a 1?')) {
                contadorOrden = 1;
                try { localStorage.setItem('ordenCounter', contadorOrden.toString()); } catch (e) {}
                elementos.ordenInput.value = contadorOrden;
                mostrarMensaje('Contador reiniciado a 1', 'success');
            }
        });

        elementos.btnOrdenarAZ.addEventListener('click', function() {
            if (this.disabled) return;
            const registrosFiltrados = obtenerRegistrosFiltrados();
            if (registrosFiltrados.length === 0) {
                mostrarMensaje('No hay registros para ordenar.', 'info');
                return;
            }
            if (estaOrdenadoAlfabeticamente()) {
                ordenAZActivo = true;
                guardarEstadoOrden();
                actualizarBotonOrdenarAZ();
                mostrarMensaje('✅ Los registros ya están ordenados alfabéticamente.', 'info');
                return;
            }
            ordenAZActivo = true;
            guardarEstadoOrden();
            renderizarTabla();
            actualizarBotonOrdenarAZ();
            emitirEventoActualizacion();
            mostrarMensaje('🔤 Registros ordenados alfabéticamente.', 'success');
        });

        document.getElementById('btnLimpiarTabla')?.addEventListener('click', limpiarHistorial);

        configurarRadiosExclusivos('condicion');
        configurarRadiosExclusivos('preprimario');

        elementos.btnActualizar.style.display = 'none';
        elementos.btnCancelarEdicion.style.display = 'none';
        actualizarBadges();

        verificarOrigen();

        setTimeout(inicializarSistemaFoto, 300);
        setTimeout(actualizarBotonOrdenarAZ, 100);

        console.log('✅ FORMULARIO.js inicializado correctamente');
    }

    return {
        inicializar: function() {
            if (!cargarDatosDesdeVariable()) {
                let intentos = 0;
                const maxIntentos = 20;
                const intervalo = setInterval(function() {
                    intentos++;
                    if (cargarDatosDesdeVariable()) {
                        clearInterval(intervalo);
                    } else if (intentos >= maxIntentos) {
                        clearInterval(intervalo);
                        console.warn('⚠️ No se pudieron cargar los datos de parajebarrio, usando datos de ejemplo');
                        if (elementos.provinciaSelect) {
                            elementos.provinciaSelect.innerHTML = '<option value="" disabled selected>Error: No se pudieron cargar los datos</option>';
                        }
                        cargarDatosEjemplo();
                    }
                }, 500);
            }
        },
        obtenerRegistros: function() { return registros; },
        obtenerRegistrosFiltrados: obtenerRegistrosFiltrados,
        guardarRegistro: guardarRegistro,
        actualizarRegistro: actualizarRegistro,
        eliminarRegistro: eliminarRegistro,
        cancelarEdicion: cancelarEdicion,
        limpiarFormulario: limpiarFormulario,
        renderizarTabla: renderizarTabla,
        inicializarSistemaFoto: inicializarSistemaFoto,
        verificarOrigen: verificarOrigen,
        estaOrdenadoAlfabeticamente: estaOrdenadoAlfabeticamente,
        actualizarBotonOrdenarAZ: actualizarBotonOrdenarAZ,
        eliminarNotasDeEstudiante: eliminarNotasDeEstudiante,
        normalizarNEAE: normalizarNEAE,
        normalizarEscolaridad: normalizarEscolaridad,
        normalizarOcupacion: normalizarOcupacion,
        obtenerValoresChecklist: obtenerValoresChecklist,
        aplicarValoresChecklist: aplicarValoresChecklist
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, inicializando formulario...');
    setTimeout(function() {
        if (typeof FormularioSigerd !== 'undefined') {
            FormularioSigerd.inicializar();
        }
    }, 100);
});

function emitirEventoActualizacion() {
    try {
        const registrosActuales = typeof FormularioSigerd !== 'undefined' ? FormularioSigerd.obtenerRegistros() : [];
        let grupo = { grado: 'Primer Grado', seccion: 'A', tanda: 'Matutina' };
        try {
            const sync = localStorage.getItem('datosSincronizados');
            const datos = sync ? JSON.parse(sync) : {};
            grupo = {
                grado: datos.grado || 'Primer Grado',
                seccion: datos.seccion || 'A',
                tanda: datos.tanda || 'Matutina'
            };
        } catch (e) {}
        const evento = new CustomEvent('formulariosActualizado', {
            detail: { timestamp: Date.now(), registros: registrosActuales, grupo: grupo }
        });
        document.dispatchEvent(evento);
        try { localStorage.setItem('formulariosActualizadoTimestamp', Date.now().toString()); } catch (e) {}
        console.log('📢 Evento "formulariosActualizado" emitido con', registrosActuales.length, 'registros');
    } catch (e) {
        console.warn('⚠️ Error al emitir evento:', e);
    }
}

window.sincronizarPaginasEstudiante = function() {
    emitirEventoActualizacion();
    console.log('🔄 Sincronización forzada de páginas de estudiante');
};

document.getElementById('btnCancelarFormulario')?.addEventListener('click', function() {
    if (confirm('¿Estás seguro de que deseas cancelar y limpiar todo el formulario?')) {
        FormularioSigerd.limpiarFormulario();
        if (window.fotoSistema) window.fotoSistema.eliminarFoto();
        document.querySelector('.form-container').classList.remove('modo-edicion');
        document.getElementById('btnGuardar').style.display = 'inline-flex';
        document.getElementById('btnActualizar').style.display = 'none';
        document.getElementById('btnCancelarEdicion').style.display = 'none';
        document.getElementById('seccionFormulario').style.display = 'block';
        document.getElementById('seccionTabla').style.display = 'none';
        mostrarMensaje('🗑️ Formulario limpiado. Puedes comenzar de nuevo.', 'info');
    }
});

console.log('✅ FORMULARIO.js cargado - SOLO Nombre y Apellido OBLIGATORIOS');