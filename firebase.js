import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyACL0luptVjTBrZw3RgEH4nM7_IboD-js",
  authDomain: "wishwork-c7e63.firebaseapp.com",
  projectId: "wishwork-c7e63",
  appId: "1:1013587518686:web:137bca9afe1d11f31e0e4f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
