// Importar las herramientas de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAdU1P7wY0IDaWaYoQMbAi6nZmhjn3oFyY",
  authDomain: "control-financiero-f5b48.firebaseapp.com",
  projectId: "control-financiero-f5b48",
  storageBucket: "control-financiero-f5b48.firebasestorage.app",
  messagingSenderId: "1086739264551",
  appId: "1:1086739264551:web:c45b976523547436494a02",
  measurementId: "G-67CGSG5CH4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Compartir con los demás archivos
export { db, auth };
