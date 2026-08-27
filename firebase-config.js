// ============================================================
// FIREBASE CONFIG
// ------------------------------------------------------------
// 1. Go to https://console.firebase.google.com → your project
//    → Project settings → General → "Your apps" → Web app.
// 2. Copy the config object Firebase gives you and paste the
//    values below.
// 3. This file is safe to commit to a public GitHub repo. These
//    are client identifiers, not secrets — real protection comes
//    from your Firestore/Storage security rules (see README.md).
// ============================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// The one email allowed into /admin.html and allowed to approve/reject posts.
// This must match the value hardcoded in your Firestore & Storage rules.
const ADMIN_EMAIL = "bhadouryaakash@gmail.com";

// Initialize Firebase (compat SDK — loaded via <script> tags in each HTML file)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
