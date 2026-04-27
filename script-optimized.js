/**
 * Utility: Debounce function
 * Reduz chamadas repetidas ao número de pixels necessários
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Utility: Throttle function
 * Garante execução máxima a cada intervalo
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Utility: Lazy load images
 */
function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach((img) => imageObserver.observe(img));
  }
}

/**
 * Utility: Cleanup function para remover listeners
 */
function createEventManager() {
  const listeners = [];

  return {
    on(element, event, handler, options = {}) {
      if (!element) return;
      element.addEventListener(event, handler, options);
      listeners.push({ element, event, handler, options });
    },

    off(element, event, handler) {
      if (!element) return;
      element.removeEventListener(event, handler);
      const index = listeners.findIndex(
        l => l.element === element && l.event === event && l.handler === handler
      );
      if (index > -1) listeners.splice(index, 1);
    },

    cleanup() {
      listeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      listeners.length = 0;
    }
  };
}

/**
 * Main initialization function
 */
function initSite() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const root = document.documentElement;
  const isiOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) || 
                (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

  // Setup motion preferences
  if (prefersReducedMotion || isTouchDevice) {
    document.body.classList.add("motion-reduce");
    root.classList.add("motion-reduce-root");
  }

  // Initialize event manager
  const events = createEventManager();

  // === LOADER ===
  const loader = document.getElementById('loader');
  if (loader) {
    const hideLoader = () => {
      loader.classList.add('loaded');
      loader.addEventListener('transitionend', () => {
        try { loader.remove(); } catch (e) {}
      }, { once: true });
    };

    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader, { once: true });
    }
  }

  // === DOM ELEMENTS ===
  const header = document.querySelector(".site-header");
  const navMenu = document.querySelector(".nav-menu");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = Array.from(document.querySelectorAll("[data-section-id]"));
  const heroSection = document.querySelector(".section--hero");

  // === PAGE PROGRESS BAR ===
  if (!document.querySelector('.page-progress')) {
    const progress = document.createElement('div');
    progress.className = 'page-progress';
    progress.innerHTML = '<div class="page-progress-bar"></div>';
    document.body.prepend(progress);
  }

  // === MOTION SPOTLIGHT (skip on touch/reduced motion) ===
  if (!prefersReducedMotion && !isTouchDevice && !document.querySelector('.motion-spotlight')) {
    const spotlight = document.createElement('div');
    spotlight.className = 'motion-spotlight';
    document.body.appendChild(spotlight);
  }

  // === MOTION STATE (cursor removed) ===
  const motionState = {
    targetScrollY: window.pageYOffset,
    currentScrollY: window.pageYOffset,
  };

  // === 3D TILT (desabilitado em reduced motion e touch) ===
  if (!prefersReducedMotion && !isTouchDevice) {
    const tiltTargets = document.querySelectorAll('.box, .ajuda-card, .localizacao-card, .transparencia-item');
    tiltTargets.forEach((element) => {
      events.on(element, 'pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        const rotateY = (relativeX - 0.5) * 7;
        const rotateX = (0.5 - relativeY) * 7;

        element.style.setProperty('--tilt-rotate-x', `${rotateX.toFixed(2)}deg`);
        element.style.setProperty('--tilt-rotate-y', `${rotateY.toFixed(2)}deg`);
      });

      events.on(element, 'pointerleave', () => {
        element.style.setProperty('--tilt-rotate-x', '0deg');
        element.style.setProperty('--tilt-rotate-y', '0deg');
      });
    });
  }

  // === FADE-UP ANIMATION ===
  const autoRevealSelectors = [
    '.box', '.section-header', '.localizacao-card', '.ajuda-card',
    '.transparencia-item', '.btn-insta', '.hero-actions', '.meta-texto', '.qrcode-area'
  ];

  autoRevealSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (!element.classList.contains('fade-up')) {
        element.classList.add('fade-up');
      }
    });
  });

  const revealElements = document.querySelectorAll('.fade-up');
  revealElements.forEach((element) => {
    const parentSection = element.closest('[data-section-id], .section, .box, main');
    const group = parentSection ? Array.from(parentSection.querySelectorAll('.fade-up')) : [element];
    const index = Math.max(group.indexOf(element), 0);
    const delay = Math.min(index * 85, 420);
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  });

  window.requestAnimationFrame(() => {
    document.body.classList.add('motion-ready');
  });

  // === NAVIGATION ===
  function getHeaderHeight() {
    return header ? header.offsetHeight : 0;
  }

  let lockedScrollY = 0;

  function openMobileMenu() {
    if (!navMenu || !navToggle) return;
    lockedScrollY = window.pageYOffset;
    navMenu.classList.add("nav-menu--open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.classList.add("active");
    document.body.classList.add("menu-open");
    root.classList.add("menu-open-root");

    if (isiOS) {
      document.body.classList.add("is-ios-lock");
      document.body.style.top = `-${lockedScrollY}px`;
    }
  }

  function closeMobileMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove("nav-menu--open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.classList.remove("active");
    document.body.classList.remove("menu-open");
    root.classList.remove("menu-open-root");

    if (isiOS) {
      document.body.classList.remove("is-ios-lock");
      document.body.style.top = "";
      window.scrollTo(0, lockedScrollY);
    }
  }

  function updateScrollState() {
    motionState.targetScrollY = window.pageYOffset;
    const scrollableHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(motionState.targetScrollY / scrollableHeight, 0), 1);
    root.style.setProperty('--scroll-progress', progress.toFixed(4));

    if (header) {
      if (motionState.targetScrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }

  // Mobile menu toggle
  if (navToggle && navMenu) {
    events.on(navToggle, 'click', () => {
      if (navMenu.classList.contains("nav-menu--open")) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    events.on(navMenu, 'click', (event) => {
      const link = event.target.closest(".nav-link");
      if (!link) return;
      closeMobileMenu();
    });

    events.on(document, 'keydown', (event) => {
      if (event.key === "Escape" && navMenu.classList.contains("nav-menu--open")) {
        closeMobileMenu();
      }
    });

    events.on(window, 'resize', debounce(() => {
      if (window.innerWidth > 900) {
        closeMobileMenu();
      }
    }, 250));
  }

  // Scroll event with throttle
  events.on(window, 'scroll', throttle(updateScrollState, 16), { passive: true });
  updateScrollState();

  // === PARALLAX & ANIMATION LOOP ===
  const parallaxEls = document.querySelectorAll('.parallax');

  if (!prefersReducedMotion && !isTouchDevice) {
    const animateMotion = () => {
      motionState.currentScrollY += (motionState.targetScrollY - motionState.currentScrollY) * 0.12;

      root.style.setProperty('--spotlight-x', `${motionState.currentScrollY.toFixed(2)}px`);
      root.style.setProperty('--spotlight-y', `${motionState.currentScrollY.toFixed(2)}px`);
      root.style.setProperty('--section-shift', `${Math.min(motionState.currentScrollY * 0.03, 18).toFixed(2)}px`);

      if (heroSection) {
        heroSection.style.setProperty('--hero-parallax', `${Math.min(motionState.currentScrollY * 0.06, 28).toFixed(2)}px`);
      }

      if (parallaxEls.length) {
        parallaxEls.forEach((el) => {
          el.style.backgroundPositionY = `${(motionState.currentScrollY * 0.18).toFixed(2)}px`;
        });
      }

      window.requestAnimationFrame(animateMotion);
    };

    window.requestAnimationFrame(animateMotion);
  } else {
    root.style.setProperty('--section-shift', '0px');
    root.style.setProperty('--scroll-progress', '0');
    if (heroSection) {
      heroSection.style.setProperty('--hero-parallax', '0px');
    }
  }

  // === INTERSECTION OBSERVER PARA SEÇÕES ===
  let activeSectionId = null;
  let lastScrollY = window.pageYOffset;

  function updateNavActive(id) {
    navLinks.forEach((link) => {
      const target = link.getAttribute("data-section-target");
      const isActive = target === id;
      link.classList.toggle("nav-link--active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function setActiveSection(id, directionHint) {
    const targetSection = id ? document.querySelector(`[data-section-id="${id}"]`) : null;
    if (!targetSection || id === activeSectionId) return;

    const previousSection = activeSectionId ? document.querySelector(`[data-section-id="${activeSectionId}"]`) : null;

    if (previousSection) {
      previousSection.classList.remove("section--active");
      if (directionHint && !prefersReducedMotion) {
        previousSection.classList.add(directionHint === "down" ? "section--leaving-down" : "section--leaving-up");
        window.setTimeout(() => {
          previousSection.classList.remove("section--leaving-down", "section--leaving-up");
        }, 650);
      }
    }

    targetSection.classList.add("section--active");
    activeSectionId = id;
    updateNavActive(id);
  }

  function scrollToSectionId(id) {
    const target = document.querySelector(`[data-section-id="${id}"]`) || document.getElementById(id);
    if (!target) return;

    const headerOffset = getHeaderHeight() + 24;
    const rect = target.getBoundingClientRect();
    const offsetTop = rect.top + window.pageYOffset - headerOffset;

    setActiveSection(id);
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  }

  events.on(document, 'click', (event) => {
    const trigger = event.target.closest("[data-section-target]");
    if (!trigger) return;

    const sectionId = trigger.getAttribute("data-section-target");
    if (!sectionId) return;

    event.preventDefault();
    scrollToSectionId(sectionId);
  });

  if ("IntersectionObserver" in window && sections.length > 0) {
    const headerOffsetForObserver = getHeaderHeight() + 16;
    const observer = new IntersectionObserver(
      (entries) => {
        const currentScrollY = window.pageYOffset;
        const direction = currentScrollY > lastScrollY ? "down" : "up";
        lastScrollY = currentScrollY;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target;
          const id = section.getAttribute("data-section-id");
          if (!id || id === activeSectionId) return;
          setActiveSection(id, direction);
        });
      },
      { threshold: 0.25, rootMargin: `-${headerOffsetForObserver}px 0px 0px 0px` }
    );

    sections.forEach((section) => observer.observe(section));
    const firstSection = sections[0];
    if (firstSection) {
      const firstId = firstSection.getAttribute("data-section-id");
      if (firstId) setActiveSection(firstId);
    }
  }

  // === FADE-UP ELEMENTS ===
  const fadeElems = document.querySelectorAll('.fade-up');
  if (prefersReducedMotion) {
    fadeElems.forEach((element) => element.classList.add('visible'));
  } else if (fadeElems.length && 'IntersectionObserver' in window) {
    const fadeObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -12% 0px' });
    fadeElems.forEach((el) => fadeObs.observe(el));
  } else {
    fadeElems.forEach((element) => element.classList.add('visible'));
  }

  // === DONATION BAR (usando config) ===
  const valorEl = document.querySelector("[data-donation-value]");
  const barra = document.querySelector("[data-donation-progress]");

  if (valorEl && barra && CONFIG) {
    CONFIG.load().then((config) => {
      const meta = config.donation.meta;
      const arrecadado = config.donation.arrecadado;

      const formato = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      });

      valorEl.textContent = formato.format(arrecadado);
      const porcentagem = Math.min((arrecadado / meta) * 100, 100);

      window.setTimeout(() => {
        barra.style.width = `${porcentagem}%`;
        barra.textContent = `${Math.floor(porcentagem)}%`;
      }, 450);
    });
  }

  // === QR CODE PIX (usando config) ===
  const pixTextarea = document.getElementById("pixTexto");
  const pixCopyButton = document.querySelector("[data-pix-copy]");
  const qrcodeEl = document.getElementById("qrcode");

  if (CONFIG && typeof QRCode !== "undefined") {
    CONFIG.load().then((config) => {
      const pixCode = config.donation.pixCode;

      if (qrcodeEl && !qrcodeEl.innerHTML) {
        new QRCode(qrcodeEl, { text: pixCode, width: 200, height: 200 });
      }

      if (pixTextarea) {
        pixTextarea.value = pixCode;
      }

      if (pixCopyButton) {
        events.on(pixCopyButton, 'click', async () => {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(pixCode);
            } else {
              pixTextarea.select();
              document.execCommand("copy");
            }
            
            // Feedback visual using ARIA Live Region
            const feedback = document.getElementById('copy-feedback');
            if (feedback) {
              feedback.textContent = '✅ PIX copiado para clipboard!';
              feedback.classList.add('show');
              
              setTimeout(() => feedback.classList.remove('show'), 3000);
            }
            
            // Button feedback
            const originalText = pixCopyButton.textContent;
            pixCopyButton.textContent = '✓ Copiado!';
            setTimeout(() => {
              pixCopyButton.textContent = originalText;
            }, 2000);
            
          } catch (error) {
            console.error('Erro ao copiar Pix:', error);
            const feedback = document.getElementById('copy-feedback');
            if (feedback) {
              feedback.textContent = '❌ Não foi possível copiar. Selecione manualmente.';
              feedback.classList.add('show');
              setTimeout(() => feedback.classList.remove('show'), 3000);
            }
          }
        });
      }
    });
  }

  // === LAZY LOAD IMAGES ===
  setupLazyLoading();

  // === CLEANUP ON PAGE UNLOAD ===
  events.on(window, 'beforeunload', () => {
    events.cleanup();
  });
}

/* Back to top button */
const backToTopButton = document.getElementById('back-to-top');

if (backToTopButton) {
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add('show');
    } else {
      backToTopButton.classList.remove('show');
    }
  });

  backToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* Newsletter form handling */
const newsletterForm = document.getElementById('newsletter-form');
const formStatus = document.getElementById('form-status');
const emailInput = document.getElementById('newsletter-email');

newsletterForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  
  // Validação básica
  if (!email || !email.includes('@')) {
    formStatus.textContent = '❌ Por favor, use um email válido.';
    formStatus.classList.add('error');
    return;
  }
  
  // Mostrar loading
  formStatus.textContent = '📧 Inscrevendo...';
  formStatus.classList.remove('error');
  
  try {
    // Por agora, simular sucesso
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Sucesso
    formStatus.textContent = '✅ Obrigado! Confira seu email para confirmar.';
    formStatus.classList.remove('error');
    
    // Limpar e resetar
    emailInput.value = '';
    setTimeout(() => {
      formStatus.textContent = '';
      emailInput.focus();
    }, 3000);
    
  } catch (error) {
    console.error('Newsletter error:', error);
    formStatus.textContent = '❌ Erro na inscrição. Tente novamente.';
    formStatus.classList.add('error');
  }
});

// Email validation in real-time
emailInput?.addEventListener('blur', (e) => {
  const email = e.target.value.trim();
  const isValid = email.includes('@') && email.includes('.');
  
  if (email && !isValid) {
    e.target.setAttribute('aria-invalid', 'true');
  } else {
    e.target.removeAttribute('aria-invalid');
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite, { once: true });
} else {
  initSite();
}
