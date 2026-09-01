/* ============================================================
   EverAfter Wedding Planner — Shared JavaScript
   ============================================================ */

import { GOOGLE_SCRIPT_URL } from './config.js';
import './chatbot.js';

/* ----- Contact / Appointment form submission (Google Sheets) -----
   Sends form data to the Google Apps Script Web App configured in
   config.js, which appends it to a Google Sheet and emails the
   site owner. Used by the inline submit handlers in contact.html
   and appointment.html.

   NOTE: the request is sent with a `text/plain` Content-Type on
   purpose (even though the body is JSON). Apps Script Web Apps
   don't handle CORS preflight requests, and `text/plain` is a
   "simple request" that browsers send without a preflight. The
   Apps Script code parses the JSON body regardless of the header. */
window.everafterSubmitForm = async function everafterSubmitForm(type, payload) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR')) {
    throw new Error('The Google Apps Script URL has not been configured yet (see config.js).');
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ type, ...payload })
  });

  if (!response.ok) {
    throw new Error('Server responded with status ' + response.status);
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Received an unexpected response from the server.');
  }

  if (!data || data.result !== 'success') {
    throw new Error((data && data.message) || 'The server reported an error.');
  }

  return data;
};

/* ----- Page loader ----- */
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 500);
  }
});

/* ----- Dark mode toggle ----- */
(function initTheme() {
  const saved = localStorage.getItem('everafter-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('everafter-theme', next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = isDark ? '☀' : '☾';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  /* ----- Navbar scroll state ----- */
  const navbar = document.querySelector('.navbar-custom');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ----- Set active nav link ----- */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path) link.classList.add('active');
  });

  /* ----- Scroll to top ----- */
  const scrollBtn = document.getElementById('scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ----- Reveal on scroll ----- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  /* ----- Animated counters ----- */
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.counter, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString() + suffix;
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  /* ----- Footer year ----- */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
