// ============================================================
// ADMIN DASHBOARD LOGIC (admin.html)
// Only usable by the signed-in user whose email === ADMIN_EMAIL
// (see js/firebase-config.js). Firestore/Storage rules enforce
// this server-side too — the UI check below is just for UX.
// ============================================================

const gateSection = document.getElementById("gateSection");
const adminSection = document.getElementById("adminSection");
const pendingList = document.getElementById("pendingList");
const pendingLoader = document.getElementById("pendingLoader");
const pendingCount = document.getElementById("pendingCount");

auth.onAuthStateChanged((user) => {
  renderNavAuthArea(user);

  if (!user) {
    showGate("signed-out");
    return;
  }
  if (user.email !== ADMIN_EMAIL) {
    showGate("not-admin");
    return;
  }

  gateSection.style.display = "none";
  adminSection.style.display = "block";
  listenToPendingPosts();
});

function showGate(reason) {
  adminSection.style.display = "none";
  gateSection.style.display = "block";
  const msg = document.getElementById("gateMessage");
  const action = document.getElementById("gateAction");
  if (reason === "signed-out") {
    msg.textContent = "Sign in with the admin account to view the dashboard.";
    action.innerHTML = `<a href="login.html" class="btn btn-primary">Sign in</a>`;
  } else {
    msg.textContent = "This dashboard is only available to the WishWork admin account.";
    action.innerHTML = `<a href="index.html" class="btn btn-ghost">Back to feed</a>`;
  }
}

function listenToPendingPosts() {
  db.collection("posts")
    .where("status", "==", "pending")
    .orderBy("createdAt", "asc")
    .onSnapshot((snap) => {
      pendingLoader.style.display = "none";
      const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      pendingCount.textContent = posts.length;

      if (posts.length === 0) {
        pendingList.innerHTML = `
          <div class="empty-state">
            <h3>All caught up</h3>
            <p>No posts are waiting for review right now.</p>
          </div>`;
        return;
      }
      pendingList.innerHTML = posts.map(renderAdminCard).join("");
      posts.forEach(attachHandlers);
    }, (err) => {
      pendingLoader.style.display = "none";
      console.error("Admin listener error:", err);
      pendingList.innerHTML = `<div class="empty-state"><h3>Couldn't load pending posts</h3><p>${escapeHtml(err.message)}</p></div>`;
    });
}

function renderAdminCard(post) {
  const img = post.imageURL
    ? `<img class="post-image" src="${escapeHtml(post.imageURL)}" alt="Post image" loading="lazy">`
    : "";
  return `
    <article class="glass admin-post" id="admin-post-${post.id}">
      <div class="post-head">
        ${avatarMarkup(post.authorName, post.authorPhoto, 38)}
        <div style="flex:1;">
          <div class="post-author">${escapeHtml(post.authorName)}</div>
          <div class="post-time">Submitted ${formatTime(post.createdAt)}</div>
        </div>
        <span class="badge badge-pending">Pending</span>
      </div>
      ${post.text ? `<div class="post-body">${escapeHtml(post.text)}</div>` : ""}
      ${img}
      <div class="admin-post-actions">
        <button class="btn btn-primary" data-action="approve" data-id="${post.id}">✓ Approve</button>
        <button class="btn btn-danger" data-action="reject" data-id="${post.id}" data-image="${post.imageURL ? escapeHtml(post.imageURL) : ""}">✕ Reject</button>
      </div>
    </article>`;
}

function attachHandlers(post) {
  const card = document.getElementById(`admin-post-${post.id}`);
  if (!card) return;

  card.querySelector('[data-action="approve"]').addEventListener("click", async (e) => {
    setButtonsDisabled(card, true);
    try {
      await db.collection("posts").doc(post.id).update({
        status: "approved",
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("Post approved and live on the feed.");
    } catch (err) {
      console.error(err);
      showToast("Couldn't approve that post.");
      setButtonsDisabled(card, false);
    }
  });

  card.querySelector('[data-action="reject"]').addEventListener("click", async (e) => {
    if (!confirm("Reject and permanently delete this post?")) return;
    setButtonsDisabled(card, true);
    try {
      await db.collection("posts").doc(post.id).delete();
      const imageURL = e.currentTarget.dataset.image;
      if (imageURL) {
        try {
          await storage.refFromURL(imageURL).delete();
        } catch (imgErr) {
          console.warn("Image cleanup failed (non-fatal):", imgErr);
        }
      }
      showToast("Post rejected and removed.");
    } catch (err) {
      console.error(err);
      showToast("Couldn't reject that post.");
      setButtonsDisabled(card, false);
    }
  });
}

function setButtonsDisabled(card, disabled) {
  card.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
}
