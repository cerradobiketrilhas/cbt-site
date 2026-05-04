/**
 * Script de Inscrição - Lógica de formulário e integração Mercado Pago
 * CBT - 2º Treino Cronometrado
 */

const InscriptionForm = (() => {
  /** Referências lazy: script pode ser injetado antes do DOM estar pronto. */
  function elForm() {
    return document.getElementById('inscription-form');
  }
  function elSubmit() {
    return document.getElementById('submit-btn');
  }
  function elMessage() {
    return document.getElementById('form-message');
  }

  /**
   * Formatadores de input
   */
  const formatters = {
    phone(value) {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    }
  };

  /**
   * Validadores
   */
  const validators = {
    nome(value) {
      return value.trim().length >= 3 ? null : 'Nome deve ter no mínimo 3 caracteres';
    },

    email(value) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(value) ? null : 'E-mail inválido';
    },

    dataNasc(value) {
      if (!value) return 'Data de nascimento é obrigatória';
      const date = new Date(value);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 80);

      if (date > today) return 'Data de nascimento não pode ser no futuro';
      if (date < minDate) return 'Data de nascimento deve ser após 1946';

      return null;
    },

    telefone(value) {
      const clean = value.replace(/\D/g, '');
      return clean.length >= 10 ? null : 'Telefone inválido';
    },

    cidade(value) {
      return value.trim().length >= 3 ? null : 'Cidade deve ter no mínimo 3 caracteres';
    },

    categoria(value) {
      return value ? null : 'Selecione uma categoria';
    }
  };

  /**
   * Setup dos event listeners para formato de inputs
   */
  function setupFormatters() {
    const phoneInput = document.getElementById('telefone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
      e.target.value = formatters.phone(e.target.value);
    });
  }

  /**
   * Validar campo individual
   */
  function validateField(fieldName) {
    const field = document.getElementById(fieldName);
    const validator = validators[fieldName];
    const errorEl = document.querySelector(`[data-error="${fieldName}"]`);

    if (!field) return true;

    const error = validator ? validator(field.value) : null;

    if (error) {
      field.classList.add('form-input--error');
      if (errorEl) errorEl.textContent = error;
      return false;
    } else {
      field.classList.remove('form-input--error');
      if (errorEl) errorEl.textContent = '';
      return true;
    }
  }

  /**
   * Validar formulário inteiro
   */
  function validateForm() {
    const fields = ['nome', 'email', 'dataNasc', 'telefone', 'cidade', 'categoria'];
    let isValid = true;

    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Recolher dados do formulário
   */
  function getFormData() {
    return {
      nome: document.getElementById('nome').value.trim(),
      email: document.getElementById('email').value.trim(),
      dataNasc: document.getElementById('dataNasc').value,
      telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
      cidade: document.getElementById('cidade').value.trim(),
      categoria: document.getElementById('categoria').value
    };
  }

  /**
   * Lê corpo da resposta como JSON (evita falha com corpo vazio ou HTML de erro).
   */
  /**
   * Live Server / localhost não têm /api; usa produção Vercel. Opcional: apiBaseUrl em config.json.
   */
  async function getCreatePreferenceUrl() {
    if (typeof CONFIG !== 'undefined' && typeof CONFIG.load === 'function') {
      try {
        const cfg = await CONFIG.load();
        const base = cfg && cfg.apiBaseUrl && String(cfg.apiBaseUrl).trim();
        if (base) {
          return `${base.replace(/\/$/, '')}/api/create-preference`;
        }
      } catch (_) {
        /* ignora */
      }
    }
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://cbt-site.vercel.app/api/create-preference';
    }
    return '/api/create-preference';
  }

  async function parseJsonResponse(response) {
    const text = await response.text();
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error(
        `Servidor retornou resposta vazia (HTTP ${response.status}). Verifique se a API está publicada.`
      );
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error(
        `Resposta inválida do servidor (HTTP ${response.status}). ${trimmed.slice(0, 160)}`
      );
    }
  }

  /**
   * Criar preferência de pagamento
   */
  async function createPaymentPreference(formData) {
    try {
      showMessage('Processando inscrição...', 'loading');
      const btn = elSubmit();
      if (btn) btn.disabled = true;

      const url = await getCreatePreferenceUrl();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Erro ao processar inscrição (HTTP ${response.status})`
        );
      }

      if (!data.checkoutUrl) {
        throw new Error('Resposta sem URL de pagamento. Tente novamente ou contate a organização.');
      }

      // Salvar dados no localStorage para recuperar após pagamento
      localStorage.setItem('inscriptionData', JSON.stringify(formData));
      localStorage.setItem('paymentId', data.preferenceId || '');

      // Redirecionar para checkout do Mercado Pago
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Erro ao criar preferência:', error);
      showMessage(`Erro: ${error.message}`, 'error');
      const btn = elSubmit();
      if (btn) btn.disabled = false;
    }
  }

  /**
   * Mostrar mensagem de status
   */
  function showMessage(text, type = 'info') {
    const box = elMessage();
    if (!box) return;
    box.textContent = text;
    box.className = `form-message form-message--${type}`;
    box.style.display = 'block';
  }

  /**
   * Handler do submit do formulário
   */
  function handleSubmit(e) {
    e.preventDefault();

    // Limpar mensagens anteriores
    const box = elMessage();
    if (box) box.textContent = '';

    // Validar
    if (!validateForm()) {
      showMessage('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    // Recolher dados
    const formData = getFormData();

    // Registrar evento no GA4
    if (window.gtag) {
      gtag('event', 'form_submit', {
        event_category: 'inscription',
        event_label: formData.categoria
      });
    }

    // Criar preferência de pagamento
    createPaymentPreference(formData);
  }

  /**
   * Inicializar
   */
  function init() {
    const form = elForm();
    if (!form) return;

    // Setup formatadores
    setupFormatters();

    // Validação em tempo real
    ['nome', 'email', 'dataNasc', 'telefone', 'cidade', 'categoria'].forEach(field => {
      const el = document.getElementById(field);
      if (el) {
        el.addEventListener('blur', () => validateField(field));
        el.addEventListener('change', () => validateField(field));
      }
    });

    // Submit handler
    form.addEventListener('submit', handleSubmit);

    // Log que a página foi carregada
    console.log('[Inscription] Form initialized');
  }

  return { init };
})();

/**
 * Scripts carregados dinamicamente (como em inscricao.html) podem rodar depois
 * do DOMContentLoaded; nesse caso o listener nunca dispara e o form faz submit nativo.
 */
function bootInscriptionForm() {
  InscriptionForm.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootInscriptionForm, { once: true });
} else {
  bootInscriptionForm();
}
