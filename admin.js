/* ==========================================================================
   WISHWORK — admin panel logic
   Gated by Firebase Auth (email/password). Manages the `products` and
   `orders` Firestore collections and uploads product images to Storage.
   Create the admin account manually in the Firebase console —
   Authentication → Users → Add user. There's no public sign-up form here
   on purpose, so random visitors can't create themselves an admin login.
   ========================================================================== */

const auth = firebase.auth();

// ---------- Element refs ----------
const loginWrap = document.getElementById('loginWrap');
const adminShell = document.getElementById('adminShell');
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');
const logoutBtn = document.getElementById('logoutBtn');

const tabButtons = document.querySelectorAll('.admin-tab');
const productsPanel = document.getElementById('productsPanel');
const ordersPanel = document.getElementById('ordersPanel');

const productForm = document.getElementById('productForm');
const productFormTitle = document.getElementById('productFormTitle');
const productFormMsg = document.getElementById('productFormMsg');
const imageInput = document.getElementById('imageInput');
const imagePreviewWrap = document.getElementById('imagePreviewWrap');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const productTableBody = document.getElementById('productTableBody');
const productStatTotal = document.getElementById('productStatTotal');
const productStatOOS = document.getElementById('productStatOOS');

const orderTableBody = document.getElementById('orderTableBody');
const orderStatTotal = document.getElementById('orderStatTotal');
const orderStatPending = document.getElementById('orderStatPending');

let editingId = null;
let selectedFile = null;
let products = [];
let orders = [];

// ---------- Helpers ----------
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
function formatPrice(n) {
  return '₹' + (Number(n) || 0).toLocaleString('en-IN');
}

// ---------- Auth gate ----------
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

// ---------- Tabs ----------
tabButtons.forEach((btn) => btn.addEventListener('click', () => {
  tabButtons.forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  productsPanel.style.display = btn.dataset.tab === 'products' ? 'block' : 'none';
  ordersPanel.style.display = btn.dataset.tab === 'orders' ? 'block' : 'none';
}));

// ---------- Image picker preview ----------
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreviewWrap.innerHTML = `<img src="${e.target.result}" alt=""><span>${escapeHTML(file.name)}</span>`;
  };
  reader.readAsDataURL(file);
});

// ---------- Products: live list ----------
db.collection('products').orderBy('createdAt', 'desc').onSnapshot(
  (snap) => { products = snap.docs.map((d) => ({ id: d.id, ...d.data() })); renderProductTable(); },
  (err) => { console.error(err); productTableBody.innerHTML = `<tr><td colspan="5" class="muted">Couldn't load products. Check your Firebase config.</td></tr>`; }
);

function renderProductTable() {
  productStatTotal.textContent = products.length;
  productStatOOS.textContent = products.filter((p) => p.stock !== undefined && p.stock !== null && Number(p.stock) <= 0).length;

  if (products.length === 0) {
    productTableBody.innerHTML = `<tr><td colspan="5" class="muted" style="text-align:center; padding:30px;">No products yet — add your first one.</td></tr>`;
    return;
  }
  productTableBody.innerHTML = products.map((p) => `
    <tr>
      <td><img class="row-thumb" src="${escapeHTML(p.imageURL || '')}" alt=""></td>
      <td>
        <div style="font-weight:600;">${escapeHTML(p.name || '')}</div>
        <div class="muted">${escapeHTML(p.category || 'General')}</div>
      </td>
      <td>${formatPrice(p.price)}</td>
      <td>${p.stock !== undefined && p.stock !== null ? p.stock : '—'}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline" style="padding:7px 12px; font-size:13px;" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-danger" style="padding:7px 12px; font-size:13px;" data-action="delete" data-id="${p.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

productTableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'edit') startEdit(btn.dataset.id);
  if (btn.dataset.action === 'delete') deleteProduct(btn.dataset.id);
});

function startEdit(id) {
  const p = products.find((pr) => pr.id === id);
  if (!p) return;
  editingId = id;
  selectedFile = null;
  productFormTitle.textContent = 'Edit product';
  // Note: using getElementById here, not productForm.name — the latter
  // resolves to the form's own native `.name` property, not the input.
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pPrice').value = p.price || '';
  document.getElementById('pCategory').value = p.category || '';
  document.getElementById('pStock').value = p.stock ?? '';
  document.getElementById('pDescription').value = p.description || '';
  imagePreviewWrap.innerHTML = p.imageURL
    ? `<img src="${escapeHTML(p.imageURL)}" alt=""><span>Current image — choose a file to replace</span>`
    : '<span>Click to choose an image</span>';
  cancelEditBtn.style.display = 'inline-flex';
  productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  editingId = null;
  selectedFile = null;
  productForm.reset();
  productFormTitle.textContent = 'Add product';
  imagePreviewWrap.innerHTML = '<span>Click to choose an image</span>';
  cancelEditBtn.style.display = 'none';
  productFormMsg.style.display = 'none';
}
cancelEditBtn.addEventListener('click', resetForm);

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  productFormMsg.style.display = 'none';
  const data = new FormData(productForm);
  const name = String(data.get('name') || '').trim();
  const price = Number(data.get('price'));
  const category = String(data.get('category') || '').trim() || 'General';
  const stockRaw = data.get('stock');
  const stock = stockRaw === '' ? null : Number(stockRaw);
  const description = String(data.get('description') || '').trim();

  if (!name || !price || price <= 0) {
    productFormMsg.textContent = 'Please add a name and a valid price.';
    productFormMsg.className = 'form-msg error';
    productFormMsg.style.display = 'block';
    return;
  }
  if (!editingId && !selectedFile) {
    productFormMsg.textContent = 'Please choose an image.';
    productFormMsg.className = 'form-msg error';
    productFormMsg.style.display = 'block';
    return;
  }

  const submitBtn = productForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    let imageURL, imagePath;
    if (selectedFile) {
      const path = `products/${Date.now()}_${selectedFile.name}`;
      const storageRef = storage.ref().child(path);
      const uploadSnap = await storageRef.put(selectedFile);
      imageURL = await uploadSnap.ref.getDownloadURL();
      imagePath = path;
    }

    const payload = { name, price, category, stock, description };
    if (imageURL) { payload.imageURL = imageURL; payload.imagePath = imagePath; }

    if (editingId) {
      const existing = products.find((p) => p.id === editingId);
      await db.collection('products').doc(editingId).update(payload);
      if (imageURL && existing && existing.imagePath && existing.imagePath !== imagePath) {
        storage.ref().child(existing.imagePath).delete().catch(() => {});
      }
    } else {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('products').add(payload);
    }

    resetForm();
    productFormMsg.textContent = 'Saved.';
    productFormMsg.className = 'form-msg success';
    productFormMsg.style.display = 'block';
    setTimeout(() => { productFormMsg.style.display = 'none'; }, 2500);
  } catch (err) {
    console.error(err);
    productFormMsg.textContent = 'Something went wrong saving this product.';
    productFormMsg.className = 'form-msg error';
    productFormMsg.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save product';
  }
});

async function deleteProduct(id) {
  const p = products.find((pr) => pr.id === id);
  if (!p) return;
  if (!confirm(`Delete "${p.name}"? This can't be undone.`)) return;
  try {
    await db.collection('products').doc(id).delete();
    if (p.imagePath) storage.ref().child(p.imagePath).delete().catch(() => {});
    if (editingId === id) resetForm();
  } catch (err) {
    alert("Could not delete this product.");
  }
}

// ---------- Orders: live list ----------
db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(
  (snap) => { orders = snap.docs.map((d) => ({ id: d.id, ...d.data() })); renderOrderTable(); },
  (err) => { console.error(err); orderTableBody.innerHTML = `<tr><td colspan="5" class="muted">Couldn't load orders.</td></tr>`; }
);

function renderOrderTable() {
  orderStatTotal.textContent = orders.length;
  orderStatPending.textContent = orders.filter((o) => o.status === 'pending').length;

  if (orders.length === 0) {
    orderTableBody.innerHTML = `<tr><td colspan="5" class="muted" style="text-align:center; padding:30px;">No orders yet.</td></tr>`;
    return;
  }
  orderTableBody.innerHTML = orders.map((o) => `
    <tr>
      <td>
        <div style="font-weight:600;">${escapeHTML(o.customerName || '')}</div>
        <div class="muted">${escapeHTML(o.customerPhone || '')}</div>
        <div class="muted" style="max-width:170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(o.customerAddress || '')}">${escapeHTML(o.customerAddress || '')}</div>
      </td>
      <td class="order-items-list">${(o.items || []).map((i) => `${escapeHTML(i.name)} × ${i.qty}`).join('<br>')}</td>
      <td>${formatPrice(o.total)}</td>
      <td class="muted">${o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
      <td>
        <select class="status-pill ${o.status || 'pending'}" data-id="${o.id}" data-action="status">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
    </tr>
  `).join('');
}

orderTableBody.addEventListener('change', async (e) => {
  const sel = e.target.closest('[data-action="status"]');
  if (!sel) return;
  sel.className = `status-pill ${sel.value}`;
  try {
    await db.collection('orders').doc(sel.dataset.id).update({ status: sel.value });
  } catch (err) {
    alert('Could not update order status.');
  }
});
