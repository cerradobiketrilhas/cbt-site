/**
 * Script de Inscrição - Lógica de formulário e integração Mercado Pago
 * CBT - 2º Treino Cronometrado
 */

const InscriptionForm = (() => {
  const MERCADO_PAGO_PUBLIC_KEY = 'TEST-b2cc91ad-a534-4253-81ee-939d8d1df20f';
  const form = document.getElementById('inscription-form');
  const submitBtn = document.getElementById('submit-btn');
  const formMessage = document.getElementById('form-message');

  // Inicializar Mercado Pago
  const mp = new MercadoPago(MERCADO_PAGO_PUBLIC_KEY, {
    locale: 'pt-BR'
  });

  /**
   * Formatadores de input
   */
  const formatters = {
    cpf(value) {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .slice(0, 14);
    },

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

    cpf(value) {
      const clean = value.replace(/\D/g, '');
      if (clean.length !== 11) return 'CPF deve ter 11 dígitos';
      if (/^(\d)\1{10}$/.test(clean)) return 'CPF inválido';

      // Validar dígitos verificadores
      let sum = 0;
      let remainder;
      for (let i = 1; i <= 9; i++) {
        sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(clean.substring(9, 10))) return 'CPF inválido';

      sum = 0;
      for (let i = 1; i <= 10; i++) {
        sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(clean.substring(10, 11))) return 'CPF inválido';

      return null;
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
    const cpfInput = document.getElementById('cpf');
    const phoneInput = document.getElementById('telefone');

    cpfInput.addEventListener('input', (e) => {
      e.target.value = formatters.cpf(e.target.value);
    });

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
    const fields = ['nome', 'email', 'cpf', 'dataNasc', 'telefone', 'cidade', 'categoria'];
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
      cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
      dataNasc: document.getElementById('dataNasc').value,
      telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
      cidade: document.getElementById('cidade').value.trim(),
      categoria: document.getElementById('categoria').value
    };
  }

  /**
   * Criar preferência de pagamento
   */
  async function createPaymentPreference(formData) {
    try {
      showMessage('Processando inscrição...', 'loading');
      submitBtn.disabled = true;

      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao processar inscrição');
      }

      const data = await response.json();

      // Salvar dados no localStorage para recuperar após pagamento
      localStorage.setItem('inscriptionData', JSON.stringify(formData));
      localStorage.setItem('paymentId', data.preferenceId);

      // Redirecionar para checkout do Mercado Pago
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Erro ao criar preferência:', error);
      showMessage(`Erro: ${error.message}`, 'error');
      submitBtn.disabled = false;
    }
  }

  /**
   * Mostrar mensagem de status
   */
  function showMessage(text, type = 'info') {
    formMessage.textContent = text;
    formMessage.className = `form-message form-message--${type}`;
    formMessage.style.display = 'block';
  }

  /**
   * Handler do submit do formulário
   */
  function handleSubmit(e) {
    e.preventDefault();

    // Limpar mensagens anteriores
    formMessage.textContent = '';

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
    if (!form) return;

    // Setup formatadores
    setupFormatters();

    // Validação em tempo real
    ['nome', 'email', 'cpf', 'dataNasc', 'telefone', 'cidade', 'categoria'].forEach(field => {
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

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', InscriptionForm.init);
