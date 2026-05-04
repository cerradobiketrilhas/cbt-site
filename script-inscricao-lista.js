/**
 * Lista pública de inscritos na página inscricao.html (agrupada por categoria).
 */

(function () {
  async function getListApiUrl() {
    if (typeof CONFIG !== 'undefined' && typeof CONFIG.load === 'function') {
      try {
        const cfg = await CONFIG.load();
        const base = cfg && cfg.apiBaseUrl && String(cfg.apiBaseUrl).trim();
        if (base) {
          return `${base.replace(/\/$/, '')}/api/list-inscriptions`;
        }
      } catch (_) {
        /* ignora */
      }
    }
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://cbt-site.vercel.app/api/list-inscriptions';
    }
    return '/api/list-inscriptions';
  }

  function renderEmpty(container, message) {
    const p = document.createElement('p');
    p.className = 'inscricao-lista__empty';
    p.textContent = message;
    container.innerHTML = '';
    container.appendChild(p);
    container.hidden = false;
  }

  function renderList(container, data) {
    const { grupos, total } = data;
    container.innerHTML = '';
    if (!grupos || grupos.length === 0 || total === 0) {
      renderEmpty(
        container,
        'Ainda não há inscritos confirmados. Seja o primeiro a se inscrever.'
      );
      return;
    }

    const intro = document.createElement('p');
    intro.className = 'inscricao-lista__total';
    intro.textContent =
      total === 1
        ? '1 inscrição confirmada.'
        : `${total} inscrições confirmadas.`;

    const wrap = document.createElement('div');
    wrap.className = 'inscricao-lista__grupos';

    for (const g of grupos) {
      if (!g.nomes || g.nomes.length === 0) continue;

      const section = document.createElement('section');
      section.className = 'inscricao-lista__grupo';
      section.setAttribute('aria-label', `Categoria ${g.categoria}`);

      const h3 = document.createElement('h3');
      h3.className = 'inscricao-lista__grupo-titulo';
      h3.textContent = g.categoria;

      const ul = document.createElement('ul');
      ul.className = 'inscricao-lista__nomes';
      for (const nome of g.nomes) {
        const li = document.createElement('li');
        li.textContent = nome;
        ul.appendChild(li);
      }

      section.appendChild(h3);
      section.appendChild(ul);
      wrap.appendChild(section);
    }

    container.appendChild(intro);
    container.appendChild(wrap);
    container.hidden = false;
  }

  async function init() {
    const statusEl = document.getElementById('lista-inscritos-status');
    const conteudo = document.getElementById('lista-inscritos-conteudo');
    if (!conteudo) return;

    if (statusEl) {
      statusEl.textContent = 'Carregando lista de inscritos…';
    }

    try {
      const url = await getListApiUrl();
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      const payload = await res.json().catch(() => ({}));

      if (statusEl) {
        statusEl.textContent = '';
      }

      if (!res.ok || !payload.success) {
        const msg =
          payload.error || `Não foi possível carregar a lista (erro ${res.status}).`;
        renderEmpty(conteudo, msg);
        return;
      }

      renderList(conteudo, payload);
    } catch (e) {
      console.error('[Inscricao lista]', e);
      if (statusEl) {
        statusEl.textContent = '';
      }
      renderEmpty(
        conteudo,
        'Não foi possível carregar a lista. Tente novamente mais tarde.'
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
