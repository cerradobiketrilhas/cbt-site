/**
 * Script de Confirmação - Mostra dados da inscrição confirmada
 * CBT - 2º Treino Cronometrado
 */

const ConfirmationPage = (() => {
  function getSearchParams() {
    return new URLSearchParams(window.location.search || '');
  }

  /** Mercado Pago pode enviar payment_id, collection_id ou capitalização diferente */
  function readPaymentIdFromUrl() {
    const fromSearch = (search) => {
      const p = new URLSearchParams(search || '');
      const direct = p.get('payment_id') || p.get('collection_id');
      if (direct) return direct;
      for (const [key, value] of p.entries()) {
        const k = key.toLowerCase();
        if ((k === 'payment_id' || k === 'collection_id') && value) return value;
      }
      return '';
    };
    let id = fromSearch(window.location.search);
    if (!id && window.location.hash && window.location.hash.includes('=')) {
      const tail = window.location.hash.slice(1);
      id = fromSearch(tail.includes('?') ? tail.slice(tail.indexOf('?')) : `?${tail}`);
    }
    return id || '';
  }

  async function getConfirmApiUrl() {
    if (typeof CONFIG !== 'undefined' && typeof CONFIG.load === 'function') {
      try {
        const cfg = await CONFIG.load();
        const base = cfg && cfg.apiBaseUrl && String(cfg.apiBaseUrl).trim();
        if (base) {
          return `${base.replace(/\/$/, '')}/api/confirm-inscription`;
        }
      } catch (_) {
        /* ignora */
      }
    }
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://cbt-site.vercel.app/api/confirm-inscription';
    }
    return '/api/confirm-inscription';
  }

  /**
   * Recuperar dados da inscrição
   */
  function getInscriptionData() {
    // Tentar recuperar do localStorage
    const stored = localStorage.getItem('inscriptionData');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Erro ao parsear dados armazenados:', e);
      }
    }

    const p = getSearchParams();
    // Tentar recuperar de URL params (fallback basico)
    return {
      nome: p.get('nome') || '',
      email: p.get('email') || '',
      categoria: p.get('categoria') || '',
      telefone: p.get('telefone') || ''
    };
  }

  /**
   * Formatar valores para exibição
   */
  function formatValue(key, value) {
    if (!value) return '—';

    const formatters = {
      telefone: (v) => {
        const clean = v.replace(/\D/g, '');
        return clean.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
      },
      categoria: (v) => {
        const labels = {
          elite: 'Elite',
          iniciante: 'Iniciante',
          feminino: 'Feminino',
          master: 'Master',
          ebike: 'E-bike',
          sport: 'Iniciante',
          amador: 'Amador'
        };
        return labels[v] || v;
      }
    };

    return formatters[key] ? formatters[key](value) : value;
  }

  /**
   * Gerar protocolo único
   */
  function generateProtocol(email) {
    const timestamp = Date.now();
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `CBT-${timestamp}-${hash}`.slice(0, 20).toUpperCase();
  }

  /**
   * Exibe status de processamento no card de confirmacao
   */
  function showStatusMessage(message, type = 'info') {
    const card = document.querySelector('.confirmation-card');
    if (!card) return;

    const oldMessage = card.querySelector('.warning');
    if (oldMessage) oldMessage.remove();

    const status = document.createElement('p');
    status.className = 'warning';
    status.style.marginBottom = '12px';
    status.style.color = type === 'error' ? '#fca5a5' : '#86efac';
    status.textContent = message;
    card.prepend(status);
  }

  /**
   * Confirma pagamento e persiste inscricao no backend
   */
  async function confirmAndSaveInscription(data) {
    const p = getSearchParams();
    const paymentId = readPaymentIdFromUrl();

    if (!paymentId) {
      showStatusMessage(
        'Não encontramos o ID do pagamento na URL. No Mercado Pago, use o link Voltar à loja (ou equivalente) para retornar ao site após o Pix.',
        'error'
      );
      return;
    }

    const paymentStatus =
      p.get('status') ||
      p.get('collection_status') ||
      '';

    if (
      paymentStatus === 'rejected' ||
      paymentStatus === 'cancelled' ||
      paymentStatus === 'failed'
    ) {
      showStatusMessage('Pagamento não foi concluído. Refaça a inscrição se necessário.', 'error');
      return;
    }

    const maxAttempts = 20;
    const delayMs = 2500;

    try {
      showStatusMessage('Confirmando pagamento e salvando inscrição...', 'info');
      const url = await getConfirmApiUrl();

      let lastError = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentId,
            formData: data
          })
        });

        let payload = {};
        try {
          const text = await response.text();
          payload = text.trim() ? JSON.parse(text) : {};
        } catch {
          payload = {};
        }

        if (response.ok && payload.success) {
          const protocoloEl = document.getElementById('conf-protocolo');
          if (protocoloEl && payload.docId) {
            protocoloEl.textContent = payload.docId;
          }
          showStatusMessage('Inscrição confirmada e salva com sucesso.', 'success');
          return;
        }

        const terminal = ['rejected', 'cancelled', 'refunded'].includes(payload.status);
        if (terminal) {
          lastError = payload.message || payload.error || 'Pagamento não aprovado';
          break;
        }

        const mpPending = payload.status === 'pending';

        if (mpPending && attempt < maxAttempts) {
          showStatusMessage(
            `Aguardando confirmação do pagamento no Mercado Pago (${attempt}/${maxAttempts})…`,
            'info'
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        lastError =
          payload.error ||
          payload.message ||
          `Falha ao confirmar (HTTP ${response.status})`;
        break;
      }

      throw new Error(lastError || 'Falha ao confirmar inscrição');
    } catch (error) {
      console.error('[Confirmation] Erro ao confirmar inscrição:', error);
      showStatusMessage(
        'Não foi possível confirmar automaticamente. Guarde o comprovante do Pix e fale com a organização.',
        'error'
      );
    }
  }

  /**
   * Preencher dados na página
   */
  function populateData() {
    const data = getInscriptionData();

    const fields = {
      'conf-nome': data.nome,
      'conf-categoria': data.categoria,
      'conf-email': data.email,
      'conf-telefone': data.telefone
    };

    // Preencher campos
    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = formatValue(id.replace('conf-', ''), value);
      }
    });

    // Gerar e mostrar protocolo
    const protocolo = generateProtocol(data.email || 'inscricao');
    const protocoloEl = document.getElementById('conf-protocolo');
    if (protocoloEl) {
      protocoloEl.textContent = protocolo;
    }

    // Se não tiver dados, mostrar aviso
    if (!data.nome) {
      console.warn('Dados de inscrição não encontrados');
      const card = document.querySelector('.confirmation-card');
      if (card) {
        const warning = document.createElement('p');
        warning.className = 'warning';
        warning.textContent = 'Dados de inscrição não encontrados. Verifique sua conexão.';
        card.prepend(warning);
      }
    }

    // Log
    console.log('[Confirmation] Data populated:', { ...data, email: data.email ? '***' : '' });

    // Confirmar no backend quando vier do checkout aprovado
    confirmAndSaveInscription(data);
  }

  /**
   * Inicializar
   */
  function init() {
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', populateData);
    } else {
      populateData();
    }

    // Limpar dados após 5 minutos (segurança)
    setTimeout(() => {
      localStorage.removeItem('inscriptionData');
      localStorage.removeItem('paymentId');
    }, 5 * 60 * 1000);

    console.log('[Confirmation] Page initialized');
  }

  return { init };
})();

// Inicializar
ConfirmationPage.init();
