// =====================================================
//  NAIL STOCK — Firebase Configuration
//  ⚠️  RELLENA ESTOS VALORES CON TU PROYECTO FIREBASE
// =====================================================
//
//  PASOS:
//  1. Ve a https://console.firebase.google.com
//  2. Crea un proyecto (o usa uno existente)
//  3. Ve a Configuración del proyecto (⚙️) → General → Tus apps
//  4. Haz clic en "</>" (web) y registra la app
//  5. Copia los valores de firebaseConfig aquí abajo
//  6. En Firebase Console → Firestore Database → Crear base de datos
//     → Modo producción → elegir región (europe-west)
//  7. En Firestore → Reglas, pega esto:
//
//     rules_version = '2';
//     service cloud.firestore {
//       match /databases/{database}/documents {
//         match /{document=**} {
//           allow read, write: if true;
//         }
//       }
//     }
//
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
