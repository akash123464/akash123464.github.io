/* ==========================================================================
   WISHWORK — bulk product import
   Writes window.SEED_PRODUCTS (from products-data.js) into the `products`
   Firestore collection, chunked into batches of 400 writes (Firestore's
   batch limit is 500; 400 leaves headroom). Gated by the same admin auth
   as admin.js — only a signed-in admin can run this, matching firestore.rules.
   ========================================================================== */

const auth = firebase.auth();

const loginWrap = document.getElementById('loginWrap');
const adminShell = document.getElementById('adminShell');
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');
const logoutBtn = document.getElementById('logoutBtn');
const importBtn = document.getElementById('importBtn');
const importMsg = document.getElementById('importMsg');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const countLabel = document.getElementById('countLabel');

const SEED = window.SEED_PRODUCTS || [];
countLabel.textContent = SEED.length;

auth.onAuthStateChanged((user) => {
  loginWrap.style.display = user ? 'none' : 'flex';
  adminShell.style.display = user ? 'block' : 'none';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMsg.style.display = 'none';
  const data = new FormData(loginForm);
  const btn = loginForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    await auth.signInWithEmailAndPassword(data.get('email'), data.get('password'));
  } catch (err) {
    loginMsg.textContent = 'Incorrect email or password.';
    loginMsg.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});
logoutBtn.addEventListener('click', () => auth.signOut());

function showMsg(text, kind) {
  importMsg.textContent = text;
  importMsg.className = `form-msg ${kind}`;
  importMsg.style.display = 'block';
}

importBtn.addEventListener('click', async () => {
  if (!SEED.length) {
    showMsg('No seed data found — make sure products-data.js is uploaded alongside this page.', 'error');
    return;
  }
  if (!confirm(`Add ${SEED.length} products to your store now?`)) return;

  importBtn.disabled = true;
  importBtn.textContent = 'Importing…';
  progressWrap.style.display = 'block';
  importMsg.style.display = 'none';

  const CHUNK = 400;
  let done = 0;
  try {
    for (let i = 0; i < SEED.length; i += CHUNK) {
      const chunk = SEED.slice(i, i + CHUNK);
      const batch = db.batch();
      chunk.forEach((p) => {
        const ref = db.collection('products').doc();
        batch.set(ref, {
          name: p.name,
          price: p.price,
          category: p.category,
          stock: p.stock,
          description: p.description,
          imageURL: p.imageURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      done += chunk.length;
      const pct = Math.round((done / SEED.length) * 100);
      progressBar.style.width = pct + '%';
      progressText.textContent = `${done} / ${SEED.length}`;
    }
    showMsg(`Done — ${done} products added. Check the storefront or Products tab.`, 'success');
  } catch (err) {
    console.error(err);
    showMsg('Something went wrong partway through. Products already added are safe — check the Products tab, then try again to add the rest.', 'error');
  } finally {
    importBtn.disabled = false;
    importBtn.textContent = 'Import 500 products';
  }
});
