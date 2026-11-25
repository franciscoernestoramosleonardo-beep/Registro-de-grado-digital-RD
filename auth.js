/* ============================================
SISTEMA DE AUTENTICACIÓN - MINERD
Registro de Grado - Nivel Primario
VERSIÓN CORREGIDA - ACCESO MULTI-DISPOSITIVO
============================================ */
const AuthSystem = {
    STORAGE_KEY: 'minerd_codigos_docentes',
    SESSION_KEY: 'minerd_session_activa',
    CORRELATIVO_KEY: 'minerd_correlativo_actual',
    CONTRASENAS_KEY: 'minerd_contrasenas_docentes',
    HUELLAS_EQUIPO_KEY: 'minerd_huellas_equipo',
    ASIGNACIONES_COMPLETAS_KEY: 'minerd_asignaciones_completas',

    /* ============================================
      HUELLA DEL EQUIPO (FINGERPRINT) - UNIFICADA
      ⚠️ IMPORTANTE: Este algoritmo debe ser IDÉNTICO
      al que usa index.html para validar el admin.
      Formato: RD-XXXXXXXX-<cores><width><height>
      ============================================ */
    generarHuellaEquipo() {
        const datos = [
            navigator.userAgent,
            navigator.language,
            navigator.platform,
            navigator.hardwareConcurrency || 0,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.deviceMemory || 0,
            navigator.maxTouchPoints || 0
        ].join('|');

        let hash = 0;
        for (let i = 0; i < datos.length; i++) {
            const char = datos.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const hashHex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
        return 'RD-' + hashHex + '-' + (navigator.hardwareConcurrency || 'X') + screen.width + screen.height;
    },

    /* ============================================
      GESTIÓN DE MÚLTIPLES HUELLAS POR USUARIO
      ============================================ */
    obtenerHuellas() {
        try {
            const datos = localStorage.getItem(this.HUELLAS_EQUIPO_KEY);
            return datos ? JSON.parse(datos) : {};
        } catch (e) {
            console.error('Error obteniendo huellas:', e);
            return {};
        }
    },

    guardarHuellas(huellas) {
        try {
            localStorage.setItem(this.HUELLAS_EQUIPO_KEY, JSON.stringify(huellas));
        } catch (e) {
            console.error('Error guardando huellas:', e);
        }
    },

    agregarHuellaUsuario(cedula, huella) {
        const huellas = this.obtenerHuellas();
        if (!huellas[cedula]) {
            huellas[cedula] = [];
        }
        if (!huellas[cedula].includes(huella)) {
            huellas[cedula].push(huella);
            this.guardarHuellas(huellas);
            console.log(`✅ Huella agregada para ${cedula}: ${huella}`);
            return true;
        }
        return false;
    },

    obtenerHuellasUsuario(cedula) {
        const huellas = this.obtenerHuellas();
        return huellas[cedula] || [];
    },

    verificarHuellaUsuario(cedula, huella) {
        const huellas = this.obtenerHuellasUsuario(cedula);
        return huellas.includes(huella);
    },

    /* ============================================
      VALIDACIÓN DE FORMATOS
      ============================================ */
    validarCedula(cedula) {
        const regex = /^\d{3}-\d{7}-\d{1}$/;
        return regex.test(cedula);
    },
    validarCodigo(codigo) {
        const regex = /^RD\d{4}\d{6}CD$/;
        return regex.test(codigo);
    },

    /* ============================================
      GESTIÓN DE CÓDIGOS EN LOCALSTORAGE
      ============================================ */
    obtenerCodigos() {
        const datos = localStorage.getItem(this.STORAGE_KEY);
        return datos ? JSON.parse(datos) : [];
    },
    guardarCodigos(codigos) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(codigos));
    },
    obtenerCorrelativo() {
        return parseInt(localStorage.getItem(this.CORRELATIVO_KEY) || '0');
    },
    incrementarCorrelativo() {
        let correlativo = this.obtenerCorrelativo();
        correlativo++;
        localStorage.setItem(this.CORRELATIVO_KEY, correlativo.toString());
        return correlativo;
    },

    /* ============================================
      GESTIÓN DE CONTRASEÑAS DE DOCENTES
      ============================================ */
    obtenerContrasenas() {
        const datos = localStorage.getItem(this.CONTRASENAS_KEY);
        return datos ? JSON.parse(datos) : [];
    },
    guardarContrasenas(contrasenas) {
        localStorage.setItem(this.CONTRASENAS_KEY, JSON.stringify(contrasenas));
        window.dispatchEvent(new Event('passwordChanged'));
    },
    guardarContrasenaDocente(cedula, codigo, password, huellaEquipo, nombre) {
        const contrasenas = this.obtenerContrasenas();
        const existente = contrasenas.find(c => c.cedula === cedula);
        if (existente) {
            existente.password = this.hashPassword(password);
            existente.codigo = codigo;
            existente.huellaEquipo = huellaEquipo;
            existente.fechaActualizacion = new Date().toISOString();
            existente.estado = 'activo';
            if (nombre) existente.nombre = nombre;
        } else {
            contrasenas.push({
                cedula: cedula,
                codigo: codigo,
                password: this.hashPassword(password),
                huellaEquipo: huellaEquipo,
                nombre: nombre || '',
                fechaCreacion: new Date().toISOString(),
                fechaActualizacion: new Date().toISOString(),
                estado: 'activo'
            });
        }
        this.guardarContrasenas(contrasenas);
        this.agregarHuellaUsuario(cedula, huellaEquipo);
        return { exito: true, mensaje: 'Contraseña guardada exitosamente' };
    },
    cambiarPasswordAdmin(cedula, nuevaPassword) {
        const contrasenas = this.obtenerContrasenas();
        const existente = contrasenas.find(c => c.cedula === cedula);
        if (!existente) {
            return { exito: false, mensaje: 'No se encontró contraseña para esta cédula' };
        }
        existente.password = this.hashPassword(nuevaPassword);
        existente.fechaActualizacion = new Date().toISOString();
        this.guardarContrasenas(contrasenas);
        return { exito: true, mensaje: 'Contraseña actualizada por el administrador' };
    },
    pausarAccesoDocente(cedula) {
        const contrasenas = this.obtenerContrasenas();
        const existente = contrasenas.find(c => c.cedula === cedula);
        if (!existente) {
            return { exito: false, mensaje: 'No se encontró contraseña para esta cédula' };
        }
        if (existente.estado === 'activo') {
            existente.estado = 'pausado';
            this.guardarContrasenas(contrasenas);
            return { exito: true, mensaje: 'Acceso pausado. El docente no podrá ingresar.' };
        } else if (existente.estado === 'pausado') {
            existente.estado = 'activo';
            this.guardarContrasenas(contrasenas);
            return { exito: true, mensaje: 'Acceso reactivado.' };
        }
        return { exito: false, mensaje: 'Estado no válido' };
    },
    eliminarPasswordDocente(cedula) {
        const contrasenas = this.obtenerContrasenas();
        const indice = contrasenas.findIndex(c => c.cedula === cedula);
        if (indice === -1) {
            return { exito: false, mensaje: 'No se encontró contraseña para esta cédula' };
        }
        contrasenas.splice(indice, 1);
        this.guardarContrasenas(contrasenas);
        return { exito: true, mensaje: 'Contraseña eliminada. El docente deberá crear una nueva.' };
    },

    /* ============================================
      BLOQUEO DE USUARIO
      ============================================ */
    bloquearDocente(cedula, motivo) {
        const contrasenas = this.obtenerContrasenas();
        const existente = contrasenas.find(c => c.cedula === cedula);
        if (!existente) {
            return { exito: false, mensaje: 'Docente no encontrado' };
        }
        existente.estado = 'bloqueado';
        existente.motivoBloqueo = motivo || 'Bloqueado por el administrador';
        existente.fechaBloqueo = new Date().toISOString();
        existente.fechaActualizacion = new Date().toISOString();
        this.guardarContrasenas(contrasenas);
        return {
            exito: true,
            mensaje: `Docente bloqueado: ${motivo || 'Sin motivo especificado'}`,
            estado: 'bloqueado'
        };
    },
    desbloquearDocente(cedula) {
        const contrasenas = this.obtenerContrasenas();
        const existente = contrasenas.find(c => c.cedula === cedula);
        if (!existente) {
            return { exito: false, mensaje: 'Docente no encontrado' };
        }
        if (existente.estado === 'pausado') {
            existente.estado = 'pausado';
        } else {
            existente.estado = 'activo';
        }
        existente.motivoBloqueo = null;
        existente.fechaBloqueo = null;
        existente.fechaActualizacion = new Date().toISOString();
        this.guardarContrasenas(contrasenas);
        return {
            exito: true,
            mensaje: 'Docente desbloqueado correctamente',
            estado: existente.estado
        };
    },
    obtenerEstadoDocente(cedula) {
        const contrasenas = this.obtenerContrasenas();
        const existente = contrasenas.find(c => c.cedula === cedula);
        if (!existente) {
            return { existe: false };
        }
        return {
            existe: true,
            estado: existente.estado || 'activo',
            motivoBloqueo: existente.motivoBloqueo || null,
            fechaBloqueo: existente.fechaBloqueo || null,
            fechaActualizacion: existente.fechaActualizacion || null,
            nombre: existente.nombre || null
        };
    },

    /* ============================================
      OBTENER NOMBRE DEL DOCENTE POR CÉDULA
      ============================================ */
    obtenerNombreDocente(cedula) {
        const contrasenas = this.obtenerContrasenas();
        const enContrasenas = contrasenas.find(c => c.cedula === cedula);
        if (enContrasenas && enContrasenas.nombre) {
            return enContrasenas.nombre;
        }
        const codigos = this.obtenerCodigos();
        const enCodigos = codigos.find(c => c.cedula === cedula);
        if (enCodigos && enCodigos.nombre) {
            return enCodigos.nombre;
        }
        return null;
    },

    /* ============================================
      ✅ ACTUALIZAR NOMBRE DEL DOCENTE
      ============================================ */
    actualizarNombreDocente(cedula, nombre) {
        if (!cedula) {
            return { exito: false, mensaje: 'Cédula requerida' };
        }
        if (!nombre || nombre.trim() === '') {
            return { exito: false, mensaje: 'El nombre no puede estar vacío' };
        }

        const nombreLimpio = nombre.trim().toUpperCase();
        let actualizado = false;

        // 1. Actualizar en CONTRASEÑAS
        const contrasenas = this.obtenerContrasenas();
        const enContrasenas = contrasenas.find(c => c.cedula === cedula);
        if (enContrasenas) {
            enContrasenas.nombre = nombreLimpio;
            enContrasenas.fechaActualizacion = new Date().toISOString();
            this.guardarContrasenas(contrasenas);
            actualizado = true;
        }

        // 2. Actualizar en CÓDIGOS
        const codigos = this.obtenerCodigos();
        let codigosActualizados = 0;
        codigos.forEach(c => {
            if (c.cedula === cedula) {
                c.nombre = nombreLimpio;
                codigosActualizados++;
            }
        });
        if (codigosActualizados > 0) {
            this.guardarCodigos(codigos);
            actualizado = true;
        }

        // 3. Actualizar en ASIGNACIONES COMPLETAS
        try {
            const asignaciones = this.obtenerAsignacionesCompletas();
            const enAsignaciones = asignaciones.find(a => a.cedula === cedula);
            if (enAsignaciones) {
                enAsignaciones.nombre = nombreLimpio;
                enAsignaciones.fechaActualizacion = new Date().toISOString();
                this.guardarAsignacionesCompletas(asignaciones);
                actualizado = true;
            }
        } catch (e) {
            console.warn('⚠️ No se pudo actualizar en asignaciones:', e);
        }

        // 4. Actualizar en la sesión activa
        try {
            const sesion = this.obtenerSesion();
            if (sesion && sesion.cedula === cedula) {
                sesion.nombre = nombreLimpio;
                localStorage.setItem(this.SESSION_KEY, JSON.stringify(sesion));
            }
        } catch (e) {}

        if (!actualizado) {
            return { exito: false, mensaje: 'No se encontró al docente en el sistema' };
        }

        window.dispatchEvent(new Event('passwordChanged'));
        window.dispatchEvent(new CustomEvent('nombreDocenteActualizado', {
            detail: { cedula, nombre: nombreLimpio }
        }));

        return {
            exito: true,
            mensaje: `Nombre actualizado a "${nombreLimpio}"`,
            nombre: nombreLimpio
        };
    },

    /* ============================================
      ✅ ACTUALIZAR CÉDULA DEL DOCENTE
      ============================================ */
    actualizarCedulaDocente(cedulaVieja, cedulaNueva) {
        if (!cedulaVieja || !cedulaNueva) {
            return { exito: false, mensaje: 'Cédula actual y nueva son requeridas' };
        }

        const cedulaViejaLimpia = cedulaVieja.trim();
        const cedulaNuevaLimpia = cedulaNueva.trim();

        if (!this.validarCedula(cedulaNuevaLimpia)) {
            return { exito: false, mensaje: 'Formato de cédula inválido. Use el formato: 000-0000000-0' };
        }

        if (cedulaViejaLimpia === cedulaNuevaLimpia) {
            return { exito: false, mensaje: 'La cédula nueva es igual a la actual' };
        }

        const contrasenasCheck = this.obtenerContrasenas();
        const codigosCheck = this.obtenerCodigos();
        const existeEnContrasenas = contrasenasCheck.some(c => c.cedula === cedulaNuevaLimpia);
        const existeEnCodigos = codigosCheck.some(c => c.cedula === cedulaNuevaLimpia);

        if (existeEnContrasenas || existeEnCodigos) {
            return {
                exito: false,
                mensaje: `La cédula ${cedulaNuevaLimpia} ya está registrada para otro docente. No se puede duplicar.`
            };
        }

        let actualizado = false;
        const cambios = [];

        const contrasenas = this.obtenerContrasenas();
        const enContrasenas = contrasenas.find(c => c.cedula === cedulaViejaLimpia);
        if (enContrasenas) {
            enContrasenas.cedula = cedulaNuevaLimpia;
            enContrasenas.fechaActualizacion = new Date().toISOString();
            this.guardarContrasenas(contrasenas);
            actualizado = true;
            cambios.push('contraseñas');
        }

        const codigos = this.obtenerCodigos();
        let codigosActualizados = 0;
        codigos.forEach(c => {
            if (c.cedula === cedulaViejaLimpia) {
                c.cedula = cedulaNuevaLimpia;
                codigosActualizados++;
            }
        });
        if (codigosActualizados > 0) {
            this.guardarCodigos(codigos);
            actualizado = true;
            cambios.push(`${codigosActualizados} código(s)`);
        }

        try {
            const asignaciones = this.obtenerAsignacionesCompletas();
            const enAsignaciones = asignaciones.find(a => a.cedula === cedulaViejaLimpia);
            if (enAsignaciones) {
                enAsignaciones.cedula = cedulaNuevaLimpia;
                enAsignaciones.fechaActualizacion = new Date().toISOString();
                this.guardarAsignacionesCompletas(asignaciones);
                actualizado = true;
                cambios.push('asignaciones');
            }
        } catch (e) {
            console.warn('⚠️ No se pudo actualizar en asignaciones:', e);
        }

        try {
            const asignacionesLegacy = this.obtenerAsignaciones();
            const enLegacy = asignacionesLegacy.find(a => a.cedula === cedulaViejaLimpia);
            if (enLegacy) {
                enLegacy.cedula = cedulaNuevaLimpia;
                enLegacy.fechaActualizacion = new Date().toISOString();
                this.guardarAsignaciones(asignacionesLegacy);
                cambios.push('grados legacy');
            }
        } catch (e) {
            console.warn('⚠️ No se pudo actualizar en asignaciones legacy:', e);
        }

        try {
            const huellas = this.obtenerHuellas();
            if (huellas[cedulaViejaLimpia]) {
                huellas[cedulaNuevaLimpia] = huellas[cedulaViejaLimpia];
                delete huellas[cedulaViejaLimpia];
                this.guardarHuellas(huellas);
                cambios.push('huellas de equipo');
            }
        } catch (e) {
            console.warn('⚠️ No se pudo actualizar huellas:', e);
        }

        try {
            const sesion = this.obtenerSesion();
            if (sesion && sesion.cedula === cedulaViejaLimpia) {
                sesion.cedula = cedulaNuevaLimpia;
                localStorage.setItem(this.SESSION_KEY, JSON.stringify(sesion));
                cambios.push('sesión activa');
            }
        } catch (e) {}

        try {
            const gradoActual = localStorage.getItem(`minerd_grado_actual_${cedulaViejaLimpia}`);
            if (gradoActual) {
                localStorage.setItem(`minerd_grado_actual_${cedulaNuevaLimpia}`, gradoActual);
                localStorage.removeItem(`minerd_grado_actual_${cedulaViejaLimpia}`);
                cambios.push('grado actual');
            }
        } catch (e) {}

        try {
            const clavesBoletin = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`boletin_${cedulaViejaLimpia}_`)) {
                    clavesBoletin.push(key);
                }
            }
            clavesBoletin.forEach(key => {
                const valor = localStorage.getItem(key);
                const nuevaKey = key.replace(`boletin_${cedulaViejaLimpia}_`, `boletin_${cedulaNuevaLimpia}_`);
                localStorage.setItem(nuevaKey, valor);
                localStorage.removeItem(key);
            });
            if (clavesBoletin.length > 0) {
                cambios.push(`${clavesBoletin.length} boletín(es)`);
            }
        } catch (e) {}

        if (!actualizado) {
            return { exito: false, mensaje: 'No se encontró al docente en el sistema' };
        }

        window.dispatchEvent(new Event('passwordChanged'));
        window.dispatchEvent(new CustomEvent('cedulaDocenteActualizada', {
            detail: { cedulaVieja: cedulaViejaLimpia, cedulaNueva: cedulaNuevaLimpia }
        }));

        return {
            exito: true,
            mensaje: `Cédula actualizada: ${cedulaViejaLimpia} → ${cedulaNuevaLimpia}`,
            cedulaVieja: cedulaViejaLimpia,
            cedulaNueva: cedulaNuevaLimpia,
            cambios: cambios
        };
    },

    /* ============================================
      ✅ VALIDAR ACCESO (DOCENTE) - SIN RESTRICCIÓN DE HUELLA
      (Permite acceso desde cualquier dispositivo)
      ============================================ */
    validarAccesoPrimerVez(cedula, codigo) {
        const estadoDocente = this.obtenerEstadoDocente(cedula);
        if (estadoDocente.existe && estadoDocente.estado === 'bloqueado') {
            return {
                exito: false,
                mensaje: `🔒 Su acceso ha sido bloqueado por el administrador.\nMotivo: ${estadoDocente.motivoBloqueo || 'Sin motivo especificado'}\nContacte al administrador.`
            };
        }

        if (!this.validarCedula(cedula)) {
            return { exito: false, mensaje: 'Formato de cédula inválido. Use el formato: 000-0000000-0' };
        }
        if (!this.validarCodigo(codigo)) {
            return { exito: false, mensaje: 'Formato de código inválido. Debe tener el formato: RD2026000001CD' };
        }
        const codigos = this.obtenerCodigos();
        const codigoEncontrado = codigos.find(c => c.codigo === codigo);
        if (!codigoEncontrado) {
            return { exito: false, mensaje: 'El código no existe en el sistema' };
        }
        if (codigoEncontrado.cedula !== cedula) {
            return { exito: false, mensaje: 'La cédula no coincide con el código registrado' };
        }
        if (codigoEncontrado.estado === 'revocado') {
            return { exito: false, mensaje: 'Este código ha sido revocado por el administrador' };
        }
        if (codigoEncontrado.estado === 'caducado') {
            return { exito: false, mensaje: 'Este código ha sido marcado como caducado' };
        }

        const contrasenas = this.obtenerContrasenas();
        const tienePassword = contrasenas.find(c => c.cedula === cedula);

        if (tienePassword) {
            if (tienePassword.estado === 'pausado') {
                return { exito: false, mensaje: 'Su acceso ha sido pausado por el administrador. Contacte al administrador.' };
            }
            if (tienePassword.estado === 'bloqueado') {
                return {
                    exito: false,
                    mensaje: `🔒 Su acceso ha sido bloqueado por el administrador.\nMotivo: ${tienePassword.motivoBloqueo || 'Sin motivo'}\nContacte al administrador.`
                };
            }

            // ✅ SE ELIMINÓ LA VALIDACIÓN DE HUELLA DIGITAL
            // Ahora el docente puede entrar desde cualquier dispositivo

            return {
                exito: true,
                accion: 'login_password',
                mensaje: 'Ya tiene contraseña creada. Ingrese su contraseña.',
                cedula: cedula,
                nombre: tienePassword.nombre || codigoEncontrado.nombre || ''
            };
        }

        if (codigoEncontrado.estado === 'activo') {
            codigoEncontrado.estado = 'usado';
            codigoEncontrado.fechaUso = new Date().toISOString();
            this.guardarCodigos(codigos);
        }
        return {
            exito: true,
            accion: 'crear_password',
            mensaje: 'Código validado exitosamente. Cree su contraseña personal.',
            cedula: cedula,
            codigo: codigo,
            nombre: codigoEncontrado.nombre || ''
        };
    },

    crearPasswordDocente(cedula, codigo, password, nombre) {
        if (!password || password.length < 6) {
            return { exito: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' };
        }
        const huellaEquipo = this.generarHuellaEquipo();
        const resultado = this.guardarContrasenaDocente(cedula, codigo, password, huellaEquipo, nombre);
        if (resultado.exito) {
            const session = {
                cedula: cedula,
                codigo: codigo,
                nombre: nombre || '',
                fechaAcceso: new Date().toISOString(),
                huellaEquipo: huellaEquipo
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            this.agregarHuellaUsuario(cedula, huellaEquipo);
            return {
                exito: true,
                mensaje: 'Contraseña creada exitosamente. Bienvenido al sistema.',
                session: session
            };
        }
        return resultado;
    },

    /* ============================================
      ✅ VALIDAR PASSWORD (DOCENTE) - SIN RESTRICCIÓN DE HUELLA
      (Permite acceso desde cualquier dispositivo)
      ============================================ */
    validarPasswordDocente(cedula, password) {
        const estadoDocente = this.obtenerEstadoDocente(cedula);
        if (estadoDocente.existe && estadoDocente.estado === 'bloqueado') {
            return {
                exito: false,
                mensaje: `🔒 Su acceso ha sido bloqueado por el administrador.\nMotivo: ${estadoDocente.motivoBloqueo || 'Sin motivo especificado'}\nContacte al administrador.`
            };
        }

        const contrasenas = this.obtenerContrasenas();
        const existente = contrasenas.find(c => c.cedula === cedula);
        if (!existente) {
            return { exito: false, mensaje: 'No se encontró contraseña para esta cédula' };
        }
        if (existente.estado === 'pausado') {
            return { exito: false, mensaje: 'Su acceso ha sido pausado por el administrador. Contacte al administrador.' };
        }
        if (existente.estado === 'bloqueado') {
            return {
                exito: false,
                mensaje: `🔒 Su acceso ha sido bloqueado por el administrador.\nMotivo: ${existente.motivoBloqueo || 'Sin motivo'}\nContacte al administrador.`
            };
        }
        const passwordHash = this.hashPassword(password);
        if (existente.password !== passwordHash) {
            return { exito: false, mensaje: 'Contraseña incorrecta' };
        }

        // ✅ SE ELIMINÓ LA VALIDACIÓN DE HUELLA DIGITAL Y EL POPUP DE AUTORIZACIÓN
        // Ahora el docente puede entrar desde cualquier dispositivo

        const codigos = this.obtenerCodigos();
        const codigoDocente = codigos.find(c => c.cedula === cedula);
        const huellaActual = this.generarHuellaEquipo();
        const session = {
            cedula: cedula,
            codigo: codigoDocente ? codigoDocente.codigo : '',
            nombre: existente.nombre || (codigoDocente ? codigoDocente.nombre : ''),
            fechaAcceso: new Date().toISOString(),
            huellaEquipo: huellaActual
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        return {
            exito: true,
            mensaje: 'Acceso exitoso. Bienvenido.',
            session: session
        };
    },

    /* ============================================
      HASH SIMPLE DE CONTRASEÑA
      ============================================ */
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(36);
    },

    /* ============================================
      GENERAR CÓDIGO (ADMINISTRADOR)
      ============================================ */
    generarCodigo(cedula, nombre) {
        if (!this.validarCedula(cedula)) {
            return { exito: false, mensaje: 'Formato de cédula inválido. Use el formato: 000-0000000-0' };
        }
        if (!nombre || nombre.trim() === '') {
            return { exito: false, mensaje: 'El nombre del docente es obligatorio' };
        }
        const codigos = this.obtenerCodigos();
        const codigoExistente = codigos.find(c =>
            c.cedula === cedula && (c.estado === 'activo' || c.estado === 'pendiente')
        );
        if (codigoExistente) {
            return { exito: false, mensaje: `Ya existe un código activo para esta cédula: ${codigoExistente.codigo}` };
        }
        const correlativo = this.incrementarCorrelativo();
        const correlativoStr = correlativo.toString().padStart(6, '0');
        const anio = new Date().getFullYear();
        const codigo = `RD${anio}${correlativoStr}CD`;
        const huellaEquipo = this.generarHuellaEquipo();
        const nuevoCodigo = {
            codigo: codigo,
            cedula: cedula,
            nombre: nombre.trim(),
            fechaGeneracion: new Date().toISOString(),
            fechaUso: null,
            estado: 'activo',
            huellaEquipo: huellaEquipo,
            correlativo: correlativo
        };
        codigos.push(nuevoCodigo);
        this.guardarCodigos(codigos);
        return {
            exito: true,
            mensaje: 'Código generado exitosamente',
            codigo: codigo,
            huellaEquipo: huellaEquipo,
            nombre: nombre.trim()
        };
    },

    /* ============================================
      GESTIÓN DE SESIÓN
      ============================================ */
    obtenerSesion() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },
    cerrarSesion() {
        localStorage.removeItem(this.SESSION_KEY);
        window.dispatchEvent(new Event('sessionChanged'));
    },
    estaAutenticado() {
        return this.obtenerSesion() !== null;
    },

    /* ============================================
      ✅ VALIDAR SESIÓN ACTIVA - SIN RESTRICCIÓN DE HUELLA
      (Permite mantener sesión en cualquier dispositivo)
      ============================================ */
    validarSesionActiva() {
        const session = this.obtenerSesion();
        if (!session) {
            return { valido: false, motivo: 'No hay sesión activa' };
        }
        const codigos = this.obtenerCodigos();
        const codigoEncontrado = codigos.find(c => c.codigo === session.codigo);
        if (!codigoEncontrado) {
            this.cerrarSesion();
            return { valido: false, motivo: 'Su código ha sido eliminado por el administrador.' };
        }
        if (codigoEncontrado.estado === 'revocado') {
            this.cerrarSesion();
            return { valido: false, motivo: 'Su código ha sido revocado.' };
        }

        // ✅ SE ELIMINÓ LA VALIDACIÓN DE HUELLA DIGITAL EN LA SESIÓN
        // Ahora la sesión se mantiene en cualquier dispositivo

        const estadoDocente = this.obtenerEstadoDocente(session.cedula);
        if (estadoDocente.existe && estadoDocente.estado === 'bloqueado') {
            this.cerrarSesion();
            return { valido: false, motivo: `Su acceso ha sido bloqueado por el administrador.` };
        }
        return { valido: true, session: session };
    },

    /* ============================================
      FUNCIONES DE ADMINISTRADOR
      ============================================ */
    obtenerHistorial() {
        return this.obtenerCodigos();
    },
    revocarCodigo(codigo) {
        const codigos = this.obtenerCodigos();
        const codigoEncontrado = codigos.find(c => c.codigo === codigo);
        if (!codigoEncontrado) {
            return { exito: false, mensaje: 'Código no encontrado' };
        }
        if (codigoEncontrado.estado === 'usado') {
            return { exito: false, mensaje: 'No se puede revocar un código ya utilizado' };
        }
        codigoEncontrado.estado = 'revocado';
        this.guardarCodigos(codigos);
        return { exito: true, mensaje: 'Código revocado exitosamente' };
    },
    eliminarCodigo(codigo) {
        const codigos = this.obtenerCodigos();
        const indice = codigos.findIndex(c => c.codigo === codigo);
        if (indice === -1) {
            return { exito: false, mensaje: 'Código no encontrado' };
        }
        codigos.splice(indice, 1);
        this.guardarCodigos(codigos);
        return { exito: true, mensaje: 'Registro del docente eliminado permanentemente' };
    },
    obtenerEstadisticas() {
        const codigos = this.obtenerCodigos();
        const contrasenas = this.obtenerContrasenas();
        const huellas = this.obtenerHuellas();
        return {
            total: codigos.length,
            activos: codigos.filter(c => c.estado === 'activo').length,
            usados: codigos.filter(c => c.estado === 'usado').length,
            caducados: codigos.filter(c => c.estado === 'caducado').length,
            revocados: codigos.filter(c => c.estado === 'revocado').length,
            conPassword: contrasenas.filter(c => c.estado === 'activo' || c.estado === 'pausado').length,
            pausados: contrasenas.filter(c => c.estado === 'pausado').length,
            bloqueados: contrasenas.filter(c => c.estado === 'bloqueado').length,
            equiposRegistrados: Object.keys(huellas).length
        };
    },
    formatearFecha(fechaISO) {
        if (!fechaISO) return 'N/A';
        const fecha = new Date(fechaISO);
        return fecha.toLocaleString('es-DO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /* ============================================
      ASIGNACIÓN DE GRADOS POR DOCENTE (LEGACY)
      ============================================ */
    GRADOS_DISPONIBLES: ['Primer Grado', 'Segundo Grado', 'Tercer Grado', 'Cuarto Grado', 'Quinto Grado', 'Sexto Grado'],
    ASIGNACION_KEY: 'minerd_asignacion_grados',

    asignarGradosDocente(cedula, listaGrados) {
        if (!cedula) {
            return { exito: false, mensaje: 'Cédula requerida' };
        }
        if (listaGrados && listaGrados.length > 8) {
            return { exito: false, mensaje: 'Máximo 8 grados por docente' };
        }
        const asignaciones = this.obtenerAsignaciones();
        const existente = asignaciones.find(a => a.cedula === cedula);
        if (existente) {
            existente.grados = listaGrados || [];
            existente.fechaActualizacion = new Date().toISOString();
        } else {
            asignaciones.push({
                cedula: cedula,
                grados: listaGrados || [],
                fechaAsignacion: new Date().toISOString(),
                fechaActualizacion: new Date().toISOString()
            });
        }
        this.guardarAsignaciones(asignaciones);
        return {
            exito: true,
            mensaje: `Grados asignados correctamente (${(listaGrados || []).length}/8)`,
            grados: listaGrados || []
        };
    },

    obtenerAsignaciones() {
        try {
            const datos = localStorage.getItem(this.ASIGNACION_KEY);
            return datos ? JSON.parse(datos) : [];
        } catch (e) {
            console.error('Error obteniendo asignaciones:', e);
            return [];
        }
    },

    guardarAsignaciones(asignaciones) {
        try {
            localStorage.setItem(this.ASIGNACION_KEY, JSON.stringify(asignaciones));
        } catch (e) {
            console.error('Error guardando asignaciones:', e);
        }
    },

    obtenerGradosAsignados(cedula) {
        if (!cedula) return [];
        const asignaciones = this.obtenerAsignaciones();
        const encontrado = asignaciones.find(a => a.cedula === cedula);
        return encontrado ? encontrado.grados : [];
    },

    agregarGradoDocente(cedula, grado) {
        if (!cedula || !grado) {
            return { exito: false, mensaje: 'Cédula y grado requeridos' };
        }
        if (!this.GRADOS_DISPONIBLES.includes(grado)) {
            return { exito: false, mensaje: 'Grado no válido' };
        }
        const asignaciones = this.obtenerAsignaciones();
        const existente = asignaciones.find(a => a.cedula === cedula);
        if (!existente) {
            return this.asignarGradosDocente(cedula, [grado]);
        }
        if (existente.grados.includes(grado)) {
            return { exito: false, mensaje: `El docente ya tiene asignado "${grado}"` };
        }
        if (existente.grados.length >= 8) {
            return { exito: false, mensaje: 'Máximo 8 grados por docente' };
        }
        existente.grados.push(grado);
        existente.fechaActualizacion = new Date().toISOString();
        this.guardarAsignaciones(asignaciones);
        return {
            exito: true,
            mensaje: `Grado "${grado}" agregado correctamente`,
            grados: existente.grados
        };
    },

    quitarGradoDocente(cedula, grado) {
        if (!cedula || !grado) {
            return { exito: false, mensaje: 'Cédula y grado requeridos' };
        }
        const asignaciones = this.obternerAsignaciones();
        const existente = asignaciones.find(a => a.cedula === cedula);
        if (!existente) {
            return { exito: false, mensaje: 'Docente no encontrado' };
        }
        const index = existente.grados.indexOf(grado);
        if (index === -1) {
            return { exito: false, mensaje: `El docente no tiene asignado "${grado}"` };
        }
        existente.grados.splice(index, 1);
        existente.fechaActualizacion = new Date().toISOString();
        this.guardarAsignaciones(asignaciones);
        return {
            exito: true,
            mensaje: `Grado "${grado}" eliminado correctamente`,
            grados: existente.grados
        };
    },

    guardarDatosGrado(cedula, grado, datos) {
        if (!cedula || !grado) {
            return { exito: false, mensaje: 'Cédula y grado requeridos' };
        }

        const key = `boletin_${cedula}_${grado}`;
        const dataToSave = {
            cedula: cedula,
            grado: grado,
            datos: datos || {},
            fechaActualizacion: new Date().toISOString()
        };

        try {
            localStorage.setItem(key, JSON.stringify(dataToSave));
            console.log(`💾 Datos guardados para ${grado}:`, dataToSave);
            return { exito: true, mensaje: 'Datos guardados correctamente' };
        } catch (e) {
            console.error('Error guardando datos del grado:', e);
            return { exito: false, mensaje: 'Error al guardar los datos' };
        }
    },

    obtenerDatosGrado(cedula, grado) {
        if (!cedula || !grado) return null;

        const key = `boletin_${cedula}_${grado}`;
        try {
            const datos = localStorage.getItem(key);
            return datos ? JSON.parse(datos) : null;
        } catch (e) {
            console.error('Error obteniendo datos del grado:', e);
            return null;
        }
    },

    guardarGradoSeleccionado(cedula, grado) {
        try {
            localStorage.setItem(`minerd_grado_actual_${cedula}`, grado);
            console.log(`📌 Grado seleccionado guardado: ${grado}`);
        } catch (e) {
            console.error('Error guardando grado seleccionado:', e);
        }
    },

    obtenerGradoSeleccionado(cedula) {
        try {
            return localStorage.getItem(`minerd_grado_actual_${cedula}`) || null;
        } catch (e) {
            console.error('Error obteniendo grado seleccionado:', e);
            return null;
        }
    },

    eliminarGradoSeleccionado(cedula) {
        try {
            localStorage.removeItem(`minerd_grado_actual_${cedula}`);
            console.log(`🗑️ Grado seleccionado eliminado para ${cedula}`);
        } catch (e) {
            console.error('Error eliminando grado seleccionado:', e);
        }
    },

    /* ============================================
      ASIGNACIONES COMPLETAS (GRADO + SECCIÓN + TANDA)
      ============================================ */
    obtenerAsignacionesCompletas() {
        try {
            const datos = localStorage.getItem(this.ASIGNACIONES_COMPLETAS_KEY);
            return datos ? JSON.parse(datos) : [];
        } catch (e) {
            console.error('Error obteniendo asignaciones completas:', e);
            return [];
        }
    },

    guardarAsignacionesCompletas(asignaciones) {
        try {
            localStorage.setItem(this.ASIGNACIONES_COMPLETAS_KEY, JSON.stringify(asignaciones));
            this.sincronizarAsignacionesLegacy(asignaciones);
            return { exito: true, mensaje: 'Asignaciones guardadas correctamente' };
        } catch (e) {
            console.error('Error guardando asignaciones completas:', e);
            return { exito: false, mensaje: 'Error al guardar las asignaciones' };
        }
    },

    sincronizarAsignacionesLegacy(asignacionesCompletas) {
        const legacy = asignacionesCompletas.map(a => ({
            cedula: a.cedula,
            grados: a.asignaciones.map(item => item.grado),
            fechaAsignacion: a.fechaAsignacion || new Date().toISOString(),
            fechaActualizacion: a.fechaActualizacion || new Date().toISOString()
        }));
        this.guardarAsignaciones(legacy);
    },

    obtenerAsignacionesDocente(cedula) {
        if (!cedula) return [];
        const todas = this.obtenerAsignacionesCompletas();
        const encontrado = todas.find(a => a.cedula === cedula);
        return encontrado ? encontrado.asignaciones : [];
    },

    guardarAsignacionesDocente(cedula, asignaciones) {
        if (!cedula) {
            return { exito: false, mensaje: 'Cédula requerida' };
        }
        if (asignaciones && asignaciones.length > 8) {
            return { exito: false, mensaje: 'Máximo 8 asignaciones por docente' };
        }

        const todas = this.obtenerAsignacionesCompletas();
        const existente = todas.find(a => a.cedula === cedula);

        if (existente) {
            existente.asignaciones = asignaciones || [];
            existente.fechaActualizacion = new Date().toISOString();
        } else {
            todas.push({
                cedula: cedula,
                asignaciones: asignaciones || [],
                fechaAsignacion: new Date().toISOString(),
                fechaActualizacion: new Date().toISOString()
            });
        }

        return this.guardarAsignacionesCompletas(todas);
    },

    asignarGradoCompleto(cedula, grado, seccion, tanda) {
        if (!cedula || !grado) {
            return { exito: false, mensaje: 'Cédula y grado requeridos' };
        }
        if (!this.GRADOS_DISPONIBLES.includes(grado)) {
            return { exito: false, mensaje: 'Grado no válido' };
        }
        if (!seccion) {
            return { exito: false, mensaje: 'Sección requerida (A-F)' };
        }
        if (!tanda) {
            return { exito: false, mensaje: 'Tanda requerida' };
        }

        const todas = this.obtenerAsignacionesCompletas();
        let existente = todas.find(a => a.cedula === cedula);

        if (!existente) {
            existente = {
                cedula: cedula,
                asignaciones: [],
                fechaAsignacion: new Date().toISOString(),
                fechaActualizacion: new Date().toISOString()
            };
            todas.push(existente);
        }

        if (existente.asignaciones.length >= 8) {
            return { exito: false, mensaje: 'Máximo 8 asignaciones por docente' };
        }

        const duplicado = existente.asignaciones.some(item =>
            item.grado === grado &&
            item.seccion === seccion &&
            item.tanda === tanda
        );

        if (duplicado) {
            return { exito: false, mensaje: `Ya existe "${grado} - Sección ${seccion} - ${tanda}"` };
        }

        existente.asignaciones.push({ grado, seccion, tanda });
        existente.fechaActualizacion = new Date().toISOString();

        return this.guardarAsignacionesCompletas(todas);
    },

    quitarAsignacionCompleta(cedula, index) {
        if (!cedula) {
            return { exito: false, mensaje: 'Cédula requerida' };
        }

        const todas = this.obtenerAsignacionesCompletas();
        const existente = todas.find(a => a.cedula === cedula);

        if (!existente) {
            return { exito: false, mensaje: 'Docente no encontrado' };
        }

        if (index < 0 || index >= existente.asignaciones.length) {
            return { exito: false, mensaje: 'Índice de asignación no válido' };
        }

        const removida = existente.asignaciones[index];
        existente.asignaciones.splice(index, 1);
        existente.fechaActualizacion = new Date().toISOString();

        const resultado = this.guardarAsignacionesCompletas(todas);
        if (resultado.exito) {
            resultado.mensaje = `Asignación "${removida.grado} - Sec. ${removida.seccion} - ${removida.tanda}" eliminada`;
        }
        return resultado;
    },

    obtenerAsignacionesFormateadas(cedula) {
        const asignaciones = this.obtenerAsignacionesDocente(cedula);
        return asignaciones.map(item => {
            let texto = item.grado;
            if (item.seccion) texto += ` - Sección ${item.seccion}`;
            if (item.tanda) texto += ` - ${item.tanda}`;
            return {
                ...item,
                textoCompleto: texto
            };
        });
    },

    docenteTieneAsignaciones(cedula) {
        const asignaciones = this.obtenerAsignacionesDocente(cedula);
        return asignaciones && asignaciones.length > 0;
    },

    obtenerDocentesConAsignacionesCompletas() {
        const asignaciones = this.obtenerAsignacionesCompletas();
        const contrasenas = this.obtenerContrasenas();
        const codigos = this.obtenerCodigos();

        const docentesMap = {};

        contrasenas.forEach(c => {
            if (!docentesMap[c.cedula]) {
                docentesMap[c.cedula] = {
                    cedula: c.cedula,
                    nombre: c.nombre || 'Sin nombre',
                    asignaciones: [],
                    estado: c.estado || 'activo',
                    tienePassword: true
                };
            } else {
                if (c.nombre) docentesMap[c.cedula].nombre = c.nombre;
                docentesMap[c.cedula].estado = c.estado || 'activo';
                docentesMap[c.cedula].tienePassword = true;
            }
        });

        codigos.forEach(c => {
            if (!docentesMap[c.cedula]) {
                docentesMap[c.cedula] = {
                    cedula: c.cedula,
                    nombre: c.nombre || 'Sin nombre',
                    asignaciones: [],
                    estado: 'pendiente',
                    tienePassword: false
                };
            } else {
                if (c.nombre) docentesMap[c.cedula].nombre = c.nombre;
            }
        });

        asignaciones.forEach(a => {
            if (docentesMap[a.cedula]) {
                docentesMap[a.cedula].asignaciones = a.asignaciones || [];
                docentesMap[a.cedula].fechaAsignacion = a.fechaAsignacion || null;
                docentesMap[a.cedula].fechaActualizacion = a.fechaActualizacion || null;
            } else {
                docentesMap[a.cedula] = {
                    cedula: a.cedula,
                    nombre: 'Sin nombre',
                    asignaciones: a.asignaciones || [],
                    estado: 'activo',
                    tienePassword: false,
                    fechaAsignacion: a.fechaAsignacion || null,
                    fechaActualizacion: a.fechaActualizacion || null
                };
                const codigoDocente = codigos.find(c => c.cedula === a.cedula);
                if (codigoDocente && codigoDocente.nombre) {
                    docentesMap[a.cedula].nombre = codigoDocente.nombre;
                }
            }
        });

        let docentes = Object.values(docentesMap);
        docentes.sort((a, b) => {
            const aTiene = a.asignaciones && a.asignaciones.length > 0;
            const bTiene = b.asignaciones && b.asignaciones.length > 0;
            if (aTiene && !bTiene) return -1;
            if (!aTiene && bTiene) return 1;
            return (a.nombre || '').localeCompare(b.nombre || '');
        });

        return docentes;
    },

    obtenerUsuariosEquipo() {
        const huellas = this.obtenerHuellas();
        const contrasenas = this.obtenerContrasenas();
        const huellaActual = this.generarHuellaEquipo();
        const usuarios = [];

        for (const [cedula, huellasLista] of Object.entries(huellas)) {
            if (huellasLista.includes(huellaActual)) {
                const docente = contrasenas.find(c => c.cedula === cedula);
                if (docente) {
                    usuarios.push({
                        cedula: cedula,
                        nombre: docente.nombre || 'Sin nombre',
                        estado: docente.estado || 'activo',
                        ultimoAcceso: docente.fechaActualizacion || new Date().toISOString()
                    });
                }
            }
        }

        usuarios.sort((a, b) => {
            return new Date(b.ultimoAcceso) - new Date(a.ultimoAcceso);
        });

        return usuarios;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}