// ========================
// TASKD — script.js
// ========================

// Mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
}

// ========================
// SERVICE PILLS (book page)
// ========================
const pills = document.querySelectorAll('.pill');
const selectedServiceInput = document.getElementById('selectedService');

// Pre-select from URL param
const urlParams = new URLSearchParams(window.location.search);
const preSelected = urlParams.get('service');

pills.forEach(pill => {
  if (preSelected && pill.dataset.service === preSelected) {
    pill.classList.add('active');
    if (selectedServiceInput) selectedServiceInput.value = preSelected;
  }

  pill.addEventListener('click', () => {
    pills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    if (selectedServiceInput) selectedServiceInput.value = pill.dataset.service;
  });
});

// ========================
// URGENCY PILLS
// ========================
const urgencyPills = document.querySelectorAll('.urgency-pill');
const urgencyInput = document.getElementById('urgency');

urgencyPills.forEach(p => {
  p.addEventListener('click', () => {
    urgencyPills.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    if (urgencyInput) urgencyInput.value = p.dataset.urgency;
  });
});

// ========================
// FORM SUBMISSION
// ========================
function submitRequest() {
  const name        = document.getElementById('name')?.value.trim();
  const phone       = document.getElementById('phone')?.value.trim();
  const description = document.getElementById('description')?.value.trim();
  const location    = document.getElementById('location')?.value.trim();
  const date        = document.getElementById('date')?.value;
  const service     = document.getElementById('selectedService')?.value;
  const urgency     = document.getElementById('urgency')?.value || 'flexible';
  const budget      = document.getElementById('budget')?.value.trim();

  // Basic validation
  if (!name) { alert('Please enter your name.'); return; }
  if (!phone) { alert('Please enter your phone number.'); return; }
  if (!description) { alert('Please describe your task.'); return; }
  if (!location) { alert('Please enter your location.'); return; }

  // Build request object (ready to send to backend later)
  const request = {
    id: 'TASKD-' + Date.now().toString(36).toUpperCase(),
    name,
    phone,
    description,
    location,
    date: date || 'Flexible',
    service: service || 'custom',
    urgency,
    budget: budget || 'Not specified',
    submittedAt: new Date().toISOString()
  };

  console.log('📋 Request submitted:', request);
  // TODO: Replace with Firebase / API call here

  // Show success state
  const form = document.getElementById('bookingForm');
  const success = document.getElementById('successState');
  const ref = document.getElementById('successRef');

  if (form) form.style.display = 'none';
  if (success) success.classList.add('show');
  if (ref) ref.textContent = `Reference ID: ${request.id}`;

  // Hide service pills too
  const formBlock = document.querySelector('.form-block');
  if (formBlock) formBlock.style.display = 'none';
}

// ========================
// SCROLL REVEAL (simple)
// ========================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .step, .side-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
