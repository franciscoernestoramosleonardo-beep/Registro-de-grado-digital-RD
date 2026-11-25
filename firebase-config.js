// ======================================================
// ARCHIVO ÚNICO DE CONEXIÓN A FIREBASE
// Todos tus archivos HTML usarán este archivo
// ======================================================

// 1. Importa las herramientas de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// 2. Tus datos de conexión (los consigues en tu cuenta de Firebase)
const firebaseConfig = {
  apiKey: "AQUÍ-TU-API-KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};

// 3. Inicializa Firebase UNA SOLA VEZ
const app = initializeApp(firebaseConfig);

// 4. Prepara lo que vas a usar
const db = getFirestore(app);
const auth = getAuth(app);

// 5. Comparte esto con los demás archivos
export { db, auth };
