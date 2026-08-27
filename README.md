# WishWork

A moderated community feed for sharing ideas on making Earth better, helping
each other, and debating philosophy. Static HTML/CSS/JS front end, Firebase
for auth, data, and images, hosted free on GitHub Pages.

```
wishwork/
├── index.html          # public feed
├── login.html           # sign up / sign in
├── admin.html            # admin-only review queue
├── CNAME                  # custom domain for GitHub Pages
├── css/style.css
└── js/
    ├── firebase-config.js  # ← you edit this
    ├── app.js               # shared helpers (theme, toast, nav, formatting)
    ├── auth.js               # login.html logic
    ├── feed.js                # index.html logic
    └── admin.js                 # admin.html logic
```

---

## 1. Create the Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. Once created, go to **Build → Authentication → Sign-in method** and enable:
   - **Email/Password**
   - **Google**
3. Go to **Build → Firestore Database → Create database** (start in production mode, pick a region).
4. Go to **Build → Storage → Get started** (production mode).
5. Go to **Project settings → General → Your apps → Add app → Web (`</>`)**.
   Register it (nickname doesn't matter, no need for Firebase Hosting).
6. Copy the `firebaseConfig` object it gives you into `js/firebase-config.js`,
   replacing the placeholder values. Leave `ADMIN_EMAIL` as
   `bhadouryaakash@gmail.com` (or change it, but keep it in sync with the
   security rules below).
7. In **Authentication → Settings → Authorized domains**, add `wishwork.online`
   (and `www.wishwork.online` if you'll use it) once your custom domain is live.

There's nothing secret in `firebase-config.js` — it's fine to commit and push
to a public GitHub repo. The real protection is the security rules below,
which run on Firebase's servers no matter what a visitor's browser sends.

---

## 2. Firestore data model

**`users/{uid}`**
```
{ name, email, photoURL, createdAt }
```

**`posts/{postId}`**
```
{
  authorId, authorName, authorPhoto,
  text, imageURL,
  status: "pending" | "approved",
  createdAt, approvedAt
}
```

---

## 3. Firestore security rules

Go to **Firestore Database → Rules** and paste this in, then **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }
    function isAdmin() {
      return isSignedIn() && request.auth.token.email == "bhadouryaakash@gmail.com";
    }

    // Users can read any profile, but only create/edit their own.
    match /users/{userId} {
      allow read: if true;
      allow create, update: if isSignedIn() && request.auth.uid == userId;
      allow delete: if false;
    }

    // Posts: public can read approved posts. Authors can read their own
    // pending post. Admin can read everything. Anyone signed in can create
    // a post, but it must start as "pending" and be attributed to themselves.
    // Only the admin can change status (approve) or delete (reject).
    match /posts/{postId} {
      allow read: if resource.data.status == "approved"
                   || isAdmin()
                   || (isSignedIn() && resource.data.authorId == request.auth.uid);

      allow create: if isSignedIn()
                    && request.resource.data.authorId == request.auth.uid
                    && request.resource.data.status == "pending"
                    && request.resource.data.text is string
                    && request.resource.data.text.size() <= 2000;

      allow update: if isAdmin();   // approving a post
      allow delete: if isAdmin()    // rejecting a post
                    || (isSignedIn() && resource.data.authorId == request.auth.uid
                        && resource.data.status == "pending"); // let users delete their own pending post
    }
  }
}
```

---

## 4. Storage security rules

Go to **Storage → Rules** and paste this in, then **Publish**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{uid}/{fileName} {
      // Anyone can view an image (post images are only linked to from the
      // app once a post is approved, or shown to the author/admin).
      allow read: if true;

      // Only a signed-in user can upload into their own folder, images only, under 5MB.
      allow write: if request.auth != null
                   && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');

      // Only the admin can delete (used when rejecting a post).
      allow delete: if request.auth != null
                    && request.auth.token.email == "bhadouryaakash@gmail.com";
    }
  }
}
```

> Note on image privacy: Storage rules can't easily check a Firestore post's
> `status` field, so images are readable by anyone **with the exact URL**
> (a long, random download URL Firebase generates — not guessable, and never
> shown publicly until the post is approved). This is a reasonable trade-off
> for a small community site. If you need stricter guarantees, move to
> Firebase Cloud Functions that generate signed URLs only for approved posts.

---

## 5. Run it locally

Because these are plain static files, any local server works:

```bash
cd wishwork
python3 -m http.server 8080
# visit http://localhost:8080
```

(Opening `index.html` directly via `file://` can break Google sign-in popups —
use a local server.)

---

## 6. Deploy to GitHub Pages with your custom domain

1. Create a new GitHub repo (e.g. `wishwork`) and push this folder's contents
   to the `main` branch (the `CNAME` file must sit at the repo root).
2. In the repo, go to **Settings → Pages**.
   - Source: **Deploy from a branch**
   - Branch: `main`, folder `/ (root)`
3. Under **Custom domain**, enter `wishwork.online` and save — GitHub will
   pick up the existing `CNAME` file automatically.
4. At your domain registrar, point `wishwork.online` to GitHub Pages:
   - Add these **A records** for the apex domain:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - (Optional) if you also want `www.wishwork.online`, add a **CNAME record**
     pointing `www` → `<your-github-username>.github.io`.
5. Back in **Settings → Pages**, check **Enforce HTTPS** once the certificate
   is issued (can take up to a few hours).
6. Add `wishwork.online` to Firebase **Authentication → Authorized domains**
   (step 1.7 above) or Google sign-in will fail on the live site.

---

## 7. How moderation works

1. A signed-in user writes a post (and optionally attaches an image) and taps
   **Share**. The image, if any, uploads to Storage first; then a Firestore
   doc is created with `status: "pending"`.
2. The author immediately sees a gold **Pending review** badge on their own
   post and a banner at the top of the feed — but no one else can see it yet
   (enforced by the Firestore rule above, not just the UI).
3. Signed in as `bhadouryaakash@gmail.com`, visit `/admin.html`. Every pending
   post appears there with **Approve** / **Reject** buttons.
   - **Approve** sets `status: "approved"` — it instantly appears in
     everyone's live feed via the real-time Firestore listener.
   - **Reject** deletes the Firestore doc (and its Storage image, if any).

---

## 8. Ideas for what to build next

- Comments subcollection (`posts/{id}/comments`) for threaded philosophy debates.
- Likes/reactions with a `posts/{id}/reactions/{uid}` doc per user.
- Email notification (via a Cloud Function) when a post is approved/rejected.
- Reporting/flagging on already-approved posts for ongoing moderation.
- Pagination (`.limit()` + `startAfter()`) once the feed grows large.
