/**
============================================
DATOS-CENTRO-MAESTRO - PÁGINA PRINCIPAL
NAVEGACIÓN POR ÍNDICE (desde pestaña Inicio)
PESTAÑAS HORIZONTALES CON LISTAS VERTICALES OCULTAS
AL HACER CLIC EN PESTAÑA, OCULTA LA HOJA VISIBLE
============================================
*/

document.addEventListener('DOMContentLoaded', function() {

    // ============================================
    // 0. CONFIGURACIÓN DE PÁGINAS
    // ============================================
    const PAGINAS = {
        'contenido-datos-centro': {
            tipo: 'iframe',
            sync: 'syncData',
            titulo: 'Datos del Centro Educativo'
        },
        'contenido-datos-maestro': {
            tipo: 'iframe',
            sync: 'syncData',
            titulo: 'Datos del Maestro'
        },
        'contenido-rmi-15oct': {
            tipo: 'iframe',
            sync: 'syncData',
            titulo: 'Resumen de Matrícula Inicial'
        },
        'contenido-estudiante': {
            tipo: 'iframe',
            sync: 'syncData',
         titulo: 'Datos del Estudiante'
        },
        'contenido-datos-pmt': {
            tipo: 'iframe',
            sync: 'syncData',
            titulo: 'Datos del Padre/Madre/Tutor'
        },
        'contenido-asistencia': {
            tipo: 'iframe',
            sync: 'syncData',
            titulo: 'Control de Asistencia'
        },
        'contenido-resumen-anual': {
            tipo: 'iframe',
            sync: 'syncData',
            titulo: 'Resumen Anual de Asistencia'
        },
        'contenido-resumen-inscritos': {
            tipo: 'iframe',
            sync: 'syncData',
            titulo: 'Resumen de Inscritos e Inscritas'
        },
        'contenido-evaluacion': {
             tipo: 'iframe',
            sync: 'syncData',
            titulo: 'Registro de Evaluación'
        },
        'contenido-acta': {
            tipo: 'iframe',
            sync: 'syncActa',
            titulo: 'Acta de Rendimiento'
        }
    };

    // ============================================
    // 1. VARIABLES GLOBALES
    // ============================================
    let currentGrade = 3;
    let currentSection = 'A';
    let currentSchoolYear = '2025-2026';

    // ============================================
    // 2. FUNCIÓN PARA MOSTRAR CONTENIDO
    // ============================================
    function mostrarContenido(targetId) {
        // Ocultar TODOS los contenidos
        var contenidos = document.querySelectorAll('.contenido-pagina');
        contenidos.forEach(function(content) {
            content.classList.remove('activo');
        });

        // Mostrar el target
        var target = document.getElementById(targetId);
        if (!target) {
            console.warn('⚠️ No se encontró:', targetId);
            return;
        }

        target.classList.add('activo');

        // Obtener configuración de la página
        var config = PAGINAS[targetId];
        if (!config) {
            console.warn('⚠️ Página no configurada:', targetId);
            return;
        }

        // Procesar según tipo
        if (config.tipo === 'iframe') {
            var iframe = target.querySelector('iframe');
            if (iframe) {
                setTimeout(function() {
                    sincronizarIframe(iframe, config.sync);
                }, 400);
            }
        } else if (config.tipo === 'directo') {
            if (targetId === 'contenido-estudiante') {
                setTimeout(function() {
                    generarPaginasEstudiante();
                }, 200);
            } else if (targetId === 'contenido-asistencia') {
                setTimeout(function() {
                    if (typeof cargarAsistencia === 'function') {
                        cargarAsistencia();
                    }
                }, 200);
            } else if (targetId === 'contenido-evaluacion') {
                setTimeout(function() {
                    if (typeof cargarEvaluacion === 'function') {
                        cargarEvaluacion();
                    }
                }, 200);
            }
        }
    }

    // ============================================
    // 3. SINCRONIZAR IFRAME
    // ============================================
    function sincronizarIframe(iframe, syncFunctionName) {
        if (!iframe) return;

        try {
            var win = iframe.contentWindow;
            if (!win) {
                console.warn('⚠️ No se puede acceder al iframe');
                return;
            }

            if (syncFunctionName && typeof win[syncFunctionName] === 'function') {
                win[syncFunctionName](currentGrade, currentSection, currentSchoolYear);
                console.log('✅ Sincronizado:', iframe.src, 'con', syncFunctionName);
            } else {
                console.warn('⚠️ Función', syncFunctionName, 'no encontrada en', iframe.src);
                if (!iframe.dataset.reloading) {
                    iframe.dataset.reloading = 'true';
                    var src = iframe.src;
                    iframe.src = src;
                    setTimeout(function() {
                        try {
                            var win2 = iframe.contentWindow;
                            if (syncFunctionName && typeof win2[syncFunctionName] === 'function') {
                                win2[syncFunctionName](currentGrade, currentSection, currentSchoolYear);
                            }
                            iframe.dataset.reloading = '';
                        } catch(e) {}
                    }, 800);
                }
            }
        } catch(e) {
            console.warn('⚠️ Error al sincronizar iframe:', e.message);
        }
    }

    // ============================================
    // 4. GENERAR PÁGINAS DE ESTUDIANTE
    // ============================================
    function generarPaginasEstudiante() {
        if (typeof window.generarPagina10 === 'function' &&
            typeof window.generarPagina11 === 'function' &&
            typeof window.generarPagina12 === 'function') {
            window.generarPagina10();
            window.generarPagina11();
            window.generarPagina12();
            console.log('✅ Páginas de estudiante generadas');
            return;
        }

        var script = document.createElement('script');
        script.src = '../js/estudiante.js';
        script.onload = function() {
            setTimeout(function() {
                if (typeof window.generarPagina10 === 'function') {
                    window.generarPagina10();
                    window.generarPagina11();
                    window.generarPagina12();
                    console.log('✅ Páginas de estudiante generadas (post-load)');
                }
            }, 300);
        };
        document.head.appendChild(script);
    }

    // ============================================
    // 5. ACTUALIZAR DATOS GLOBALES
    // ============================================
    function actualizarDatosGlobales(grade, section, year) {
        if (grade !== undefined && grade >= 1 && grade <= 6) {
            currentGrade = grade;
        }
        if (section !== undefined) {
            currentSection = section;
        }
        if (year !== undefined) {
            currentSchoolYear = year;
        }

        localStorage.setItem('currentGrade', String(currentGrade));
        localStorage.setItem('currentSection', currentSection);
        localStorage.setItem('currentSchoolYear', currentSchoolYear);

        sincronizarPaginasVisibles();
    }

    function sincronizarPaginasVisibles() {
        document.querySelectorAll('.contenido-pagina.activo').forEach(function(container) {
            var id = container.id;
            var config = PAGINAS[id];

            if (config && config.tipo === 'iframe') {
                var iframe = container.querySelector('iframe');
                if (iframe) {
                    sincronizarIframe(iframe, config.sync);
                }
            }
        });
    }

    // ============================================
    // 6. NAVEGACIÓN POR ÍNDICE
    // ============================================
    document.querySelectorAll('.indice-item.clickable').forEach(function(item) {
        item.addEventListener('click', function() {
            var targetId = this.getAttribute('data-target');
            if (targetId) {
                // Ocultar panel de pestañas
                var tabContent = document.querySelector('.tab-content-container');
                if (tabContent) {
                    tabContent.style.display = 'none';
                }

                // Desactivar pestañas
                document.querySelectorAll('.tab-btn').forEach(function(tab) {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab-panel').forEach(function(panel) {
                    panel.classList.remove('activo');
                });

                mostrarContenido(targetId);
            }
        });
    });

    // ============================================
    // 7. FUNCIONALIDAD DE PESTAÑAS
    // ============================================
    var tabs = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');
    var tabContentContainer = document.querySelector('.tab-content-container');

    function activarTab(tabId) {
        tabs.forEach(function(tab) {
            tab.classList.remove('active');
        });
        panels.forEach(function(panel) {
            panel.classList.remove('activo');
        });

        var tabActivo = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
        if (tabActivo) {
            tabActivo.classList.add('active');
        }
        var panelActivo = document.getElementById(tabId);
        if (panelActivo) {
            panelActivo.classList.add('activo');
        }
        if (tabContentContainer) {
            tabContentContainer.style.display = 'block';
        }

        document.querySelectorAll('.contenido-pagina').forEach(function(content) {
            content.classList.remove('activo');
        });
    }

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            var tabId = this.getAttribute('data-tab');
            activarTab(tabId);
        });
    });

    // Activar pestaña Inicio por defecto
    activarTab('tab-inicio');

    // ============================================
    // 8. FUNCIONALIDAD DEL ÍNDICE EN INICIO
    // ============================================
    var itemIndice = document.querySelector('.item-indice');
    if (itemIndice) {
        itemIndice.addEventListener('click', function(e) {
            e.stopPropagation();
            if (tabContentContainer) {
                tabContentContainer.style.display = 'none';
            }
            tabs.forEach(function(tab) {
                tab.classList.remove('active');
            });
            panels.forEach(function(panel) {
                panel.classList.remove('activo');
            });
            mostrarContenido('contenido-indice');
        });
    }

    // ============================================
    // 9. CLICK EN EL RESTO DE FUNCIONES
    // ============================================
    function mostrarMensajeNoDisponible(funcionNombre) {
        var mensajeAnterior = document.querySelector('.mensaje-no-disponible');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }
        var div = document.createElement('div');
        div.className = 'mensaje-no-disponible';
        div.innerHTML = `
            <span class="icono-grande">🚧</span>
            <h3>No está disponible</h3>
            <p>La función "<strong>${funcionNombre}</strong>" aún no está disponible.</p>
            <button class="cerrar-btn">✕ Cerrar</button>
        `;
        document.body.appendChild(div);
        div.querySelector('.cerrar-btn').addEventListener('click', function() {
            div.remove();
        });
        div.addEventListener('click', function(e) {
            if (e.target === div) {
                div.remove();
            }
        });
    }

    document.querySelectorAll('.lista-item:not(.item-indice)').forEach(function(item) {
        item.addEventListener('click', function() {
            var funcionNombre = this.getAttribute('data-funcion') || this.textContent.trim();
            mostrarMensajeNoDisponible(funcionNombre);
        });
    });

    // ============================================
    // 10. MENÚ DE ENGRANAJE
    // ============================================
    var btnEngranaje = document.getElementById('btnEngranaje');
    var menuDropdown = document.getElementById('menuDropdown');

    if (btnEngranaje && menuDropdown) {
        btnEngranaje.addEventListener('click', function(e) {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.menu-engranaje')) {
                menuDropdown.classList.remove('active');
            }
        });

        document.querySelectorAll('.menu-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                var action = this.getAttribute('data-action');
                menuDropdown.classList.remove('active');

                switch(action) {
                    case 'inicio':
                        mostrarMensaje('🏠 Redirigiendo al Inicio...', 'info');
                        setTimeout(function() {
                            window.location.href = '../index.html';
                        }, 500);
                        break;
                    case 'ayuda':
                        mostrarMensaje('❓ Ayuda - Función disponible próximamente', 'info');
                        break;
                    case 'acerca':
                        mostrarMensaje('ℹ️ Registro de Grado - Nivel Primario v1.0', 'info');
                        break;
                    case 'configuracion':
                        mostrarMensaje('⚙️ Configuración - Función disponible próximamente', 'info');
                        break;
                    default:
                        mostrarMensaje('Función en desarrollo...', 'info');
                }
            });
        });
    }

    // ============================================
    // 11. MOSTRAR MENSAJES
    // ============================================
    function mostrarMensaje(mensaje, tipo) {
        var div = document.createElement('div');
        div.className = 'mensaje-flotante-datos-centro';
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
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 90%;
            text-align: center;
            animation: slideDown 0.3s ease;
        `;
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
    // 12. INICIALIZACIÓN
    // ============================================
    // Cargar datos guardados
    var savedGrade = localStorage.getItem('currentGrade');
    var savedSection = localStorage.getItem('currentSection');
    var savedYear = localStorage.getItem('currentSchoolYear');

    if (savedGrade) {
        currentGrade = parseInt(savedGrade);
    }
    if (savedSection) {
        currentSection = savedSection;
    }
    if (savedYear) {
        currentSchoolYear = savedYear;
    }

    console.log('📋 Sistema de páginas inicializado');
    console.log('🎓 Grado:', currentGrade, 'Sección:', currentSection);
    console.log('📅 Año:', currentSchoolYear);

    // ============================================
    // 13. ESTILOS DE ANIMACIÓN
    // ============================================
    var styleAnim = document.createElement('style');
    styleAnim.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .mensaje-flotante-datos-centro {
            animation: slideDown 0.3s ease !important;
        }
        @media print {
            .mensaje-flotante-datos-centro {
                display: none !important;
            }
        }
        .mensaje-no-disponible {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff3cd;
            border: 3px solid #ffc107;
            border-radius: 10px;
            padding: 25px 35px;
            text-align: center;
            z-index: 2000;
            box-shadow: 0 8px 40px rgba(0,0,0,0.25);
            animation: popIn 0.3s ease;
            max-width: 90%;
        }
        .mensaje-no-disponible .icono-grande {
            font-size: 40px;
            display: block;
            margin-bottom: 8px;
        }
        .mensaje-no-disponible h3 {
            font-size: 20px;
            color: #856404;
            font-family: 'Times New Roman', Times, serif;
            margin-bottom: 4px;
        }
        .mensaje-no-disponible p {
            font-size: 14px;
            color: #856404;
            font-family: 'Times New Roman', Times, serif;
            opacity: 0.8;
        }
        .mensaje-no-disponible .cerrar-btn {
            margin-top: 12px;
            padding: 6px 24px;
            background: #ffc107;
            border: none;
            border-radius: 5px;
            font-size: 13px;
            font-weight: bold;
            color: #856404;
            cursor: pointer;
            font-family: 'Times New Roman', Times, serif;
            transition: all 0.2s ease;
        }
        .mensaje-no-disponible .cerrar-btn:hover {
            background: #e6a800;
            transform: scale(1.03);
        }
        @keyframes popIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(styleAnim);

    // Exponer funciones globales
    window.mostrarContenido = mostrarContenido;
    window.sincronizarPagina = function(paginaId) {
        var container = document.getElementById(paginaId);
        if (container) {
            var config = PAGINAS[paginaId];
            if (config && config.tipo === 'iframe') {
                var iframe = container.querySelector('iframe');
                if (iframe) {
                    sincronizarIframe(iframe, config.sync);
                }
            }
        }
    };
    window.actualizarDatosGlobales = actualizarDatosGlobales;

    console.log('✅ Datos-Centro-Maestro.js cargado correctamente');
});