/**
 * Vercel Function: Criar Preferência de Pagamento Mercado Pago
 * POST /api/create-preference
 */

import { MercadoPagoConfig, Preference } from 'mercadopago';

const TEST_ACCESS_TOKEN = 'TEST-2437728556196941-042910-54d8e5c572ebc76af02a52a082f24756-1022849667';

function getEventUnitPrice() {
  const raw = process.env.INSCRIPTION_UNIT_PRICE;
  if (raw === undefined || String(raw).trim() === '') return 5;
  const n = Number.parseFloat(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 5;
}

/** URL pública (sem barra final): back_urls e webhook do MP. Se o DNS do domínio próprio falhar, use https://cbt-site.vercel.app na Vercel. */
function getPublicSiteBase() {
  const raw =
    process.env.PUBLIC_SITE_BASE_URL ||
    process.env.SITE_URL ||
    'https://cerradobiketrilhas.com';
  return String(raw).trim().replace(/\/$/, '');
}

const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

function normalizeAccessToken(rawToken) {
  const token = String(rawToken || '').trim().replace(/^['"]|['"]$/g, '');
  return token.replace(/^Bearer\s+/i, '');
}

/**
 * Validar dados do formulário
 */
function validateData(data) {
  const errors = [];

  if (!data.nome || data.nome.length < 3) {
    errors.push('Nome inválido');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }

  if (!data.cpf || data.cpf.length !== 11) {
    errors.push('CPF inválido');
  }

  if (!data.dataNasc) {
    errors.push('Data de nascimento obrigatória');
  }

  if (!data.telefone || data.telefone.length < 10) {
    errors.push('Telefone inválido');
  }

  if (!data.cidade || data.cidade.length < 3) {
    errors.push('Cidade inválida');
  }

  const categorias = ['elite', 'sport', 'amador', 'feminino', 'master'];
  if (!data.categoria || !categorias.includes(data.categoria)) {
    errors.push('Categoria inválida');
  }

  return errors;
}

/**
 * Handler da função
 */
export default async function handler(req, res) {
  // CORS: ecoar origem permite localhost, preview Vercel e domínio de produção
  const requestOrigin = req.headers.origin;
  res.setHeader(
    'Access-Control-Allow-Origin',
    requestOrigin || '*'
  );
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envToken = normalizeAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);
    const accessToken = envToken || TEST_ACCESS_TOKEN;

    if (!envToken && isProduction) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'MERCADO_PAGO_ACCESS_TOKEN não configurado em produção'
      });
    }

    let rawBody = req.body;
    if (typeof rawBody === 'string') {
      try {
        rawBody = JSON.parse(rawBody || '{}');
      } catch {
        return res.status(400).json({
          error: 'Invalid JSON',
          message: 'Corpo da requisição não é JSON válido'
        });
      }
    }
    if (!rawBody || typeof rawBody !== 'object') {
      return res.status(400).json({
        error: 'Invalid body',
        message: 'Envie os dados da inscrição em JSON no corpo da requisição'
      });
    }

    const { nome, email, cpf, dataNasc, telefone, cidade, categoria } = rawBody;

    // Validar dados
    const errors = validateData({
      nome,
      email,
      cpf,
      dataNasc,
      telefone,
      cidade,
      categoria
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: errors.join('; ')
      });
    }

    // Telefone BR para o payer (Pix e checkout costumam exigir area_code + number)
    const telDigits = String(telefone).replace(/\D/g, '');
    let phoneArea = '61';
    let phoneNumber = telDigits;
    if (telDigits.length >= 10) {
      phoneArea = telDigits.slice(0, 2);
      phoneNumber = telDigits.slice(2);
    }

    // Criar preferência no Mercado Pago
    const mercadopago = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(mercadopago);
    const eventUnitPrice = getEventUnitPrice();
    const siteBase = getPublicSiteBase();

    const response = await preference.create({
      body: {
        // false = permite pendente (Pix, boleto); não remove cartões nem outros meios
        binary_mode: false,
        items: [
          {
            id: '2-treino-cbt',
            title: '2º Treino Cronometrado - CBT',
            quantity: 1,
            unit_price: eventUnitPrice,
            currency_id: 'BRL'
          }
        ],
        back_urls: {
          success: `${siteBase}/confirmacao.html`,
          failure: `${siteBase}/inscricao.html`,
          pending: `${siteBase}/confirmacao.html`
        },
        // 'all' = volta ao site mesmo com Pix ainda pending; a página confirma e faz polling até approved
        auto_return: 'all',
        // Não exclui nenhum meio; deixa Pix, cartão, saldo etc. conforme conta MP
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: 12
        },
        notification_url: `${siteBase}/api/confirm-inscription`,
        external_reference: `inscricao_${cpf}_${Date.now()}`,
        metadata: {
          nome,
          cpf,
          dataNasc,
          telefone,
          cidade,
          categoria,
          dataInscricao: new Date().toISOString()
        }
      }
    });

    const isTestToken = String(accessToken).startsWith('TEST-');
    const checkoutUrl =
      (isTestToken && response.sandbox_init_point) ||
      response.init_point ||
      response.sandbox_init_point ||
      `https://www.mercadopago.com.br/checkout/v1/redirect?preference-id=${response.id}`;

    // Retornar preferenceId e checkout URL
    return res.status(200).json({
      preferenceId: response.id,
      checkoutUrl,
      unitPrice: eventUnitPrice
    });

  } catch (error) {
    console.error('Erro ao criar preferência:', {
      message: error?.message,
      cause: error?.cause || null,
      status: error?.status || error?.cause?.status || null
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Falha ao processar inscrição'
    });
  }
}
