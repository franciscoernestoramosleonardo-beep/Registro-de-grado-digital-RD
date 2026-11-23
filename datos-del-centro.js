/**
DATOS DEL CENTRO EDUCATIVO - SCRIPT COMPLETO
✅ GUARDADO PERMANENTE en localStorage
✅ BÚSQUEDA EN CASCADA (Provincia -> Municipio -> Paraje)
✅ PERMITE ESCRITURA MANUAL EN TODOS LOS CAMPOS
✅ SIN LÍNEA VERDE EN ZONA/SECTOR
✅ TELÉFONO OBLIGATORIO
*/
const DatosCentro = (() => {
'use strict';
let currentGrade = 3;
let currentSection = 'A';
let currentSchoolYear = '2025-2026';
let parajeData = [];
let ipUbicacion = null;
let parajeDataNormalized = [];

// ============================================
// UTILIDADES
// ============================================
function normalizar(str) {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn('⚠️ No se pudo guardar en localStorage:', e);
        return false;
    }
}
function safeLocalStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn('⚠️ No se pudo leer de localStorage:', e);
        return null;
    }
}

// ============================================
// OBTENER CLAVE PRINCIPAL PARA GUARDAR
// ============================================
function getStorageKey() {
    return 'datos_centro_' + currentGrade + '_' + currentSection;
}

// ============================================
// SINCRONIZACIÓN
// ============================================
function syncData(grade, section, year) {
    if (grade !== undefined && grade >= 1 && grade <= 6) currentGrade = grade;
    if (section !== undefined) currentSection = section;
    if (year !== undefined) currentSchoolYear = year;
    
    document.getElementById('gradeDisplayDC').textContent = getGradeText(currentGrade) + ' Grado';
    document.getElementById('sectionDisplayDC').textContent = 'Sección ' + currentSection;
    document.getElementById('schoolYearDisplayDC').textContent = currentSchoolYear;
    
    safeLocalStorageSet('currentGrade', currentGrade.toString());
    safeLocalStorageSet('currentSection', currentSection);
    safeLocalStorageSet('currentSchoolYear', currentSchoolYear);
    
    cargarDatosCentro();
}
function getGradeText(grade) {
    const texts = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to' };
    return texts[grade] || '3er';
}

// ============================================
// APLICAR DATOS SINCRONIZADOS
// ============================================
function aplicarDatosSincronizados() {
    try {
        const datosSync = safeLocalStorageGet('datosSincronizados');
        if (!datosSync) return false;
        
        const datos = JSON.parse(datosSync);
        
        if (datos.grado) {
            const gradoMap = {
                'Primer Grado': 1, 'Segundo Grado': 2, 'Tercer Grado': 3,
                'Cuarto Grado': 4, 'Quinto Grado': 5, 'Sexto Grado': 6
            };
            currentGrade = gradoMap[datos.grado] || 3;
            document.getElementById('gradeDisplayDC').textContent = getGradeText(currentGrade) + ' Grado';
        }
        
        if (datos.seccion) {
            currentSection = datos.seccion;
            document.getElementById('sectionDisplayDC').textContent = 'Sección ' + currentSection;
        }
        
        if (datos.anioEscolar) {
            currentSchoolYear = datos.anioEscolar;
            document.getElementById('schoolYearDisplayDC').textContent = currentSchoolYear;
        }
        
        if (datos.regional) {
            const selectRegional = document.getElementById('regional');
            if (selectRegional) {
                selectRegional.value = datos.regional;
                selectRegional.style.borderBottomColor = '#28a745';
            }
        }
        
        if (datos.distrito) {
            const selectDistrito = document.getElementById('distrito');
            if (selectDistrito) {
                selectDistrito.value = datos.distrito;
                selectDistrito.style.borderBottomColor = '#28a745';
            }
        }
        
        if (datos.centroEducativo) {
            safeLocalStorageSet('centroEducativoSincronizado', datos.centroEducativo);
        }
        
        safeLocalStorageSet('currentGrade', currentGrade.toString());
        safeLocalStorageSet('currentSection', currentSection);
        safeLocalStorageSet('currentSchoolYear', currentSchoolYear);
        
        return true;
    } catch (e) {
        console.error('❌ Error aplicando datos sincronizados:', e);
        return false;
    }
}

// ============================================
// CARGAR DATOS DE PARAJES
// ============================================
function cargarDatosParajes() {
    try {
        if (typeof window.parajebarrio !== 'undefined' && Array.isArray(window.parajebarrio)) {
            parajeData = window.parajebarrio;
            
            // Eliminar duplicados
            const vistaUnica = new Map();
            parajeData.forEach(item => {
                const key = `${item["Barrio/Paraje"]}|${item.Provincia}|${item.Municipio}`;
                if (!vistaUnica.has(key)) vistaUnica.set(key, item);
            });
            parajeData = Array.from(vistaUnica.values());
            
            // Normalizar para búsquedas
            parajeDataNormalized = parajeData.map(item => ({
                ...item,
                _parajeNorm: normalizar(item["Barrio/Paraje"]),
                _municipioNorm: normalizar(item.Municipio),
                _provinciaNorm: normalizar(item.Provincia)
            }));
            
            obtenerUbicacionPorIP();
        } else {
            parajeData = [
                { "Barrio/Paraje": "Los Cartones", "Provincia": "Azua", "Municipio": "Azua" },
                { "Barrio/Paraje": "Guayacanes Adentro", "Provincia": "Valverde", "Municipio": "Laguna Salada" }
            ];
            parajeDataNormalized = parajeData.map(item => ({
                ...item,
                _parajeNorm: normalizar(item["Barrio/Paraje"]),
                _municipioNorm: normalizar(item.Municipio),
                _provinciaNorm: normalizar(item.Provincia)
            }));
        }
    } catch (e) {
        console.error('❌ Error cargando datos de parajes:', e);
        parajeData = [];
        parajeDataNormalized = [];
    }
}

// ============================================
// OBTENER UBICACIÓN POR IP
// ============================================
function obtenerUbicacionPorIP() {
    const cached = sessionStorage.getItem('ipLocation');
    if (cached) {
        try {
            ipUbicacion = JSON.parse(cached);
            actualizarPlaceholderParaje();
            return;
        } catch (e) {}
    }
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            if (data.region) {
                ipUbicacion = { provincia: data.region, ciudad: data.city };
                sessionStorage.setItem('ipLocation', JSON.stringify(ipUbicacion));
                actualizarPlaceholderParaje();
            }
        })
        .catch(() => {});
}
function actualizarPlaceholderParaje() {
    if (ipUbicacion && ipUbicacion.provincia) {
        const parajesEncontrados = parajeDataNormalized.filter(item => 
            item._provinciaNorm === normalizar(ipUbicacion.provincia)
        );
        if (parajesEncontrados.length > 0) {
            const inputParaje = document.getElementById('paraje');
            if (inputParaje && !inputParaje.value) {
                inputParaje.placeholder = `Ej: ${parajesEncontrados[0]["Barrio/Paraje"]}`;
            }
        }
    }
}

// ============================================
// 🆕 SISTEMA DE BÚSQUEDA EN CASCADA
// ============================================

// Obtener todas las provincias únicas
function obtenerTodasLasProvincias() {
    const provincias = new Set();
    parajeDataNormalized.forEach(item => {
        if (item.Provincia) provincias.add(item.Provincia);
    });
    return Array.from(provincias).sort();
}

// Obtener municipios de una provincia específica
function obtenerMunicipiosDeProvincia(provincia) {
    if (!provincia) return [];
    const provinciaNorm = normalizar(provincia);
    const municipios = new Set();
    parajeDataNormalized.forEach(item => {
        if (item._provinciaNorm === provinciaNorm && item.Municipio) {
            municipios.add(item.Municipio);
        }
    });
    return Array.from(municipios).sort();
}

// Obtener parajes de un municipio específico (y provincia si se especifica)
function obtenerParajesDeMunicipio(municipio, provincia) {
    if (!municipio) return [];
    const municipioNorm = normalizar(municipio);
    const provinciaNorm = provincia ? normalizar(provincia) : null;
    
    const parajes = new Set();
    parajeDataNormalized.forEach(item => {
        if (item._municipioNorm === municipioNorm) {
            if (!provinciaNorm || item._provinciaNorm === provinciaNorm) {
                if (item["Barrio/Paraje"]) parajes.add(item["Barrio/Paraje"]);
            }
        }
    });
    return Array.from(parajes).sort();
}

// ============================================
// MOSTRAR SUGERENCIAS
// ============================================
function mostrarSugerencias(contenedorId, items, tipo, input, permitirManual, callback) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = '';
    
    if (items.length === 0 && !permitirManual) {
        contenedor.classList.remove('active');
        return;
    }

    let html = '';

    // Mostrar los items de la lista
    items.forEach(item => {
        html += `
            <div class="sugerencia-item" data-valor="${escapeHTML(item)}" role="option">
                <span>${escapeHTML(item)}</span>
                <span class="badge-sugerencia">${tipo}</span>
            </div>
        `;
    });
    
    // Opción manual siempre disponible si se permite
    if (permitirManual) {
        html += `
            <div class="sugerencia-item sugerencia-manual" data-manual="true" role="option">
                <span>✏️ Escribir manualmente (no está en la lista)</span>
                <span class="badge-sugerencia">Manual</span>
            </div>
        `;
    }

    contenedor.innerHTML = html;
    contenedor.classList.add('active');
    if (input) input.setAttribute('aria-expanded', 'true');
    
    // Manejar clics en las sugerencias
    contenedor.querySelectorAll('.sugerencia-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.dataset.manual === 'true') {
                if (input) {
                    input.value = '';
                    input.focus();
                    input.style.borderBottomColor = '#f39c12';
                }
                contenedor.classList.remove('active');
                contenedor.innerHTML = '';
                if (input) input.setAttribute('aria-expanded', 'false');
                guardarDatosCentro();
                return;
            }
            
            const valor = this.dataset.valor;
            if (input) {
                input.value = valor;
                input.style.borderBottomColor = '#28a745';
            }
            
            contenedor.classList.remove('active');
            contenedor.innerHTML = '';
            if (input) input.setAttribute('aria-expanded', 'false');
            
            if (callback) callback(valor);
            guardarDatosCentro();
        });
    });
}

// ============================================
// CONFIGURAR CAMPOS DE UBICACIÓN (CASCADA)
// ============================================
function configurarCamposUbicacion() {
    const inputParaje = document.getElementById('paraje');
    const inputMunicipio = document.getElementById('municipio');
    const inputProvincia = document.getElementById('provincia');

    if (!inputParaje || !inputMunicipio || !inputProvincia) return;

    // --- PROVINCIA: Lista completa ---
    inputProvincia.addEventListener('focus', function() {
        const todasLasProvincias = obtenerTodasLasProvincias();
        mostrarSugerencias(
            'sugerenciasProvincia', 
            todasLasProvincias, 
            'Provincia', 
            inputProvincia, 
            true,
            (provinciaSeleccionada) => {
                // Al seleccionar provincia, limpiar municipio y paraje si no coinciden
                if (inputMunicipio.value) {
                    const municipiosValidos = obtenerMunicipiosDeProvincia(provinciaSeleccionada);
                    if (!municipiosValidos.includes(inputMunicipio.value)) {
                        inputMunicipio.value = '';
                        inputMunicipio.style.borderBottomColor = '#000';
                        inputParaje.value = '';
                        inputParaje.style.borderBottomColor = '#000';
                    }
                }
            }
        );
    });

    inputProvincia.addEventListener('input', function() {
        const valor = this.value.trim();
        if (valor.length > 0) {
            const todasLasProvincias = obtenerTodasLasProvincias();
            const filtradas = todasLasProvincias.filter(p => normalizar(p).includes(normalizar(valor)));
            mostrarSugerencias(
                'sugerenciasProvincia', 
                filtradas, 
                'Provincia', 
                inputProvincia, 
                true,
                (provinciaSeleccionada) => {
                    if (inputMunicipio.value) {
                        const municipiosValidos = obtenerMunicipiosDeProvincia(provinciaSeleccionada);
                        if (!municipiosValidos.includes(inputMunicipio.value)) {
                            inputMunicipio.value = '';
                            inputMunicipio.style.borderBottomColor = '#000';
                            inputParaje.value = '';
                            inputParaje.style.borderBottomColor = '#000';
                        }
                    }
                }
            );
        } else {
            const contenedor = document.getElementById('sugerenciasProvincia');
            if (contenedor) {
                contenedor.classList.remove('active');
                contenedor.innerHTML = '';
            }
        }
        guardarDatosCentro();
    });

    // --- MUNICIPIO: Depende de Provincia ---
    inputMunicipio.addEventListener('focus', function() {
        const provincia = inputProvincia.value.trim();
        if (provincia) {
            const municipios = obtenerMunicipiosDeProvincia(provincia);
            mostrarSugerencias(
                'sugerenciasMunicipio', 
                municipios, 
                'Municipio', 
                inputMunicipio, 
                true,
                (municipioSeleccionado) => {
                    // Al seleccionar municipio, limpiar paraje si no coincide
                    if (inputParaje.value) {
                        const parajesValidos = obtenerParajesDeMunicipio(municipioSeleccionado, provincia);
                        if (!parajesValidos.includes(inputParaje.value)) {
                            inputParaje.value = '';
                            inputParaje.style.borderBottomColor = '#000';
                        }
                    }
                }
            );
        } else {
            // Si no hay provincia, mostrar todos los municipios (pero con manual)
            const todosLosMunicipios = [...new Set(parajeDataNormalized.map(item => item.Municipio))].sort();
            mostrarSugerencias(
                'sugerenciasMunicipio', 
                todosLosMunicipios, 
                'Municipio', 
                inputMunicipio, 
                true,
                () => {}
            );
        }
    });

    inputMunicipio.addEventListener('input', function() {
        const valor = this.value.trim();
        const provincia = inputProvincia.value.trim();
        
        if (valor.length > 0) {
            let municipios;
            if (provincia) {
                municipios = obtenerMunicipiosDeProvincia(provincia).filter(m => 
                    normalizar(m).includes(normalizar(valor))
                );
            } else {
                municipios = [...new Set(parajeDataNormalized.map(item => item.Municipio))]
                    .filter(m => normalizar(m).includes(normalizar(valor)))
                    .sort();
            }
            
            mostrarSugerencias(
                'sugerenciasMunicipio', 
                municipios, 
                'Municipio', 
                inputMunicipio, 
                true,
                (municipioSeleccionado) => {
                    if (inputParaje.value) {
                        const parajesValidos = obtenerParajesDeMunicipio(municipioSeleccionado, provincia);
                        if (!parajesValidos.includes(inputParaje.value)) {
                            inputParaje.value = '';
                            inputParaje.style.borderBottomColor = '#000';
                        }
                    }
                }
            );
        } else {
            const contenedor = document.getElementById('sugerenciasMunicipio');
            if (contenedor) {
                contenedor.classList.remove('active');
                contenedor.innerHTML = '';
            }
        }
        guardarDatosCentro();
    });

    // --- PARAJE: Depende de Municipio (y Provincia) ---
    inputParaje.addEventListener('focus', function() {
        const municipio = inputMunicipio.value.trim();
        const provincia = inputProvincia.value.trim();
        
        if (municipio) {
            const parajes = obtenerParajesDeMunicipio(municipio, provincia);
            mostrarSugerencias(
                'sugerenciasParaje', 
                parajes, 
                'Paraje', 
                inputParaje, 
                true,
                () => {}
            );
        } else {
            // Si no hay municipio, mostrar todos los parajes
            const todosLosParajes = [...new Set(parajeDataNormalized.map(item => item["Barrio/Paraje"]))].sort();
            mostrarSugerencias(
                'sugerenciasParaje', 
                todosLosParajes, 
                'Paraje', 
                inputParaje, 
                true,
                () => {}
            );
        }
    });

    inputParaje.addEventListener('input', function() {
        const valor = this.value.trim();
        const municipio = inputMunicipio.value.trim();
        const provincia = inputProvincia.value.trim();
        
        if (valor.length > 0) {
            let parajes;
            if (municipio) {
                parajes = obtenerParajesDeMunicipio(municipio, provincia).filter(p => 
                    normalizar(p).includes(normalizar(valor))
                );
            } else {
                parajes = [...new Set(parajeDataNormalized.map(item => item["Barrio/Paraje"]))]
                    .filter(p => normalizar(p).includes(normalizar(valor)))
                    .sort();
            }
            
            mostrarSugerencias(
                'sugerenciasParaje', 
                parajes, 
                'Paraje', 
                inputParaje, 
                true,
                () => {}
            );
        } else {
            const contenedor = document.getElementById('sugerenciasParaje');
            if (contenedor) {
                contenedor.classList.remove('active');
                contenedor.innerHTML = '';
            }
        }
        guardarDatosCentro();
    });

    // --- MANEJO DE BLUR (MAYÚSCULAS) Y CIERRE DE LISTAS ---
    [inputParaje, inputMunicipio, inputProvincia].forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.value = this.value.toUpperCase();
            }
            guardarDatosCentro();
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.form-group-dc:has(#' + input.id + ')')) {
                const contenedorId = 'sugerencias' + input.id.charAt(0).toUpperCase() + input.id.slice(1);
                const contenedor = document.getElementById(contenedorId);
                if (contenedor) {
                    contenedor.classList.remove('active');
                    contenedor.innerHTML = '';
                }
                input.setAttribute('aria-expanded', 'false');
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const contenedorId = 'sugerencias' + input.id.charAt(0).toUpperCase() + input.id.slice(1);
                const contenedor = document.getElementById(contenedorId);
                if (contenedor) {
                    contenedor.classList.remove('active');
                    contenedor.innerHTML = '';
                }
                input.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

// ============================================
// CONFIGURAR MAYÚSCULAS (OTROS CAMPOS)
// ============================================
function configurarMayusculas() {
    document.querySelectorAll('.value-input-dc, .value-input-full-dc').forEach(function(input) {
        if (input.id === 'paraje' || input.id === 'provincia' || input.id === 'municipio') {
            return;
        }
        input.addEventListener('input', function() {
            if (this.type !== 'email' && this.type !== 'tel') {
                this.value = this.value.toUpperCase();
                guardarDatosCentro();
            }
        });
        input.addEventListener('blur', function() {
            if (this.type !== 'email' && this.type !== 'tel') {
                this.value = this.value.toUpperCase();
                guardarDatosCentro();
            }
        });
    });
}

// ============================================
// VALIDACIONES
// ============================================
function configurarValidacionCorreo() {
    document.querySelectorAll('input[type="email"]').forEach(function(input) {
        input.addEventListener('blur', function() {
            validarCorreo(this);
            guardarDatosCentro();
        });
    });
}
function validarCorreo(input) {
    const valor = input.value.trim();
    if (valor === '') {
        input.style.borderBottomColor = '#000';
        return true;
    }
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (regex.test(valor)) {
        input.style.borderBottomColor = '#28a745';
        return true;
    } else {
        input.style.borderBottomColor = '#dc3545';
        mostrarMensaje('❌ Correo electrónico inválido', 'error');
        return false;
    }
}

function configurarValidacionTelefono() {
    document.querySelectorAll('input[type="tel"]').forEach(function(input) {
        input.addEventListener('input', function(e) {
            formatearTelefono(this, e);
            guardarDatosCentro();
        });
        input.addEventListener('blur', function() {
            validarTelefono(this);
            guardarDatosCentro();
        });
        input.addEventListener('keypress', function(e) {
            if (e.which < 48 || e.which > 57) {
                e.preventDefault();
            }
        });
    });
}
function formatearTelefono(input, event) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 10) valor = valor.substring(0, 10);
    if (valor.length > 3 && valor.length <= 6) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3);
    } else if (valor.length > 6) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 6) + '-' + valor.substring(6, 10);
    }
    input.value = valor;
}
function validarTelefono(input) {
    const valor = input.value.trim();
    if (valor === '') {
        input.style.borderBottomColor = '#000';
        return true;
    }
    const regex = /^(809|829|849)-[0-9]{3}-[0-9]{4}$/;
    if (regex.test(valor)) {
        input.style.borderBottomColor = '#28a745';
        return true;
    } else {
        input.style.borderBottomColor = '#dc3545';
        mostrarMensaje('❌ Teléfono inválido. Debe ser: 809-000-0000, 829-000-0000 o 849-000-0000', 'error');
        return false;
    }
}

// ============================================
// RADIO BUTTONS Y SELECTS
// ============================================
function configurarRadioButtons() {
    // ✅ Se eliminó el borde verde al seleccionar zona/sector
    document.querySelectorAll('#zonaGroupDC input[type="radio"], #sectorGroupDC input[type="radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.checked) {
                guardarDatosCentro();
            }
        });
    });
}

function configurarSelects() {
    document.querySelectorAll('.value-select-dc').forEach(function(select) {
        select.addEventListener('change', function() {
            if (this.value) {
                this.style.borderBottomColor = '#28a745';
                this.style.borderBottomWidth = '2px';
            } else {
                this.style.borderBottomColor = '#000';
                this.style.borderBottomWidth = '1px';
            }
            guardarDatosCentro();
        });
    });
}

// ============================================
// GUARDAR Y CARGAR
// ============================================
function guardarDatosCentro() {
    const datos = {};
    document.querySelectorAll('.value-input-dc, .value-input-full-dc, .value-select-dc').forEach(function(input) {
        if (input.id) datos[input.id] = input.value;
    });
    
    const zonaSeleccionada = document.querySelector('#zonaGroupDC input[type="radio"]:checked');
    if (zonaSeleccionada) datos['zona'] = zonaSeleccionada.value;
    
    const sectorSeleccionado = document.querySelector('#sectorGroupDC input[type="radio"]:checked');
    if (sectorSeleccionado) datos['sector'] = sectorSeleccionado.value;
    
    const key = getStorageKey();
    safeLocalStorageSet(key, JSON.stringify(datos));
    safeLocalStorageSet('datos_centro_respaldo', JSON.stringify(datos));
}

function cargarDatosCentro() {
    const key = getStorageKey();
    let saved = safeLocalStorageGet(key);
    
    if (!saved) {
        saved = safeLocalStorageGet('datos_centro_respaldo');
        if (saved) safeLocalStorageSet(key, saved);
    }
    
    if (!saved) return;
    
    try {
        const datos = JSON.parse(saved);
        
        for (const id in datos) {
            if (id === 'zona' || id === 'sector') continue;
            const el = document.getElementById(id);
            if (el) {
                el.value = datos[id];
                
                if (el.id === 'municipio' || el.id === 'provincia' || el.id === 'paraje') {
                    if (el.value.trim()) el.style.borderBottomColor = '#f39c12';
                }
                if (el.type === 'email') validarCorreo(el);
                else if (el.type === 'tel') validarTelefono(el);
                else if (el.tagName === 'SELECT' && el.value) {
                    el.style.borderBottomColor = '#28a745';
                }
            }
        }
        
        // ✅ Se eliminó la aplicación del borde verde al cargar zona/sector
        if (datos.zona) {
            const radioZona = document.querySelector('#zonaGroupDC input[type="radio"][value="' + datos.zona + '"]');
            if (radioZona) {
                radioZona.checked = true;
            }
        }
        
        if (datos.sector) {
            const radioSector = document.querySelector('#sectorGroupDC input[type="radio"][value="' + datos.sector + '"]');
            if (radioSector) {
                radioSector.checked = true;
            }
        }
    } catch(e) {
        console.error('❌ Error cargando datos:', e);
    }
}

// ============================================
// VALIDAR - CON TELÉFONO OBLIGATORIO
// ============================================
function validarDatosCentro() {
    let todoValido = true;
    const errores = [];
    
    guardarDatosCentro();
    
    // ✅ VALIDAR TELÉFONO OBLIGATORIO
    const inputTelefono = document.getElementById('telefono');
    if (inputTelefono) {
        const telefonoValor = inputTelefono.value.trim();
        if (telefonoValor === '') {
            inputTelefono.style.borderBottomColor = '#dc3545';
            inputTelefono.style.borderBottomWidth = '2px';
            todoValido = false;
            errores.push('El teléfono es obligatorio');
        } else if (!validarTelefono(inputTelefono)) {
            todoValido = false;
            errores.push('Teléfono inválido');
        } else {
            inputTelefono.style.borderBottomColor = '#28a745';
            inputTelefono.style.borderBottomWidth = '2px';
        }
    }
    
    // Validar correos
    document.querySelectorAll('input[type="email"]').forEach(function(input) {
        if (input.value.trim() !== '' && !validarCorreo(input)) {
            todoValido = false;
            errores.push('Correo inválido');
        }
    });
    
    // Validar otros teléfonos (director)
    document.querySelectorAll('input[type="tel"]').forEach(function(input) {
        if (input.id !== 'telefono' && input.value.trim() !== '' && !validarTelefono(input)) {
            todoValido = false;
            errores.push('Teléfono inválido');
        }
    });
    
    // Validar selects
    document.querySelectorAll('.value-select-dc').forEach(function(select) {
        if (select.value === '') {
            select.style.borderBottomColor = '#dc3545';
            todoValido = false;
        } else {
            select.style.borderBottomColor = '#28a745';
        }
    });
    
    // Validar paraje
    if (!document.getElementById('paraje')?.value.trim()) {
        todoValido = false;
        errores.push('Escriba un paraje/barrio');
    }
    
    // Validar municipio
    if (!document.getElementById('municipio')?.value.trim()) {
        todoValido = false;
        errores.push('Escriba o seleccione un municipio');
    }
    
    // Validar provincia
    if (!document.getElementById('provincia')?.value.trim()) {
        todoValido = false;
        errores.push('Escriba o seleccione una provincia');
    }
    
    // Validar zona
    if (!document.querySelector('#zonaGroupDC input[type="radio"]:checked')) {
        todoValido = false;
        errores.push('Seleccione una Zona');
    }
    
    // Validar sector
    if (!document.querySelector('#sectorGroupDC input[type="radio"]:checked')) {
        todoValido = false;
        errores.push('Seleccione un Sector');
    }
    
    guardarDatosCentro();
    
    if (todoValido) {
        mostrarMensaje('✅ ¡Todos los campos son válidos! Datos guardados permanentemente.', 'success');
    } else if (errores.length > 0) {
        mostrarMensaje('⚠️ ' + errores.join(' • '), 'error');
    }
    
    return todoValido;
}

// ============================================
// LIMPIAR
// ============================================
function limpiarDatosCentro() {
    if (!confirm('¿Está seguro que desea limpiar todos los campos?')) return;
    
    document.querySelectorAll('.value-input-dc, .value-input-full-dc, .value-select-dc').forEach(function(input) {
        input.value = '';
        input.style.borderBottomColor = '#000';
    });
    
    document.querySelectorAll('#zonaGroupDC input[type="radio"], #sectorGroupDC input[type="radio"]').forEach(function(radio) {
        radio.checked = false;
    });
    
    document.querySelectorAll('.form-row-dc').forEach(function(row) {
        row.style.borderBottom = 'none';
    });
    
    ['sugerenciasMunicipio', 'sugerenciasProvincia', 'sugerenciasParaje'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.remove('active'); el.innerHTML = ''; }
    });
    
    try {
        localStorage.removeItem(getStorageKey());
        localStorage.removeItem('datos_centro_respaldo');
    } catch (e) {}
    
    mostrarMensaje('✅ Todos los campos han sido limpiados.', 'info');
}

function printPage() {
    window.print();
}

// ============================================
// MENSAJES
// ============================================
function mostrarMensaje(mensaje, tipo) {
    const div = document.createElement('div');
    div.className = 'mensaje-flotante-dc';
    div.textContent = mensaje;
    div.setAttribute('role', 'alert');
    div.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; font-family: "Times New Roman", serif; font-size: 11pt; font-weight: bold; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.2); max-width: 90%; text-align: center; animation: slideDown 0.3s ease;';
    
    if (tipo === 'error') {
        div.style.background = '#f8d7da'; div.style.border = '3px solid #dc3545'; div.style.color = '#721c24';
    } else if (tipo === 'success') {
        div.style.background = '#d4edda'; div.style.border = '3px solid #28a745'; div.style.color = '#155724';
    } else {
        div.style.background = '#d1ecf1'; div.style.border = '3px solid #17a2b8'; div.style.color = '#0c5460';
    }
    
    document.body.appendChild(div);
    
    setTimeout(function() {
        if (div) {
            div.style.opacity = '0';
            div.style.transition = 'opacity 0.3s ease';
            setTimeout(function() { div.remove(); }, 300);
        }
    }, 4000);
}

// ============================================
// INICIALIZACIÓN
// ============================================
function init() {
    cargarDatosParajes();
    
    // ✅ CONFIGURAR CAMPOS EN CASCADA
    configurarCamposUbicacion(); 
    
    configurarMayusculas();
    configurarValidacionCorreo();
    configurarValidacionTelefono();
    configurarRadioButtons();
    configurarSelects();
    
    const savedGrade = safeLocalStorageGet('currentGrade') || '3';
    const savedSection = safeLocalStorageGet('currentSection') || 'A';
    const savedYear = safeLocalStorageGet('currentSchoolYear') || '2025-2026';
    
    currentGrade = parseInt(savedGrade);
    currentSection = savedSection;
    currentSchoolYear = savedYear;
    
    document.getElementById('gradeDisplayDC').textContent = getGradeText(currentGrade) + ' Grado';
    document.getElementById('sectionDisplayDC').textContent = 'Sección ' + currentSection;
    document.getElementById('schoolYearDisplayDC').textContent = currentSchoolYear;
    
    cargarDatosCentro();
    aplicarDatosSincronizados();
    
    setTimeout(() => {
        guardarDatosCentro();
    }, 500);
}

return {
    syncData,
    aplicarDatosSincronizados,
    validarDatosCentro,
    limpiarDatosCentro,
    printPage,
    init
};
})();

window.syncData = DatosCentro.syncData;
window.aplicarDatosSincronizados = DatosCentro.aplicarDatosSincronizados;
window.validarDatosCentro = DatosCentro.validarDatosCentro;
window.limpiarDatosCentro = DatosCentro.limpiarDatosCentro;
window.printPage = DatosCentro.printPage;

document.addEventListener('DOMContentLoaded', function() {
    DatosCentro.init();
});

// ========================================================================
// SINCRONIZACIÓN DE PROVINCIA, MUNICIPIO Y TELÉFONO CON EL BOLETÍN
// ========================================================================
(function() {
    'use strict';
    const CLAVE_SYNC_BOLETIN = 'datos_centro_para_boletin';

    function obtenerTelefonoCentro() {
        const tels = document.querySelectorAll('input[type="tel"]');
        return (tels.length > 0) ? tels[0].value.trim() : '';
    }

    function sincronizarConBoletin() {
        const provincia = document.getElementById('provincia') ? document.getElementById('provincia').value.trim() : '';
        const municipio = document.getElementById('municipio') ? document.getElementById('municipio').value.trim() : '';
        const telefono  = obtenerTelefonoCentro();

        if (!provincia && !municipio && !telefono) return;

        const datosParaBoletin = {
            provincia: provincia,
            municipio: municipio,
            telefono: telefono,
            actualizado: new Date().toISOString()
        };

        try {
            localStorage.setItem(CLAVE_SYNC_BOLETIN, JSON.stringify(datosParaBoletin));
        } catch (e) {}
    }

    function initSyncBoletin() {
        ['provincia', 'municipio'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('blur', sincronizarConBoletin);
                el.addEventListener('change', sincronizarConBoletin);
            }
        });

        const tels = document.querySelectorAll('input[type="tel"]');
        if (tels.length > 0) {
            tels[0].addEventListener('blur', sincronizarConBoletin);
            tels[0].addEventListener('change', sincronizarConBoletin);
            tels[0].addEventListener('input', sincronizarConBoletin);
        }

        setTimeout(sincronizarConBoletin, 1200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncBoletin);
    } else {
        initSyncBoletin();
    }
})();