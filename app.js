// ============================================================
// SHARED UTILITIES — used by index.html, login.html, admin.html
// ============================================================

/* ---------- Dark / light theme toggle ---------- */
(function initTheme() {
  const saved = localStorage.getItem("wishwork-theme");
  const theme = saved || "dark";
  document.documentElement.setAttribute("data-theme", theme);
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("wishwork-theme", next);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = next === "light" ? "🌙" : "☀️";
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.textContent = document.documentElement.getAttribute("data-theme") === "light" ? "🌙" : "☀️";
    btn.addEventListener("click", toggleTheme);
  }
});

/* ---------- Toast notifications ---------- */
let toastTimer;
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

/* ---------- Escape user text before inserting as HTML ---------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

/* ---------- Relative time formatting ---------- */
function formatTime(timestamp) {
  if (!timestamp) return "just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- Build the avatar markup for a user ---------- */
function avatarMarkup(name, photoURL, size) {
  const styleAttr = size ? ` style="width:${size}px;height:${size}px;"` : "";
  if (photoURL) {
    return `<img class="avatar" src="${escapeHtml(photoURL)}" alt="${escapeHtml(name)}"${styleAttr}>`;
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return `<div class="avatar-fallback"${styleAttr}>${initial}</div>`;
}

/* ---------- Render the shared top nav once auth state is known ----------
   `user` is a Firebase Auth user object or null.
   `activePage` is "feed" or "admin", used to decide which links to show. */
function renderNavAuthArea(user, options = {}) {
  const area = document.getElementById("navAuthArea");
  if (!area) return;

  if (!user) {
    area.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">Sign in</a>`;
    return;
  }

  const isAdmin = user.email === ADMIN_EMAIL;
  const adminLink = isAdmin
    ? `<a href="admin.html" class="icon-btn" title="Admin dashboard">🛡️</a>`
    : "";

  area.innerHTML = `
    ${adminLink}
    <button class="icon-btn" id="signOutBtn" title="Sign out">⏻</button>
    ${avatarMarkup(user.displayName || user.email, user.photoURL)}
  `;

  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await auth.signOut();
      window.location.href = options.afterSignOut || "index.html";
    });
  }
}
