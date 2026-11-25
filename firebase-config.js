// ======================================================
// ARCHIVO ÚNICO DE CONEXIÓN A FIREBASE
// ======================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, doc, setDoc, getDocs, 
    deleteDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TUS CREDENCIALES REALES
const firebaseConfig = {
    apiKey: "AIzaSyAdU1P7wY0IDaWaYoQMbAi6nZmhjn3oFyY",
    authDomain: "control-financiero-f5b48.firebaseapp.com",
    projectId: "control-financiero-f5b48",
    storageBucket: "control-financiero-f5b48.firebasestorage.app",
    messagingSenderId: "1086739264551",
    appId: "1:1086739264551:web:c45b976523547436494a02"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let firebaseDisponible = true;

export { db, auth, firebaseDisponible, collection, doc, setDoc, getDocs, deleteDoc, onSnapshot };

if (typeof window !== 'undefined') {
    window.db = db;
    window.auth = auth;
}