/**
 * Vercel Function: Criar Preferência de Pagamento Mercado Pago
 * POST /api/create-preference
 */

import { randomUUID } from 'node:crypto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import {
  applyCorsPreflight,
  consumeRateLimit,
  getClientIp
} from './_lib/security.js';

function getEventUnitPrice() {
  const raw = process.env.INSCRIPTION_UNIT_PRICE;
  if (raw === undefined || String(raw).trim() === '') return 80;
  const n = Number.parseFloat(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 80;
}

/**
 * URL pública (sem barra final): back_urls e webhook do MP.
 * Padrão = domínio .vercel.app do projeto (não exige domínio comprado).
 * Com domínio próprio: defina PUBLIC_SITE_BASE_URL na Vercel.
 */
function getPublicSiteBase() {
  const raw =
    process.env.PUBLIC_SITE_BASE_URL ||
    process.env.SITE_URL ||
    'https://cbt-site.vercel.app';
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

  if (!data.dataNasc) {
    errors.push('Data de nascimento obrigatória');
  }

  if (!data.telefone || data.telefone.length < 10) {
    errors.push('Telefone inválido');
  }

  if (!data.cidade || data.cidade.length < 3) {
    errors.push('Cidade inválida');
  }

  const categorias = ['elite', 'iniciante', 'feminino', 'master', 'ebike'];
  if (!data.categoria || !categorias.includes(data.categoria)) {
    errors.push('Categoria inválida');
  }

  return errors;
}

/**
 * Handler da função
 */
export default async function handler(req, res) {
  applyCorsPreflight(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rate = consumeRateLimit({
      key: `create-preference:${getClientIp(req)}`,
      maxRequests: 20,
      windowMs: 15 * 60 * 1000,
      blockMs: 10 * 60 * 1000
    });
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Tente novamente em instantes.'
      });
    }

    const envToken = normalizeAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);
    const accessToken = envToken;

    if (!envToken) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: isProduction
          ? 'Serviço de pagamento indisponível no momento.'
          : 'MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente.'
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

    const { nome, email, dataNasc, telefone, cidade, categoria } = rawBody;

    // Validar dados
    const errors = validateData({
      nome,
      email,
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
        external_reference: `inscricao_${Date.now()}_${randomUUID()}`,
        metadata: {
          nome,
          email,
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
      message: 'Falha ao processar inscrição'
    });
  }
}
