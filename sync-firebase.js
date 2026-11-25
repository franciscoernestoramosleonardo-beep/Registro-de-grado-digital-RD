// ======================================================
// SINCRONIZACIÓN EN TIEMPO REAL CON FIREBASE
// ======================================================

import { 
    db, firebaseDisponible, collection, doc, 
    setDoc, getDocs, deleteDoc, onSnapshot 
} from './firebase-config.js';

const SyncFirebase = {
    // Nombres de las colecciones en Firestore
    COLECCIONES: {
        CODIGOS: 'minerd_codigos',
        CONTRASENAS: 'minerd_contrasenas',
        ASIGNACIONES: 'minerd_asignaciones',
        CONFIG: 'minerd_config'
    },

    listeners: {},

    // ============================================
    // INICIAR SINCRONIZACIÓN AUTOMÁTICA
    // ============================================
    iniciar() {
        if (!firebaseDisponible) {
            console.warn('⚠️ Firebase no disponible');
            return;
        }

        console.log('🔄 Iniciando sincronización en tiempo real...');

        // 1. Escuchar cambios en CÓDIGOS
        this.escucharCodigos();

        // 2. Escuchar cambios en CONTRASEÑAS
        this.escucharContrasenas();

        // 3. Escuchar cambios en ASIGNACIONES
        this.escucharAsignaciones();

        // 4. Subir datos locales actuales a la nube
        this.subirDatosLocales();
    },

    // ============================================
    // ESCUCHAR CAMBIOS EN CÓDIGOS (TIEMPO REAL)
    // ============================================
    escucharCodigos() {
        const colRef = collection(db, this.COLECCIONES.CODIGOS);
        
        this.listeners.codigos = onSnapshot(colRef, (snapshot) => {
            const codigos = [];
            snapshot.forEach(docSnap => {
                codigos.push(docSnap.data());
            });
            
            // Guardar en localStorage local
            localStorage.setItem('minerd_codigos_docentes', JSON.stringify(codigos));
            console.log(`📥 ${codigos.length} códigos sincronizados desde la nube`);
            
            // Notificar al sistema
            window.dispatchEvent(new CustomEvent('datosSincronizados', { 
                detail: { tipo: 'codigos', datos: codigos } 
            }));
        }, (error) => {
            console.error('❌ Error escuchando códigos:', error);
        });
    },

    // ============================================
    // ESCUCHAR CAMBIOS EN CONTRASEÑAS (TIEMPO REAL)
    // ============================================
    escucharContrasenas() {
        const colRef = collection(db, this.COLECCIONES.CONTRASENAS);
        
        this.listeners.contrasenas = onSnapshot(colRef, (snapshot) => {
            const contrasenas = [];
            snapshot.forEach(docSnap => {
                contrasenas.push(docSnap.data());
            });
            
            localStorage.setItem('minerd_contrasenas_docentes', JSON.stringify(contrasenas));
            console.log(`📥 ${contrasenas.length} contraseñas sincronizadas desde la nube`);
            
            window.dispatchEvent(new CustomEvent('datosSincronizados', { 
                detail: { tipo: 'contrasenas', datos: contrasenas } 
            }));
        }, (error) => {
            console.error('❌ Error escuchando contraseñas:', error);
        });
    },

    // ============================================
    // ESCUCHAR CAMBIOS EN ASIGNACIONES (TIEMPO REAL)
    // ============================================
    escucharAsignaciones() {
        const colRef = collection(db, this.COLECCIONES.ASIGNACIONES);
        
        this.listeners.asignaciones = onSnapshot(colRef, (snapshot) => {
            const asignaciones = [];
            snapshot.forEach(docSnap => {
                asignaciones.push(docSnap.data());
            });
            
            localStorage.setItem('minerd_asignaciones_completas', JSON.stringify(asignaciones));
            console.log(`📥 ${asignaciones.length} asignaciones sincronizadas desde la nube`);
            
            window.dispatchEvent(new CustomEvent('datosSincronizados', { 
                detail: { tipo: 'asignaciones', datos: asignaciones } 
            }));
        }, (error) => {
            console.error('❌ Error escuchando asignaciones:', error);
        });
    },

    // ============================================
    // SUBIR DATOS LOCALES A LA NUBE
    // ============================================
    async subirDatosLocales() {
        try {
            // Subir códigos
            const codigos = JSON.parse(localStorage.getItem('minerd_codigos_docentes') || '[]');
            for (const codigo of codigos) {
                if (codigo.codigo) {
                    await setDoc(doc(db, this.COLECCIONES.CODIGOS, codigo.codigo), codigo);
                }
            }

            // Subir contraseñas
            const contrasenas = JSON.parse(localStorage.getItem('minerd_contrasenas_docentes') || '[]');
            for (const contrasena of contrasenas) {
                if (contrasena.cedula) {
                    await setDoc(doc(db, this.COLECCIONES.CONTRASENAS, contrasena.cedula), contrasena);
                }
            }

            // Subir asignaciones
            const asignaciones = JSON.parse(localStorage.getItem('minerd_asignaciones_completas') || '[]');
            for (const asignacion of asignaciones) {
                if (asignacion.cedula) {
                    await setDoc(doc(db, this.COLECCIONES.ASIGNACIONES, asignacion.cedula), asignacion);
                }
            }

            console.log('✅ Datos locales subidos a la nube');
        } catch (error) {
            console.error('❌ Error subiendo datos locales:', error);
        }
    },

    // ============================================
    // SUBIR UN CÓDIGO ESPECÍFICO
    // ============================================
    async subirCodigo(codigo) {
        if (!firebaseDisponible || !codigo.codigo) return;
        try {
            await setDoc(doc(db, this.COLECCIONES.CODIGOS, codigo.codigo), codigo);
            console.log(`✅ Código ${codigo.codigo} subido a la nube`);
        } catch (error) {
            console.error('❌ Error subiendo código:', error);
        }
    },

    // ============================================
    // SUBIR UNA CONTRASEÑA ESPECÍFICA
    // ============================================
    async subirContrasena(contrasena) {
        if (!firebaseDisponible || !contrasena.cedula) return;
        try {
            await setDoc(doc(db, this.COLECCIONES.CONTRASENAS, contrasena.cedula), contrasena);
            console.log(`✅ Contraseña de ${contrasena.cedula} subida a la nube`);
        } catch (error) {
            console.error('❌ Error subiendo contraseña:', error);
        }
    },

    // ============================================
    // SUBIR ASIGNACIONES DE UN DOCENTE
    // ============================================
    async subirAsignacion(asignacion) {
        if (!firebaseDisponible || !asignacion.cedula) return;
        try {
            await setDoc(doc(db, this.COLECCIONES.ASIGNACIONES, asignacion.cedula), asignacion);
            console.log(`✅ Asignaciones de ${asignacion.cedula} subidas a la nube`);
        } catch (error) {
            console.error('❌ Error subiendo asignación:', error);
        }
    },

    // ============================================
    // ELIMINAR DE LA NUBE
    // ============================================
    async eliminarCodigo(codigo) {
        if (!firebaseDisponible) return;
        try {
            await deleteDoc(doc(db, this.COLECCIONES.CODIGOS, codigo));
            console.log(`🗑️ Código ${codigo} eliminado de la nube`);
        } catch (error) {
            console.error('❌ Error eliminando código:', error);
        }
    },

    async eliminarContrasena(cedula) {
        if (!firebaseDisponible) return;
        try {
            await deleteDoc(doc(db, this.COLECCIONES.CONTRASENAS, cedula));
            console.log(`🗑️ Contraseña de ${cedula} eliminada de la nube`);
        } catch (error) {
            console.error('❌ Error eliminando contraseña:', error);
        }
    }
};

// Hacer disponible globalmente
window.SyncFirebase = SyncFirebase;
export default SyncFirebase;