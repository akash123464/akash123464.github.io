// ============================================================
// LOGIN / SIGNUP PAGE LOGIC (login.html)
// ============================================================

const form = document.getElementById("authForm");
const nameField = document.getElementById("nameField");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const submitBtn = document.getElementById("submitBtn");
const errorMsg = document.getElementById("errorMsg");
const modeTitle = document.getElementById("modeTitle");
const modeSubtitle = document.getElementById("modeSubtitle");
const switchModeBtn = document.getElementById("switchModeBtn");
const switchModeText = document.getElementById("switchModeText");
const googleBtn = document.getElementById("googleBtn");

let mode = "login"; // or "signup"

function setMode(newMode) {
  mode = newMode;
  errorMsg.classList.remove("show");
  if (mode === "signup") {
    modeTitle.textContent = "Create your account";
    modeSubtitle.textContent = "Join the conversation on building a better Earth.";
    submitBtn.textContent = "Create account";
    switchModeText.textContent = "Already have an account?";
    switchModeBtn.textContent = "Sign in";
    nameField.style.display = "block";
    nameInput.required = true;
  } else {
    modeTitle.textContent = "Welcome back";
    modeSubtitle.textContent = "Sign in to post, comment, and debate ideas.";
    submitBtn.textContent = "Sign in";
    switchModeText.textContent = "New to WishWork?";
    switchModeBtn.textContent = "Create an account";
    nameField.style.display = "none";
    nameInput.required = false;
  }
}

switchModeBtn.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.add("show");
}

// Create the /users/{uid} profile document the first time someone signs in.
// Security rules only let a user write their OWN profile doc (see README).
async function ensureUserProfile(user, fallbackName) {
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      name: user.displayName || fallbackName || user.email.split("@")[0],
      email: user.email,
      photoURL: user.photoURL || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.remove("show");
  submitBtn.disabled = true;
  submitBtn.textContent = mode === "signup" ? "Creating account…" : "Signing in…";

  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (mode === "signup") {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (nameInput.value.trim()) {
        await cred.user.updateProfile({ displayName: nameInput.value.trim() });
      }
      await ensureUserProfile(cred.user, nameInput.value.trim());
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
    window.location.href = "index.html";
  } catch (err) {
    showError(friendlyAuthError(err));
    submitBtn.disabled = false;
    submitBtn.textContent = mode === "signup" ? "Create account" : "Sign in";
  }
});

googleBtn.addEventListener("click", async () => {
  errorMsg.classList.remove("show");
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    await ensureUserProfile(result.user);
    window.location.href = "index.html";
  } catch (err) {
    showError(friendlyAuthError(err));
  }
});

function friendlyAuthError(err) {
  const map = {
    "auth/email-already-in-use": "That email already has an account. Try signing in instead.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Choose a password with at least 6 characters.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/popup-closed-by-user": "Google sign-in was closed before finishing."
  };
  return map[err.code] || err.message || "Something went wrong. Please try again.";
}

// If already signed in, skip straight to the feed.
auth.onAuthStateChanged((user) => {
  if (user) window.location.href = "index.html";
});
