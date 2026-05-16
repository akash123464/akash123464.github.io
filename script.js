// ========================
// WISHWORK.online — script.js
// ========================

// ── Navbar scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ── Mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
}
function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
}
document.addEventListener('click', (e) => {
  if (mobileMenu && hamburger && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
    mobileMenu.classList.remove('open');
  }
});

// ── Service Pills
const spills = document.querySelectorAll('.spill');
const selectedInput = document.getElementById('selectedService');
const hireExtra = document.getElementById('hireExtra');

const preSelect = new URLSearchParams(window.location.search).get('service');
spills.forEach(pill => {
  if (preSelect && pill.dataset.service === preSelect) {
    pill.classList.add('active');
    if (selectedInput) selectedInput.value = preSelect;
    if (preSelect === 'hire' && hireExtra) hireExtra.classList.add('show');
  }
  pill.addEventListener('click', () => {
    spills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const svc = pill.dataset.service;
    if (selectedInput) selectedInput.value = svc;
    if (hireExtra) hireExtra.classList.toggle('show', svc === 'hire');
  });
});

// ── Urgency Pills
const upills = document.querySelectorAll('.upill');
const urgencyInput = document.getElementById('urgency');
upills.forEach(p => {
  p.addEventListener('click', () => {
    upills.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    if (urgencyInput) urgencyInput.value = p.dataset.u;
  });
});

// ── Submit
function submitRequest() {
  const name        = document.getElementById('name')?.value.trim();
  const phone       = document.getElementById('phone')?.value.trim();
  const description = document.getElementById('description')?.value.trim();
  const location    = document.getElementById('location')?.value.trim();
  const date        = document.getElementById('date')?.value;
  const budget      = document.getElementById('budget')?.value.trim();
  const service     = document.getElementById('selectedService')?.value || 'custom';
  const urgency     = document.getElementById('urgency')?.value || 'flexible';
  const workerSkill = document.getElementById('workerSkill')?.value.trim();
  const duration    = document.getElementById('duration')?.value;

  if (!name)        { shake('name');        return; }
  if (!phone)       { shake('phone');       return; }
  if (!description) { shake('description'); return; }
  if (!location)    { shake('location');    return; }

  const request = {
    id: 'WW-' + Date.now().toString(36).toUpperCase(),
    name, phone, description, location,
    date: date || 'Flexible',
    budget: budget || 'Not specified',
    service, urgency,
    workerSkill: workerSkill || null,
    duration: duration || null,
    submittedAt: new Date().toISOString()
  };

  console.log('📋 WISHWORK request submitted:', request);
  // → Replace console.log with Firebase addDoc() when ready

  const form    = document.getElementById('bookingForm');
  const block   = document.querySelector('.form-block');
  const extra   = document.getElementById('hireExtra');
  const success = document.getElementById('successState');
  const ref     = document.getElementById('successRef');

  if (form)    form.style.display = 'none';
  if (block)   block.style.display = 'none';
  if (extra)   extra.style.display = 'none';
  if (success) success.classList.add('show');
  if (ref)     ref.textContent = 'Your Reference: ' + request.id;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Input shake on validation fail
function shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.35s ease';
  el.focus();
}

// ── Scroll reveal
const toReveal = document.querySelectorAll('.scard, .pstep, .wcard, .aside-card, .ti');
const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 70);
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

toReveal.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  obs.observe(el);
});
