/* ==========================================================================
   WISHWORK — app.js
   Firebase integration, feed, messaging, and admin logic for all three pages
   (login.html, index.html, admin.html) — routed by document.body.dataset.page.
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged,
  updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, where, orderBy, limit, serverTimestamp,
  arrayUnion, arrayRemove, increment, runTransaction, getCountFromServer, Timestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-storage.js";

/* ==========================================================================
   1. CONFIG — replace with your Firebase project's config object
   (Firebase Console → Project settings → General → Your apps → SDK setup)
   ========================================================================== */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const ADMIN_EMAIL = "bhadouryaakash@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let currentUser = null;

/* ==========================================================================
   2. SHARED UTILITIES
   ========================================================================== */

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = ["#6C5CE7", "#22C7B7", "#FF7FA6", "#8B7CF6", "#2BD9C9", "#E5546B"];
function colorFromString(str) {
  let hash = 0;
  const s = String(str || "U");
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/** Returns an HTML string for a repeated, template-rendered avatar. Sizing comes from CSS context selectors (e.g. .post-header .avatar). */
function avatarHTML(name, photoURL) {
  const safeName = escapeHTML(name || "Someone");
  if (photoURL) {
    return `<img class="avatar" src="${escapeHTML(photoURL)}" alt="${safeName}" referrerpolicy="no-referrer">`;
  }
  return `<div class="avatar" style="background:${colorFromString(name)}">${escapeHTML(getInitials(name))}</div>`;
}

/** Fills an existing, already-sized .avatar element in place (navbar, composer, chat header). */
function fillAvatarEl(el, name, photoURL) {
  if (!el) return;
  el.innerHTML = "";
  if (photoURL) {
    el.style.background = "transparent";
    const img = document.createElement("img");
    img.src = photoURL;
    img.alt = name || "User";
    img.referrerPolicy = "no-referrer";
    img.style.cssText = "width:100%;height:100%;border-radius:50%;object-fit:cover;";
    el.appendChild(img);
  } else {
    el.style.background = colorFromString(name);
    el.textContent = getInitials(name);
  }
}

function formatRelativeTime(ts) {
  if (!ts) return "just now";
  const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
}

let toastTimer = null;
function showToast(message, kind) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${kind || "success"}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove("show"); }, 3200);
}

function friendlyAuthError(err) {
  const code = err && err.code;
  switch (code) {
    case "auth/invalid-email": return "That email address looks invalid.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "That email and password don't match our records.";
    case "auth/email-already-in-use": return "An account already exists with that email. Try logging in instead.";
    case "auth/weak-password": return "Choose a password with at least 6 characters.";
    case "auth/too-many-requests": return "Too many attempts. Wait a moment and try again.";
    case "auth/popup-closed-by-user": return "Google sign-in was closed before finishing.";
    case "auth/unauthorized-domain": return "This domain isn't authorized for sign-in yet — add it in Firebase Console → Authentication → Settings → Authorized domains.";
    case "permission-denied": return "You don't have permission to do that.";
    default: return (err && err.message) ? err.message.replace("Firebase: ", "") : "Something went wrong. Please try again.";
  }
}

/** Creates (or refreshes) a user's profile document. Idempotent — safe to call on every login. */
async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const isAdminUser = user.email === ADMIN_EMAIL;
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || (user.email ? user.email.split("@")[0] : "Someone"),
      email: user.email || "",
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      banned: false,
      isAdmin: isAdminUser,
      status: isAdminUser ? "approved" : "pending"
    });
  } else {
    await setDoc(ref, {
      displayName: snap.data().displayName || user.displayName || "Someone",
      photoURL: user.photoURL || snap.data().photoURL || null,
      email: user.email || snap.data().email || ""
    }, { merge: true });
  }
}

/** Uploads an optional verification photo (never shown publicly) and returns its URL. */
async function uploadVerificationPhoto(uid, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `verification/${uid}/${Date.now()}_${safeName}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

/** Records a new member's reflection-question answer for admin review. */
async function submitApplication(user, answer, photoURL) {
  await setDoc(doc(db, "applications", user.uid), {
    uid: user.uid,
    name: user.displayName || "",
    email: user.email || "",
    answer,
    photoURL: photoURL || null,
    status: "pending",
    submittedAt: serverTimestamp()
  });
}

/** Wires a file input to show a live preview and a remove button. Shared by the signup form and the post-Google apply panel. */
function wireUpPhotoInput(inputId, previewWrapId, previewImgId, removeBtnId) {
  const input = document.getElementById(inputId);
  const previewWrap = document.getElementById(previewWrapId);
  const previewImg = document.getElementById(previewImgId);
  const removeBtn = document.getElementById(removeBtnId);

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("That photo is over 5MB — please choose a smaller one.", "error");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      previewImg.src = reader.result;
      previewWrap.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  removeBtn.addEventListener("click", () => {
    input.value = "";
    previewImg.src = "";
    previewWrap.classList.add("hidden");
  });
}

/* ==========================================================================
   3. ROUTER
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "login") initLoginPage();
  else if (page === "feed") initFeedPage();
  else if (page === "admin") initAdminPage();
});

/* ==========================================================================
   4. LOGIN PAGE
   ========================================================================== */

function initLoginPage() {
  const authGate = document.getElementById("authGate");
  const authPage = document.getElementById("authPage");
  const applyPage = document.getElementById("applyPage");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginError = document.getElementById("loginError");
  const signupError = document.getElementById("signupError");
  const applyError = document.getElementById("applyError");
  const googleBtn = document.getElementById("googleSignInBtn");
  const forgotLink = document.getElementById("forgotPasswordLink");
  const applySubmitBtn = document.getElementById("applySubmitBtn");

  let pendingApplyUser = null;
  // Flips true the moment any flow below takes navigation into its own hands,
  // so the generic listener here doesn't race it to index.html mid-signup.
  let manualFlowInProgress = false;

  wireUpPhotoInput("signupPhotoInput", "signupPhotoPreviewWrap", "signupPhotoPreview", "signupPhotoRemoveBtn");
  wireUpPhotoInput("applyPhotoInput", "applyPhotoPreviewWrap", "applyPhotoPreview", "applyPhotoRemoveBtn");

  function showApplyPanel(user) {
    pendingApplyUser = user;
    authGate.classList.add("hidden");
    authPage.classList.add("hidden");
    applyPage.classList.remove("hidden");
  }

  // If already signed in, skip straight to the feed — unless they signed up via
  // Google and never finished answering the reflection question.
  onAuthStateChanged(auth, async (user) => {
    if (manualFlowInProgress) return;
    if (!user) {
      authGate.classList.add("hidden");
      authPage.classList.remove("hidden");
      return;
    }
    if (user.email === ADMIN_EMAIL) { window.location.href = "index.html"; return; }
    try {
      const appSnap = await getDoc(doc(db, "applications", user.uid));
      if (appSnap.exists()) window.location.href = "index.html";
      else showApplyPanel(user);
    } catch (err) {
      window.location.href = "index.html";
    }
  });

  function showFormError(el, message) {
    el.textContent = message;
    el.classList.add("show");
  }
  function clearFormError(el) {
    el.textContent = "";
    el.classList.remove("show");
  }

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
  });
  tabSignup.addEventListener("click", () => {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormError(loginError);
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const submitBtn = document.getElementById("loginSubmit");
    manualFlowInProgress = true;
    submitBtn.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch (err) {
      manualFlowInProgress = false;
      showFormError(loginError, friendlyAuthError(err));
      submitBtn.disabled = false;
    }
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormError(signupError);
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;
    const answer = document.getElementById("signupAnswer").value.trim();
    const photoFile = document.getElementById("signupPhotoInput").files[0];
    const submitBtn = document.getElementById("signupSubmit");

    if (!name) { showFormError(signupError, "Enter your name."); return; }
    if (password.length < 6) { showFormError(signupError, "Choose a password with at least 6 characters."); return; }
    if (password !== confirm) { showFormError(signupError, "Passwords don't match."); return; }
    if (answer.length < 20) { showFormError(signupError, "Please share a real answer to the question above — a sentence or two at least."); return; }

    manualFlowInProgress = true;
    submitBtn.disabled = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await ensureUserDoc({ ...cred.user, displayName: name });
      let photoURL = null;
      if (photoFile) photoURL = await uploadVerificationPhoto(cred.user.uid, photoFile);
      await submitApplication({ ...cred.user, displayName: name }, answer, photoURL);
      window.location.href = "index.html";
    } catch (err) {
      manualFlowInProgress = false;
      showFormError(signupError, friendlyAuthError(err));
      submitBtn.disabled = false;
    }
  });

  googleBtn.addEventListener("click", async () => {
    manualFlowInProgress = true;
    googleBtn.disabled = true;
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(cred.user);
      if (cred.user.email === ADMIN_EMAIL) { window.location.href = "index.html"; return; }
      const appSnap = await getDoc(doc(db, "applications", cred.user.uid));
      if (appSnap.exists()) {
        window.location.href = "index.html";
      } else {
        showApplyPanel(cred.user);
        googleBtn.disabled = false;
      }
    } catch (err) {
      manualFlowInProgress = false;
      showFormError(loginError, friendlyAuthError(err));
      googleBtn.disabled = false;
    }
  });

  applySubmitBtn.addEventListener("click", async () => {
    clearFormError(applyError);
    const answer = document.getElementById("applyAnswer").value.trim();
    const photoFile = document.getElementById("applyPhotoInput").files[0];
    if (answer.length < 20) { showFormError(applyError, "Please share a real answer to the question above — a sentence or two at least."); return; }
    if (!pendingApplyUser) { window.location.href = "index.html"; return; }

    applySubmitBtn.disabled = true;
    try {
      let photoURL = null;
      if (photoFile) photoURL = await uploadVerificationPhoto(pendingApplyUser.uid, photoFile);
      await submitApplication(pendingApplyUser, answer, photoURL);
      window.location.href = "index.html";
    } catch (err) {
      showFormError(applyError, friendlyAuthError(err));
      applySubmitBtn.disabled = false;
    }
  });

  forgotLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) { showFormError(loginError, 'Enter your email above first, then click "Forgot password?"'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent — check your inbox.", "success");
    } catch (err) {
      showFormError(loginError, friendlyAuthError(err));
    }
  });
}

/* ==========================================================================
   5. FEED PAGE (feed + composer + messages + navbar, all on index.html)
   ========================================================================== */

const CATEGORY_META = {
  thought: { label: "Thought", cls: "thought" },
  offer: { label: "Offering help", cls: "offer" },
  ask: { label: "Asking for help", cls: "ask" },
  gratitude: { label: "Gratitude", cls: "gratitude" }
};

let selectedCategory = "thought";
let openCommentPostIds = new Set();
const commentUnsubscribers = {};
let conversationsUnsubscribe = null;
let messagesUnsubscribe = null;
let activeConversationId = null;
let currentUserStatus = "pending";
let statusListenerFirstLoad = true;

function initFeedPage() {
  const authGate = document.getElementById("authGate");
  const appShell = document.getElementById("appShell");

  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "login.html"; return; }
    currentUser = user;
    try {
      await ensureUserDoc(user);
    } catch (err) {
      // Non-fatal — the app can still run read-only-ish if this hiccups.
    }
    authGate.classList.add("hidden");
    appShell.classList.remove("hidden");

    setupNavbar(user);
    setupComposer();
    setupFeedInteractions();
    listenOwnUserDoc();
    listenFeed();
    loadCommunityStats();
    setupMessagesShell(); // wires buttons; conversations load lazily on first Messages tab open
  });
}

/* ---- Approval gating ------------------------------------------------------
   New members start "pending" until an admin reviews their reflection-question
   answer. Reading the feed always works; contributing (posting, liking,
   commenting, messaging) requires status === "approved". This mirrors what
   firestore.rules enforces server-side — this copy is just for a responsive UI. */

function listenOwnUserDoc() {
  onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
    if (!snap.exists()) return;
    const newStatus = snap.data().status || "pending";
    const wasApproved = currentUserStatus === "approved";
    currentUserStatus = newStatus;
    updateGatingUI();
    if (!statusListenerFirstLoad && !wasApproved && currentUserStatus === "approved") {
      showToast("You're approved! Welcome to Wishwork — go ahead and post.", "success");
    }
    statusListenerFirstLoad = false;
  });
}

function isApprovedUser() {
  return currentUserStatus === "approved";
}

/** Call at the top of any contribution action. Shows an explanatory toast and returns false if locked. */
function requireApproved(actionLabel) {
  if (isApprovedUser()) return true;
  showToast(`${actionLabel} once your application is approved.`, "error");
  return false;
}

function updateGatingUI() {
  document.body.classList.toggle("guest-mode", !isApprovedUser());
  renderComposerState();
  document.querySelectorAll(".comment-form input").forEach((input) => {
    input.placeholder = isApprovedUser() ? "Write a comment…" : "Comment once you're approved…";
  });
}

function renderComposerState() {
  const composerCard = document.querySelector(".composer-card");
  const normalContent = document.getElementById("composerNormalContent");
  if (!composerCard || !normalContent) return;
  let notice = document.getElementById("composerLockedNotice");

  if (isApprovedUser()) {
    normalContent.classList.remove("hidden");
    if (notice) notice.classList.add("hidden");
    return;
  }

  normalContent.classList.add("hidden");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "composerLockedNotice";
    notice.className = "empty-state";
    composerCard.appendChild(notice);
  }
  notice.innerHTML = currentUserStatus === "rejected"
    ? `<div class="empty-icon">🌥️</div><p>Your application wasn't approved this time. Feel free to reach out if you'd like it reconsidered.</p>`
    : `<div class="empty-icon">🌱</div><p>Your application is under review. Once approved, you'll be able to post, like, and message — for now, feel free to look around.</p>`;
  notice.classList.remove("hidden");
}

/* ---- Navbar / user menu -------------------------------------------------- */

function setupNavbar(user) {
  fillAvatarEl(document.getElementById("navAvatar"), user.displayName, user.photoURL);
  document.getElementById("userMenuName").textContent = user.displayName || "Wishworker";
  document.getElementById("userMenuEmail").textContent = user.email || "";

  const adminLink = document.getElementById("adminLink");
  if (user.email === ADMIN_EMAIL) adminLink.classList.remove("hidden");
  adminLink.addEventListener("click", () => { window.location.href = "admin.html"; });

  const avatarBtn = document.getElementById("userAvatarBtn");
  const menu = document.getElementById("userMenu");
  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("open");
    avatarBtn.setAttribute("aria-expanded", String(isOpen));
  });
  menu.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", () => menu.classList.remove("open"));

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  document.getElementById("navFeedTab").addEventListener("click", () => switchMainTab("feed"));
  document.getElementById("navMessagesTab").addEventListener("click", () => switchMainTab("messages"));
}

function switchMainTab(tab) {
  const isFeed = tab === "feed";
  document.getElementById("feedSection").classList.toggle("hidden", !isFeed);
  document.getElementById("messagesSection").classList.toggle("hidden", isFeed);
  document.getElementById("navFeedTab").classList.toggle("active", isFeed);
  document.getElementById("navMessagesTab").classList.toggle("active", !isFeed);
  if (!isFeed && !conversationsUnsubscribe) listenConversations();
}

/* ---- Composer -------------------------------------------------------------- */

function setupComposer() {
  fillAvatarEl(document.getElementById("composerAvatar"), currentUser.displayName, currentUser.photoURL);

  const pillsWrap = document.getElementById("categoryPills");
  pillsWrap.addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    selectedCategory = pill.dataset.category;
    pillsWrap.querySelectorAll(".pill").forEach((p) => p.classList.toggle("active", p === pill));
  });

  const textarea = document.getElementById("postComposerText");
  const submitBtn = document.getElementById("submitPostBtn");

  textarea.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitBtn.click();
  });

  submitBtn.addEventListener("click", async () => {
    if (!requireApproved("You can post")) return;
    const text = textarea.value.trim();
    if (!text) return;
    submitBtn.disabled = true;
    try {
      await addDoc(collection(db, "posts"), {
        authorId: currentUser.uid,
        authorName: currentUser.displayName || "Someone",
        authorPhoto: currentUser.photoURL || null,
        text: text.slice(0, 2000),
        category: selectedCategory,
        createdAt: serverTimestamp(),
        likeCount: 0,
        likedBy: [],
        commentCount: 0
      });
      textarea.value = "";
      selectedCategory = "thought";
      pillsWrap.querySelectorAll(".pill").forEach((p, i) => p.classList.toggle("active", i === 0));
    } catch (err) {
      showToast("Could not publish your post.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---- Feed rendering ---------------------------------------------------- */

function listenFeed() {
  const postsList = document.getElementById("postsList");
  const feedLoading = document.getElementById("feedLoading");
  const feedEmpty = document.getElementById("feedEmpty");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
  onSnapshot(q, (snap) => {
    feedLoading.classList.add("hidden");

    // Tear down comment listeners before replacing the DOM they point at.
    Object.values(commentUnsubscribers).forEach((unsub) => unsub());
    Object.keys(commentUnsubscribers).forEach((k) => delete commentUnsubscribers[k]);

    if (snap.empty) {
      postsList.innerHTML = "";
      feedEmpty.classList.remove("hidden");
      return;
    }
    feedEmpty.classList.add("hidden");
    postsList.innerHTML = snap.docs.map((d) => renderPostCard(d.id, d.data())).join("");

    openCommentPostIds.forEach((postId) => {
      const section = postsList.querySelector(`.comments-section[data-post-id="${CSS.escape(postId)}"]`);
      if (section) {
        section.classList.add("open");
        listenComments(postId, section);
      } else {
        openCommentPostIds.delete(postId);
      }
    });
  }, () => {
    feedLoading.classList.add("hidden");
    showToast("Could not load the feed.", "error");
  });
}

function renderPostCard(id, data) {
  const liked = (data.likedBy || []).includes(currentUser.uid);
  const meta = CATEGORY_META[data.category] || CATEGORY_META.thought;
  const canMessage = data.authorId && data.authorId !== currentUser.uid;

  return `
    <li class="post-card glass-panel" data-post-id="${id}">
      <div class="post-header">
        ${avatarHTML(data.authorName, data.authorPhoto)}
        <div style="flex:1; min-width:0;">
          <div class="post-author-line">
            <span class="post-author-name">${escapeHTML(data.authorName)}</span>
            <span class="category-badge ${meta.cls}">${meta.label}</span>
          </div>
          <span class="post-timestamp">${formatRelativeTime(data.createdAt)}</span>
        </div>
        ${canMessage ? `<button type="button" class="btn-icon message-author-btn" data-uid="${escapeHTML(data.authorId)}" data-name="${escapeHTML(data.authorName)}" data-photo="${escapeHTML(data.authorPhoto || "")}" aria-label="Message ${escapeHTML(data.authorName)}" title="Message ${escapeHTML(data.authorName)}">✉️</button>` : ""}
      </div>
      <p class="post-body">${escapeHTML(data.text)}</p>
      <div class="post-actions">
        <button type="button" class="action-btn like-btn ${liked ? "liked" : ""}" data-post-id="${id}" aria-label="Like">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="${liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg>
          <span>${data.likeCount || 0}</span>
        </button>
        <button type="button" class="action-btn comment-toggle-btn" data-post-id="${id}" aria-label="Comments">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.35 0-2.62-.32-3.73-.9L3 21l1.9-5.77A8.5 8.5 0 1 1 21 11.5z"/></svg>
          <span>${data.commentCount || 0}</span>
        </button>
      </div>
      <div class="comments-section" data-post-id="${id}">
        <div class="comments-list"></div>
        <form class="comment-form" data-post-id="${id}">
          <input type="text" placeholder="${isApprovedUser() ? "Write a comment…" : "Comment once you're approved…"}" maxlength="500">
          <button type="submit" class="btn-icon btn-sm" aria-label="Send comment">➤</button>
        </form>
      </div>
    </li>
  `;
}

function renderComment(data) {
  return `
    <div class="comment-item">
      ${avatarHTML(data.authorName, data.authorPhoto)}
      <div class="comment-bubble">
        <div class="comment-author">${escapeHTML(data.authorName)}</div>
        <div class="comment-text">${escapeHTML(data.text)}</div>
      </div>
    </div>
  `;
}

function listenComments(postId, section) {
  if (commentUnsubscribers[postId]) return;
  const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"), limit(200));
  commentUnsubscribers[postId] = onSnapshot(q, (snap) => {
    const list = section.querySelector(".comments-list");
    if (!list) return;
    list.innerHTML = snap.docs.map((d) => renderComment(d.data())).join("");
  });
}

/* ---- Feed interactions (event delegation — attached once) -------------- */

function setupFeedInteractions() {
  const postsList = document.getElementById("postsList");

  postsList.addEventListener("click", (e) => {
    const likeBtn = e.target.closest(".like-btn");
    if (likeBtn) {
      if (!requireApproved("You can like posts")) return;
      likeBtn.classList.add("pulse");
      setTimeout(() => likeBtn.classList.remove("pulse"), 550);
      toggleLike(likeBtn.dataset.postId);
      return;
    }
    const commentToggle = e.target.closest(".comment-toggle-btn");
    if (commentToggle) { toggleCommentSection(commentToggle.dataset.postId); return; } // reading is always allowed

    const msgBtn = e.target.closest(".message-author-btn");
    if (msgBtn) {
      if (!requireApproved("You can message members")) return;
      startConversation(msgBtn.dataset.uid, msgBtn.dataset.name, msgBtn.dataset.photo);
    }
  });

  postsList.addEventListener("submit", (e) => {
    const form = e.target.closest(".comment-form");
    if (!form) return;
    e.preventDefault();
    if (!requireApproved("You can comment")) return;
    const input = form.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addComment(form.dataset.postId, text);
  });
}

function toggleCommentSection(postId) {
  const postsList = document.getElementById("postsList");
  const section = postsList.querySelector(`.comments-section[data-post-id="${CSS.escape(postId)}"]`);
  if (!section) return;
  const isOpen = section.classList.toggle("open");
  if (isOpen) {
    openCommentPostIds.add(postId);
    listenComments(postId, section);
  } else {
    openCommentPostIds.delete(postId);
    if (commentUnsubscribers[postId]) { commentUnsubscribers[postId](); delete commentUnsubscribers[postId]; }
  }
}

async function toggleLike(postId) {
  const ref = doc(db, "posts", postId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const likedBy = snap.data().likedBy || [];
      const hasLiked = likedBy.includes(currentUser.uid);
      tx.update(ref, {
        likedBy: hasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        likeCount: increment(hasLiked ? -1 : 1)
      });
    });
  } catch (err) {
    showToast("Could not update your like.", "error");
  }
}

async function addComment(postId, text) {
  const trimmed = text.slice(0, 500);
  const postRef = doc(db, "posts", postId);
  try {
    await addDoc(collection(postRef, "comments"), {
      authorId: currentUser.uid,
      authorName: currentUser.displayName || "Someone",
      authorPhoto: currentUser.photoURL || null,
      text: trimmed,
      createdAt: serverTimestamp()
    });
    await updateDoc(postRef, { commentCount: increment(1) });
  } catch (err) {
    showToast("Could not post your comment.", "error");
  }
}

async function loadCommunityStats() {
  try {
    const [usersCount, postsCount] = await Promise.all([
      getCountFromServer(collection(db, "users")),
      getCountFromServer(collection(db, "posts"))
    ]);
    document.getElementById("statMembers").textContent = usersCount.data().count;
    document.getElementById("statPosts").textContent = postsCount.data().count;
  } catch (err) {
    // Non-critical decorative stat — fail silently.
  }
}

/* ---- Messages ------------------------------------------------------------ */

function getConversationId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

function setupMessagesShell() {
  document.getElementById("conversationsList").addEventListener("click", (e) => {
    const item = e.target.closest(".conversation-item");
    if (!item) return;
    openConversation(item.dataset.convId, item.dataset.otherName, item.dataset.otherPhoto);
    if (window.innerWidth <= 780) {
      document.getElementById("conversationsPanel").classList.add("hide-mobile");
      document.getElementById("chatPanel").classList.remove("hide-mobile");
    }
  });

  document.getElementById("chatBackBtn").addEventListener("click", () => {
    document.getElementById("chatPanel").classList.add("hide-mobile");
    document.getElementById("conversationsPanel").classList.remove("hide-mobile");
  });

  document.getElementById("chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!requireApproved("You can send messages")) return;
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text || !activeConversationId) return;
    input.value = "";
    const convRef = doc(db, "conversations", activeConversationId);
    try {
      await addDoc(collection(convRef, "messages"), {
        senderId: currentUser.uid,
        text: text.slice(0, 2000),
        createdAt: serverTimestamp()
      });
      await updateDoc(convRef, {
        lastMessage: text.slice(0, 120),
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: currentUser.uid
      });
    } catch (err) {
      showToast("Message failed to send.", "error");
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 780) {
      document.getElementById("conversationsPanel").classList.remove("hide-mobile");
      document.getElementById("chatPanel").classList.remove("hide-mobile");
    }
  });
}

function listenConversations() {
  const list = document.getElementById("conversationsList");
  const empty = document.getElementById("conversationsEmpty");
  const q = query(collection(db, "conversations"), where("participants", "array-contains", currentUser.uid), orderBy("lastMessageAt", "desc"));
  conversationsUnsubscribe = onSnapshot(q, (snap) => {
    if (snap.empty) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    list.innerHTML = snap.docs.map((d) => renderConversationItem(d.id, d.data())).join("");
  }, () => showToast("Could not load messages.", "error"));
}

function renderConversationItem(id, data) {
  const otherUid = (data.participants || []).find((uid) => uid !== currentUser.uid);
  const info = (data.participantInfo && data.participantInfo[otherUid]) || {};
  const isActive = id === activeConversationId;
  const mine = data.lastMessageSenderId === currentUser.uid;
  const preview = data.lastMessage ? (mine ? `You: ${data.lastMessage}` : data.lastMessage) : "Say hello 👋";

  return `
    <button type="button" class="conversation-item ${isActive ? "active" : ""}" data-conv-id="${id}" data-other-name="${escapeHTML(info.name || "Someone")}" data-other-photo="${escapeHTML(info.photo || "")}">
      ${avatarHTML(info.name, info.photo)}
      <div class="conversation-meta">
        <div class="conversation-name">${escapeHTML(info.name || "Someone")}</div>
        <div class="conversation-last-msg">${escapeHTML(preview)}</div>
      </div>
      <div class="conversation-time">${data.lastMessageAt ? formatRelativeTime(data.lastMessageAt) : ""}</div>
    </button>
  `;
}

async function startConversation(otherUid, otherName, otherPhoto) {
  if (!otherUid || otherUid === currentUser.uid) return;
  const convId = getConversationId(currentUser.uid, otherUid);
  const convRef = doc(db, "conversations", convId);
  try {
    const snap = await getDoc(convRef);
    if (!snap.exists()) {
      await setDoc(convRef, {
        participants: [currentUser.uid, otherUid],
        participantInfo: {
          [currentUser.uid]: { name: currentUser.displayName || "Someone", photo: currentUser.photoURL || null },
          [otherUid]: { name: otherName || "Someone", photo: otherPhoto || null }
        },
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: null
      });
    }
    switchMainTab("messages");
    if (!conversationsUnsubscribe) listenConversations();
    openConversation(convId, otherName, otherPhoto);
  } catch (err) {
    showToast("Could not start the conversation.", "error");
  }
}

function openConversation(convId, otherName, otherPhoto) {
  activeConversationId = convId;
  document.getElementById("noConversationSelected").classList.add("hidden");
  document.getElementById("activeChat").classList.remove("hidden");
  document.getElementById("chatHeaderName").textContent = otherName || "";
  fillAvatarEl(document.getElementById("chatAvatar"), otherName, otherPhoto);

  document.querySelectorAll(".conversation-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.convId === convId);
  });

  if (messagesUnsubscribe) messagesUnsubscribe();
  const chatMessages = document.getElementById("chatMessages");
  const q = query(collection(db, "conversations", convId, "messages"), orderBy("createdAt", "asc"), limit(300));
  messagesUnsubscribe = onSnapshot(q, (snap) => {
    chatMessages.innerHTML = snap.docs.map((d) => renderMessageBubble(d.data())).join("");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function renderMessageBubble(data) {
  const mine = data.senderId === currentUser.uid;
  return `<div class="message-bubble ${mine ? "sent" : "received"}">${escapeHTML(data.text)}</div>`;
}

/* ==========================================================================
   6. ADMIN PAGE
   ========================================================================== */

let adminUsersLoaded = false;
let adminApplicationsUnsubscribe = null;

function initAdminPage() {
  const authGate = document.getElementById("authGate");
  const shell = document.getElementById("adminShellWrap");

  onAuthStateChanged(auth, (user) => {
    if (!user) { window.location.href = "login.html"; return; }
    if (user.email !== ADMIN_EMAIL) { window.location.href = "index.html"; return; }
    currentUser = user;
    authGate.classList.add("hidden");
    shell.classList.remove("hidden");

    loadAdminStats();
    listenApplications("pending");
    listenAdminPosts();

    document.getElementById("adminTabApplications").addEventListener("click", () => switchAdminTab("applications"));
    document.getElementById("adminTabPosts").addEventListener("click", () => switchAdminTab("posts"));
    document.getElementById("adminTabUsers").addEventListener("click", () => switchAdminTab("users"));
    document.getElementById("adminLogoutBtn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });

    document.querySelectorAll(".application-filters .pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".application-filters .pill").forEach((p) => p.classList.toggle("active", p === pill));
        listenApplications(pill.dataset.status);
      });
    });

    document.getElementById("adminApplicationsList").addEventListener("click", handleApplicationActionClick);
    document.getElementById("adminPostsList").addEventListener("click", handleDeletePostClick);
    document.getElementById("adminUsersList").addEventListener("click", handleToggleBanClick);
  });
}

function switchAdminTab(tab) {
  const panels = { applications: "adminApplicationsPanel", posts: "adminPostsPanel", users: "adminUsersPanel" };
  const tabs = { applications: "adminTabApplications", posts: "adminTabPosts", users: "adminTabUsers" };
  Object.keys(panels).forEach((key) => {
    document.getElementById(panels[key]).classList.toggle("hidden", key !== tab);
    document.getElementById(tabs[key]).classList.toggle("active", key === tab);
  });
  if (tab === "users" && !adminUsersLoaded) { adminUsersLoaded = true; loadAdminUsers(); }
}

async function loadAdminStats() {
  try {
    const since = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const [pendingApps, users, posts, postsToday] = await Promise.all([
      getCountFromServer(query(collection(db, "applications"), where("status", "==", "pending"))),
      getCountFromServer(collection(db, "users")),
      getCountFromServer(collection(db, "posts")),
      getCountFromServer(query(collection(db, "posts"), where("createdAt", ">=", since)))
    ]);
    document.getElementById("statPendingApplications").textContent = pendingApps.data().count;
    document.getElementById("statTotalUsers").textContent = users.data().count;
    document.getElementById("statTotalPosts").textContent = posts.data().count;
    document.getElementById("statPostsToday").textContent = postsToday.data().count;
  } catch (err) {
    showToast("Could not load platform stats.", "error");
  }
}

/* ---- Applications -------------------------------------------------------- */

function listenApplications(status) {
  if (adminApplicationsUnsubscribe) adminApplicationsUnsubscribe();

  const list = document.getElementById("adminApplicationsList");
  const loading = document.getElementById("adminApplicationsLoading");
  const empty = document.getElementById("adminApplicationsEmpty");
  loading.classList.remove("hidden");

  // Filtered by equality only (no orderBy) so this never needs a composite index —
  // newest-first ordering is applied client-side just below instead.
  const q = query(collection(db, "applications"), where("status", "==", status), limit(200));
  adminApplicationsUnsubscribe = onSnapshot(q, (snap) => {
    loading.classList.add("hidden");
    if (snap.empty) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    const docs = [...snap.docs].sort((a, b) => {
      const ta = a.data().submittedAt ? a.data().submittedAt.toMillis() : 0;
      const tb = b.data().submittedAt ? b.data().submittedAt.toMillis() : 0;
      return tb - ta;
    });
    list.innerHTML = docs.map((d) => renderApplicationCard(d.id, d.data())).join("");
  }, () => {
    loading.classList.add("hidden");
    showToast("Could not load applications.", "error");
  });
}

function renderApplicationCard(uid, data) {
  const submitted = data.submittedAt ? formatRelativeTime(data.submittedAt) : "";
  const photoBlock = data.photoURL
    ? `<a href="${escapeHTML(data.photoURL)}" target="_blank" rel="noopener"><img class="application-photo" src="${escapeHTML(data.photoURL)}" alt="Verification photo from ${escapeHTML(data.name)}"></a>`
    : "";
  return `
    <div class="application-card" data-uid="${uid}">
      <div class="application-header">
        ${avatarHTML(data.name, null)}
        <div class="application-header-meta">
          <div class="application-name">${escapeHTML(data.name || "Someone")}</div>
          <div class="application-email">${escapeHTML(data.email || "")}</div>
        </div>
        <span class="application-time">${submitted}</span>
      </div>
      <div class="application-body">
        <div class="application-answer">${escapeHTML(data.answer || "")}</div>
        ${photoBlock}
      </div>
      <div class="application-actions">
        ${renderApplicationActions(uid, data.status)}
      </div>
    </div>
  `;
}

function renderApplicationActions(uid, status) {
  if (status === "approved") {
    return `<span class="status-badge approved">Approved</span>
            <button type="button" class="btn btn-outline btn-sm application-action-btn" data-uid="${uid}" data-action="pending">Move to pending</button>`;
  }
  if (status === "rejected") {
    return `<span class="status-badge rejected">Rejected</span>
            <button type="button" class="btn btn-outline btn-sm application-action-btn" data-uid="${uid}" data-action="pending">Reconsider</button>`;
  }
  return `<button type="button" class="btn btn-primary btn-sm application-action-btn" data-uid="${uid}" data-action="approved">Approve</button>
          <button type="button" class="btn btn-danger btn-sm application-action-btn" data-uid="${uid}" data-action="rejected">Reject</button>`;
}

async function handleApplicationActionClick(e) {
  const btn = e.target.closest(".application-action-btn");
  if (!btn) return;
  const uid = btn.dataset.uid;
  const newStatus = btn.dataset.action;
  btn.disabled = true;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "applications", uid), { status: newStatus, reviewedAt: serverTimestamp(), reviewedBy: currentUser.email });
    batch.update(doc(db, "users", uid), { status: newStatus });
    await batch.commit();
    showToast(
      newStatus === "approved" ? "Member approved." : newStatus === "rejected" ? "Application rejected." : "Moved back to pending.",
      "success"
    );
    loadAdminStats();
  } catch (err) {
    showToast("Could not update that application.", "error");
    btn.disabled = false;
  }
}

function listenAdminPosts() {
  const list = document.getElementById("adminPostsList");
  const loading = document.getElementById("adminPostsLoading");
  const empty = document.getElementById("adminPostsEmpty");
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100));
  onSnapshot(q, (snap) => {
    loading.classList.add("hidden");
    if (snap.empty) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    list.innerHTML = snap.docs.map((d) => renderAdminPostRow(d.id, d.data())).join("");
  }, () => { loading.classList.add("hidden"); showToast("Could not load posts.", "error"); });
}

function renderAdminPostRow(id, data) {
  const snippet = (data.text || "").slice(0, 90) + ((data.text || "").length > 90 ? "…" : "");
  return `
    <div class="admin-row" data-post-id="${id}">
      ${avatarHTML(data.authorName, data.authorPhoto)}
      <div class="admin-row-main">
        <div class="admin-row-title">${escapeHTML(data.authorName || "Someone")}</div>
        <div class="admin-row-sub">${escapeHTML(snippet)}</div>
      </div>
      <span style="font-size:0.75rem; color:var(--ink-300); white-space:nowrap;">${formatRelativeTime(data.createdAt)}</span>
      <button type="button" class="btn btn-danger btn-sm delete-post-btn" data-post-id="${id}">Delete</button>
    </div>
  `;
}

async function handleDeletePostClick(e) {
  const btn = e.target.closest(".delete-post-btn");
  if (!btn) return;
  const postId = btn.dataset.postId;
  if (!window.confirm("Delete this post? This can't be undone.")) return;
  btn.disabled = true;
  try {
    await deleteDoc(doc(db, "posts", postId));
    showToast("Post deleted.", "success");
  } catch (err) {
    showToast("Could not delete that post.", "error");
    btn.disabled = false;
  }
}

async function loadAdminUsers() {
  const list = document.getElementById("adminUsersList");
  const loading = document.getElementById("adminUsersLoading");
  const empty = document.getElementById("adminUsersEmpty");
  loading.classList.remove("hidden");
  try {
    const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(300)));
    loading.classList.add("hidden");
    if (snap.empty) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    list.innerHTML = snap.docs.map((d) => renderAdminUserRow(d.id, d.data())).join("");
  } catch (err) {
    loading.classList.add("hidden");
    showToast("Could not load members.", "error");
  }
}

function renderAdminUserRow(uid, data) {
  const banned = !!data.banned;
  const status = data.status || "pending";
  const statusBadge = status !== "approved" ? `<span class="status-badge ${status}">${status === "pending" ? "Pending" : "Rejected"}</span>` : "";
  return `
    <div class="admin-row" data-uid="${uid}">
      ${avatarHTML(data.displayName, data.photoURL)}
      <div class="admin-row-main">
        <div class="admin-row-title">${escapeHTML(data.displayName || "Someone")} ${statusBadge} ${banned ? '<span class="badge-banned">Banned</span>' : ""}</div>
        <div class="admin-row-sub">${escapeHTML(data.email || "")}</div>
      </div>
      <button type="button" class="btn btn-sm ${banned ? "btn-outline" : "btn-danger"} toggle-ban-btn" data-uid="${uid}" data-banned="${banned}">${banned ? "Unban" : "Ban"}</button>
    </div>
  `;
}

async function handleToggleBanClick(e) {
  const btn = e.target.closest(".toggle-ban-btn");
  if (!btn) return;
  const uid = btn.dataset.uid;
  const currentlyBanned = btn.dataset.banned === "true";
  if (uid === currentUser.uid) { showToast("You can't ban yourself.", "error"); return; }
  btn.disabled = true;
  try {
    await updateDoc(doc(db, "users", uid), { banned: !currentlyBanned });
    showToast(currentlyBanned ? "User unbanned." : "User banned.", "success");
    adminUsersLoaded = false;
    loadAdminUsers();
  } catch (err) {
    showToast("Could not update that member.", "error");
    btn.disabled = false;
  }
}
