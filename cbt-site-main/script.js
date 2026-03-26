function initSite() {
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

  /* custom cursor */
  const cursor = document.body;
  document.addEventListener('mousemove', (e) => {
    document.body.style.setProperty('--cursor-x', e.clientX + 'px');
    document.body.style.setProperty('--cursor-y', e.clientY + 'px');
  });


  function getHeaderHeight() {
    return header ? header.offsetHeight : 0;
  }

  /* ===== MENU MOBILE ===== */
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("nav-menu--open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.classList.toggle('active', isOpen);
    });

    navMenu.addEventListener("click", (event) => {
      const link = event.target.closest(".nav-link");
      if (!link) return;
      navMenu.classList.remove("nav-menu--open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  }

  /* header transparency on scroll */
  if (header) {
    const toggleHeader = () => {
      if (window.pageYOffset > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', toggleHeader);
    toggleHeader();
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
  if (fadeElems.length && 'IntersectionObserver' in window) {
    const fadeObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    fadeElems.forEach((el) => fadeObs.observe(el));
  }

  /* parallax backgrounds */
  const parallaxEls = document.querySelectorAll('.parallax');
  if (parallaxEls.length) {
    window.addEventListener('scroll', () => {
      const scroll = window.pageYOffset;
      parallaxEls.forEach((el) => {
        el.style.backgroundPositionY = `${scroll * 0.5}px`;
      });
    });
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

  /* ===== BARRA DE PROGRESSO DE SCROLL ===== */
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  document.body.prepend(progressBar);
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
  }, { passive: true });

  /* ===== SPOTLIGHT DO CURSOR ===== */
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const spotlight = document.createElement('div');
  spotlight.id = 'spotlight';
  document.body.appendChild(spotlight);
  if (!isTouch) {
    document.addEventListener('mousemove', (e) => {
      spotlight.style.left = e.clientX + 'px';
      spotlight.style.top  = e.clientY + 'px';
    }, { passive: true });
  }

  /* ===== SCROLL REVEAL ===== */
  const revealMap = [
    { sel: '.eyebrow',          anim: 'up'    },
    { sel: 'h2',                anim: 'up'    },
    { sel: '.section-lead',     anim: 'up'    },
    { sel: '.content-text',     anim: 'left'  },
    { sel: '.ajuda-card',       anim: 'scale' },
    { sel: '.box',              anim: 'scale' },
    { sel: '.localizacao-card', anim: 'up'    },
  ];
  revealMap.forEach(({ sel, anim }) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.closest('.section--hero')) return;
      if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', anim);
    });
  });
  document.querySelectorAll('.ajuda-card').forEach((el, i) => {
    el.setAttribute('data-delay', String(Math.min(i + 1, 6)));
  });
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));
  }

  /* ===== ANIMAÇÃO PALAVRA POR PALAVRA NO H1 DO HERO ===== */
  const heroH1 = document.querySelector('.section--hero h1');
  if (heroH1) {
    const words = heroH1.textContent.trim().split(/\s+/);
    heroH1.innerHTML = words.map((w, i) =>
      `<span class="word" style="animation-delay:${0.3 + i * 0.12}s">${w}</span>`
    ).join(' ');
    heroH1.classList.add('word-animate');
  }

  /* ===== MAGNETIC BUTTONS ===== */
  if (!isTouch) {
    document.querySelectorAll('.btn-primary, .btn-ghost').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top  - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite, { once: true });
} else {
  initSite();
}