/* =========================================================
   NeuroLearn IA — Landing Page
   - Menú móvil
   - 5 eventos personalizados para Google Tag Manager (dataLayer)
   - Envío del formulario a HubSpot (Forms API v3)
   ========================================================= */

/* ---------- CONFIGURACIÓN DE HUBSPOT ----------
   portalId: ID de tu cuenta (Hub ID), visible en el menú de tu cuenta HubSpot.
   formId:   ID del formulario (aparece en la URL del editor o en el código de inserción). */
const HUBSPOT = {
  portalId: '52179079',
  formId: '4535c23b-bc09-4ab0-a686-3091ec2bccc1'
};

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
   EVENTO 5: generate_lead — formulario enviado con éxito a HubSpot
   ========================================================= */
const form = document.getElementById('leadForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

/** Lee la cookie de seguimiento de HubSpot (si existe) para asociar la visita. */
function getHubspotCookie() {
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? match[1] : undefined;
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = 'form__status ' + (type || '');
}

function validateForm() {
  let valid = true;
  form.querySelectorAll('[required]').forEach((field) => {
    const ok = field.type === 'checkbox' ? field.checked : field.checkValidity();
    field.classList.toggle('is-invalid', !ok);
    if (!ok) valid = false;
  });
  return valid;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    setStatus('Revisa los campos marcados en rojo.', 'error');
    return;
  }

  const data = new FormData(form);
  const fieldNames = ['firstname', 'lastname', 'email', 'company', 'jobtitle', 'message'];

  const payload = {
    fields: fieldNames
      .filter((name) => data.get(name))
      .map((name) => ({ objectTypeId: '0-1', name, value: data.get(name) })),
    context: {
      pageUri: window.location.href,
      pageName: document.title
    }
  };

  const hutk = getHubspotCookie();
  if (hutk) payload.context.hutk = hutk;

  submitBtn.disabled = true;
  setStatus('Enviando...', '');

  try {
    const response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT.portalId}/${HUBSPOT.formId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('HubSpot respondió con error:', response.status, detail);
      throw new Error('HubSpot error ' + response.status);
    }

    // Solo se envía el evento si HubSpot confirmó el registro (sin datos personales).
    trackEvent('generate_lead', {
      form_name: 'solicitud_demo',
      lead_role: data.get('jobtitle')
    });

    form.reset();
    setStatus('¡Gracias! Recibimos tu solicitud y te contactaremos pronto.', 'ok');
  } catch (err) {
    setStatus('No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});