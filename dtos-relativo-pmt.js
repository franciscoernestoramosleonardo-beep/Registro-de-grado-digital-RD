/**
============================================
dtos-relativo-pmt.js
Datos relativos al padre, madre, tutor, tutora
CON VALIDACIONES COMPLETAS
✅ SINCRONIZACIÓN DIRECTA CON registrosSigerd (historial del FORMULARIO)
✅ PARENTESCO tomado de la Sección 1 (datos del estudiante)
✅ Lee tutorCedula, tutorTelefono de cada estudiante
✅ ✅ NUEVO: Lee tutorOcupacion → lo selecciona en el <select> de profesión
✅ ✅ NUEVO: Lee tutorEscolaridad → marca el checkbox de nivel educativo
✅ TANDA incluida en la barra de información
✅ Sin dependencia de DATOS-PADRES.html
============================================
*/

/* ============ CONFIGURACIÓN ============ */
const NUM_FILAS = 45;
const STORAGE_KEY = 'datosPadres';
const STORAGE_REGISTROS = 'registrosSigerd';

/* ============ VARIABLES DE SINCRONIZACIÓN ============ */
let currentGrade = 3;
let currentSection = 'A';
let currentTanda = 'MATUTINA';
let currentSchoolYear = '2025-2026';

/* ============ DIAGNÓSTICO ============ */
function diagnostico() {
    console.log('═══════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO DE SINCRONIZACIÓN');
    console.log('═══════════════════════════════════');

    const regsRaw = localStorage.getItem(STORAGE_REGISTROS);
    if (!regsRaw) {
        console.error('❌ NO existe registrosSigerd en localStorage');
        console.log('   → Debes guardar estudiantes en FORMULARIO.html primero');
        console.log('═══════════════════════════════════');
        return;
    }

    const regs = JSON.parse(regsRaw);
    console.log('✅ registrosSigerd existe:', regs.length, 'estudiantes');
    console.log('\n📋 Muestra de los primeros 3:');
    regs.slice(0, 3).forEach((r, i) => {
        console.log(`\n   Estudiante ${i + 1}:`);
        console.log('   - Nombre:', r.nombre, r.apellido);
        console.log('   - Grado:', r.grado, '| Sección:', r.seccion, '| Tanda:', r.tanda);
        console.log('   - UID:', r.uid || '❌ SIN UID');
        console.log('   - 📌 parentesco (Sección 1):', r.parentesco || '❌ vacío');
        console.log('   - tutorTipo:', r.tutorTipo || '❌ vacío');
        console.log('   - tutorCedula:', r.tutorCedula || '❌ vacío');
        console.log('   - tutorTelefono:', r.tutorTelefono || '❌ vacío');
        console.log('   - tutorEscolaridad:', r.tutorEscolaridad || '❌ vacío');
        console.log('   - tutorOcupacion:', r.tutorOcupacion || '❌ vacío');
        console.log('   - emergenciaNombre:', r.emergenciaNombre || '❌ vacío');
    });

    const grupo = obtenerGrupoActual();
    console.log('\n✅ Grupo actual:', grupo);

    const estudiantes = obtenerEstudiantesDelGrupo();
    console.log('✅ Estudiantes del grupo actual:', estudiantes.length);

    if (estudiantes.length > 0) {
        console.log('\n📋 Estudiantes que se mostrarán:');
        estudiantes.forEach((e, i) => {
            console.log(`   ${i + 1}. ${e.nombre} ${e.apellido} (${e.grado} ${e.seccion} ${e.tanda})`);
            console.log(`      parentesco: ${e.parentesco || 'no especificado'}`);
            console.log(`      tutor: ${e.tutorTipo || 'no especificado'} - ${e.tutorCedula || 'sin cédula'}`);
            console.log(`      ocupación: ${e.tutorOcupacion || 'no especificada'}`);
            console.log(`      escolaridad: ${e.tutorEscolaridad || 'no especificada'}`);
        });
    } else {
        console.warn('⚠️ No hay estudiantes que coincidan con el grupo actual');
        console.log('\n💡 Verifica:');
        console.log('   - Grado en registros:', [...new Set(regs.map(r => r.grado))]);
        console.log('   - Grado buscado:', grupo.grado);
        console.log('   - Sección buscada:', grupo.seccion);
        console.log('   - Tanda buscada:', grupo.tanda);
    }

    console.log('═══════════════════════════════════');
}
window.diagnostico = diagnostico;

/* ============ FUNCIÓN DE SINCRONIZACIÓN ============ */
function syncData(grade, section, year, tanda) {
    if (grade !== undefined && grade >= 1 && grade <= 6) currentGrade = grade;
    if (section !== undefined) currentSection = section;
    if (tanda !== undefined) currentTanda = tanda;
    if (year !== undefined) currentSchoolYear = year;
    actualizarInfoGradoPMT();
    console.log('👨‍👩‍👧 Datos PMT sincronizado:', currentGrade, currentSection, currentTanda);
}
window.syncData = syncData;

/* ============ OBTENER GRUPO ACTUAL ============ */
function obtenerGrupoActual() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const gradoUrl = urlParams.get('grado');
        const seccionUrl = urlParams.get('seccion');
        const tandaUrl = urlParams.get('tanda');

        if (gradoUrl) {
            return {
                grado: decodeURIComponent(gradoUrl).trim().toUpperCase(),
                seccion: seccionUrl ? decodeURIComponent(seccionUrl).trim().toUpperCase() : '',
                tanda: tandaUrl ? decodeURIComponent(tandaUrl).trim().toUpperCase() : ''
            };
        }

        const fuentes = [
            localStorage.getItem('datosSincronizados'),
            localStorage.getItem('registroGradoData'),
            localStorage.getItem('minerd_grado_completo')
        ];

        for (const fuente of fuentes) {
            if (fuente) {
                try {
                    const datos = JSON.parse(fuente);
                    if (datos && datos.grado) {
                        return {
                            grado: (datos.grado || '').trim().toUpperCase(),
                            seccion: (datos.seccion || '').trim().toUpperCase(),
                            tanda: (datos.tanda || '').trim().toUpperCase()
                        };
                    }
                } catch (e) { continue; }
            }
        }

        if (typeof AuthSystem !== 'undefined') {
            const sesion = AuthSystem.obtenerSesion();
            if (sesion && sesion.cedula) {
                const gradoGuardado = AuthSystem.obtenerGradoSeleccionado(sesion.cedula);
                if (gradoGuardado) {
                    return { grado: gradoGuardado, seccion: '', tanda: '' };
                }
            }
        }

        return { grado: '', seccion: '', tanda: '' };
    } catch (e) {
        return { grado: '', seccion: '', tanda: '' };
    }
}

/* ============ CONVERTIR GRADO TEXTO A NÚMERO ============ */
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

/* ============ APLICAR DATOS SINCRONIZADOS ============ */
function aplicarDatosSincronizados() {
    try {
        const grupoActual = obtenerGrupoActual();
        if (!grupoActual.grado) return false;

        const gradoNum = convertirGradoANumero(grupoActual.grado);
        if (gradoNum) currentGrade = gradoNum;
        if (grupoActual.seccion) currentSection = grupoActual.seccion;
        if (grupoActual.tanda) currentTanda = grupoActual.tanda;

        localStorage.setItem('currentGrade', currentGrade.toString());
        localStorage.setItem('currentSection', currentSection);
        localStorage.setItem('currentTanda', currentTanda);
        localStorage.setItem('currentSchoolYear', currentSchoolYear);

        console.log('✅ Datos aplicados: Grado', currentGrade, '| Sección', currentSection, '| Tanda', currentTanda);
        actualizarInfoGradoPMT();
        return true;
    } catch (e) {
        console.error('❌ Error aplicando datos sincronizados:', e);
        return false;
    }
}

/* ============ ACTUALIZAR BARRA INFO ============ */
function getGradeTextPMT(grade) {
    const texts = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to' };
    return texts[grade] || '3er';
}

function formatearTanda(tanda) {
    if (!tanda) return 'Matutina';
    const t = String(tanda).toUpperCase().trim();
    const mapa = {
        'MATUTINA': 'Matutina', 'VESPERTINA': 'Vespertina', 'NOCTURNA': 'Nocturna',
        'MATUTINO': 'Matutina', 'VESPERTINO': 'Vespertina', 'NOCTURNO': 'Nocturna',
        'MAÑANA': 'Matutina', 'TARDE': 'Vespertina', 'NOCHE': 'Nocturna'
    };
    return mapa[t] || tanda;
}

function actualizarInfoGradoPMT() {
    const g = document.getElementById('gradeDisplayPMT');
    const s = document.getElementById('sectionDisplayPMT');
    const t = document.getElementById('tandaDisplayPMT');
    const y = document.getElementById('schoolYearDisplayPMT');

    if (g) g.textContent = getGradeTextPMT(currentGrade) + ' Grado';
    if (s) s.textContent = 'Sección ' + currentSection;
    if (t) t.textContent = formatearTanda(currentTanda);
    if (y) y.textContent = currentSchoolYear;
}

/* ============ LISTA DE PROFESIONES ============ */
const PROFESIONES = [
    'MÉDICO', 'MÉDICA', 'MAESTRO', 'MAESTRA', 'OBRERO', 'OBRERA',
    'VASTENDER', 'HOTELERO', 'HOTELERA', 'ALBAÑIL',
    'INGENIERO', 'INGENIERA', 'AMA DE CASA', 'ESTUDIANTE',
    'ENFERMERO', 'ENFERMERA', 'MOTO TAXI', 'OTROS OFICIO'
];

/* ============ REFERENCIAS ============ */
const cuerpo = document.getElementById('cuerpoTabla');

/* ============ GENERACIÓN DINÁMICA DE FILAS ============ */
function crearFilas() {
    let html = '';
    for (let i = 1; i <= NUM_FILAS; i++) {
        html += `<tr data-fila="${i}">
            <td>${i}</td>
            <td><input type="text" data-campo="nombre" class="input-nombre"></td>
            <td><input type="checkbox" data-campo="madre" class="parentesco" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="padre" class="parentesco" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="tutor" class="parentesco" data-fila="${i}"></td>
            <td><input type="text" data-campo="cedula" class="input-cedula" maxlength="13"></td>
            <td><input type="text" data-campo="telefono" class="input-telefono" maxlength="12"></td>
            <td>
                <select data-campo="profesion" class="input-profesion">
                    <option value=""></option>
                    ${PROFESIONES.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </td>
            <td><input type="checkbox" data-campo="sin_escolaridad" class="nivel-educativo" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="primaria_inc" class="nivel-educativo" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="primaria_comp" class="nivel-educativo" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="secundaria_inc" class="nivel-educativo" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="secundaria_comp" class="nivel-educativo" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="superior_inc" class="nivel-educativo" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="superior_comp" class="nivel-educativo" data-fila="${i}"></td>
            <td><input type="checkbox" data-campo="desconocido" class="nivel-educativo" data-fila="${i}"></td>
        </tr>`;
    }
    cuerpo.innerHTML = html;
    asignarEventos();
}

/* ============ ASIGNAR EVENTOS ============ */
function asignarEventos() {
    document.querySelectorAll('.input-nombre').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    });

    document.querySelectorAll('.input-cedula').forEach(input => {
        input.addEventListener('input', function() {
            this.value = formatearCedula(this.value);
        });
        input.addEventListener('blur', function() {
            validarCedula(this);
        });
    });

    document.querySelectorAll('.input-telefono').forEach(input => {
        input.addEventListener('input', function() {
            this.value = formatearTelefono(this.value);
        });
        input.addEventListener('blur', function() {
            validarTelefono(this);
        });
    });

    document.querySelectorAll('.parentesco').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const fila = this.dataset.fila;
            const parentescos = document.querySelectorAll(`.parentesco[data-fila="${fila}"]`);
            if (this.checked) {
                parentescos.forEach(cb => {
                    if (cb !== this) cb.checked = false;
                });
            }
        });
    });

    document.querySelectorAll('.nivel-educativo').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const fila = this.dataset.fila;
            const niveles = document.querySelectorAll(`.nivel-educativo[data-fila="${fila}"]`);
            if (this.checked) {
                niveles.forEach(cb => {
                    if (cb !== this) cb.checked = false;
                });
            }
        });
    });
}

/* ============ FORMATEAR CÉDULA ============ */
function formatearCedula(valor) {
    valor = valor.replace(/\D/g, '');
    if (valor.length > 3 && valor.length <= 10) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3);
    } else if (valor.length > 10 && valor.length <= 11) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 10) + '-' + valor.substring(10);
    } else if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }
    return valor;
}

function validarCedula(input) {
    const valor = input.value.trim();
    if (valor === '') {
        input.style.borderBottom = '1px solid #d0d8e0';
        return true;
    }
    const regex = /^[0-9]{3}-[0-9]{7}-[0-9]{1}$/;
    if (regex.test(valor)) {
        input.style.borderBottom = '2px solid #28a745';
        return true;
    } else {
        input.style.borderBottom = '2px solid #dc3545';
        return false;
    }
}

/* ============ FORMATEAR TELÉFONO ============ */
function formatearTelefono(valor) {
    valor = valor.replace(/\D/g, '');
    if (valor.length > 3 && valor.length <= 6) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3);
    } else if (valor.length > 6 && valor.length <= 10) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 6) + '-' + valor.substring(6, 10);
    } else if (valor.length > 10) {
        valor = valor.substring(0, 10);
    }
    return valor;
}

function validarTelefono(input) {
    const valor = input.value.trim();
    if (valor === '') {
        input.style.borderBottom = '1px solid #d0d8e0';
        return true;
    }
    const regex = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
    if (regex.test(valor)) {
        input.style.borderBottom = '2px solid #28a745';
        return true;
    } else {
        input.style.borderBottom = '2px solid #dc3545';
        return false;
    }
}

/* ============================================
✅ OBTENER ESTUDIANTES DEL GRUPO ACTUAL
============================================ */
function obtenerEstudiantesDelGrupo() {
    try {
        const stored = localStorage.getItem(STORAGE_REGISTROS);
        if (!stored) return [];

        const registros = JSON.parse(stored);
        if (!Array.isArray(registros)) return [];

        const grupo = obtenerGrupoActual();

        if (!grupo.grado) {
            console.log('⚠️ No hay grupo definido, mostrando TODOS los estudiantes');
            return registros.sort((a, b) => (parseInt(a.orden) || 0) - (parseInt(b.orden) || 0));
        }

        const filtrados = registros.filter(r => {
            const gradoReg = (r.grado || '').trim().toUpperCase();
            const seccionReg = (r.seccion || '').trim().toUpperCase();
            const tandaReg = (r.tanda || '').trim().toUpperCase();

            const gradoRegNum = convertirGradoANumero(gradoReg);
            const gradoGrupoNum = convertirGradoANumero(grupo.grado);

            if (gradoRegNum && gradoGrupoNum) {
                if (gradoRegNum !== gradoGrupoNum) return false;
            } else if (gradoReg !== grupo.grado) {
                return false;
            }

            if (grupo.seccion && seccionReg && seccionReg !== grupo.seccion) return false;
            if (grupo.tanda && tandaReg && tandaReg !== grupo.tanda) return false;

            return true;
        });

        console.log('🔍 Filtro aplicado:', {
            grupoBuscado: grupo,
            totalRegistros: registros.length,
            encontrados: filtrados.length
        });

        filtrados.sort((a, b) => (parseInt(a.orden) || 0) - (parseInt(b.orden) || 0));
        return filtrados;
    } catch (e) {
        console.error('❌ Error obteniendo estudiantes:', e);
        return [];
    }
}

/* ============================================
✅ MAPEAR NIVEL EDUCATIVO
============================================ */
function mapearNivelEducativo(nivelEducativo) {
    if (!nivelEducativo) return null;
    const valor = String(nivelEducativo).toUpperCase().trim();

    const mapa = {
        'SIN ESCOLARIDAD': 'sin_escolaridad',
        'PRIMARIA INCOMPLETA': 'primaria_inc',
        'PRIMARIA COMPLETA': 'primaria_comp',
        'SECUNDARIA INCOMPLETA': 'secundaria_inc',
        'SECUNDARIA COMPLETA': 'secundaria_comp',
        'SUPERIOR INCOMPLETO': 'superior_inc',
        'SUPERIOR COMPLETO': 'superior_comp',
        'DESCONOCIDO': 'desconocido',
        // Aliases viejos
        'SIN_ESCOLARIDAD': 'sin_escolaridad',
        'PRIMARIA_INCOMPLETA': 'primaria_inc',
        'PRIMARIA_COMPLETA': 'primaria_comp',
        'SECUNDARIA_INCOMPLETA': 'secundaria_inc',
        'SECUNDARIA_COMPLETA': 'secundaria_comp',
        'BACHILLER': 'secundaria_comp',
        'TECNICO': 'superior_inc',
        'UNIVERSITARIO': 'superior_comp',
        'POSTGRADO': 'superior_comp'
    };
    return mapa[valor] || null;
}

/* ============================================
✅ MAPEAR OCUPACIÓN
============================================ */
function mapearOcupacion(ocupacion) {
    if (!ocupacion) return '';
    const valor = String(ocupacion).toUpperCase().trim();
    if (PROFESIONES.includes(valor)) return valor;

    // Fallback: buscar coincidencia parcial
    const encontrada = PROFESIONES.find(p =>
        p.includes(valor) || valor.includes(p)
    );
    return encontrada || 'OTROS OFICIO';
}

/* ============================================
✅ DETECTAR PARENTESCO DESDE LA SECCIÓN 1
============================================ */
function detectarParentescoDesdeEstudiante(parentesco) {
    if (!parentesco) return null;
    const p = String(parentesco).toUpperCase().trim();

    if (p === 'MADRE' || p.includes('MADRE')) return 'madre';
    if (p === 'PADRE' || p.includes('PADRE')) return 'padre';
    if (p === 'TUTOR(A)' || p === 'TUTOR' || p === 'TUTORA' || p.includes('TUTOR')) return 'tutor';

    // Otros → tutor
    return 'tutor';
}

/* ============================================
✅ AUTO-COMPLETAR TABLA DESDE EL HISTORIAL DEL FORMULARIO
============================================ */
function autoCompletarTabla() {
    console.log('═══════════════════════════════════');
    console.log('🚀 INICIANDO autoCompletarTabla');
    console.log('   📌 Fuente: registrosSigerd (historial del FORMULARIO)');
    console.log('   📌 Parentesco: campo "parentesco" de la Sección 1');
    console.log('   📌 Ocupación: campo "tutorOcupacion"');
    console.log('   📌 Escolaridad: campo "tutorEscolaridad"');
    console.log('═══════════════════════════════════');

    const estudiantes = obtenerEstudiantesDelGrupo();
    console.log('📋 Estudiantes encontrados:', estudiantes.length);

    if (estudiantes.length === 0) {
        console.warn('⚠️ No hay estudiantes para mostrar');
        return;
    }

    const filas = document.querySelectorAll('#cuerpoTabla tr');
    if (filas.length === 0) {
        console.error('❌ No hay filas en la tabla');
        return;
    }

    let filaIndex = 0;
    let contactosAgregados = 0;

    estudiantes.forEach((estudiante, idxEst) => {
        if (filaIndex >= NUM_FILAS) return;

        console.log(`\n👤 Estudiante ${idxEst + 1}: ${estudiante.nombre} ${estudiante.apellido}`);

        // ✅ DATOS DIRECTOS DEL REGISTRO
        const parentescoEstudiante = estudiante.parentesco || '';
        const tutorTipo = estudiante.tutorTipo || '';
        const tutorCedula = estudiante.tutorCedula || '';
        const tutorTelefono = estudiante.tutorTelefono || '';
        const tutorEscolaridad = estudiante.tutorEscolaridad || '';
        const tutorOcupacion = estudiante.tutorOcupacion || '';
        const emergenciaNombre = estudiante.emergenciaNombre || '';
        const emergenciaTelefono = estudiante.emergenciaTelefono || '';

        console.log('   📋 Datos del historial:');
        console.log('   - parentesco (Sección 1):', parentescoEstudiante || '❌ vacío');
        console.log('   - tutorTipo:', tutorTipo || '❌ vacío');
        console.log('   - tutorCedula:', tutorCedula || '❌ vacío');
        console.log('   - tutorTelefono:', tutorTelefono || '❌ vacío');
        console.log('   - tutorEscolaridad:', tutorEscolaridad || '❌ vacío');
        console.log('   - tutorOcupacion:', tutorOcupacion || '❌ vacío');
        console.log('   - emergenciaNombre:', emergenciaNombre || '❌ vacío');
        console.log('   - emergenciaTelefono:', emergenciaTelefono || '❌ vacío');

        // ✅ 1. DETECTAR PARENTESCO
        let tipoParentesco = detectarParentescoDesdeEstudiante(parentescoEstudiante);

        if (!tipoParentesco && tutorTipo) {
            tipoParentesco = detectarParentescoDesdeEstudiante(tutorTipo) || 'tutor';
        }
        if (!tipoParentesco) {
            tipoParentesco = 'tutor';
        }

        console.log('   ✅ Parentesco detectado:', tipoParentesco);

        // ✅ 2. Determinar NOMBRE del contacto
        let nombreContacto = '';

        if (emergenciaNombre && emergenciaNombre.trim() !== '') {
            nombreContacto = emergenciaNombre;
        }
        else if (tutorTipo && tutorTipo.trim() !== '' &&
                 !['PADRE', 'MADRE', 'TUTOR', 'TUTORA', 'TUTOR(A)'].includes(tutorTipo.toUpperCase().trim())) {
            nombreContacto = tutorTipo;
        }
        else {
            nombreContacto = `${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim();
        }

        if (!nombreContacto || nombreContacto.trim() === '') {
            console.warn('   ⚠️ No hay nombre de contacto para este estudiante');
            return;
        }

        console.log('   ✅ Contacto a insertar:', {
            nombre: nombreContacto,
            tipo: tipoParentesco,
            cedula: tutorCedula,
            telefono: tutorTelefono || emergenciaTelefono,
            escolaridad: tutorEscolaridad,
            ocupacion: tutorOcupacion
        });

        const fila = filas[filaIndex];
        if (!fila) return;

        // ✅ 1. NOMBRE
        const inputNombre = fila.querySelector('.input-nombre');
        if (inputNombre) {
            inputNombre.value = nombreContacto.toUpperCase().trim();
        }

        // ✅ 2. PARENTESCO
        const checkParentesco = fila.querySelector(`.parentesco[data-campo="${tipoParentesco}"]`);
        if (checkParentesco) checkParentesco.checked = true;

        // ✅ 3. CÉDULA
        const inputCedula = fila.querySelector('.input-cedula');
        if (inputCedula && tutorCedula) {
            inputCedula.value = tutorCedula;
            validarCedula(inputCedula);
        }

        // ✅ 4. TELÉFONO
        const inputTelefono = fila.querySelector('.input-telefono');
        const telefonoFinal = tutorTelefono || emergenciaTelefono;
        if (inputTelefono && telefonoFinal) {
            inputTelefono.value = telefonoFinal;
            validarTelefono(inputTelefono);
        }

        // ✅ 5. OCUPACIÓN U OFICIO (NUEVO)
        const selectProfesion = fila.querySelector('.input-profesion');
        if (selectProfesion && tutorOcupacion && tutorOcupacion.trim() !== '') {
            const ocupacionMapeada = mapearOcupacion(tutorOcupacion);
            if (ocupacionMapeada) {
                selectProfesion.value = ocupacionMapeada;
            }
        }

        // ✅ 6. NIVEL EDUCATIVO (NUEVO)
        if (tutorEscolaridad && tutorEscolaridad.trim() !== '') {
            // Desmarcar todos los checkboxes de nivel educativo de esta fila
            fila.querySelectorAll('.nivel-educativo').forEach(cb => cb.checked = false);

            const campoDestino = mapearNivelEducativo(tutorEscolaridad);
            if (campoDestino) {
                const checkbox = fila.querySelector(`.nivel-educativo[data-campo="${campoDestino}"]`);
                if (checkbox) checkbox.checked = true;
            }
        }

        filaIndex++;
        contactosAgregados++;
    });

    console.log('\n═══════════════════════════════════');
    console.log(`✅ TOTAL: ${contactosAgregados} contactos insertados`);
    console.log('═══════════════════════════════════');
}

/* ============ GUARDAR ============ */
function guardarDatos() {
    const datos = [];
    let valido = true;

    document.querySelectorAll('#cuerpoTabla tr').forEach(fila => {
        const filaData = {};
        let tieneNombre = false;

        fila.querySelectorAll('input').forEach(input => {
            if (input.type === 'checkbox') {
                filaData[input.dataset.campo] = input.checked;
            } else {
                const valor = input.value.trim();
                filaData[input.dataset.campo] = valor;
                if (input.dataset.campo === 'nombre' && valor !== '') {
                    tieneNombre = true;
                }
            }
        });

        const select = fila.querySelector('.input-profesion');
        if (select) filaData.profesion = select.value;

        if (tieneNombre) {
            const tieneParentesco = filaData.madre || filaData.padre || filaData.tutor;
            if (!tieneParentesco) {
                valido = false;
                alert(`⚠️ La fila ${fila.dataset.fila} tiene nombre pero no parentesco.`);
                return;
            }
        }

        datos.push(filaData);
    });

    if (!valido) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    alert('✅ Datos guardados correctamente');
}

/* ============ CARGAR ============ */
function cargarDatos() {
    const datos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!datos) {
        alert('⚠️ No hay datos guardados');
        return;
    }

    const filas = document.querySelectorAll('#cuerpoTabla tr');
    datos.forEach((filaData, idx) => {
        if (filas[idx]) {
            filas[idx].querySelectorAll('input').forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = filaData[input.dataset.campo] || false;
                } else {
                    input.value = filaData[input.dataset.campo] || '';
                    if (input.dataset.campo === 'cedula') validarCedula(input);
                    else if (input.dataset.campo === 'telefono') validarTelefono(input);
                }
            });
            const select = filas[idx].querySelector('.input-profesion');
            if (select && filaData.profesion) select.value = filaData.profesion;
        }
    });
    alert('✅ Datos cargados correctamente');
}

/* ============ LIMPIAR ============ */
function limpiarTodo() {
    if (!confirm('¿Limpiar todos los datos?')) return;
    limpiarCampos();
    localStorage.removeItem(STORAGE_KEY);
    alert('🗑️ Datos limpiados');
}

function limpiarCampos() {
    document.querySelectorAll('#cuerpoTabla input').forEach(input => {
        if (input.type === 'checkbox') input.checked = false;
        else { input.value = ''; input.style.borderBottom = '1px solid #d0d8e0'; }
    });
    document.querySelectorAll('.input-profesion').forEach(select => select.value = '');
}

function recargarTablaDesdeSincronizacion() {
    limpiarCampos();
    aplicarDatosSincronizados();
    autoCompletarTabla();
}
window.recargarTablaDesdeSincronizacion = recargarTablaDesdeSincronizacion;

/* ============ INICIALIZAR ============ */
document.addEventListener('DOMContentLoaded', function() {
    console.log('👨‍👩‍👧 dtos-relativo-pmt - Inicializando...');
    console.log('📌 Fuente de datos: registrosSigerd (historial del FORMULARIO)');
    console.log('📌 Parentesco: campo "parentesco" de la Sección 1 del estudiante');
    console.log('📌 Ocupación: campo "tutorOcupacion"');
    console.log('📌 Escolaridad: campo "tutorEscolaridad"');

    setTimeout(diagnostico, 300);

    const sincronizado = aplicarDatosSincronizados();
    if (!sincronizado) {
        const savedGrade = localStorage.getItem('currentGrade') || '3';
        const savedSection = localStorage.getItem('currentSection') || 'A';
        const savedTanda = localStorage.getItem('currentTanda') || 'MATUTINA';
        const savedYear = localStorage.getItem('currentSchoolYear') || '2025-2026';

        currentGrade = parseInt(savedGrade);
        currentSection = savedSection;
        currentTanda = savedTanda;
        currentSchoolYear = savedYear;

        actualizarInfoGradoPMT();
    }

    crearFilas();

    setTimeout(function() {
        autoCompletarTabla();
    }, 400);
});

/* ============ EVENTOS DE SINCRONIZACIÓN ============ */
document.addEventListener('formulariosActualizado', function() {
    console.log('🔄 Evento formulariosActualizado recibido');
    recargarTablaDesdeSincronizacion();
});

window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_REGISTROS ||
        e.key === 'datosSincronizados' ||
        e.key === 'formulariosActualizadoTimestamp' ||
        e.key === 'registroGradoData' ||
        e.key === 'minerd_grado_completo') {
        console.log('🔄 Cambio detectado en localStorage:', e.key);
        recargarTablaDesdeSincronizacion();
    }
});

/* ============ EXPORTAR ============ */
window.syncData = syncData;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;
window.actualizarInfoGradoPMT = actualizarInfoGradoPMT;
window.formatearTanda = formatearTanda;
window.autoCompletarTabla = autoCompletarTabla;
window.obtenerEstudiantesDelGrupo = obtenerEstudiantesDelGrupo;
window.obtenerGrupoActualPMT = obtenerGrupoActual;
window.diagnostico = diagnostico;
window.recargarTablaDesdeSincronizacion = recargarTablaDesdeSincronizacion;
window.detectarParentescoDesdeEstudiante = detectarParentescoDesdeEstudiante;
window.mapearNivelEducativo = mapearNivelEducativo;
window.mapearOcupacion = mapearOcupacion;