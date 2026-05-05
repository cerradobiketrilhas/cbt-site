/**
 * Security-friendly bootstrap:
 * - initializes GA without inline scripts
 * - registers service worker
 * - handles page-specific analytics events
 * - ensures hero video autoplay behavior
 */
(function initSecurityBootstrap() {
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');

  const path = window.location.pathname || '';
  const isDonationPage = path.includes('doacoes');
  const isEventPage = path.includes('inscricao');
  const isConfirmationPage = path.includes('confirmacao');

  if (isDonationPage) {
    gtag('event', 'view_donation_page', {
      page_title: document.title,
      page_location: window.location.href
    });
  } else if (isEventPage) {
    gtag('event', 'view_event_page', {
      page_title: document.title,
      page_location: window.location.href
    });
  } else if (isConfirmationPage) {
    gtag('event', 'payment_complete', {
      page_title: document.title,
      page_location: window.location.href
    });
  } else {
    gtag('event', 'page_view', { page_path: path });
  }

  document.addEventListener('click', function onClick(e) {
    if (e.target.classList.contains('btn-primary') || e.target.closest('.btn-primary')) {
      const target = e.target.closest('.btn-primary') || e.target;
      gtag('event', 'click_primary_button', {
        button_text: (target.textContent || '').trim()
      });
    }
  });

  document.addEventListener('submit', function onSubmit(e) {
    if (e.target && e.target.id === 'contact-form') {
      gtag('event', 'form_submit', { form_name: 'contact' });
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function registerSw() {
      navigator.serviceWorker.register('sw.js').catch(function () {
        // Ignore registration failures in bootstrap.
      });
    }, { once: true });
  }

  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    heroVideo.muted = true;
    const play = function () {
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    };
    heroVideo.addEventListener('loadeddata', play);
    heroVideo.addEventListener('canplay', play);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) play();
    });
    play();
  }
})();
