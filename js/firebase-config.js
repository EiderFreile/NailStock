// =====================================================
//  NAIL STOCK — Firebase Configuration
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyChMXx5ZcleAo5oqzPvo1K_Af_wgQkh-LQ",
  authDomain: "listify-16b5d.firebaseapp.com",
  databaseURL: "https://listify-16b5d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "listify-16b5d",
  storageBucket: "listify-16b5d.firebasestorage.app",
  messagingSenderId: "238610923350",
  appId: "1:238610923350:web:cd5c2c3fb23b5c0afba0f7"
};

const app = initializeApp(firebaseConfig, "nail-stock");
export const db = getFirestore(app);
