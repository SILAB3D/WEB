// ============================================================
//  CONFIGURACIÓN DE FIREBASE  —  3DProject
// ------------------------------------------------------------
//  Pega aquí los datos de TU proyecto de Firebase.
//  (La GUÍA_FIREBASE.md te lleva paso a paso.)
// ============================================================

export const firebaseConfig = {
  apiKey:            "AIzaSyDBbAPi0QSDcIy_TZ9TkxMcVdo7Ji4x8Ac",
  authDomain:        "dproject-11937.firebaseapp.com",
  projectId:         "dproject-11937",
  storageBucket:     "dproject-11937.firebasestorage.app",
  messagingSenderId: "539172031609",
  appId:             "1:539172031609:web:9eb55213bbbdda2b4258a8"
};

// ¿Está configurado? (lo usa la app para avisarte si falta rellenar)
export const FIREBASE_LISTO = !Object.values(firebaseConfig).some(v => String(v).startsWith("PEGA_AQUI"));
