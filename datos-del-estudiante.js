/**
============================================
DATOS-DEL-ESTUDIANTE.js - GENERACIÓN DINÁMICA DE TABLAS
PÁGINAS 10, 11 Y 12
✅ SINCRONIZADO CON EL FORMULARIO (registrosSigerd)
✅ TODOS LOS CAMPOS DEL FORMULARIO MAPEADOS
✅ BOTONES OCULTOS (SINCRONIZAR, VALIDAR, LIMPIAR)
✅ CAMPOS BLOQUEADOS CON APARIENCIA VIVA
✅ NACIONALIDAD - SE MUESTRA DIRECTAMENTE DEL FORMULARIO (INPUT TEXTO)
============================================
*/

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================
const TOTAL_FILAS = 45;
const PAISES_AMERICA = [
    'REPÚBLICA DOMINICANA', 'HAITÍ', 'ANTIGUA Y BARBUDA', 'ARGENTINA',
    'BAHAMAS', 'BARBADOS', 'BELICE', 'BOLIVIA', 'BRASIL', 'CANADÁ',
    'CHILE', 'COLOMBIA', 'COSTA RICA', 'CUBA', 'DOMINICA', 'ECUADOR',
    'EL SALVADOR', 'GRANADA', 'GUATEMALA', 'GUYANA', 'HONDURAS',
    'JAMAICA', 'MÉXICO', 'NICARAGUA', 'PANAMÁ', 'PARAGUAY', 'PERÚ',
    'SAN CRISTÓBAL Y NIEVES', 'SAN VICENTE Y LAS GRANADINAS',
    'SANTA LUCÍA', 'SURINAM', 'TRINIDAD Y TOBAGO', 'URUGUAY',
    'VENEZUELA', 'OTROS'
];
const PARENTESCOS = [
    'PADRE', 'MADRE', 'TUTOR(A)', 'ABUELO(A)', 'HERMANO(A)',
    'TÍO(A)', 'PRIMO(A)', 'VECINO(A)', 'AMIGO(A)', 'ENCARGADO(A)', 'OTRO'
];

// ============================================
// VARIABLES DE CONTROL
// ============================================
let estudiantesCargados = [];
let sincronizacionActiva = true;
let timeoutSincronizacion = null;
let sincronizando = false;
let ultimaSincronizacion = 0;
let ultimoHashRegistros = '';
let _grupoAnterior = '';

// ============================================
// FUNCIÓN DE NORMALIZACIÓN
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
    } catch (e) {
        console.warn('⚠️ Error obteniendo sección:', e);
        return null;
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
        console.warn('⚠️ Error obteniendo tanda:', e);
        return 'Matutina';
    }
}

function obtenerGrupoActual() {
    const grado = obtenerGradoDesdePortada();
    const seccion = obtenerSeccionDesdePortada();
    const tanda = obtenerTandaDesdePortada();
    
    const grupo = {
        grado: grado ? grado.trim() : 'Primer Grado',
        seccion: seccion ? seccion.trim() : 'A',
        tanda: tanda ? tanda.trim() : 'Matutina'
    };
    
    console.log('🎯 Grupo actual detectado:', grupo);
    return grupo;
}

// ============================================
// BADGE DE ASIGNACIÓN
// ============================================
function crearBadgeAsignacion() {
    const grupo = obtenerGrupoActual();
    
    const badge = document.createElement('div');
    badge.className = 'badge-asignacion-completa visible';
    badge.style.cssText = `
        background: #002D62;
        color: white;
        padding: 10px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 15px;
        border: 2px solid #C8102E;
        font-family: 'Times New Roman', Times, serif;
        box-shadow: 0 4px 15px rgba(0, 45, 98, 0.2);
    `;
    
    badge.innerHTML = `
        📚 Asignación: 
        <span style="color: #FFD700;">${grupo.grado}</span>
        <span style="color: #fff; opacity: 0.4; margin: 0 6px;">|</span>
        <span style="color: #4FC3F7;">${grupo.seccion}</span>
        <span style="color: #fff; opacity: 0.4; margin: 0 6px;">|</span>
        <span style="color: #81C784;">${grupo.tanda}</span>
        <button onclick="cambiarGradoDesdeEstudiante()" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 4px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.3s ease;
            margin-left: 12px;
            font-family: 'Times New Roman', Times, serif;
        ">🔄 Cambiar</button>
    `;
    
    return badge;
}

window.cambiarGradoDesdeEstudiante = function() {
    if (confirm('¿Desea cambiar de grado? Se guardarán los datos actuales.')) {
        if (typeof AuthSystem !== 'undefined') {
            const sesion = AuthSystem.obtenerSesion();
            if (sesion && sesion.cedula) {
                AuthSystem.eliminarGradoSeleccionado(sesion.cedula);
            }
        }
        window.top.location.href = 'login.html?action=select_grado';
    }
};

// ============================================
// CLAVE DE STORAGE AISLADA POR GRUPO
// ============================================
function obtenerClaveStorageEstudiante() {
    const grupo = obtenerGrupoActual();
    return `datosEstudiante_${grupo.grado}_${grupo.seccion}_${grupo.tanda}`
        .replace(/\s+/g, '_')
        .toUpperCase();
}

// ============================================
// LEER ESTUDIANTES DEL FORMULARIO (FILTRADO ROBUSTO)
// ============================================
function obtenerEstudiantesFiltrados() {
    try {
        const stored = localStorage.getItem('registrosSigerd');
        if (!stored) {
            console.log('ℹ️ No hay registros en localStorage');
            return [];
        }
        
        const registros = JSON.parse(stored);
        if (!Array.isArray(registros) || registros.length === 0) {
            console.log('ℹ️ No hay registros en el array');
            return [];
        }

        const grupo = obtenerGrupoActual();
        const gradoActual = normalizarTexto(grupo.grado);
        const seccionActual = normalizarTexto(grupo.seccion);
        const tandaActual = normalizarTexto(grupo.tanda);

        console.log(`🔍 Filtrando por: Grado="${gradoActual}", Sección="${seccionActual}", Tanda="${tandaActual}"`);
        console.log(`📊 Total de registros en localStorage: ${registros.length}`);

        const filtrados = registros.filter(r => {
            const gradoRegistro = normalizarTexto(r.grado);
            const seccionRegistro = normalizarTexto(r.seccion);
            const tandaRegistro = normalizarTexto(r.tanda);

            if (!gradoRegistro) return false;

            const coincideGrado = gradoRegistro === gradoActual;
            const coincideSeccion = seccionRegistro === seccionActual;
            const coincideTanda = !tandaRegistro || tandaRegistro === tandaActual;

            return coincideGrado && coincideSeccion && coincideTanda;
        });

        filtrados.sort((a, b) => (parseInt(a.orden) || 0) - (parseInt(b.orden) || 0));

        console.log(`✅ ${filtrados.length} estudiantes filtrados para: ${grupo.grado}, Sección: ${grupo.seccion}, Tanda: ${grupo.tanda}`);
        
        estudiantesCargados = filtrados;
        return filtrados;
    } catch (e) {
        console.error('❌ Error obteniendo estudiantes filtrados:', e);
        return [];
    }
}

// ============================================
// FUNCIONES DE PERSISTENCIA (localStorage)
// ============================================
function guardarDatosEstudiante(pagina, fila, columna, valor) {
    try {
        const CLAVE = obtenerClaveStorageEstudiante();
        let datos = JSON.parse(localStorage.getItem(CLAVE)) || {};
        if (!datos[pagina]) datos[pagina] = {};
        if (!datos[pagina][fila]) datos[pagina][fila] = {};
        datos[pagina][fila][columna] = valor;
        localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch (e) {
        console.error('Error al guardar:', e);
    }
}

function cargarDatosEstudiante() {
    try {
        const CLAVE = obtenerClaveStorageEstudiante();
        const datos = localStorage.getItem(CLAVE);
        return datos ? JSON.parse(datos) : null;
    } catch (e) {
        console.error('Error al cargar:', e);
        return null;
    }
}

function limpiarDatosEstudiante() {
    try {
        const CLAVE = obtenerClaveStorageEstudiante();
        localStorage.removeItem(CLAVE);
    } catch (e) {
        console.error('Error al limpiar:', e);
    }
}

// ============================================
// CREAR ELEMENTOS CON ESTILOS
// ============================================
function crearInputTexto(placeholder, className, uppercase, pagina, fila, columna) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = className || 'input-editable';
    if (placeholder) input.placeholder = placeholder;
    input.style.cssText = `width: 100%; border: none; border-bottom: 1.5px solid transparent; background: transparent; font-family: 'Times New Roman', Times, serif; font-size: 12px; outline: none; color: #1a2a4a; text-align: center; padding: 2px 2px;`;

    if (pagina && fila !== undefined && columna) {
        input.dataset.pagina = pagina;
        input.dataset.fila = fila;
        input.dataset.columna = columna;
    }

    input.addEventListener('input', function() {
        if (this.dataset.pagina && this.dataset.fila !== undefined && this.dataset.columna) {
            guardarDatosEstudiante(
                this.dataset.pagina,
                parseInt(this.dataset.fila),
                this.dataset.columna,
                this.value
            );
        }
        if (uppercase !== false) {
            this.value = this.value.toUpperCase();
        }
    });

    if (uppercase !== false) {
        input.addEventListener('blur', function() {
            this.value = this.value.toUpperCase();
            if (this.dataset.pagina && this.dataset.fila !== undefined && this.dataset.columna) {
                guardarDatosEstudiante(
                    this.dataset.pagina,
                    parseInt(this.dataset.fila),
                    this.dataset.columna,
                    this.value
                );
            }
        });
    }
    return input;
}

function crearCheckbox(clase, dataset, datasetValor, pagina, fila, columna) {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = clase;
    if (dataset) cb.dataset[dataset] = datasetValor;
    cb.style.cssText = `width: 16px; height: 16px; cursor: default; margin: 0 auto; display: block; pointer-events: none;`;

    if (pagina && fila !== undefined && columna) {
        cb.dataset.pagina = pagina;
        cb.dataset.fila = fila;
        cb.dataset.columna = columna;
    }

    cb.addEventListener('change', function() {
        if (this.dataset.pagina && this.dataset.fila !== undefined && this.dataset.columna) {
            guardarDatosEstudiante(
                this.dataset.pagina,
                parseInt(this.dataset.fila),
                this.dataset.columna,
                this.checked ? 'true' : 'false'
            );
        }
    });
    return cb;
}

function crearSelect(opciones, className, pagina, fila, columna) {
    const select = document.createElement('select');
    select.className = className || 'select-generico';
    select.style.cssText = `width: 100%; border: none; background: transparent; font-family: 'Times New Roman', Times, serif; font-size: 12px; outline: none; color: #1a2a4a; text-align: center; cursor: default; padding: 0 2px; pointer-events: none;`;

    const optionEmpty = document.createElement('option');
    optionEmpty.value = '';
    optionEmpty.textContent = '';
    select.appendChild(optionEmpty);

    opciones.forEach(function(opcion) {
        const option = document.createElement('option');
        option.value = opcion;
        option.textContent = opcion;
        select.appendChild(option);
    });

    if (pagina && fila !== undefined && columna) {
        select.dataset.pagina = pagina;
        select.dataset.fila = fila;
        select.dataset.columna = columna;
    }

    select.addEventListener('change', function() {
        if (this.dataset.pagina && this.dataset.fila !== undefined && this.dataset.columna) {
            guardarDatosEstudiante(
                this.dataset.pagina,
                parseInt(this.dataset.fila),
                this.dataset.columna,
                this.value
            );
        }
    });
    return select;
}

// ============================================
// DESHABILITAR TODOS LOS CAMPOS (SOLO LECTURA CON APARIENCIA VIVA)
// ============================================
function deshabilitarTodosLosCampos() {
    console.log('🔒 Aplicando modo SOLO LECTURA con apariencia viva...');
    
    document.querySelectorAll('input:not([readonly])').forEach(input => {
        input.readOnly = true;
        input.disabled = true;
        input.style.cursor = 'default';
        input.style.color = '#1a2a4a';
        input.style.opacity = '1';
        input.style.background = 'transparent';
        input.style.borderBottomColor = '#a0b8d0';
        input.style.borderBottomWidth = '1.5px';
    });

    document.querySelectorAll('select').forEach(select => {
        select.disabled = true;
        select.style.cursor = 'default';
        select.style.color = '#1a2a4a';
        select.style.opacity = '1';
        select.style.background = 'transparent';
        select.style.pointerEvents = 'none';
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.disabled = true;
        cb.style.cursor = 'default';
        cb.style.opacity = '1';
        cb.style.pointerEvents = 'none';
    });

    document.querySelectorAll('.botones-pagina10, .botones-pagina11, .botones-pagina12').forEach(div => {
        div.style.display = 'none';
    });
}

// ============================================
// RESTAURAR DATOS GUARDADOS
// ============================================
function restaurarDatosPagina(pagina) {
    const datos = cargarDatosEstudiante();
    if (!datos || !datos[pagina]) return;

    const elementos = document.querySelectorAll(`[data-pagina="${pagina}"]`);
    elementos.forEach(function(el) {
        const fila = parseInt(el.dataset.fila);
        const columna = el.dataset.columna;
        if (datos[pagina][fila] && datos[pagina][fila][columna] !== undefined) {
            const valor = datos[pagina][fila][columna];
            if (el.type === 'checkbox') {
                el.checked = (valor === 'true');
            } else if (el.tagName === 'SELECT') {
                el.value = valor;
            } else {
                el.value = valor;
            }
        }
    });
}

// ============================================
// PRE-LLENAR DATOS DESDE EL FORMULARIO (COMPLETO)
// ============================================
function prellenarDesdeFormulario(pagina) {
    const estudiantes = obtenerEstudiantesFiltrados();
    
    limpiarFilasPagina(pagina);
    
    if (estudiantes.length === 0) {
        console.log(`ℹ️ No hay estudiantes para pre-llenar en ${pagina}`);
        return;
    }

    console.log(`📝 Pre-llenando ${pagina} con ${estudiantes.length} estudiantes...`);

    estudiantes.forEach(function(est, index) {
        const fila = parseInt(est.orden) || (index + 1);
        
        if (fila > TOTAL_FILAS) {
            console.warn(`⚠️ Estudiante con orden ${fila} excede las ${TOTAL_FILAS} filas disponibles`);
            return;
        }

        if (pagina === 'pagina10') {
            prellenarPagina10(est, fila);
        } else if (pagina === 'pagina11') {
            prellenarPagina11(est, fila);
        } else if (pagina === 'pagina12') {
            prellenarPagina12(est, fila);
        }
    });

    console.log(`✅ ${estudiantes.length} estudiantes pre-llenados en ${pagina}`);
}

// ============================================
// PRE-LLENAR PÁGINA 10 - NACIONALIDAD DIRECTA DEL FORMULARIO
// ============================================
function prellenarPagina10(est, fila) {
    // 1. NOMBRE COMPLETO
    const inputNombre = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="nombre"]`);
    if (inputNombre) {
        const nombreCompleto = `${est.nombre || ''} ${est.apellido || ''}`.trim().toUpperCase();
        inputNombre.value = nombreCompleto;
        guardarDatosEstudiante('pagina10', fila, 'nombre', nombreCompleto);
    }

    // 2. NACIONALIDAD - DIRECTAMENTE DEL FORMULARIO (DOMINICANO/A, HAITIANO/A, etc.)
    // ✅ AHORA SE USA INPUT TEXTO EN VEZ DE SELECT PARA NACIONALIDAD
    const nacionalidad = String(est.nacionalidad || '').toUpperCase().trim();
    console.log(`📍 Fila ${fila}: Nacionalidad desde formulario = "${nacionalidad}"`);
    
    // Buscar el input de nacionalidad (ahora es un input de texto)
    const inputNac = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="nacionalidad"]`);
    if (inputNac) {
        inputNac.value = nacionalidad;
        guardarDatosEstudiante('pagina10', fila, 'nacionalidad', nacionalidad);
        console.log(`✅ Fila ${fila}: Nacionalidad asignada: "${nacionalidad}"`);
    }

    // 3. SEXO
    const cbFem = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="sexo_femenino"]`);
    const cbMasc = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="sexo_masculino"]`);
    if (est.sexo === 'FEMENINO') {
        if (cbFem) { cbFem.checked = true; guardarDatosEstudiante('pagina10', fila, 'sexo_femenino', 'true'); }
        if (cbMasc) { cbMasc.checked = false; guardarDatosEstudiante('pagina10', fila, 'sexo_masculino', 'false'); }
    } else if (est.sexo === 'MASCULINO') {
        if (cbMasc) { cbMasc.checked = true; guardarDatosEstudiante('pagina10', fila, 'sexo_masculino', 'true'); }
        if (cbFem) { cbFem.checked = false; guardarDatosEstudiante('pagina10', fila, 'sexo_femenino', 'false'); }
    }

    // 4. FECHA DE NACIMIENTO
    if (est.fechaNac) {
        const partes = est.fechaNac.split('/');
        if (partes.length === 3) {
            const inputDia = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="fecha_dia"]`);
            const inputMes = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="fecha_mes"]`);
            const inputAnio = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="fecha_anio"]`);

            if (inputDia) {
                const dia = String(parseInt(partes[0], 10)).padStart(2, '0');
                inputDia.value = dia;
                guardarDatosEstudiante('pagina10', fila, 'fecha_dia', dia);
            }
            if (inputMes) {
                const mes = String(parseInt(partes[1], 10)).padStart(2, '0');
                inputMes.value = mes;
                guardarDatosEstudiante('pagina10', fila, 'fecha_mes', mes);
            }
            if (inputAnio) {
                const anioCompleto = parseInt(partes[2], 10);
                if (!isNaN(anioCompleto)) {
                    const anio = String(anioCompleto % 100).padStart(2, '0');
                    inputAnio.value = anio;
                    guardarDatosEstudiante('pagina10', fila, 'fecha_anio', anio);
                }
            }
            recalcularEdadFila(fila);
        }
    }

    // 5. EDAD
    const inputEdad = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="edad"]`);
    if (inputEdad && !inputEdad.value && est.edad) {
        const edadNum = parseInt(est.edad, 10);
        if (!isNaN(edadNum)) {
            inputEdad.value = String(edadNum);
            guardarDatosEstudiante('pagina10', fila, 'edad', String(edadNum));
        }
    }

    // 6. LIBRO
    const inputLibro = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="libro"]`);
    if (inputLibro && est.libro) {
        inputLibro.value = String(est.libro).toUpperCase();
        guardarDatosEstudiante('pagina10', fila, 'libro', String(est.libro).toUpperCase());
    }

    // 7. FOLIO
    const inputFolio = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="folio"]`);
    if (inputFolio && est.folio) {
        inputFolio.value = String(est.folio).toUpperCase();
        guardarDatosEstudiante('pagina10', fila, 'folio', String(est.folio).toUpperCase());
    }

    // 8. PARENTESCO
    if (est.parentesco) {
        const selectPar = document.querySelector(`select[data-pagina="pagina10"][data-fila="${fila}"][data-columna="parentesco"]`);
        if (selectPar) {
            selectPar.value = est.parentesco;
            guardarDatosEstudiante('pagina10', fila, 'parentesco', est.parentesco);
        }
    }
}

// ============================================
// PRE-LLENAR PÁGINA 11
// ============================================
function prellenarPagina11(est, fila) {
    const inputDir = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="direccion"]`);
    if (inputDir && est.direccion) {
        inputDir.value = String(est.direccion).toUpperCase();
        guardarDatosEstudiante('pagina11', fila, 'direccion', String(est.direccion).toUpperCase());
    }

    if (est.nuevoDia) {
        const inputNuevoDia = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="nuevo_dia"]`);
        if (inputNuevoDia) {
            inputNuevoDia.value = String(est.nuevoDia).padStart(2, '0');
            guardarDatosEstudiante('pagina11', fila, 'nuevo_dia', String(est.nuevoDia).padStart(2, '0'));
        }
    }
    if (est.nuevoMes) {
        const inputNuevoMes = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="nuevo_mes"]`);
        if (inputNuevoMes) {
            inputNuevoMes.value = String(est.nuevoMes).padStart(2, '0');
            guardarDatosEstudiante('pagina11', fila, 'nuevo_mes', String(est.nuevoMes).padStart(2, '0'));
        }
    }
    if (est.nuevoAnio) {
        const inputNuevoAnio = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="nuevo_anio"]`);
        if (inputNuevoAnio) {
            const anioCorto = String(parseInt(est.nuevoAnio, 10) % 100).padStart(2, '0');
            inputNuevoAnio.value = anioCorto;
            guardarDatosEstudiante('pagina11', fila, 'nuevo_anio', anioCorto);
        }
    }

    if (est.retiradoDia) {
        const inputRetiradoDia = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="retirado_dia"]`);
        if (inputRetiradoDia) {
            inputRetiradoDia.value = String(est.retiradoDia).padStart(2, '0');
            guardarDatosEstudiante('pagina11', fila, 'retirado_dia', String(est.retiradoDia).padStart(2, '0'));
        }
    }
    if (est.retiradoMes) {
        const inputRetiradoMes = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="retirado_mes"]`);
        if (inputRetiradoMes) {
            inputRetiradoMes.value = String(est.retiradoMes).padStart(2, '0');
            guardarDatosEstudiante('pagina11', fila, 'retirado_mes', String(est.retiradoMes).padStart(2, '0'));
        }
    }
    if (est.retiradoAnio) {
        const inputRetiradoAnio = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="retirado_anio"]`);
        if (inputRetiradoAnio) {
            const anioCorto = String(parseInt(est.retiradoAnio, 10) % 100).padStart(2, '0');
            inputRetiradoAnio.value = anioCorto;
            guardarDatosEstudiante('pagina11', fila, 'retirado_anio', anioCorto);
        }
    }

    if (est.condicion) {
        const condicionMap = {
            'NUEVO INGRESO': 0,
            'PROMOVIDO': 1,
            'REENTRANTE': 2
        };
        const idx = condicionMap[est.condicion.toUpperCase()];
        if (idx !== undefined) {
            const cb = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="condicion_${idx}"]`);
            if (cb) {
                cb.checked = true;
                guardarDatosEstudiante('pagina11', fila, 'condicion_' + idx, 'true');
                guardarDatosEstudiante('pagina11', fila, 'condicion_seleccionada', idx.toString());
            }
        }
    }

    if (est.preprimario) {
        const preMap = {
            'SI': 'preprimario_si',
            'NO': 'preprimario_no'
        };
        const columna = preMap[est.preprimario.toUpperCase()];
        if (columna) {
            const cb = document.querySelector(`input[data-pagina="pagina11"][data-fila="${fila}"][data-columna="${columna}"]`);
            if (cb) {
                cb.checked = true;
                guardarDatosEstudiante('pagina11', fila, columna, 'true');
                guardarDatosEstudiante('pagina11', fila, 'preprimario_seleccionado', est.preprimario.toLowerCase());
            }
        }
    }
}

// ============================================
// PRE-LLENAR PÁGINA 12
// ============================================
function prellenarPagina12(est, fila) {
    const inputNeae = document.querySelector(`input[data-pagina="pagina12"][data-fila="${fila}"][data-columna="neae"]`);
    if (inputNeae && est.neae) {
        inputNeae.value = String(est.neae).toUpperCase();
        guardarDatosEstudiante('pagina12', fila, 'neae', String(est.neae).toUpperCase());
    }

    const inputEnfermedades = document.querySelector(`input[data-pagina="pagina12"][data-fila="${fila}"][data-columna="enfermedades"]`);
    if (inputEnfermedades && est.enfermedades) {
        inputEnfermedades.value = String(est.enfermedades).toUpperCase();
        guardarDatosEstudiante('pagina12', fila, 'enfermedades', String(est.enfermedades).toUpperCase());
    }

    const inputMedicamentos = document.querySelector(`input[data-pagina="pagina12"][data-fila="${fila}"][data-columna="medicamentos"]`);
    if (inputMedicamentos && est.medicamentos) {
        inputMedicamentos.value = String(est.medicamentos).toUpperCase();
        guardarDatosEstudiante('pagina12', fila, 'medicamentos', String(est.medicamentos).toUpperCase());
    }

    const inputEmergenciaNombre = document.querySelector(`input[data-pagina="pagina12"][data-fila="${fila}"][data-columna="emergencia_nombre"]`);
    if (inputEmergenciaNombre && est.emergenciaNombre) {
        inputEmergenciaNombre.value = String(est.emergenciaNombre).toUpperCase();
        guardarDatosEstudiante('pagina12', fila, 'emergencia_nombre', String(est.emergenciaNombre).toUpperCase());
    } else if (inputEmergenciaNombre && est.tutorTipo) {
        inputEmergenciaNombre.value = String(est.tutorTipo).toUpperCase();
        guardarDatosEstudiante('pagina12', fila, 'emergencia_nombre', String(est.tutorTipo).toUpperCase());
    }

    const inputEmergenciaTelefono = document.querySelector(`input[data-pagina="pagina12"][data-fila="${fila}"][data-columna="emergencia_telefono"]`);
    if (inputEmergenciaTelefono) {
        let telefono = '';
        if (est.emergenciaTelefono) {
            telefono = String(est.emergenciaTelefono);
        } else if (est.tutorTelefono) {
            telefono = String(est.tutorTelefono);
        } else if (est.telefono) {
            telefono = String(est.telefono);
        }
        
        let telLimpio = telefono.replace(/\D/g, '');
        if (telLimpio.length === 10) {
            telLimpio = telLimpio.substring(0, 3) + '-' + telLimpio.substring(3, 6) + '-' + telLimpio.substring(6, 10);
            inputEmergenciaTelefono.value = telLimpio;
            inputEmergenciaTelefono.style.borderBottomColor = '#28a745';
            inputEmergenciaTelefono.style.borderBottomWidth = '2px';
            guardarDatosEstudiante('pagina12', fila, 'emergencia_telefono', telLimpio);
        } else if (telLimpio.length > 0) {
            inputEmergenciaTelefono.value = telLimpio;
            inputEmergenciaTelefono.style.borderBottomColor = '#dc3545';
            inputEmergenciaTelefono.style.borderBottomWidth = '2px';
            guardarDatosEstudiante('pagina12', fila, 'emergencia_telefono', telLimpio);
        }
    }
}

// ============================================
// LIMPIAR FILAS DE UNA PÁGINA
// ============================================
function limpiarFilasPagina(pagina) {
    console.log(`🧹 Limpiando filas de ${pagina}...`);
    
    document.querySelectorAll(`[data-pagina="${pagina}"]`).forEach(function(el) {
        if (el.type === 'checkbox') {
            el.checked = false;
        } else if (el.tagName === 'SELECT') {
            el.value = '';
        } else if (el.tagName === 'INPUT') {
            el.value = '';
            el.style.borderBottomColor = 'transparent';
            el.style.borderBottomWidth = '1.5px';
        }
    });
}

// ============================================
// RECALCULAR EDAD DE UNA FILA
// ============================================
function recalcularEdadFila(fila) {
    const diaInput = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="fecha_dia"]`);
    const mesInput = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="fecha_mes"]`);
    const anioInput = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="fecha_anio"]`);
    const inputEdad = document.querySelector(`input[data-pagina="pagina10"][data-fila="${fila}"][data-columna="edad"]`);
    if (!diaInput || !mesInput || !anioInput || !inputEdad) return;

    const dia = parseInt(diaInput.value, 10);
    const mes = parseInt(mesInput.value, 10);
    const anioCorto = parseInt(anioInput.value, 10);

    if (isNaN(dia) || isNaN(mes) || isNaN(anioCorto) ||
        diaInput.value === '' || mesInput.value === '' || anioInput.value === '') {
        inputEdad.value = '';
        return;
    }

    if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || anioCorto < 0 || anioCorto > 99) {
        inputEdad.value = '';
        return;
    }

    let anioCompleto;
    if (anioCorto >= 60 && anioCorto <= 99) {
        anioCompleto = 1900 + anioCorto;
    } else {
        anioCompleto = 2000 + anioCorto;
    }

    const fechaNacimiento = new Date(anioCompleto, mes - 1, dia);
    if (fechaNacimiento.getDate() !== dia ||
        fechaNacimiento.getMonth() !== mes - 1 ||
        fechaNacimiento.getFullYear() !== anioCompleto) {
        inputEdad.value = '';
        return;
    }

    const fechaActual = new Date();
    let edad = fechaActual.getFullYear() - fechaNacimiento.getFullYear();
    const m = fechaActual.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && fechaActual.getDate() < fechaNacimiento.getDate())) {
        edad--;
    }

    if (edad >= 0 && edad <= 120) {
        inputEdad.value = edad;
        inputEdad.style.color = '#1a2a4a';
        guardarDatosEstudiante('pagina10', fila, 'edad', edad.toString());
    } else {
        inputEdad.value = '';
        inputEdad.style.color = '#dc3545';
    }
}

// ============================================
// SINCRONIZAR TODAS LAS PÁGINAS
// ============================================
function sincronizarConFormulario() {
    if (sincronizando) {
        console.log('⏳ Ya hay una sincronización en curso, omitiendo...');
        return;
    }
    
    const ahora = Date.now();
    if (ahora - ultimaSincronizacion < 500) {
        console.log('⏳ Sincronización demasiado rápida, omitiendo...');
        return;
    }
    
    sincronizando = true;
    ultimaSincronizacion = ahora;
    
    console.log('🔄 INICIANDO SINCRONIZACIÓN CON EL FORMULARIO...');
    
    try {
        const grupo = obtenerGrupoActual();
        const estudiantes = obtenerEstudiantesFiltrados();
        
        console.log(`📊 ${estudiantes.length} estudiantes encontrados para: ${grupo.grado} - ${grupo.seccion} - ${grupo.tanda}`);
        
        const container10 = document.getElementById('pagina10-container');
        const container11 = document.getElementById('pagina11-container');
        const container12 = document.getElementById('pagina12-container');
        
        if (!container10 || !container11 || !container12) {
            console.error('❌ No se encontraron los contenedores de las páginas');
            mostrarMensajeEstudiante('❌ Error: No se encontraron los contenedores de las páginas', 'error');
            sincronizando = false;
            return;
        }
        
        limpiarDatosEstudiante();
        
        console.log('🔄 Regenerando Página 10...');
        window.generarPagina10();
        console.log('✅ Página 10 regenerada');
        
        console.log('🔄 Regenerando Página 11...');
        window.generarPagina11();
        console.log('✅ Página 11 regenerada');
        
        console.log('🔄 Regenerando Página 12...');
        window.generarPagina12();
        console.log('✅ Página 12 regenerada');
        
        estudiantesCargados = estudiantes;
        
        const mensaje = `✅ Sincronizado: ${estudiantes.length} estudiantes en ${grupo.grado} · Sección ${grupo.seccion} · ${grupo.tanda}`;
        mostrarMensajeEstudiante(mensaje, 'success');
        console.log('✅ SINCRONIZACIÓN COMPLETADA:', mensaje);
        
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        mostrarMensajeEstudiante('❌ Error al sincronizar: ' + error.message, 'error');
    }
    
    sincronizando = false;
}

window.sincronizarConFormulario = sincronizarConFormulario;

// ============================================
// MOSTRAR MENSAJES
// ============================================
function mostrarMensajeEstudiante(mensaje, tipo) {
    const mensajeAnterior = document.querySelector('.mensaje-flotante-estudiante');
    if (mensajeAnterior) { mensajeAnterior.remove(); }

    const div = document.createElement('div');
    div.className = 'mensaje-flotante-estudiante';
    div.textContent = mensaje;
    div.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-family: 'Times New Roman', serif;
        font-size: 14px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        max-width: 90%;
        text-align: center;
        animation: slideDown 0.3s ease;
    `;

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
    document.body.appendChild(div);

    setTimeout(function() {
        if (div && div.parentNode) {
            div.style.opacity = '0';
            div.style.transition = 'opacity 0.3s ease';
            setTimeout(function() { 
                if (div.parentNode) div.remove(); 
            }, 300);
        }
    }, 5000);
}

// ============================================
// 1. GENERAR PÁGINA 10 - CON INPUT PARA NACIONALIDAD
// ============================================
window.generarPagina10 = function() {
    console.log('📄 Generando Página 10...');
    const container = document.getElementById('pagina10-container');

    if (!container) {
        console.error('❌ No se encontró #pagina10-container');
        return;
    }

    container.innerHTML = '';

    container.appendChild(crearBadgeAsignacion());

    const titulo = document.createElement('div');
    titulo.className = 'titulo-pagina';
    titulo.textContent = 'Datos generales de la o del estudiante';
    container.appendChild(titulo);

    const subtitulo = document.createElement('div');
    subtitulo.className = 'subtitulo';
    subtitulo.textContent = 'Inscribir los y las estudiantes por orden alfabético según los nombres.';
    container.appendChild(subtitulo);

    const tablaContainer = document.createElement('div');
    tablaContainer.className = 'tabla-container';
    container.appendChild(tablaContainer);

    const tabla = document.createElement('table');
    tabla.className = 'tabla-estudiantes';
    tablaContainer.appendChild(tabla);

    const thead = document.createElement('thead');
    tabla.appendChild(thead);

    const tr1 = document.createElement('tr');
    thead.appendChild(tr1);

    let th = document.createElement('th');
    th.rowSpan = 2;
    th.className = 'col-orden';
    const span1 = document.createElement('span');
    span1.className = 'texto-vertical-orden';
    span1.textContent = 'N° de orden';
    th.appendChild(span1);
    tr1.appendChild(th);

    th = document.createElement('th');
    th.rowSpan = 2;
    th.className = 'col-nombre';
    th.textContent = 'Nombre(s) y Apellido(s)';
    tr1.appendChild(th);

    th = document.createElement('th');
    th.rowSpan = 2;
    th.className = 'col-nacionalidad';
    th.textContent = 'Nacionalidad';
    tr1.appendChild(th);

    th = document.createElement('th');
    th.colSpan = 2;
    th.className = 'col-sexo';
    th.textContent = 'Sexo';
    tr1.appendChild(th);

    th = document.createElement('th');
    th.colSpan = 6;
    th.className = 'col-fecha';
    th.textContent = 'Fecha de nacimiento';
    tr1.appendChild(th);

    th = document.createElement('th');
    th.rowSpan = 2;
    th.className = 'col-parentesco';
    th.textContent = 'Parentesco de la persona con quien vive';
    tr1.appendChild(th);

    const tr2 = document.createElement('tr');
    thead.appendChild(tr2);

    const subSexos = ['Femenino', 'Masculino'];
    subSexos.forEach(texto => {
        let th2 = document.createElement('th');
        th2.className = 'col-sexo-sub';
        const span2 = document.createElement('span');
        span2.className = 'texto-vertical';
        span2.textContent = texto;
        th2.appendChild(span2);
        tr2.appendChild(th2);
    });

    const subFechas = ['Día', 'Mes', 'Año', 'Libro', 'Folio', 'Edad'];
    subFechas.forEach(texto => {
        let th2 = document.createElement('th');
        th2.className = 'col-fecha-sub';
        const span2 = document.createElement('span');
        span2.className = 'texto-vertical';
        span2.textContent = texto;
        th2.appendChild(span2);
        tr2.appendChild(th2);
    });

    const tbody = document.createElement('tbody');
    tabla.appendChild(tbody);

    for (let i = 1; i <= TOTAL_FILAS; i++) {
        const tr = document.createElement('tr');

        const tdOrden = document.createElement('td');
        tdOrden.className = 'col-orden';
        tdOrden.textContent = i;
        tr.appendChild(tdOrden);

        const tdNombre = document.createElement('td');
        tdNombre.className = 'col-nombre';
        tdNombre.style.cssText = 'padding: 0px; vertical-align: middle; text-align: left; padding-left: 3px;';
        const inputNombre = crearInputTexto('', 'input-editable', true, 'pagina10', i, 'nombre');
        inputNombre.style.textAlign = 'left';
        tdNombre.appendChild(inputNombre);
        tr.appendChild(tdNombre);

        // ✅ NACIONALIDAD - INPUT TEXTO (no select)
        const tdNacionalidad = document.createElement('td');
        tdNacionalidad.className = 'col-nacionalidad';
        tdNacionalidad.style.cssText = 'padding: 0px; vertical-align: middle;';
        const inputNacionalidad = crearInputTexto('', 'input-editable', true, 'pagina10', i, 'nacionalidad');
        tdNacionalidad.appendChild(inputNacionalidad);
        tr.appendChild(tdNacionalidad);

        const tdFemenino = document.createElement('td');
        tdFemenino.className = 'col-sexo-sub';
        tdFemenino.style.cssText = 'padding: 0px; text-align: center; vertical-align: middle;';
        const cbFemenino = crearCheckbox('checkbox-sexo', 'sexo', 'femenino', 'pagina10', i, 'sexo_femenino');
        tdFemenino.appendChild(cbFemenino);
        tr.appendChild(tdFemenino);

        const tdMasculino = document.createElement('td');
        tdMasculino.className = 'col-sexo-sub';
        tdMasculino.style.cssText = 'padding: 0px; text-align: center; vertical-align: middle;';
        const cbMasculino = crearCheckbox('checkbox-sexo', 'sexo', 'masculino', 'pagina10', i, 'sexo_masculino');
        tdMasculino.appendChild(cbMasculino);
        tr.appendChild(tdMasculino);

        cbFemenino.addEventListener('change', function() {
            if (this.checked) { cbMasculino.checked = false; }
        });
        cbMasculino.addEventListener('change', function() {
            if (this.checked) { cbFemenino.checked = false; }
        });

        const fechaColumnas = ['dia', 'mes', 'anio'];
        fechaColumnas.forEach(function(col) {
            const td = document.createElement('td');
            td.className = 'col-fecha-sub';
            td.style.cssText = 'padding: 0px; vertical-align: middle;';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'input-fecha-' + col;
            input.maxLength = 2;
            input.dataset.pagina = 'pagina10';
            input.dataset.fila = i;
            input.dataset.columna = 'fecha_' + col;
            input.style.cssText = `
                width: 100%;
                border: none;
                border-bottom: 1.5px solid transparent;
                background: transparent;
                font-family: 'Times New Roman', Times, serif;
                font-size: 12px;
                text-align: center;
                outline: none;
                color: #1a2a4a;
                padding: 0 2px;
            `;

            input.addEventListener('input', function() {
                guardarDatosEstudiante('pagina10', i, 'fecha_' + col, this.value);
                recalcularEdadFila(i);
            });
            input.addEventListener('blur', function() {
                recalcularEdadFila(i);
            });

            td.appendChild(input);
            tr.appendChild(td);
        });

        const tdLibro = document.createElement('td');
        tdLibro.className = 'col-fecha-sub';
        tdLibro.style.cssText = 'padding: 0px; vertical-align: middle;';
        const inputLibro = crearInputTexto('', 'input-editable', true, 'pagina10', i, 'libro');
        tdLibro.appendChild(inputLibro);
        tr.appendChild(tdLibro);

        const tdFolio = document.createElement('td');
        tdFolio.className = 'col-fecha-sub';
        tdFolio.style.cssText = 'padding: 0px; vertical-align: middle;';
        const inputFolio = crearInputTexto('', 'input-editable', true, 'pagina10', i, 'folio');
        tdFolio.appendChild(inputFolio);
        tr.appendChild(tdFolio);

        const tdEdad = document.createElement('td');
        tdEdad.className = 'col-fecha-sub';
        tdEdad.style.cssText = 'padding: 0px; vertical-align: middle;';
        const inputEdad = document.createElement('input');
        inputEdad.type = 'text';
        inputEdad.className = 'input-edad';
        inputEdad.readOnly = true;
        inputEdad.dataset.pagina = 'pagina10';
        inputEdad.dataset.fila = i;
        inputEdad.dataset.columna = 'edad';
        inputEdad.style.cssText = `
            width: 100%;
            border: none;
            background: transparent;
            font-family: 'Times New Roman', Times, serif;
            font-size: 12px;
            text-align: center;
            color: #1a2a4a;
            font-weight: bold;
            outline: none;
            padding: 0 2px;
        `;
        tdEdad.appendChild(inputEdad);
        tr.appendChild(tdEdad);

        const tdParentesco = document.createElement('td');
        tdParentesco.className = 'col-parentesco';
        tdParentesco.style.cssText = 'padding: 0px; vertical-align: middle;';
        const selectPar = crearSelect(PARENTESCOS, 'select-parentesco', 'pagina10', i, 'parentesco');
        tdParentesco.appendChild(selectPar);
        tr.appendChild(tdParentesco);

        tbody.appendChild(tr);
    }

    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.textContent = 'Ministerio de Educación • República Dominicana';
    container.appendChild(watermark);

    agregarBotonesPagina10(container);

    prellenarDesdeFormulario('pagina10');
    restaurarDatosPagina('pagina10');

    deshabilitarTodosLosCampos();

    console.log('✅ Página 10 generada correctamente');
};

// ============================================
// 2. GENERAR PÁGINA 11
// ============================================
window.generarPagina11 = function() {
    console.log('📄 Generando Página 11...');
    const container = document.getElementById('pagina11-container');

    if (!container) {
        console.error('❌ No se encontró #pagina11-container');
        return;
    }

    container.innerHTML = '';

    container.appendChild(crearBadgeAsignacion());

    const titulo = document.createElement('div');
    titulo.className = 'titulo-pagina';
    titulo.textContent = 'Datos generales de la o del estudiante';
    container.appendChild(titulo);

    const subtitulo = document.createElement('div');
    subtitulo.className = 'subtitulo';
    subtitulo.textContent = 'Inscribir los y las estudiantes por orden alfabético según los nombres.';
    container.appendChild(subtitulo);

    const tablaContainer = document.createElement('div');
    tablaContainer.className = 'tabla-container';
    container.appendChild(tablaContainer);

    const tabla = document.createElement('table');
    tabla.className = 'tabla-estudiantes tabla-pagina11';
    tablaContainer.appendChild(tabla);

    const thead = document.createElement('thead');
    tabla.appendChild(thead);

    const tr1 = document.createElement('tr');
    thead.appendChild(tr1);

    const headersRow1 = [
        { text: 'N° de orden', rowspan: 2, class: 'col-orden-p11', vertical: true },
        { text: 'Dirección donde reside', rowspan: 2, class: 'col-direccion', vertical: false },
        { text: 'Nuevo inscrito', colspan: 3, class: 'col-nuevo', vertical: false },
        { text: 'Retirado', colspan: 3, class: 'col-retirado', vertical: false },
        { text: 'Condición inicial', colspan: 3, class: 'col-condicion', vertical: false },
        { text: 'Realizó el Preprimario', colspan: 2, class: 'col-preprimario', vertical: false }
    ];

    headersRow1.forEach(function(h) {
        const th = document.createElement('th');
        if (h.rowspan) th.rowSpan = h.rowspan;
        if (h.colspan) th.colSpan = h.colspan;
        if (h.class) th.className = h.class;
        if (h.vertical) {
            const span = document.createElement('span');
            span.className = 'texto-vertical-orden';
            span.textContent = h.text;
            th.appendChild(span);
        } else {
            th.textContent = h.text;
        }
        tr1.appendChild(th);
    });

    const tr2 = document.createElement('tr');
    thead.appendChild(tr2);

    const headersRow2 = [
        { text: 'Día', class: 'col-fecha-sub', vertical: true },
        { text: 'Mes', class: 'col-fecha-sub', vertical: true },
        { text: 'Año', class: 'col-fecha-sub', vertical: true },
        { text: 'Día', class: 'col-fecha-sub', vertical: true },
        { text: 'Mes', class: 'col-fecha-sub', vertical: true },
        { text: 'Año', class: 'col-fecha-sub', vertical: true },
        { text: 'Nuevo ingreso', class: 'col-condicion-sub', vertical: true },
        { text: 'Promovido', class: 'col-condicion-sub', vertical: true },
        { text: 'Reentrante', class: 'col-condicion-sub', vertical: true },
        { text: 'Sí', class: 'col-preprimario-sub', vertical: true },
        { text: 'No', class: 'col-preprimario-sub', vertical: true }
    ];

    headersRow2.forEach(function(h) {
        const th = document.createElement('th');
        th.className = h.class;
        if (h.vertical) {
            const span = document.createElement('span');
            span.className = 'texto-vertical';
            span.textContent = h.text;
            th.appendChild(span);
        } else {
            th.textContent = h.text;
        }
        tr2.appendChild(th);
    });

    const tbody = document.createElement('tbody');
    tabla.appendChild(tbody);

    for (let i = 1; i <= TOTAL_FILAS; i++) {
        const tr = document.createElement('tr');

        const tdOrden = document.createElement('td');
        tdOrden.className = 'col-orden-p11';
        tdOrden.textContent = i;
        tr.appendChild(tdOrden);

        const tdDireccion = document.createElement('td');
        tdDireccion.className = 'col-direccion';
        tdDireccion.style.cssText = 'padding: 0px; vertical-align: middle;';
        const inputDir = crearInputTexto('', 'input-editable input-direccion', true, 'pagina11', i, 'direccion');
        tdDireccion.appendChild(inputDir);
        tr.appendChild(tdDireccion);

        const fechaColumnasP11 = ['nuevo_dia', 'nuevo_mes', 'nuevo_anio', 'retirado_dia', 'retirado_mes', 'retirado_anio'];
        for (let j = 0; j < 6; j++) {
            const td = document.createElement('td');
            td.className = 'col-fecha-sub';
            td.style.cssText = 'padding: 0px; vertical-align: middle;';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'input-fecha-p11';
            input.maxLength = 2;
            input.dataset.pagina = 'pagina11';
            input.dataset.fila = i;
            input.dataset.columna = fechaColumnasP11[j];
            input.style.cssText = `
                width: 100%;
                border: none;
                border-bottom: 1.5px solid transparent;
                background: transparent;
                font-family: 'Times New Roman', Times, serif;
                font-size: 12px;
                text-align: center;
                outline: none;
                color: #1a2a4a;
                padding: 0 2px;
            `;

            input.addEventListener('input', function() {
                guardarDatosEstudiante('pagina11', i, this.dataset.columna, this.value);
            });

            td.appendChild(input);
            tr.appendChild(td);
        }

        const condiciones = ['NUEVO INGRESO', 'PROMOVIDO', 'REENTRANTE'];
        const checkboxesCond = [];

        condiciones.forEach(function(cond, idx) {
            const td = document.createElement('td');
            td.className = 'col-condicion-sub';
            td.style.cssText = 'padding: 0px; text-align: center; vertical-align: middle;';

            const cb = crearCheckbox('checkbox-condicion', 'condicion', cond, 'pagina11', i, 'condicion_' + idx);
            td.appendChild(cb);
            tr.appendChild(td);
            checkboxesCond.push(cb);
        });

        checkboxesCond.forEach(function(cb, index) {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    checkboxesCond.forEach(function(other, i) {
                        if (i !== index) { other.checked = false; }
                    });
                }
                guardarDatosEstudiante('pagina11', i, 'condicion_seleccionada', index.toString());
            });
        });

        const tdPreSi = document.createElement('td');
        tdPreSi.className = 'col-preprimario-sub';
        tdPreSi.style.cssText = 'padding: 0px; text-align: center; vertical-align: middle;';
        const cbPreSi = crearCheckbox('checkbox-preprimario', 'preprimario', 'SI', 'pagina11', i, 'preprimario_si');
        tdPreSi.appendChild(cbPreSi);
        tr.appendChild(tdPreSi);

        const tdPreNo = document.createElement('td');
        tdPreNo.className = 'col-preprimario-sub';
        tdPreNo.style.cssText = 'padding: 0px; text-align: center; vertical-align: middle;';
        const cbPreNo = crearCheckbox('checkbox-preprimario', 'preprimario', 'NO', 'pagina11', i, 'preprimario_no');
        tdPreNo.appendChild(cbPreNo);
        tr.appendChild(tdPreNo);

        cbPreSi.addEventListener('change', function() {
            if (this.checked) { cbPreNo.checked = false; }
            guardarDatosEstudiante('pagina11', i, 'preprimario_seleccionado', this.checked ? 'si' : '');
        });

        cbPreNo.addEventListener('change', function() {
            if (this.checked) { cbPreSi.checked = false; }
            guardarDatosEstudiante('pagina11', i, 'preprimario_seleccionado', this.checked ? 'no' : '');
        });

        tbody.appendChild(tr);
    }

    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.textContent = 'Ministerio de Educación • República Dominicana';
    container.appendChild(watermark);

    agregarBotonesPagina11(container);

    prellenarDesdeFormulario('pagina11');
    restaurarDatosPagina('pagina11');

    deshabilitarTodosLosCampos();

    console.log('✅ Página 11 generada correctamente');
};

// ============================================
// 3. GENERAR PÁGINA 12
// ============================================
window.generarPagina12 = function() {
    console.log('📄 Generando Página 12...');
    const container = document.getElementById('pagina12-container');

    if (!container) {
        console.error('❌ No se encontró #pagina12-container');
        return;
    }

    container.innerHTML = '';

    container.appendChild(crearBadgeAsignacion());

    const titulo = document.createElement('div');
    titulo.className = 'titulo-pagina';
    titulo.textContent = 'Datos generales de la o del estudiante';
    container.appendChild(titulo);

    const tablaContainer = document.createElement('div');
    tablaContainer.className = 'tabla-container';
    container.appendChild(tablaContainer);

    const tabla = document.createElement('table');
    tabla.className = 'tabla-estudiantes tabla-pagina12';
    tablaContainer.appendChild(tabla);

    const thead = document.createElement('thead');
    tabla.appendChild(thead);

    const tr1 = document.createElement('tr');
    thead.appendChild(tr1);

    const headersRow1 = [
        { text: 'Nº de orden', rowspan: 2, class: 'col-orden-p12' },
        { text: 'Necesidades Específicas de Apoyo Educativo (NEAE)', rowspan: 2, class: 'col-neae' },
        { text: 'Enfermedades o alérgico a', rowspan: 2, class: 'col-enfermedades' },
        { text: 'Medicamentos que usa', rowspan: 2, class: 'col-medicamentos' },
        { text: 'En caso de emergencia llamar a', colspan: 2, class: 'col-emergencia' }
    ];

    headersRow1.forEach(function(h) {
        const th = document.createElement('th');
        if (h.rowspan) th.rowSpan = h.rowspan;
        if (h.colspan) th.colSpan = h.colspan;
        if (h.class) th.className = h.class;
        if (h.class === 'col-orden-p12') {
            const span = document.createElement('span');
            span.className = 'texto-vertical-orden';
            span.textContent = h.text;
            th.appendChild(span);
        } else {
            th.textContent = h.text;
        }
        tr1.appendChild(th);
    });

    const tr2 = document.createElement('tr');
    thead.appendChild(tr2);

    const headersRow2 = [
        { text: 'Nombre y apellido', class: 'col-emergencia-sub' },
        { text: 'Teléfono', class: 'col-emergencia-telefono' }
    ];

    headersRow2.forEach(function(h) {
        const th = document.createElement('th');
        th.className = h.class;
        th.textContent = h.text;
        tr2.appendChild(th);
    });

    const tbody = document.createElement('tbody');
    tbody.id = 'tablaP12Body';
    tabla.appendChild(tbody);

    for (let i = 1; i <= TOTAL_FILAS; i++) {
        const tr = document.createElement('tr');

        const tdOrden = document.createElement('td');
        tdOrden.className = 'col-orden-p12';
        tdOrden.textContent = i;
        tr.appendChild(tdOrden);

        const tdNeae = document.createElement('td');
        tdNeae.className = 'col-neae';
        tdNeae.style.cssText = 'padding: 0px; vertical-align: middle; text-align: center;';
        const inputNeae = crearInputTexto('', 'input-p12', true, 'pagina12', i, 'neae');
        tdNeae.appendChild(inputNeae);
        tr.appendChild(tdNeae);

        const tdEnfermedades = document.createElement('td');
        tdEnfermedades.className = 'col-enfermedades';
        tdEnfermedades.style.cssText = 'padding: 0px; vertical-align: middle; text-align: center;';
        const inputEnfermedades = crearInputTexto('', 'input-p12', true, 'pagina12', i, 'enfermedades');
        tdEnfermedades.appendChild(inputEnfermedades);
        tr.appendChild(tdEnfermedades);

        const tdMedicamentos = document.createElement('td');
        tdMedicamentos.className = 'col-medicamentos';
        tdMedicamentos.style.cssText = 'padding: 0px; vertical-align: middle; text-align: center;';
        const inputMedicamentos = crearInputTexto('', 'input-p12', true, 'pagina12', i, 'medicamentos');
        tdMedicamentos.appendChild(inputMedicamentos);
        tr.appendChild(tdMedicamentos);

        const tdEmergenciaNombre = document.createElement('td');
        tdEmergenciaNombre.className = 'col-emergencia-sub';
        tdEmergenciaNombre.style.cssText = 'padding: 0px; vertical-align: middle; text-align: center;';
        const inputEmergenciaNombre = crearInputTexto('', 'input-p12', true, 'pagina12', i, 'emergencia_nombre');
        tdEmergenciaNombre.appendChild(inputEmergenciaNombre);
        tr.appendChild(tdEmergenciaNombre);

        const tdEmergenciaTelefono = document.createElement('td');
        tdEmergenciaTelefono.className = 'col-emergencia-telefono';
        tdEmergenciaTelefono.style.cssText = 'padding: 0px; vertical-align: middle; text-align: center;';
        const inputEmergenciaTelefono = document.createElement('input');
        inputEmergenciaTelefono.type = 'text';
        inputEmergenciaTelefono.className = 'input-telefono-emergencia-p12';
        inputEmergenciaTelefono.maxLength = 12;
        inputEmergenciaTelefono.dataset.pagina = 'pagina12';
        inputEmergenciaTelefono.dataset.fila = i;
        inputEmergenciaTelefono.dataset.columna = 'emergencia_telefono';
        inputEmergenciaTelefono.style.cssText = `
            width: 100%;
            border: none;
            border-bottom: 1.5px solid transparent;
            background: transparent;
            font-family: 'Times New Roman', Times, serif;
            font-size: 12px;
            text-align: center;
            outline: none;
            color: #1a2a4a;
            padding: 0 2px;
        `;

        inputEmergenciaTelefono.addEventListener('input', function() {
            let valor = this.value.replace(/\D/g, '');
            if (valor.length > 3 && valor.length <= 6) {
                valor = valor.substring(0, 3) + '-' + valor.substring(3);
            } else if (valor.length > 6 && valor.length <= 10) {
                valor = valor.substring(0, 3) + '-' + valor.substring(3, 6) + '-' + valor.substring(6, 10);
            } else if (valor.length > 10) {
                valor = valor.substring(0, 10);
            }
            this.value = valor;
            guardarDatosEstudiante('pagina12', i, 'emergencia_telefono', this.value);

            const regex = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
            if (this.value.length === 12 && regex.test(this.value)) {
                this.style.borderBottomColor = '#28a745';
                this.style.borderBottomWidth = '2px';
            } else if (this.value.length > 0) {
                this.style.borderBottomColor = '#dc3545';
                this.style.borderBottomWidth = '2px';
            } else {
                this.style.borderBottomColor = 'transparent';
                this.style.borderBottomWidth = '1.5px';
            }
        });

        inputEmergenciaTelefono.addEventListener('blur', function() {
            const regex = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
            if (this.value !== '' && !regex.test(this.value)) {
                this.style.borderBottomColor = '#dc3545';
                this.style.borderBottomWidth = '2px';
                mostrarMensajeEstudiante('❌ Teléfono inválido. Formato: 000-000-0000', 'error');
            }
        });

        tdEmergenciaTelefono.appendChild(inputEmergenciaTelefono);
        tr.appendChild(tdEmergenciaTelefono);

        tbody.appendChild(tr);
    }

    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.textContent = 'Ministerio de Educación • República Dominicana';
    container.appendChild(watermark);

    agregarBotonesPagina12(container);

    prellenarDesdeFormulario('pagina12');
    restaurarDatosPagina('pagina12');

    deshabilitarTodosLosCampos();

    console.log('✅ Página 12 generada correctamente');
};

// ============================================
// 4. BOTONES POR PÁGINA - OCULTOS
// ============================================
function agregarBotonesPagina10(container) {
    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'botones-pagina10';
    botonesDiv.style.cssText = `display: none;`;

    const btnSincronizar = crearBotonPagina('🔄 Sincronizar con Formulario', '#17a2b8', function() {
        console.log('🔄 Botón Sincronizar de Página 10 presionado');
        sincronizarConFormulario();
    });
    const btnValidar = crearBotonPagina('✅ Validar Página 10', '#28a745', function() {
        window.validarPagina10();
    });
    const btnLimpiar = crearBotonPagina('🗑️ Limpiar Página 10', '#6c757d', function() {
        window.limpiarPagina10();
    });

    botonesDiv.appendChild(btnSincronizar);
    botonesDiv.appendChild(btnValidar);
    botonesDiv.appendChild(btnLimpiar);
    container.appendChild(botonesDiv);
}

function agregarBotonesPagina11(container) {
    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'botones-pagina11';
    botonesDiv.style.cssText = `display: none;`;

    const btnSincronizar = crearBotonPagina('🔄 Sincronizar con Formulario', '#17a2b8', function() {
        console.log('🔄 Botón Sincronizar de Página 11 presionado');
        sincronizarConFormulario();
    });
    const btnValidar = crearBotonPagina('✅ Validar Página 11', '#28a745', function() {
        window.validarPagina11();
    });
    const btnLimpiar = crearBotonPagina('🗑️ Limpiar Página 11', '#6c757d', function() {
        window.limpiarPagina11();
    });

    botonesDiv.appendChild(btnSincronizar);
    botonesDiv.appendChild(btnValidar);
    botonesDiv.appendChild(btnLimpiar);
    container.appendChild(botonesDiv);
}

function agregarBotonesPagina12(container) {
    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'botones-pagina12';
    botonesDiv.style.cssText = `display: none;`;

    const btnSincronizar = crearBotonPagina('🔄 Sincronizar con Formulario', '#17a2b8', function() {
        console.log('🔄 Botón Sincronizar de Página 12 presionado');
        sincronizarConFormulario();
    });
    const btnValidar = crearBotonPagina('✅ Validar Página 12', '#28a745', function() {
        window.validarPagina12();
    });
    const btnLimpiar = crearBotonPagina('🗑️ Limpiar Página 12', '#6c757d', function() {
        window.limpiarPagina12();
    });

    botonesDiv.appendChild(btnSincronizar);
    botonesDiv.appendChild(btnValidar);
    botonesDiv.appendChild(btnLimpiar);
    container.appendChild(botonesDiv);
}

function crearBotonPagina(texto, color, onClick) {
    const btn = document.createElement('button');
    btn.textContent = texto;
    btn.style.cssText = `padding: 10px 25px; border: 2px solid ${color}; border-radius: 6px; background: ${color}; color: white; font-family: 'Times New Roman', Times, serif; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px;`;

    btn.onmouseover = function() {
        this.style.background = color === '#28a745' ? '#218838' : (color === '#17a2b8' ? '#138496' : '#5a6268');
        this.style.borderColor = this.style.background;
        this.style.transform = 'scale(1.02)';
    };

    btn.onmouseout = function() {
        this.style.background = color;
        this.style.borderColor = color;
        this.style.transform = 'scale(1)';
    };

    btn.onclick = onClick;
    return btn;
}

// ============================================
// 5. FUNCIONES DE VALIDACIÓN Y LIMPIEZA
// ============================================
window.validarPagina10 = function() {
    const container = document.getElementById('pagina10-container');
    if (!container) { mostrarMensajeEstudiante('⚠️ No se encontró la Página 10', 'warning'); return false; }

    const tabla = container.querySelector('.tabla-estudiantes');
    if (!tabla) return false;

    const filas = tabla.querySelectorAll('tbody tr');
    let errores = [];
    let tieneDatos = false;

    filas.forEach(function(fila, index) {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length < 2) return;

        const nombreInput = celdas[1]?.querySelector('input');
        const nombre = nombreInput ? nombreInput.value.trim() : '';

        if (nombre !== '') {
            tieneDatos = true;
            const checkboxes = fila.querySelectorAll('.checkbox-sexo');
            let sexoSeleccionado = false;
            checkboxes.forEach(function(cb) { if (cb.checked) sexoSeleccionado = true; });
            if (!sexoSeleccionado) errores.push(`Fila ${index + 1}: Seleccione Sexo`);

            const selectPar = celdas[11]?.querySelector('select');
            if (selectPar && selectPar.value === '') errores.push(`Fila ${index + 1}: Seleccione Parentesco`);
        }
    });

    if (!tieneDatos) { mostrarMensajeEstudiante('⚠️ No hay datos para validar en Página 10', 'warning'); return false; }
    if (errores.length === 0) { mostrarMensajeEstudiante('✅ ¡Página 10 válida!', 'success'); return true; }

    mostrarMensajeEstudiante('❌ ' + errores.join(' • '), 'error');
    return false;
};

window.limpiarPagina10 = function() {
    const container = document.getElementById('pagina10-container');
    if (!container) return;

    container.querySelectorAll('input').forEach(function(input) {
        if (!input.readOnly) { input.value = ''; }
        input.style.borderBottomColor = 'transparent';
        input.style.borderBottomWidth = '1.5px';
    });

    container.querySelectorAll('select').forEach(function(select) { select.value = ''; });
    container.querySelectorAll('.checkbox-sexo').forEach(function(cb) { cb.checked = false; });

    const CLAVE = obtenerClaveStorageEstudiante();
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '{}');
    if (datos.pagina10) {
        delete datos.pagina10;
        localStorage.setItem(CLAVE, JSON.stringify(datos));
    }

    mostrarMensajeEstudiante('✅ Página 10 limpiada.', 'info');
};

window.validarPagina11 = function() {
    const container = document.getElementById('pagina11-container');
    if (!container) { mostrarMensajeEstudiante('⚠️ No se encontró la Página 11', 'warning'); return false; }

    const tabla = container.querySelector('.tabla-pagina11');
    if (!tabla) return false;

    const filas = tabla.querySelectorAll('tbody tr');
    let errores = [];
    let tieneDatos = false;

    filas.forEach(function(fila, index) {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length < 2) return;

        const dirInput = celdas[1]?.querySelector('input');
        const direccion = dirInput ? dirInput.value.trim() : '';

        if (direccion !== '') {
            tieneDatos = true;
            const checkboxesCond = fila.querySelectorAll('.checkbox-condicion');
            let condSeleccionado = false;
            checkboxesCond.forEach(function(cb) { if (cb.checked) condSeleccionado = true; });
            if (!condSeleccionado) errores.push(`Fila ${index + 1}: Seleccione Condición inicial`);

            const checkboxesPre = fila.querySelectorAll('.checkbox-preprimario');
            let preSeleccionado = false;
            checkboxesPre.forEach(function(cb) { if (cb.checked) preSeleccionado = true; });
            if (!preSeleccionado) errores.push(`Fila ${index + 1}: Seleccione Preprimario`);
        }
    });

    if (!tieneDatos) { mostrarMensajeEstudiante('⚠️ No hay datos para validar en Página 11', 'warning'); return false; }
    if (errores.length === 0) { mostrarMensajeEstudiante('✅ ¡Página 11 válida!', 'success'); return true; }

    mostrarMensajeEstudiante('❌ ' + errores.join(' • '), 'error');
    return false;
};

window.limpiarPagina11 = function() {
    const container = document.getElementById('pagina11-container');
    if (!container) return;

    container.querySelectorAll('input').forEach(function(input) {
        input.value = '';
        input.style.borderBottomColor = 'transparent';
        input.style.borderBottomWidth = '1.5px';
    });

    container.querySelectorAll('.checkbox-condicion, .checkbox-preprimario').forEach(function(cb) { cb.checked = false; });

    const CLAVE = obtenerClaveStorageEstudiante();
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '{}');
    if (datos.pagina11) {
        delete datos.pagina11;
        localStorage.setItem(CLAVE, JSON.stringify(datos));
    }

    mostrarMensajeEstudiante('✅ Página 11 limpiada.', 'info');
};

window.validarPagina12 = function() {
    const container = document.getElementById('pagina12-container');
    if (!container) { mostrarMensajeEstudiante('⚠️ No se encontró la Página 12', 'warning'); return false; }

    const tabla = container.querySelector('.tabla-pagina12');
    if (!tabla) return false;

    const inputsTelefono = tabla.querySelectorAll('.input-telefono-emergencia-p12');
    let tieneDatos = false;
    let errores = [];
    let telefonoValido = true;

    inputsTelefono.forEach(function(input) {
        if (input.value !== '') {
            tieneDatos = true;
            const regex = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
            if (!regex.test(input.value)) {
                telefonoValido = false;
                input.style.borderBottomColor = '#dc3545';
                input.style.borderBottomWidth = '2px';
                errores.push('Teléfono inválido (formato: 000-000-0000)');
            } else {
                input.style.borderBottomColor = '#28a745';
                input.style.borderBottomWidth = '2px';
            }
        }
    });

    if (!tieneDatos) {
        mostrarMensajeEstudiante('⚠️ No hay datos para validar en Página 12', 'warning');
        return false;
    }

    if (telefonoValido) {
        mostrarMensajeEstudiante('✅ ¡Página 12 válida!', 'success');
        return true;
    }

    mostrarMensajeEstudiante('❌ ' + errores.join(' • '), 'error');
    return false;
};

window.limpiarPagina12 = function() {
    const container = document.getElementById('pagina12-container');
    if (!container) return;

    container.querySelectorAll('.input-p12, .input-telefono-emergencia-p12').forEach(function(input) {
        input.value = '';
        input.style.borderBottomColor = 'transparent';
        input.style.borderBottomWidth = '1.5px';
    });

    const CLAVE = obtenerClaveStorageEstudiante();
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '{}');
    if (datos.pagina12) {
        delete datos.pagina12;
        localStorage.setItem(CLAVE, JSON.stringify(datos));
    }

    mostrarMensajeEstudiante('✅ Página 12 limpiada.', 'info');
};

// ============================================
// ESCUCHAR CAMBIOS EN EL FORMULARIO
// ============================================

document.addEventListener('formulariosActualizado', function(e) {
    console.log('🔄 Evento "formulariosActualizado" recibido');
    
    if (window._timeoutSync) {
        clearTimeout(window._timeoutSync);
    }
    
    window._timeoutSync = setTimeout(function() {
        console.log('🔄 Ejecutando sincronización por evento...');
        sincronizarConFormulario();
        window._timeoutSync = null;
    }, 300);
});

window.addEventListener('storage', function(e) {
    if (e.key === 'registrosSigerd' || e.key === 'datosSincronizados' || e.key === 'registroGradoData') {
        console.log('🔄 Cambios detectados en otra pestaña en:', e.key);
        
        if (window._timeoutSync) {
            clearTimeout(window._timeoutSync);
        }
        
        window._timeoutSync = setTimeout(function() {
            if (document.getElementById('pagina10-container') || 
                document.getElementById('pagina11-container') || 
                document.getElementById('pagina12-container')) {
                console.log('🔄 Actualizando páginas por cambio en otra pestaña...');
                sincronizarConFormulario();
            }
            window._timeoutSync = null;
        }, 500);
    }
});

function detectarCambioGrupo() {
    const grupoActual = obtenerGrupoActual();
    const key = `${grupoActual.grado}|${grupoActual.seccion}|${grupoActual.tanda}`;
    
    if (_grupoAnterior && _grupoAnterior !== key) {
        console.log(`🔄 Cambio de grupo detectado: ${_grupoAnterior} -> ${key}`);
        sincronizarConFormulario();
    }
    
    _grupoAnterior = key;
}

setInterval(detectarCambioGrupo, 2000);

function verificarCambiosHash() {
    try {
        const stored = localStorage.getItem('registrosSigerd');
        if (stored) {
            const hash = stored.length + '_' + stored.substring(0, 100);
            if (hash !== ultimoHashRegistros) {
                ultimoHashRegistros = hash;
                console.log('🔄 Detectado cambio en registrosSigerd (hash)');
                sincronizarConFormulario();
            }
        }
    } catch (e) {
        // Ignorar errores
    }
}

setInterval(verificarCambiosHash, 3000);

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('👁️ Página visible nuevamente, verificando cambios...');
        sincronizarConFormulario();
    }
});

window.sincronizarAhora = function() {
    console.log('🔄 Sincronización manual iniciada...');
    sincronizarConFormulario();
};

// ============================================
// INYECTAR ESTILOS DE ANIMACIÓN Y CHECKBOXES NEGROS
// ============================================
const styleAnimEstudiante = document.createElement('style');
styleAnimEstudiante.textContent = `
@keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
.mensaje-flotante-estudiante { animation: slideDown 0.3s ease !important; }

@media print {
    .mensaje-flotante-estudiante { display: none !important; }
    .botones-pagina10, .botones-pagina11, .botones-pagina12 { display: none !important; }
    #panel-configuracion-grupo { display: none !important; }
    .badge-asignacion-completa {
        display: block !important;
        background: #002D62 !important;
        color: white !important;
        border: 2px solid #C8102E !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    .badge-asignacion-completa button { display: none !important; }
}

/* ESTILOS PARA CAMPOS BLOQUEADOS CON APARIENCIA VIVA */
input[readonly], input[disabled], select[disabled] {
    color: #1a2a4a !important;
    opacity: 1 !important;
    background: transparent !important;
    border-bottom-color: #a0b8d0 !important;
    border-bottom-width: 1.5px !important;
    cursor: default !important;
    pointer-events: none !important;
}

input[type="checkbox"][disabled] {
    opacity: 1 !important;
    pointer-events: none !important;
    cursor: default !important;
}

select[disabled] {
    color: #1a2a4a !important;
    opacity: 1 !important;
    pointer-events: none !important;
    cursor: default !important;
}

input[readonly]:focus, input[disabled]:focus, select[disabled]:focus {
    border-bottom-color: #a0b8d0 !important;
    box-shadow: none !important;
    outline: none !important;
}

/* ✅ CHECKBOXES - COLOR NEGRO */
input[type="checkbox"] {
    width: 16px !important;
    height: 16px !important;
    accent-color: #000000 !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    border: 2px solid #000000 !important;
    border-radius: 2px !important;
    background: #ffffff !important;
    cursor: default !important;
    pointer-events: none !important;
    display: inline-block !important;
    position: relative !important;
    flex-shrink: 0 !important;
    margin: 0 auto !important;
}

input[type="checkbox"]:checked {
    background: #000000 !important;
    border-color: #000000 !important;
}

input[type="checkbox"]:checked::after {
    content: "✓" !important;
    display: block !important;
    color: #ffffff !important;
    font-size: 12px !important;
    font-weight: bold !important;
    text-align: center !important;
    line-height: 12px !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
}

input[type="checkbox"][disabled] {
    opacity: 1 !important;
    pointer-events: none !important;
    cursor: default !important;
    border-color: #000000 !important;
}

input[type="checkbox"][disabled]:checked {
    background: #000000 !important;
    border-color: #000000 !important;
}

input[type="checkbox"][disabled]:checked::after {
    color: #ffffff !important;
}

/* CHECKBOXES ESPECÍFICOS */
.checkbox-sexo,
.checkbox-condicion,
.checkbox-preprimario {
    width: 16px !important;
    height: 16px !important;
    accent-color: #000000 !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    border: 2px solid #000000 !important;
    border-radius: 2px !important;
    background: #ffffff !important;
    cursor: default !important;
    pointer-events: none !important;
    display: inline-block !important;
    position: relative !important;
    flex-shrink: 0 !important;
    margin: 0 auto !important;
}

.checkbox-sexo:checked,
.checkbox-condicion:checked,
.checkbox-preprimario:checked {
    background: #000000 !important;
    border-color: #000000 !important;
}

.checkbox-sexo:checked::after,
.checkbox-condicion:checked::after,
.checkbox-preprimario:checked::after {
    content: "✓" !important;
    display: block !important;
    color: #ffffff !important;
    font-size: 12px !important;
    font-weight: bold !important;
    text-align: center !important;
    line-height: 12px !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
}

/* IMPRESIÓN - CHECKBOXES NEGROS */
@media print {
    input[type="checkbox"] {
        border: 2px solid #000000 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    input[type="checkbox"]:checked {
        background: #000000 !important;
        border-color: #000000 !important;
    }
    input[type="checkbox"]:checked::after {
        color: #ffffff !important;
    }
    .checkbox-sexo:checked,
    .checkbox-condicion:checked,
    .checkbox-preprimario:checked {
        background: #000000 !important;
        border-color: #000000 !important;
    }
    .checkbox-sexo:checked::after,
    .checkbox-condicion:checked::after,
    .checkbox-preprimario:checked::after {
        color: #ffffff !important;
    }
}
`;
document.head.appendChild(styleAnimEstudiante);

// ============================================
// INICIALIZACIÓN CON REINTENTOS
// ============================================
function inicializarConReintentos(intentos = 15) {
    if (intentos <= 0) {
        console.error('❌ No se pudieron cargar los datos del formulario después de múltiples intentos');
        mostrarMensajeEstudiante('⚠️ No se pudo sincronizar con el formulario. Verifica que haya datos guardados.', 'warning');
        return;
    }
    
    const registros = localStorage.getItem('registrosSigerd');
    if (!registros) {
        console.log(`⏳ Esperando registrosSigerd... (${intentos} intentos restantes)`);
        setTimeout(() => inicializarConReintentos(intentos - 1), 500);
        return;
    }
    
    try {
        const parsed = JSON.parse(registros);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            console.log(`⏳ registrosSigerd existe pero está vacío (${intentos} intentos restantes)`);
            setTimeout(() => inicializarConReintentos(intentos - 1), 500);
            return;
        }
    } catch (e) {
        console.log(`⏳ registrosSigerd no es válido (${intentos} intentos restantes)`);
        setTimeout(() => inicializarConReintentos(intentos - 1), 500);
        return;
    }
    
    console.log('✅ registrosSigerd encontrado, generando páginas...');
    
    if (document.getElementById('pagina10-container') &&
        document.getElementById('pagina11-container') &&
        document.getElementById('pagina12-container')) {
        
        console.log('📄 Inicializando generación dinámica de páginas...');
        console.log('🎯 Grupo actual:', obtenerGrupoActual());
        console.log('🔑 Clave de storage:', obtenerClaveStorageEstudiante());
        
        try {
            window.generarPagina10();
            window.generarPagina11();
            window.generarPagina12();
            
            estudiantesCargados = obtenerEstudiantesFiltrados();
            
            console.log('✅ Todas las páginas generadas correctamente');
            console.log(`📊 ${estudiantesCargados.length} estudiantes sincronizados`);
            
            mostrarMensajeEstudiante(
                `✅ Sincronizado: ${estudiantesCargados.length} estudiantes cargados`,
                'success'
            );
        } catch (error) {
            console.error('❌ Error al generar páginas:', error);
            mostrarMensajeEstudiante('❌ Error al generar las páginas. Revisa la consola.', 'error');
        }
    } else {
        console.log('⏳ Esperando contenedores de páginas...');
        setTimeout(() => inicializarConReintentos(intentos - 1), 300);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(inicializarConReintentos, 500);
    });
} else {
    setTimeout(inicializarConReintentos, 500);
}

window.obtenerEstudiantesFiltrados = obtenerEstudiantesFiltrados;
window.sincronizarConFormulario = sincronizarConFormulario;
window.prellenarDesdeFormulario = prellenarDesdeFormulario;
window.obtenerGrupoActual = obtenerGrupoActual;

console.log('📚 DATOS-DEL-ESTUDIANTE.js cargado - NACIONALIDAD NORMAL (INPUT TEXTO)');
console.log('   ✅ La nacionalidad se muestra TAL CUAL del formulario (DOMINICANO/A, HAITIANO/A, etc.)');
console.log('   ✅ Se usa INPUT TEXTO en lugar de SELECT para nacionalidad');
console.log('   ✅ Checkboxes en color NEGRO');
console.log('   ✅ Botones ocultos');
console.log('   ✅ Campos con apariencia viva');