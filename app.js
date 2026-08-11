/* ==========================================================================
   WISHWORK — storefront logic
   Loads products from Firestore in real time, handles search/filter/sort,
   a cart persisted to localStorage, and checkout (writes an order document).
   No build step — plain script, relies on the Firebase Compat SDK already
   loaded on the page (see firebase-config.js).
   ========================================================================== */

// ---------- State ----------
let products = [];
let cart = [];
try { cart = JSON.parse(localStorage.getItem('wishwork_cart') || '[]'); } catch (e) { cart = []; }
let activeCategory = 'All';
let searchTerm = '';
let sortMode = 'newest';

// ---------- Element refs ----------
const productGrid = document.getElementById('productGrid');
const emptyState = document.getElementById('emptyState');
const chipRow = document.getElementById('chipRow');
const searchInput = document.getElementById('searchInput');

const overlay = document.getElementById('overlay');
const panels = {
  cart: document.getElementById('cartDrawer'),
  detail: document.getElementById('detailModalWrap'),
  checkout: document.getElementById('checkoutModalWrap'),
};

const cartBtn = document.getElementById('cartBtn');
const cartCountEl = document.getElementById('cartCount');
const cartBody = document.getElementById('cartBody');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

const detailBody = document.getElementById('detailBody');

const checkoutForm = document.getElementById('checkoutForm');
const checkoutSummary = document.getElementById('checkoutSummary');
const checkoutTotalEl = document.getElementById('checkoutTotal');
const checkoutFormMsg = document.getElementById('checkoutFormMsg');
const confirmState = document.getElementById('confirmState');

// ---------- Helpers ----------
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
function formatPrice(n) {
  return '₹' + (Number(n) || 0).toLocaleString('en-IN');
}
function priceTagHTML(price, extraClass) {
  return `<span class="price-tag ${extraClass || ''}"><span class="rupee">₹</span>${(Number(price) || 0).toLocaleString('en-IN')}</span>`;
}
function saveCart() {
  localStorage.setItem('wishwork_cart', JSON.stringify(cart));
}

// ---------- Panel management (cart drawer / detail / checkout share one overlay) ----------
function closeAllPanels() {
  Object.values(panels).forEach((p) => p.classList.remove('open'));
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
function openPanel(name) {
  closeAllPanels();
  panels[name].classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
overlay.addEventListener('click', closeAllPanels);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllPanels(); });
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', closeAllPanels));

// ---------- Firestore: load products in real time ----------
db.collection('products').orderBy('createdAt', 'desc').onSnapshot(
  (snapshot) => {
    products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderChips();
    renderProducts();
  },
  (err) => {
    console.error('Failed to load products:', err);
    productGrid.innerHTML = '';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = "Couldn't load products";
    emptyState.querySelector('p').textContent = 'Check your internet connection, or your Firebase config in firebase-config.js.';
  }
);

// ---------- Category chips ----------
function renderChips() {
  const cats = ['All', ...new Set(products.map((p) => p.category || 'General'))];
  chipRow.innerHTML = cats
    .map((c) => `<button class="chip ${c === activeCategory ? 'active' : ''}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`)
    .join('') +
    `<select class="sort-select" id="sortSelect" aria-label="Sort products">
       <option value="newest">Newest first</option>
       <option value="price-asc">Price: low to high</option>
       <option value="price-desc">Price: high to low</option>
     </select>`;
  const sortSelect = document.getElementById('sortSelect');
  sortSelect.value = sortMode;
  sortSelect.addEventListener('change', (e) => { sortMode = e.target.value; renderProducts(); });
}
chipRow.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activeCategory = chip.dataset.cat;
  renderChips();
  renderProducts();
});

// ---------- Search ----------
searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value;
  renderProducts();
});

// ---------- Product grid ----------
function getFilteredSorted() {
  let list = products.slice();
  if (activeCategory !== 'All') list = list.filter((p) => (p.category || 'General') === activeCategory);
  if (searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();
    list = list.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }
  if (sortMode === 'price-asc') list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  else if (sortMode === 'price-desc') list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  return list;
}

function productCardHTML(p) {
  const outOfStock = p.stock !== undefined && p.stock !== null && Number(p.stock) <= 0;
  return `
    <article class="product-card">
      <button class="unstyled" data-action="detail" data-id="${p.id}">
        <div class="product-media">
          ${outOfStock ? '<span class="stock-badge">Out of stock</span>' : ''}
          <img src="${escapeHTML(p.imageURL || '')}" alt="${escapeHTML(p.name || '')}" loading="lazy">
        </div>
      </button>
      <div class="product-info">
        <span class="product-category">${escapeHTML(p.category || 'General')}</span>
        <button class="unstyled product-name" data-action="detail" data-id="${p.id}">${escapeHTML(p.name || 'Untitled')}</button>
        <div class="product-foot">
          ${priceTagHTML(p.price)}
          <button class="btn btn-primary" data-action="add" data-id="${p.id}" ${outOfStock ? 'disabled' : ''}>Add</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const list = getFilteredSorted();
  const resultCount = document.getElementById('resultCount');
  if (resultCount) resultCount.textContent = products.length ? `${list.length} item${list.length === 1 ? '' : 's'}` : '';
  if (list.length === 0) {
    productGrid.innerHTML = '';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = products.length === 0 ? 'No products yet' : 'Nothing matches';
    emptyState.querySelector('p').textContent = products.length === 0
      ? 'Add your first product from the admin page.'
      : 'Try a different search or category.';
    return;
  }
  emptyState.style.display = 'none';
  productGrid.innerHTML = list.map(productCardHTML).join('');
}

productGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'detail') openDetail(id);
  if (btn.dataset.action === 'add') addToCart(id, 1);
});

// ---------- Product detail ----------
function openDetail(id) {
  const p = products.find((pr) => pr.id === id);
  if (!p) return;
  const outOfStock = p.stock !== undefined && p.stock !== null && Number(p.stock) <= 0;
  detailBody.innerHTML = `
    <div class="detail-media"><img src="${escapeHTML(p.imageURL || '')}" alt="${escapeHTML(p.name || '')}"></div>
    <span class="product-category">${escapeHTML(p.category || 'General')}</span>
    <h2 style="margin-top:6px;">${escapeHTML(p.name || 'Untitled')}</h2>
    <p class="detail-desc">${escapeHTML(p.description || 'No description provided.')}</p>
    <div class="detail-actions">
      ${priceTagHTML(p.price, 'lg')}
      <button class="btn btn-primary" id="detailAddBtn" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of stock' : 'Add to cart'}</button>
    </div>
  `;
  const addBtn = document.getElementById('detailAddBtn');
  if (addBtn) addBtn.addEventListener('click', () => { addToCart(p.id, 1); openPanel('cart'); });
  openPanel('detail');
}

// ---------- Cart ----------
function cartLines() {
  return cart
    .map((item) => {
      const p = products.find((pr) => pr.id === item.id);
      return p ? { ...p, qty: item.qty } : null;
    })
    .filter(Boolean);
}
function cartTotal() {
  return cartLines().reduce((sum, l) => sum + (Number(l.price) || 0) * l.qty, 0);
}
function addToCart(id, qty) {
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  saveCart();
  updateCartUI();
  cartCountEl.classList.remove('bump');
  void cartCountEl.offsetWidth;
  cartCountEl.classList.add('bump');
}
function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCartUI();
}
function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCartUI();
}
function updateCartUI() {
  const lines = cartLines();
  const count = lines.reduce((s, l) => s + l.qty, 0);
  cartCountEl.textContent = count;
  cartCountEl.style.display = count > 0 ? 'flex' : 'none';

  cartBody.innerHTML = lines.length === 0
    ? '<p class="muted" style="padding:36px 0; text-align:center;">Your cart is empty.</p>'
    : lines.map((l) => `
        <div class="cart-item">
          <img src="${escapeHTML(l.imageURL || '')}" alt="">
          <div class="cart-item-info">
            <span class="name">${escapeHTML(l.name || '')}</span>
            ${priceTagHTML(l.price)}
            <div class="qty-row">
              <button class="qty-btn" data-action="dec" data-id="${l.id}" aria-label="Decrease quantity">−</button>
              <span class="qty-val">${l.qty}</span>
              <button class="qty-btn" data-action="inc" data-id="${l.id}" aria-label="Increase quantity">+</button>
              <button class="remove-link" data-action="remove" data-id="${l.id}">Remove</button>
            </div>
          </div>
        </div>
      `).join('');

  cartTotalEl.textContent = formatPrice(cartTotal());
  checkoutBtn.disabled = lines.length === 0;
}
cartBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'inc') changeQty(id, 1);
  if (btn.dataset.action === 'dec') changeQty(id, -1);
  if (btn.dataset.action === 'remove') removeFromCart(id);
});
cartBtn.addEventListener('click', () => openPanel('cart'));

// ---------- Checkout ----------
checkoutBtn.addEventListener('click', () => {
  if (cartLines().length === 0) return;
  checkoutFormMsg.style.display = 'none';
  checkoutForm.reset();
  checkoutForm.style.display = 'flex';
  confirmState.style.display = 'none';
  checkoutSummary.innerHTML = cartLines().map((l) => `
    <div style="display:flex; justify-content:space-between; font-size:13.5px; padding:4px 0; color:var(--ink-soft);">
      <span>${escapeHTML(l.name)} × ${l.qty}</span><span>${formatPrice((Number(l.price) || 0) * l.qty)}</span>
    </div>`).join('');
  checkoutTotalEl.textContent = formatPrice(cartTotal());
  openPanel('checkout');
});

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = checkoutForm.querySelector('button[type="submit"]');
  const lines = cartLines();
  if (lines.length === 0) return;

  const data = new FormData(checkoutForm);
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const address = String(data.get('address') || '').trim();
  if (!name || !phone || !address) {
    checkoutFormMsg.textContent = 'Please fill in all fields.';
    checkoutFormMsg.className = 'form-msg error';
    checkoutFormMsg.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing order…';

  const order = {
    items: lines.map((l) => ({ productId: l.id, name: l.name || '', price: Number(l.price) || 0, qty: l.qty })),
    total: cartTotal(),
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection('orders').add(order);
    cart = [];
    saveCart();
    updateCartUI();
    checkoutForm.style.display = 'none';
    confirmState.style.display = 'block';
  } catch (err) {
    console.error('Order failed:', err);
    checkoutFormMsg.textContent = 'Could not place your order. Please try again.';
    checkoutFormMsg.className = 'form-msg error';
    checkoutFormMsg.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place order';
  }
});

// ---------- Init ----------
updateCartUI();
