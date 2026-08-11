/* ==========================================================================
   FIREBASE CONFIG
   Replace the values below with your own project's config.
   Get it from: Firebase Console → ⚙ Project settings → General →
   "Your apps" → Web app (</>) → SDK setup and configuration.

   This file must be loaded AFTER the firebase-*-compat.js script tags
   and BEFORE app.js / admin.js. Uses the Compat SDK on purpose (global
   `firebase` namespace, no ES module imports) for reliability across
   preview environments and plain static hosting like GitHub Pages.
   ========================================================================== */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();
