// WISHWORK.online — script.js

// Navbar scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// Mobile menu
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

// Hero search / quick request
function submitHeroRequest() {
  const val = document.getElementById('heroReqInput')?.value.trim();
  if (!val) { document.getElementById('heroReqInput')?.focus(); return; }
  window.location.href = 'book.html?prefill=' + encodeURIComponent(val);
}
document.getElementById('heroReqInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitHeroRequest();
});

function navSearch() {
  const val = document.getElementById('navSearchInput')?.value.trim();
  if (val) window.location.href = 'book.html?prefill=' + encodeURIComponent(val);
}
document.getElementById('navSearchInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') navSearch();
});

// Service Pills
const spills = document.querySelectorAll('.spill');
const selectedInput = document.getElementById('selectedService');
const hireExtra = document.getElementById('hireExtra');

const params = new URLSearchParams(window.location.search);
const preSelect = params.get('service');
const prefill   = params.get('prefill');

if (prefill && document.getElementById('description')) {
  document.getElementById('description').value = prefill;
}

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

// Urgency
const upills = document.querySelectorAll('.upill');
const urgencyInput = document.getElementById('urgency');
upills.forEach(p => {
  p.addEventListener('click', () => {
    upills.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    if (urgencyInput) urgencyInput.value = p.dataset.u;
  });
});

// Submit
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

  console.log('WISHWORK request:', request);
  // → Replace with Firebase addDoc() when ready

  document.getElementById('formCard')?.style.setProperty('display','none');
  document.querySelector('.form-block-wrap')?.style.setProperty('display','none');
  const s = document.getElementById('successState');
  const r = document.getElementById('successRef');
  if (s) s.classList.add('show');
  if (r) r.textContent = 'Your Reference: ' + request.id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  el.focus();
}

// Scroll reveal
const toReveal = document.querySelectorAll('.svc-card, .step-card, .wmc, .pb-card, .aside-card');
const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 60);
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.07 });
toReveal.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  obs.observe(el);
});
