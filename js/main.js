/* =========================================================
   NeuroLearn IA — Landing Page
   - Menú móvil
   - 5 eventos personalizados para Google Tag Manager (dataLayer)
   - Evento generate_lead escuchado desde el embed nativo de HubSpot
   ========================================================= */

window.dataLayer = window.dataLayer || [];

/** Envía un evento al dataLayer para que GTM lo capture. */
function trackEvent(eventName, params = {}) {
  window.dataLayer.push({ event: eventName, ...params });
}

/* ---------- Menú móvil ---------- */
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');

menuToggle.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

menu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

/* =========================================================
   EVENTO 1: cta_click — clic en cualquier botón con data-cta
   ========================================================= */
document.querySelectorAll('[data-cta]').forEach((el) => {
  el.addEventListener('click', () => {
    trackEvent('cta_click', {
      cta_name: el.dataset.cta,
      cta_location: el.dataset.ctaLocation || 'sin_ubicacion'
    });
  });
});

/* =========================================================
   EVENTO 2: nav_click — clic en enlaces del menú y del footer
   ========================================================= */
document.querySelectorAll('[data-nav]').forEach((el) => {
  el.addEventListener('click', () => {
    trackEvent('nav_click', { nav_section: el.dataset.nav });
  });
});

/* =========================================================
   EVENTO 3: faq_open — se abre una pregunta frecuente
   ========================================================= */
document.querySelectorAll('.faq details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      trackEvent('faq_open', { faq_question: item.dataset.faq });
    }
  });
});

/* =========================================================
   EVENTO 4: scroll_depth — el usuario alcanza 50 % y 90 % de la página
   (cada umbral se envía una sola vez por visita)
   ========================================================= */
const scrollMarks = [50, 90];
const sentMarks = new Set();
let ticking = false;

function checkScroll() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return;
  const percent = (window.scrollY / scrollable) * 100;

  scrollMarks.forEach((mark) => {
    if (percent >= mark && !sentMarks.has(mark)) {
      sentMarks.add(mark);
      trackEvent('scroll_depth', { scroll_percent: mark });
    }
  });
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(checkScroll);
    ticking = true;
  }
}, { passive: true });

/* =========================================================
   EVENTO 5: generate_lead — formulario de HubSpot enviado con éxito
   HubSpot emite un postMessage con type 'hsFormCallback'
   y eventName 'onFormSubmitted' cuando el envío es exitoso.
   ========================================================= */
window.addEventListener('message', (event) => {
  if (
    event.data &&
    event.data.type === 'hsFormCallback' &&
    event.data.eventName === 'onFormSubmitted'
  ) {
    trackEvent('generate_lead', {
      form_name: 'solicitud_demo'
    });
  }
});