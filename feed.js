// ============================================================
// FEED PAGE LOGIC (index.html)
// ============================================================

const composerSection = document.getElementById("composerSection");
const signedOutPrompt = document.getElementById("signedOutPrompt");
const postText = document.getElementById("postText");
const postSubmitBtn = document.getElementById("postSubmitBtn");
const imageInput = document.getElementById("imageInput");
const imagePreviewWrap = document.getElementById("imagePreviewWrap");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");
const pendingBanner = document.getElementById("pendingBanner");
const feedList = document.getElementById("feedList");
const feedLoader = document.getElementById("feedLoader");
const composerAvatarSlot = document.getElementById("composerAvatarSlot");

let currentUser = null;
let selectedImageFile = null;
let approvedPosts = [];
let myPendingPosts = [];

/* ---------- Auth state ---------- */
auth.onAuthStateChanged((user) => {
  currentUser = user;
  renderNavAuthArea(user);

  if (user) {
    composerSection.style.display = "block";
    signedOutPrompt.style.display = "none";
    composerAvatarSlot.innerHTML = avatarMarkup(user.displayName || user.email, user.photoURL, 40);
    listenToMyPendingPosts(user.uid);
  } else {
    composerSection.style.display = "none";
    signedOutPrompt.style.display = "block";
    pendingBanner.classList.remove("show");
    myPendingPosts = [];
    renderFeed();
  }
});

/* ---------- Image attach / preview ---------- */
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast("Please choose an image under 5MB.");
    imageInput.value = "";
    return;
  }
  selectedImageFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreviewWrap.classList.add("show");
  };
  reader.readAsDataURL(file);
});

removeImageBtn.addEventListener("click", () => {
  selectedImageFile = null;
  imageInput.value = "";
  imagePreviewWrap.classList.remove("show");
  imagePreview.src = "";
});

/* ---------- Submit a new post ---------- */
postSubmitBtn.addEventListener("click", async () => {
  const text = postText.value.trim();
  if (!text && !selectedImageFile) {
    showToast("Write something or attach an image first.");
    return;
  }
  if (!currentUser) return;

  postSubmitBtn.disabled = true;
  postSubmitBtn.textContent = "Posting…";

  try {
    let imageURL = null;

    if (selectedImageFile) {
      const path = `posts/${currentUser.uid}/${Date.now()}_${selectedImageFile.name}`;
      const ref = storage.ref().child(path);
      await ref.put(selectedImageFile);
      imageURL = await ref.getDownloadURL();
    }

    await db.collection("posts").add({
      authorId: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
      authorPhoto: currentUser.photoURL || null,
      text: text,
      imageURL: imageURL,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    postText.value = "";
    selectedImageFile = null;
    imageInput.value = "";
    imagePreviewWrap.classList.remove("show");
    showToast("Post submitted — awaiting admin review 🌱");
  } catch (err) {
    console.error(err);
    showToast("Couldn't submit your post. Please try again.");
  } finally {
    postSubmitBtn.disabled = false;
    postSubmitBtn.textContent = "Share";
  }
});

/* ---------- Listen: this user's own pending posts (for the banner + inline preview) ---------- */
function listenToMyPendingPosts(uid) {
  db.collection("posts")
    .where("authorId", "==", uid)
    .where("status", "==", "pending")
    .onSnapshot((snap) => {
      myPendingPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      pendingBanner.classList.toggle("show", myPendingPosts.length > 0);
      pendingBanner.querySelector("span").textContent =
        myPendingPosts.length === 1
          ? "Your post is awaiting admin review. It'll appear on the feed once approved."
          : `${myPendingPosts.length} of your posts are awaiting admin review.`;
      renderFeed();
    }, (err) => console.error("Pending listener error:", err));
}

/* ---------- Listen: all approved posts (public feed) ---------- */
db.collection("posts")
  .where("status", "==", "approved")
  .orderBy("createdAt", "desc")
  .onSnapshot((snap) => {
    feedLoader.style.display = "none";
    approvedPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderFeed();
  }, (err) => {
    feedLoader.style.display = "none";
    console.error("Feed listener error:", err);
    feedList.innerHTML = `<div class="empty-state"><h3>Couldn't load the feed</h3><p>Please refresh the page.</p></div>`;
  });

/* ---------- Render ---------- */
function renderFeed() {
  const combined = [...myPendingPosts.map((p) => ({ ...p, __mine: true })), ...approvedPosts];

  if (combined.length === 0) {
    feedList.innerHTML = `
      <div class="empty-state">
        <h3>No posts yet</h3>
        <p>Be the first to share an idea for a better Earth.</p>
      </div>`;
    return;
  }

  // Pending-of-mine first (so people see their own submission), then approved by recency.
  combined.sort((a, b) => {
    if (a.__mine && !b.__mine) return -1;
    if (!a.__mine && b.__mine) return 1;
    const at = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bt = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bt - at;
  });

  feedList.innerHTML = combined.map(renderPostCard).join("");
}

function renderPostCard(post) {
  const badge = post.__mine
    ? `<span class="badge badge-pending">Pending review</span>`
    : "";
  const img = post.imageURL
    ? `<img class="post-image" src="${escapeHtml(post.imageURL)}" alt="Post image" loading="lazy">`
    : "";

  return `
    <article class="glass post">
      <div class="post-head">
        ${avatarMarkup(post.authorName, post.authorPhoto, 38)}
        <div style="flex:1;">
          <div class="post-author">${escapeHtml(post.authorName)}</div>
          <div class="post-time">${formatTime(post.createdAt)}</div>
        </div>
        ${badge}
      </div>
      ${post.text ? `<div class="post-body">${escapeHtml(post.text)}</div>` : ""}
      ${img}
    </article>`;
}
