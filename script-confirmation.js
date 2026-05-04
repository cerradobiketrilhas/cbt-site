/**
 * Script de Confirmação - Mostra dados da inscrição confirmada
 * CBT - 2º Treino Cronometrado
 */

const ConfirmationPage = (() => {
  const params = new URLSearchParams(window.location.search);

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

    // Tentar recuperar de URL params (fallback basico)
    return {
      nome: params.get('nome') || '',
      email: params.get('email') || '',
      categoria: params.get('categoria') || '',
      telefone: params.get('telefone') || ''
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
          'elite': 'Elite',
          'sport': 'Sport',
          'amador': 'Amador',
          'feminino': 'Feminino',
          'master': 'Master'
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
    const paymentId = params.get('payment_id');
    const paymentStatus = params.get('status');

    // Evita chamadas desnecessarias ao abrir a pagina sem retorno do checkout
    if (!paymentId) return;

    if (paymentStatus && paymentStatus !== 'approved') {
      showStatusMessage('Pagamento ainda não aprovado. Assim que aprovar, a inscrição será confirmada.', 'error');
      return;
    }

    try {
      showStatusMessage('Confirmando pagamento e salvando inscrição...', 'info');

      const response = await fetch('/api/confirm-inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId,
          formData: data
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || payload.message || 'Falha ao confirmar inscrição');
      }

      const protocoloEl = document.getElementById('conf-protocolo');
      if (protocoloEl && payload.docId) {
        protocoloEl.textContent = payload.docId;
      }

      showStatusMessage('Inscrição confirmada e salva com sucesso.', 'success');
    } catch (error) {
      console.error('[Confirmation] Erro ao confirmar inscrição:', error);
      showStatusMessage('Não foi possível confirmar automaticamente. Entre em contato com a organização.', 'error');
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
