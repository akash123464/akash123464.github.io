# Wishwork — setup guide

*Helping people make Earth a good place — through mutual help, kindness, and shared philosophy.*

## What's here

| File | Purpose |
|---|---|
| `index.html` | Feed + Messages (the main app, after login) |
| `login.html` | Log in / sign up (email+password and Google) |
| `admin.html` | Dashboard locked to `bhadouryaakash@gmail.com` |
| `style.css` | The whole design system |
| `app.js` | Firebase auth, feed, chat, admin logic |
| `firestore.rules` | Server-side security rules — **deploy this, it's not optional** |
| `storage.rules` | Security rules for verification photos — **deploy this too** |

Chat lives inside `index.html` as a "Messages" tab rather than its own file, since that's the 5-file structure you asked for. Easy to split out later if you'd rather have `messages.html`.

## New: applications & approval

Signing up now takes one more step: everyone answers a reflection question ("Why do you think we should work towards making Earth a better place? Do people driven only by greed deserve a better place too?") and can optionally attach a photo, used only for your review — it's never shown on the platform. This applies whether someone signs up with email/password or Google; a brand-new Google sign-in gets routed to a short "one more step" panel to answer before landing in the app.

- New accounts start `status: "pending"`. They can log in and browse the feed, but posting, liking, commenting, and messaging are locked (with an explanation shown in place of each) until you approve them.
- Review answers and photos in **admin.html → Applications** (now the default tab) and click Approve or Reject. Someone actively using the app when you approve them sees it unlock live, with a toast — no refresh needed.
- You (`bhadouryaakash@gmail.com`) are auto-approved and skip the question entirely.
- A couple of judgment calls I made building this: "guest" access means a signed-in-but-not-yet-approved account (not a fully anonymous visitor), and the lock extends to commenting and messaging too, not just posting and liking — since those are the same kind of contribution. Say the word if you pictured either differently.

## 1. Create the Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it (e.g. "Wishwork").
2. **Build → Authentication → Get started.** Enable **Email/Password**, and enable **Google**.
3. **Build → Firestore Database → Create database.** Start in production mode (the rules file below replaces the defaults either way) → pick a region close to your users.
4. **Build → Storage → Get started.** Same idea, for the optional verification photos. Default settings are fine.
5. **Project settings (gear icon) → General → Your apps → Web (`</>`)**. Register an app (nickname anything), skip hosting setup, and copy the `firebaseConfig` object it shows you.

## 2. Plug in your config

Open `app.js` and replace the placeholder near the top:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

with the real values from step 1.5. This object isn't a secret — it's meant to be public in client code. It just tells the browser which Firebase project to talk to; actual access control happens in `firestore.rules`, not here.

## 3. Deploy the security rules

**Firestore Database → Rules** tab in the console → delete what's there → paste in everything from `firestore.rules` → **Publish**. Then **Storage → Rules** → same thing with `storage.rules`.

Without this step, anyone could grant themselves admin, approve their own application, un-ban themselves, edit other people's posts, or read someone else's verification photo directly through the Firebase APIs — the checks in `app.js` only hide buttons and show messages in the browser, they don't stop requests at the source. The rules files are what actually enforce:
- Only `bhadouryaakash@gmail.com` can delete others' posts, ban users, and approve/reject applications.
- A banned or not-yet-approved user's writes are rejected everywhere, server-side — not just hidden in the UI.
- Nobody can hand themselves `isAdmin: true`, `banned: false`, or `status: "approved"` by editing their own user doc.
- A verification photo is only readable by the person who uploaded it and by you.

## 4. Authorize your domain

**Authentication → Settings → Authorized domains → Add domain** → add `wishwork.online`. Also add `localhost` if it isn't already there (it usually is by default), so Google sign-in works while you're testing locally.

This is the single most common gotcha with a custom domain — skip it and Google sign-in fails with `auth/unauthorized-domain`.

## 5. Run it locally

Firebase's auth popup and ES module imports both need a real server — opening `index.html` straight from disk (`file://`) won't work. From this folder:

```bash
npx serve .
# or: python3 -m http.server 8000
```

then visit the printed `localhost` URL.

## 6. Deploy to GitHub Pages

Your `CNAME` file with `wishwork.online` is already set up, so:

```bash
git add .
git commit -m "Wishwork v1"
git push
```

Then in the repo: **Settings → Pages** → set the source branch → save. Once GitHub's SSL cert issues for the custom domain (can take a few minutes to a few hours), enable **Enforce HTTPS**. At your domain registrar, make sure your DNS points at GitHub Pages (A records to GitHub's IPs, or a CNAME record if you're on a subdomain) — GitHub's own custom-domain docs walk through the exact records if you haven't set this part up yet.

## How the pieces fit together

- **Posts** live in a `posts` collection; each has an `authorId`, `text`, `category`, `likeCount`/`likedBy`, and `commentCount`. Comments are a subcollection per post.
- **Conversations** use a deterministic ID (both users' UIDs, sorted and joined) so two people never accidentally get two separate DM threads. Messages are a subcollection per conversation.
- **Admin access** is checked against `request.auth.token.email` — the *verified* email on the signed-in user's Firebase ID token — never against anything the client sends. That's what makes it real security rather than a UI convention. Approval works the same way: `status` lives on the user doc but only an admin write can change it.
- Avatars use each person's Google photo when available, otherwise a colored circle with their initials. The one place Storage is used is the private verification photo at signup — never the public avatar.

## Known v1 simplifications (good next steps)

- The feed re-renders in full on every update rather than patching individual posts — fine at moderate scale, but a candidate to optimize later if the community grows large.
- No profile editing page beyond what sign-up collects.
- No push notifications for new messages, likes, or application decisions.
- No pagination on the feed (currently loads the most recent 50 posts).
- No re-apply flow for a rejected applicant beyond you manually moving them back to pending.

Happy to build out any of these next — just say which.
