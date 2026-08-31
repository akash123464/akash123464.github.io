# Wishwork — setup guide

*Helping people make Earth a good place — through mutual help, kindness, and shared philosophy.*

## What's here

| File | Purpose |
|---|---|
| `index.html` | Feed + Messages — readable by anyone, even signed out |
| `login.html` | Log in / sign up (email+password and Google) |
| `admin.html` | Dashboard locked to `bhadouryaakash@gmail.com` |
| `style.css` | The whole design system |
| `app.js` | Firebase auth, feed, chat, admin logic |
| `firestore.rules` | Server-side security rules — **deploy this, it's not optional** |
| `storage.rules` | Security rules for verification photos — **deploy this too** |

Chat lives inside `index.html` as a "Messages" tab rather than its own file, since that's the file structure you first asked for. Easy to split out later if you'd rather have `messages.html`.

## Step by step: getting it live

Follow these in order. If you already did some of this in an earlier round, skip ahead — nothing here will break what's already set up.

**1. Create the Firebase project**
- [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it (e.g. "Wishwork").

**2. Turn on Authentication**
- **Build → Authentication → Get started** → enable **Email/Password** → enable **Google**.

**3. Turn on Firestore**
- **Build → Firestore Database → Create database** → production mode → pick a region near your users.

**4. Turn on Storage**
- **Build → Storage → Get started** → default settings are fine. This is only used for the private verification photos people can optionally attach at signup.

**5. Register your web app and grab the config**
- **Project settings (gear icon) → General → Your apps → Web (`</>`)** → register (nickname anything, skip hosting setup) → copy the `firebaseConfig` object it shows you.

**6. Paste your config into `app.js`**
- Near the top of the file:
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
- Replace with your real values from step 5. This isn't a secret — it's meant to be public in client code. It just tells the browser which Firebase project to talk to; actual access control happens in the rules files, not here.

**7. Deploy both rules files — don't skip this**
- **Firestore Database → Rules** → delete what's there → paste in everything from `firestore.rules` → **Publish**.
- **Storage → Rules** → same thing with `storage.rules` → **Publish**.
- Without this, anyone could grant themselves admin, approve their own application or post, un-ban themselves, or read someone else's verification photo directly through the Firebase APIs — the checks in `app.js` only hide buttons and show messages in the browser, they don't stop requests at the source. These two files are what actually enforce every rule described below.

**8. Authorize your domain**
- **Authentication → Settings → Authorized domains → Add domain** → add `wishwork.online`. Make sure `localhost` is also listed (it usually is by default) so Google sign-in works while testing locally.
- This is the single most common gotcha with a custom domain — skip it and Google sign-in fails with `auth/unauthorized-domain`.

**9. Test it locally**
- Firebase's auth popup and ES module imports both need a real server — opening `index.html` straight from disk (`file://`) won't work.
  ```bash
  npx serve .
  # or: python3 -m http.server 8000
  ```
- Visit the printed `localhost` URL. Try it both signed out (guest) and signed in.

**10. Push to GitHub Pages**
- Your `CNAME` file with `wishwork.online` is already set up:
  ```bash
  git add .
  git commit -m "Wishwork update"
  git push
  ```
- In the repo: **Settings → Pages** → set the source branch → save. Once GitHub's SSL cert issues for the custom domain (minutes to a few hours), enable **Enforce HTTPS**. At your domain registrar, confirm DNS points at GitHub Pages — their custom-domain docs list the exact records if this isn't done yet.

## Using the admin panel

Sign in with `bhadouryaakash@gmail.com` (auto-approved, no application needed) and open `admin.html`.

**Applications tab** (default view) — everyone who signs up answers a reflection question and can optionally attach a photo for your eyes only. Each card shows their name, email, full answer, and photo. **Approve** unlocks their account (posting, liking, commenting, messaging); **Reject** leaves it locked. Filter pills switch between Pending / Approved / Rejected. Someone actively on the site when you approve them sees it unlock live, with a toast — no refresh needed on their end.

**Posts tab** — every new post also starts pending, separately from its author's own approval. Review the full text and **Approve** (goes live in the public feed) or **Reject** (stays hidden from everyone but the author). Delete is always available regardless of status. Filter pills: Pending / Approved / Rejected / All. Worth knowing: this means *every single post* needs a manual approval, which is real ongoing work as the community grows — say the word if you'd rather auto-approve posts from members who've been active a while, and I'll add that.

**Users tab** — everyone who's signed up, with their approval status and a Ban / Unban toggle. A banned account can't post, like, comment, or message even if previously approved.

The four stat cards at the top (pending applications, pending posts, total members, total posts) update live so you can see at a glance what needs attention.

## Guest browsing

`index.html` no longer requires logging in. A signed-out visitor sees the full public feed (approved posts, comments, member count) and a "Log in" button in place of the usual avatar menu. Trying to post, like, comment, or message shows a short prompt to log in instead of failing silently. Messaging and the admin panel still require an account either way, obviously.

## How the pieces fit together

- **Posts** live in a `posts` collection: `authorId`, `text`, `category`, `status` (`pending`/`approved`/`rejected`), `likeCount`/`likedBy`, `commentCount`. Comments are a subcollection per post.
- **Users** have their own `status` too — separate from any individual post's status — controlling whether they can contribute at all.
- **Conversations** use a deterministic ID (both users' UIDs, sorted and joined) so two people never accidentally get two separate DM threads. Messages are a subcollection per conversation.
- **Admin access** is checked against `request.auth.token.email` — the *verified* email on the signed-in user's Firebase ID token — never against anything the client sends. Approval works the same way: `status` fields live on the documents, but only an admin write can change them.
- Avatars use each person's Google photo when available, otherwise a colored circle with their initials. The one place Storage is used is the private verification photo at signup — never a public avatar.

## Known v1 simplifications (good next steps)

- Every post needs individual admin approval — no auto-approval tier yet for trusted/veteran members.
- The feed re-renders in full on every update rather than patching individual posts — fine at moderate scale.
- No profile editing page beyond what sign-up collects.
- No push notifications for new messages, likes, or moderation decisions.
- No pagination (currently loads the most recent 50 posts).
- No re-apply flow for a rejected application or post beyond you manually moving it back to pending.

Happy to build out any of these next — just say which.
