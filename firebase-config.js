// =====================================================
//  NAIL STOCK — Firebase Configuration
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyChMXx5ZcleAo5oqzPvo1K_Af_wgQkh-LQ",
  authDomain: "listify-16b5d.firebaseapp.com",
  databaseURL: "https://listify-16b5d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "listify-16b5d",
  storageBucket: "listify-16b5d.firebasestorage.app",
  messagingSenderId: "238610923350",
  appId: "1:238610923350:web:cd5c2c3fb23b5c0afba0f7"
};

const fbApp = firebase.initializeApp(firebaseConfig, "nail-stock");
const db    = firebase.database(fbApp);

const ROOT      = "nailstock";
const catsRef   = db.ref(`${ROOT}/categories`);
const prodsRef  = db.ref(`${ROOT}/products`);
const configRef = db.ref(`${ROOT}/config`);
const cartRef   = db.ref(`${ROOT}/cart`);
