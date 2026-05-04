function initSite() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const root = document.documentElement;
  const isiOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  if (prefersReducedMotion || isTouchDevice) {
    document.body.classList.add("motion-reduce");
    root.classList.add("motion-reduce-root");
  }

  /* loader */
  const loader = document.getElementById('loader');
  if (loader) {
    const hideLoader = () => {
      loader.classList.add('loaded');
      loader.addEventListener('transitionend', () => loader.remove());
    };

    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader, { once: true });
    }
  }

  const header = document.querySelector(".site-header");
  const navMenu = document.querySelector(".nav-menu");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = Array.from(document.querySelectorAll("[data-section-id]"));
  const heroSection = document.querySelector(".section--hero");

  if (!document.querySelector('.page-progress')) {
    const progress = document.createElement('div');
    progress.className = 'page-progress';
    progress.innerHTML = '<div class="page-progress-bar"></div>';
    document.body.prepend(progress);
  }

  if (!prefersReducedMotion && !isTouchDevice && !document.querySelector('.motion-spotlight')) {
    const spotlight = document.createElement('div');
    spotlight.className = 'motion-spotlight';
    document.body.appendChild(spotlight);
  }

  /* custom cursor */
  const motionState = {
    targetCursorX: window.innerWidth / 2,
    targetCursorY: window.innerHeight / 2,
    currentCursorX: window.innerWidth / 2,
    currentCursorY: window.innerHeight / 2,
    targetScrollY: window.pageYOffset,
    currentScrollY: window.pageYOffset,
  };

  if (!prefersReducedMotion && !isTouchDevice) {
    document.addEventListener('mousemove', (e) => {
      motionState.targetCursorX = e.clientX;
      motionState.targetCursorY = e.clientY;
    });

    root.style.setProperty('--cursor-render-x', `${motionState.currentCursorX}px`);
    root.style.setProperty('--cursor-render-y', `${motionState.currentCursorY}px`);
  }

  const interactiveElements = document.querySelectorAll('a, button, .btn, .btn-ajuda, .btn-mapa, .btn-insta, .nav-link');
  if (!isTouchDevice) {
    interactiveElements.forEach((element) => {
      element.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
      element.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
    });
  }

  if (!prefersReducedMotion && !isTouchDevice) {
    const tiltTargets = document.querySelectorAll('.box, .ajuda-card, .localizacao-card, .transparencia-item');
    tiltTargets.forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        const rotateY = (relativeX - 0.5) * 7;
        const rotateX = (0.5 - relativeY) * 7;

        element.style.setProperty('--tilt-rotate-x', `${rotateX.toFixed(2)}deg`);
        element.style.setProperty('--tilt-rotate-y', `${rotateY.toFixed(2)}deg`);
      });

      element.addEventListener('pointerleave', () => {
        element.style.setProperty('--tilt-rotate-x', '0deg');
        element.style.setProperty('--tilt-rotate-y', '0deg');
      });
    });
  }

  const autoRevealSelectors = [
    '.box',
    '.section-header',
    '.localizacao-card',
    '.ajuda-card',
    '.transparencia-item',
    '.btn-insta',
    '.hero-actions',
    '.meta-texto',
    '.qrcode-area'
  ];

  autoRevealSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.classList.add('fade-up');
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

  /* ===== MENU MOBILE ===== */
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      if (navMenu.classList.contains("nav-menu--open")) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    navMenu.addEventListener("click", (event) => {
      const link = event.target.closest(".nav-link");
      if (!link) return;
      closeMobileMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navMenu.classList.contains("nav-menu--open")) {
        closeMobileMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        closeMobileMenu();
      }
    });
  }

  /* header transparency on scroll */
  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  const parallaxEls = document.querySelectorAll('.parallax');

  if (!prefersReducedMotion && !isTouchDevice) {
    const animateMotion = () => {
      motionState.currentCursorX += (motionState.targetCursorX - motionState.currentCursorX) * 0.18;
      motionState.currentCursorY += (motionState.targetCursorY - motionState.currentCursorY) * 0.18;
      motionState.currentScrollY += (motionState.targetScrollY - motionState.currentScrollY) * 0.12;

      root.style.setProperty('--cursor-render-x', `${motionState.currentCursorX.toFixed(2)}px`);
      root.style.setProperty('--cursor-render-y', `${motionState.currentCursorY.toFixed(2)}px`);
      root.style.setProperty('--spotlight-x', `${motionState.currentCursorX.toFixed(2)}px`);
      root.style.setProperty('--spotlight-y', `${motionState.currentCursorY.toFixed(2)}px`);
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

  /* ===== INTERSECTION OBSERVER PARA SEÇÕES E MENU ATIVO ===== */
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
    const targetSection = id
      ? document.querySelector(`[data-section-id="${id}"]`)
      : null;
    if (!targetSection || id === activeSectionId) return;

    const previousSection = activeSectionId
      ? document.querySelector(`[data-section-id="${activeSectionId}"]`)
      : null;

    if (previousSection) {
      previousSection.classList.remove("section--active");
      if (directionHint) {
        previousSection.classList.add(
          directionHint === "down" ? "section--leaving-down" : "section--leaving-up"
        );
        window.setTimeout(() => {
          previousSection.classList.remove(
            "section--leaving-down",
            "section--leaving-up"
          );
        }, 650);
      }
    }

    targetSection.classList.add("section--active");
    activeSectionId = id;
    updateNavActive(id);
  }

  /* ===== SCROLL SUAVE COM OFFSET ===== */
  function scrollToSectionId(id) {
    const target =
      document.querySelector(`[data-section-id="${id}"]`) ||
      document.getElementById(id);

    if (!target) return;

    const headerOffset = getHeaderHeight() + 24;
    const rect = target.getBoundingClientRect();
    const offsetTop = rect.top + window.pageYOffset - headerOffset;

    // Garante que o conteúdo fique visível mesmo antes do observer disparar
    setActiveSection(id);

    window.scrollTo({
      top: offsetTop,
      behavior: "smooth",
    });
  }

  document.addEventListener("click", (event) => {
    const directPageLink = event.target.closest('a[href$=".html"], a[href^="/"]');
    if (directPageLink && !directPageLink.hasAttribute('data-section-target')) {
      // Garante navegacao normal entre paginas, sem interceptacao de scroll interno.
      window.location.href = directPageLink.getAttribute('href');
      return;
    }

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
      {
        threshold: 0.25,
        rootMargin: `-${headerOffsetForObserver}px 0px 0px 0px`,
      }
    );

    sections.forEach((section) => observer.observe(section));

    const firstSection = sections[0];
    if (firstSection) {
      const firstId = firstSection.getAttribute("data-section-id");
      if (firstId) {
        setActiveSection(firstId);
      }
    }
  }

  /* reveal fade-up elements */
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
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -12% 0px'
    });
    fadeElems.forEach((el) => fadeObs.observe(el));
  } else {
    fadeElems.forEach((element) => element.classList.add('visible'));
  }

  /* ===== DOAÇÃO / BARRA DE PROGRESSO ===== */
  const meta = 5000;
  const arrecadado = 1850;

  const valorEl = document.querySelector("[data-donation-value]");
  const barra = document.querySelector("[data-donation-progress]");

  if (valorEl && barra) {
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
  }

  /* ===== QR CODE PIX + CÓPIA ===== */
  const pixTextarea = document.getElementById("pixTexto");
  const pixCopyButton = document.querySelector("[data-pix-copy]");
  const qrcodeEl = document.getElementById("qrcode");

  const pixCode =
    "00020126710014BR.GOV.BCB.PIX0114+55619997134370231As trilhas agradecem pela ajuda5204000053039865802BR5921Raniel Mourao de Melo6009SAO PAULO61080540900062160512NUiNnO7MmSjq630419AD";

  if (typeof QRCode !== "undefined" && qrcodeEl) {
    // eslint-disable-next-line no-undef
    new QRCode(qrcodeEl, {
      text: pixCode,
      width: 200,
      height: 200,
    });
  }

  if (pixTextarea) {
    pixTextarea.value = pixCode;
  }

  async function copiarPix() {
    if (!pixTextarea) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pixCode);
      } else {
        pixTextarea.select();
        document.execCommand("copy");
      }
      window.alert("Código Pix copiado.");
    } catch (error) {
      window.alert("Não foi possível copiar o código Pix.");
    }
  }

  if (pixCopyButton) {
    pixCopyButton.addEventListener("click", copiarPix);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite, { once: true });
} else {
  initSite();
}