# Wishwork

A store front (browse, search, cart, checkout) plus an admin page for managing
products and orders — no build step, just static files + Firebase.

**Files:** `index.html` (store), `admin.html` (admin panel), `style.css`,
`app.js`, `admin.js`, `firebase-config.js` (your keys go here), `CNAME`
(for the custom domain), `firestore.rules` / `storage.rules` (paste into
the Firebase console — GitHub Pages won't deploy these for you).

---

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it (e.g. `wishwork`) → create.
2. In the left sidebar: **Build → Firestore Database → Create database** → start in **production mode** → pick a region close to India → Enable.
3. **Build → Storage → Get started** → production mode → same region → Done.
4. **Build → Authentication → Get started** → enable the **Email/Password** sign-in method.
5. Still in Authentication, go to the **Users** tab → **Add user** → enter the email and password *you* (the admin) will log in with. There's no public sign-up page on purpose — this is the only way to create an admin login.

## 2. Get your config keys

Project settings (gear icon, top left) → **General** tab → scroll to **Your apps** → click the `</>` (web) icon → register the app (any nickname) → copy the `firebaseConfig` object it shows you.

Open `firebase-config.js` in these files and replace the placeholder values with your real ones:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3. Set the security rules

In Firebase console: **Firestore Database → Rules** tab → delete what's there → paste the contents of `firestore.rules` from this project → **Publish**.

Then: **Storage → Rules** tab → same thing with `storage.rules` → **Publish**.

(These make products and images publicly viewable, but only your signed-in
admin account can add, edit, or delete anything — and only your admin
account can see the order list.)

## 4. Push the files to GitHub

Since your repo is empty, easiest is the GitHub web UI:

1. Open your repo on GitHub → **Add file → Upload files**.
2. Drag in *all* the files in this project (`index.html`, `admin.html`, `style.css`, `app.js`, `admin.js`, `firebase-config.js`, `CNAME`) — keep them at the root of the repo, not in a subfolder.
3. Commit.

(Or, if you're comfortable with git: `git add . && git commit -m "Wishwork store" && git push`.)

## 5. Turn on GitHub Pages

Repo → **Settings → Pages** → under "Build and deployment", Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → **Save**.

GitHub will give you a `https://<yourusername>.github.io/<reponame>/` link — check the site loads there first.

## 6. Connect wishwork.online

Still on **Settings → Pages**: under "Custom domain", type `wishwork.online` → **Save**. (The `CNAME` file you already uploaded does the same thing — this just confirms it in GitHub's settings too.)

Now go to wherever you bought the domain (its DNS settings) and add these records:

| Type | Host/Name | Value |
|---|---|---|
| A | @ (or blank) | 185.199.108.153 |
| A | @ (or blank) | 185.199.109.153 |
| A | @ (or blank) | 185.199.110.153 |
| A | @ (or blank) | 185.199.111.153 |
| CNAME | www | `<yourusername>.github.io` |

DNS changes can take up to a few hours to go live. Once it does, go back to
**Settings → Pages** and tick **Enforce HTTPS** so the site loads securely.

## 7. Try it

- `https://wishwork.online` → the store.
- `https://wishwork.online/admin.html` → sign in with the admin email/password you created in step 1.5, add your first product (image + name + price required), and it appears on the store instantly.

---

### Notes

- **Payment:** checkout currently collects name, phone, and address and
  records the order as "Cash on delivery" — there's no payment gateway
  wired in. Adding one (Razorpay is the common choice in India) means
  business KYC/verification with the provider first, so it's left out of
  this first version on purpose.
- **Cart:** stored in the browser (`localStorage`), so it survives a
  refresh but is per-device.
- Every file here is meant to be viewed as a whole and re-uploaded whole
  when you want changes — there's no build step to run.
