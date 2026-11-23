/**
============================================
DATOS DEL MAESTRO - SCRIPT COMPLETO
Incluye:
✅ SINCRONIZACIÓN con página principal (index.html)
✅ Lee datos de 'datosSincronizados' en localStorage
============================================
*/
// ============================================
// VARIABLES GLOBALES
// ============================================
let currentGrade = 3;
let currentSection = 'A';
let currentSchoolYear = '2025-2026';

// ============================================
// FUNCIÓN DE SINCRONIZACIÓN (RECIBE DEL PADRE)
// ============================================
function syncData(grade, section, year) {
    if (grade !== undefined && grade >= 1 && grade <= 6) {
        currentGrade = grade;
    }
    if (section !== undefined) {
        currentSection = section;
    }
    if (year !== undefined) {
        currentSchoolYear = year;
    }
    document.getElementById('gradeDisplayDM').textContent = getGradeText(currentGrade) + ' Grado';
    document.getElementById('sectionDisplayDM').textContent = 'Sección ' + currentSection;
    document.getElementById('schoolYearDisplayDM').textContent = currentSchoolYear;
    cargarDatosMaestro();
    console.log('👨‍🏫 Datos del Maestro sincronizado:', currentGrade, currentSection);
}

function getGradeText(grade) {
    const texts = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to' };
    return texts[grade] || '3er';
}

// ============================================
// ✅ NUEVA FUNCIÓN: APLICAR DATOS SINCRONIZADOS DESDE PÁGINA PRINCIPAL
// ============================================
function aplicarDatosSincronizados() {
    try {
        const datosSync = localStorage.getItem('datosSincronizados');
        if (!datosSync) {
            console.log('ℹ️ No hay datos sincronizados desde la página principal');
            return false;
        }
        
        const datos = JSON.parse(datosSync);
        console.log('📥 Datos sincronizados recibidos en DATOS-DEL-MAESTRO:', datos);
        
        // ✅ Sincronizar Grado
        if (datos.grado) {
            const gradoMap = {
                'Primer Grado': 1,
                'Segundo Grado': 2,
                'Tercer Grado': 3,
                'Cuarto Grado': 4,
                'Quinto Grado': 5,
                'Sexto Grado': 6
            };
            currentGrade = gradoMap[datos.grado] || 3;
            document.getElementById('gradeDisplayDM').textContent = getGradeText(currentGrade) + ' Grado';
            console.log('✅ Grado sincronizado:', currentGrade);
        }
        
        // ✅ Sincronizar Sección
        if (datos.seccion) {
            currentSection = datos.seccion;
            document.getElementById('sectionDisplayDM').textContent = 'Sección ' + currentSection;
            console.log('✅ Sección sincronizada:', currentSection);
        }
        
        // ✅ Sincronizar Año Escolar
        if (datos.anioEscolar) {
            currentSchoolYear = datos.anioEscolar;
            document.getElementById('schoolYearDisplayDM').textContent = currentSchoolYear;
            console.log('✅ Año Escolar sincronizado:', currentSchoolYear);
        }
        
        // ✅ Guardar también en las claves individuales para compatibilidad
        localStorage.setItem('currentGrade', currentGrade.toString());
        localStorage.setItem('currentSection', currentSection);
        localStorage.setItem('currentSchoolYear', currentSchoolYear);
        
        return true;
        
    } catch (e) {
        console.error('❌ Error aplicando datos sincronizados:', e);
        return false;
    }
}

// ============================================
// EXPONER AL PADRE
// ============================================
window.syncData = syncData;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;

// ============================================
// GUARDADO AUTOMÁTICO EN TIEMPO REAL
// ============================================
function guardarAutomatico() {
    guardarDatosMaestro();
}

// ============================================
// CONVERTIR A MAYÚSCULAS Y GUARDAR AUTOMÁTICAMENTE
// ============================================
document.querySelectorAll('.value-input-full-dm').forEach(function(input) {
    input.addEventListener('input', function() {
        if (this.type !== 'email' && this.type !== 'tel' && this.type !== 'number') {
            this.value = this.value.toUpperCase();
        }
        guardarAutomatico();
    });
    input.addEventListener('blur', function() {
        if (this.type !== 'email' && this.type !== 'tel' && this.type !== 'number') {
            this.value = this.value.toUpperCase();
        }
        guardarAutomatico();
    });
});

document.querySelectorAll('select.value-input-dm').forEach(function(select) {
    select.addEventListener('change', function() {
        guardarAutomatico();
    });
});

// ============================================
// VALIDAR CORREO
// ============================================
document.querySelectorAll('input[type="email"]').forEach(function(input) {
    input.addEventListener('blur', function() {
        validarCorreo(this);
        guardarAutomatico();
    });
});

function validarCorreo(input) {
    var valor = input.value.trim();
    if (valor === '') {
        input.style.borderBottomColor = '#a0b0c0';
        return true;
    }
    var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (regex.test(valor)) {
        input.style.borderBottomColor = '#28a745';
        return true;
    } else {
        input.style.borderBottomColor = '#dc3545';
        mostrarMensaje('❌ Correo electrónico inválido', 'error');
        return false;
    }
}

// ============================================
// VALIDAR TELÉFONO - Máximo 10 dígitos
// ============================================
document.querySelectorAll('input[type="tel"]').forEach(function(input) {
    input.addEventListener('input', function() {
        formatearTelefono(this);
        guardarAutomatico();
    });
    input.addEventListener('blur', function() {
        validarTelefono(this);
        guardarAutomatico();
    });
});

function formatearTelefono(input) {
    var valor = input.value.replace(/\D/g, '');
    if (valor.length > 10) {
        valor = valor.substring(0, 10);
    }
    if (valor.length > 6 && valor.length <= 10) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 6) + '-' + valor.substring(6, 10);
    } else if (valor.length > 3 && valor.length <= 6) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 6);
    }
    input.value = valor;
}

function validarTelefono(input) {
    var valor = input.value.trim();
    if (valor === '') {
        input.style.borderBottomColor = '#a0b0c0';
        return true;
    }
    var regex = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
    if (regex.test(valor)) {
        input.style.borderBottomColor = '#28a745';
        return true;
    } else {
        input.style.borderBottomColor = '#dc3545';
        mostrarMensaje('❌ Teléfono inválido. Formato: 809-000-0000', 'error');
        return false;
    }
}

// ============================================
// VALIDAR CÉDULA - Máximo 11 dígitos
// ============================================
document.querySelectorAll('#maestroCedula').forEach(function(input) {
    input.addEventListener('input', function() {
        formatearCedula(this);
        guardarAutomatico();
    });
    input.addEventListener('blur', function() {
        validarCedula(this);
        guardarAutomatico();
    });
});

function formatearCedula(input) {
    var valor = input.value.replace(/\D/g, '');
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }
    if (valor.length > 10 && valor.length <= 11) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 10) + '-' + valor.substring(10, 11);
    } else if (valor.length > 3 && valor.length <= 10) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 10);
    }
    input.value = valor;
}

function validarCedula(input) {
    var valor = input.value.trim();
    if (valor === '') {
        input.style.borderBottomColor = '#a0b0c0';
        return true;
    }
    var regex = /^[0-9]{3}-[0-9]{7}-[0-9]{1}$/;
    if (regex.test(valor)) {
        input.style.borderBottomColor = '#28a745';
        return true;
    } else {
        input.style.borderBottomColor = '#dc3545';
        mostrarMensaje('❌ Cédula inválida. Formato: 000-0000000-0', 'error');
        return false;
    }
}

// ============================================
// VALIDAR FECHAS - Día máx 31, Mes máx 12
// ============================================
document.querySelectorAll('.fecha-group-dm input').forEach(function(input) {
    input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.id.includes('Dia') || this.id.includes('dia')) {
            var num = parseInt(this.value);
            if (num > 31) {
                this.value = '31';
            }
        }
        if (this.id.includes('Mes') || this.id.includes('mes')) {
            var num = parseInt(this.value);
            if (num > 12) {
                this.value = '12';
            }
        }
        guardarAutomatico();
        if (this.value.length === this.maxLength) {
            var nextInput = this.parentElement.querySelectorAll('input');
            var index = Array.from(nextInput).indexOf(this);
            if (index < nextInput.length - 1) {
                nextInput[index + 1].focus();
            }
        }
    });
    input.addEventListener('blur', function() {
        var parent = this.parentElement;
        var inputs = parent.querySelectorAll('input');
        var dia = inputs[0].value;
        var mes = inputs[1].value;
        var anio = inputs[2].value;
        if (dia !== '' || mes !== '' || anio !== '') {
            validarFechaCompleta(inputs);
        }
        guardarAutomatico();
    });
});

function validarFechaCompleta(inputs) {
    var dia = inputs[0].value;
    var mes = inputs[1].value;
    var anio = inputs[2].value;
    var valido = true;
    if (dia !== '' && (parseInt(dia) < 1 || parseInt(dia) > 31)) {
        inputs[0].style.borderBottomColor = '#dc3545';
        inputs[0].style.borderBottomWidth = '2px';
        valido = false;
    } else if (dia !== '') {
        inputs[0].style.borderBottomColor = '#28a745';
        inputs[0].style.borderBottomWidth = '2px';
    }
    if (mes !== '' && (parseInt(mes) < 1 || parseInt(mes) > 12)) {
        inputs[1].style.borderBottomColor = '#dc3545';
        inputs[1].style.borderBottomWidth = '2px';
        valido = false;
    } else if (mes !== '') {
        inputs[1].style.borderBottomColor = '#28a745';
        inputs[1].style.borderBottomWidth = '2px';
    }
    if (anio !== '' && (parseInt(anio) < 1900 || parseInt(anio) > 2099)) {
        inputs[2].style.borderBottomColor = '#dc3545';
        inputs[2].style.borderBottomWidth = '2px';
        valido = false;
    } else if (anio !== '') {
        inputs[2].style.borderBottomColor = '#28a745';
        inputs[2].style.borderBottomWidth = '2px';
    }
    if (dia !== '' && mes !== '' && anio !== '' && valido) {
        var fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
        if (fecha.getDate() !== parseInt(dia) || 
            fecha.getMonth() !== parseInt(mes) - 1 || 
            fecha.getFullYear() !== parseInt(anio)) {
            mostrarMensaje('❌ Fecha inválida', 'error');
            inputs.forEach(function(input) {
                input.style.borderBottomColor = '#dc3545';
                input.style.borderBottomWidth = '2px';
            });
            valido = false;
        }
    }
    return valido;
}

// ============================================
// VALIDAR RADIOS Y GUARDAR AUTOMÁTICAMENTE
// ============================================
document.querySelectorAll('.sexo-group-dm input[type="radio"], .si-no-group-dm input[type="radio"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
        var padre = this.closest('.maestro-item-dm');
        if (padre) {
            padre.style.borderBottomColor = '#28a745';
            padre.style.borderBottomWidth = '2px';
        }
        guardarAutomatico();
    });
});

// ============================================
// GUARDAR Y CARGAR DATOS
// ============================================
function guardarDatosMaestro() {
    var datos = {};
    document.querySelectorAll('.value-input-dm, .value-input-full-dm').forEach(function(input) {
        if (input.id) {
            datos[input.id] = input.value;
        }
    });
    var fechaIngreso = document.getElementById('maestroIngresoDia').value + '/' + 
                       document.getElementById('maestroIngresoMes').value + '/' + 
                       document.getElementById('maestroIngresoAnio').value;
    datos['maestroIngreso'] = fechaIngreso;
    var fechaNac = document.getElementById('maestroNacDia').value + '/' + 
                   document.getElementById('maestroNacMes').value + '/' + 
                   document.getElementById('maestroNacAnio').value;
    datos['maestroNacimiento'] = fechaNac;
    var sexo = document.querySelector('input[name="sexo"]:checked');
    datos['maestroSexo'] = sexo ? sexo.value : '';
    var labora = document.querySelector('input[name="labora"]:checked');
    datos['maestroLabora'] = labora ? labora.value : '';
    localStorage.setItem('datos_maestro_' + currentGrade + '_' + currentSection, JSON.stringify(datos));
}

function cargarDatosMaestro() {
    var key = 'datos_maestro_' + currentGrade + '_' + currentSection;
    var saved = localStorage.getItem(key);
    if (!saved) return;
    try {
        var datos = JSON.parse(saved);
        for (var id in datos) {
            if (id === 'maestroIngreso' || id === 'maestroNacimiento' || id === 'maestroSexo' || id === 'maestroLabora') continue;
            var el = document.getElementById(id);
            if (el) {
                el.value = datos[id];
                if (el.type === 'email' || el.type === 'tel') {
                    validarCorreo(el);
                    validarTelefono(el);
                }
                if (el.id === 'maestroCedula') {
                    validarCedula(el);
                }
            }
        }
        if (datos.maestroIngreso) {
            var partes = datos.maestroIngreso.split('/');
            if (partes.length === 3) {
                document.getElementById('maestroIngresoDia').value = partes[0];
                document.getElementById('maestroIngresoMes').value = partes[1];
                document.getElementById('maestroIngresoAnio').value = partes[2];
            }
        }
        if (datos.maestroNacimiento) {
            var partes = datos.maestroNacimiento.split('/');
            if (partes.length === 3) {
                document.getElementById('maestroNacDia').value = partes[0];
                document.getElementById('maestroNacMes').value = partes[1];
                document.getElementById('maestroNacAnio').value = partes[2];
            }
        }
        if (datos.maestroSexo) {
            var radios = document.querySelectorAll('input[name="sexo"]');
            radios.forEach(function(radio) {
                if (radio.value === datos.maestroSexo) {
                    radio.checked = true;
                }
            });
        }
        if (datos.maestroLabora) {
            var radios = document.querySelectorAll('input[name="labora"]');
            radios.forEach(function(radio) {
                if (radio.value === datos.maestroLabora) {
                    radio.checked = true;
                }
            });
        }
        console.log('✅ Datos del Maestro cargados');
    } catch(e) {}
}

// ============================================
// VALIDAR TODOS LOS CAMPOS
// ============================================
function validarDatosMaestro() {
    var todoValido = true;
    var errores = [];
    document.querySelectorAll('input[type="email"]').forEach(function(input) {
        if (input.value.trim() !== '' && !validarCorreo(input)) {
            todoValido = false;
            errores.push('Correo inválido');
        }
    });
    document.querySelectorAll('input[type="tel"]').forEach(function(input) {
        if (input.value.trim() !== '' && !validarTelefono(input)) {
            todoValido = false;
            errores.push('Teléfono inválido');
        }
    });
    var cedula = document.getElementById('maestroCedula');
    if (cedula && cedula.value.trim() !== '' && !validarCedula(cedula)) {
        todoValido = false;
        errores.push('Cédula inválida');
    }
    var fechaGrupos = document.querySelectorAll('.fecha-group-dm');
    fechaGrupos.forEach(function(grupo) {
        var inputs = grupo.querySelectorAll('input');
        if (inputs[0].value !== '' || inputs[1].value !== '' || inputs[2].value !== '') {
            if (!validarFechaCompleta(inputs)) {
                todoValido = false;
                errores.push('Fecha inválida');
            }
        }
    });
    var sexoSeleccionado = document.querySelector('input[name="sexo"]:checked');
    if (!sexoSeleccionado) {
        var padre = document.querySelector('.sexo-group-dm')?.closest('.maestro-item-dm');
        if (padre) {
            padre.style.borderBottomColor = '#dc3545';
            padre.style.borderBottomWidth = '2px';
        }
        todoValido = false;
        errores.push('Seleccione Sexo');
    }
    var laboraSeleccionado = document.querySelector('input[name="labora"]:checked');
    if (!laboraSeleccionado) {
        var padre = document.querySelector('.si-no-group-dm')?.closest('.maestro-item-dm');
        if (padre) {
            padre.style.borderBottomColor = '#dc3545';
            padre.style.borderBottomWidth = '2px';
        }
        todoValido = false;
        errores.push('Seleccione si labora en otra actividad');
    }
    if (todoValido) {
        guardarDatosMaestro();
        mostrarMensaje('✅ ¡Todos los campos son válidos! Datos guardados.', 'success');
    } else {
        mostrarMensaje('❌ ' + errores.join(' • '), 'error');
    }
    return todoValido;
}

// ============================================
// LIMPIAR DATOS
// ============================================
function limpiarDatosMaestro() {
    document.querySelectorAll('.value-input-dm, .value-input-full-dm').forEach(function(input) {
        input.value = '';
        input.style.borderBottomColor = '#a0b0c0';
        input.style.borderBottomWidth = '1.5px';
    });
    document.querySelectorAll('.fecha-group-dm input').forEach(function(input) {
        input.value = '';
        input.style.borderBottomColor = '#a0b0c0';
        input.style.borderBottomWidth = '1.5px';
    });
    document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
        radio.checked = false;
    });
    document.querySelectorAll('.maestro-item-dm').forEach(function(item) {
        item.style.borderBottomColor = '#d0d8e0';
        item.style.borderBottomWidth = '1px';
    });
    localStorage.removeItem('datos_maestro_' + currentGrade + '_' + currentSection);
    mostrarMensaje('✅ Todos los campos han sido limpiados.', 'info');
}

// ============================================
// IMPRIMIR
// ============================================
function printPage() {
    if (validarDatosMaestro()) {
        window.print();
    }
}

// ============================================
// MOSTRAR MENSAJES
// ============================================
function mostrarMensaje(mensaje, tipo) {
    var div = document.createElement('div');
    div.className = 'mensaje-flotante-dm';
    div.textContent = mensaje;
    div.style.cssText = `position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; font-family: 'Times New Roman', serif; font-size: 11pt; font-weight: bold; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.2); max-width: 90%; text-align: center; animation: slideDown 0.3s ease;`;
    if (tipo === 'error') {
        div.style.background = '#f8d7da';
        div.style.border = '3px solid #dc3545';
        div.style.color = '#721c24';
    } else if (tipo === 'success') {
        div.style.background = '#d4edda';
        div.style.border = '3px solid #28a745';
        div.style.color = '#155724';
    } else {
        div.style.background = '#d1ecf1';
        div.style.border = '3px solid #17a2b8';
        div.style.color = '#0c5460';
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
// ✅ INICIALIZACIÓN (MODIFICADA CON SINCRONIZACIÓN)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // ✅ PRIMERO: Intentar aplicar datos sincronizados desde la página principal
    const sincronizado = aplicarDatosSincronizados();
    
    // ✅ Si NO hay datos sincronizados, usar valores de localStorage individual
    if (!sincronizado) {
        var savedGrade = localStorage.getItem('currentGrade') || '3';
        var savedSection = localStorage.getItem('currentSection') || 'A';
        var savedYear = localStorage.getItem('currentSchoolYear') || '2025-2026';
        
        currentGrade = parseInt(savedGrade);
        currentSection = savedSection;
        currentSchoolYear = savedYear;
        
        document.getElementById('gradeDisplayDM').textContent = getGradeText(currentGrade) + ' Grado';
        document.getElementById('sectionDisplayDM').textContent = 'Sección ' + currentSection;
        document.getElementById('schoolYearDisplayDM').textContent = currentSchoolYear;
    }
    
    cargarDatosMaestro();
});

// Exponer funciones globales
window.validarDatosMaestro = validarDatosMaestro;
window.limpiarDatosMaestro = limpiarDatosMaestro;
window.printPage = printPage;
window.syncData = syncData;
window.aplicarDatosSincronizados = aplicarDatosSincronizados;

console.log('👨‍🏫 Datos del Maestro - Cargado correctamente con sincronización');