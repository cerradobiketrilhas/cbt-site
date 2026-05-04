/**
 * Vercel Function: Confirmação de Inscrição
 * POST /api/confirm-inscription
 * - Navegador (pós-checkout): JSON com paymentId + formData
 * - Webhook Mercado Pago: JSON { type: "payment", data: { id } } e/ou query ?data.id=&type=payment
 */

import crypto from 'node:crypto';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configurar Firebase (credenciais de teste)
const firebaseConfig = {
  apiKey: 'AIzaSyB0JARQ6_f2yFPYXjlmcjbeD5TQI9t7Mnk',
  authDomain: 'cbt-inscricoes.firebaseapp.com',
  projectId: 'cbt-inscricoes',
  storageBucket: 'cbt-inscricoes.firebasestorage.app',
  messagingSenderId: '935122287992',
  appId: '1:935122287992:web:d41cf1f74329e3b3eb9c8d'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const TEST_ACCESS_TOKEN = 'TEST-2437728556196941-042910-54d8e5c572ebc76af02a52a082f24756-1022849667';
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

function normalizeAccessToken(rawToken) {
  const token = String(rawToken || '').trim().replace(/^['"]|['"]$/g, '');
  return token.replace(/^Bearer\s+/i, '');
}

/**
 * Remove tudo que não for digito
 */
function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCpfDisplay(digits) {
  const d = onlyDigits(digits);
  if (d.length !== 11) return d || '—';
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatBrl(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPhoneDisplay(digits) {
  const d = onlyDigits(digits);
  if (d.length < 10) return d || '—';
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

function isValidEmail(addr) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(addr || '').trim());
}

/** Base pública do site (mesma lógica de `create-preference.js`) para links no e-mail. */
function getPublicSiteBase() {
  const raw =
    process.env.PUBLIC_SITE_BASE_URL ||
    process.env.SITE_URL ||
    'https://cbt-site.vercel.app';
  return String(raw).trim().replace(/\/$/, '');
}

function buildConfirmationEmailHtml(details, protocoloDocId, siteBase) {
  const base = String(siteBase || '').trim().replace(/\/$/, '') || 'https://cbt-site.vercel.app';
  const urlHome = `${base}/`;
  const urlInscricao = `${base}/inscricao.html`;
  const urlConfirmacao = `${base}/confirmacao.html`;
  const rows = [
    ['Nome completo', escapeHtml(details.nome)],
    ['E-mail', escapeHtml(details.email)],
    ['CPF', escapeHtml(formatCpfDisplay(details.cpf))],
    ['Data de nascimento', escapeHtml(String(details.dataNasc || '—'))],
    ['Telefone', escapeHtml(formatPhoneDisplay(details.telefone))],
    ['Cidade', escapeHtml(details.cidade)],
    ['Categoria', escapeHtml(details.categoria)],
    ['Valor pago', escapeHtml(formatBrl(details.valor))],
    ['ID do pagamento (Mercado Pago)', escapeHtml(String(details.idPagamento || '—'))],
    ['Forma de pagamento', escapeHtml(String(details.metodo || '—'))],
    ['Referência', escapeHtml(String(details.referencia || '—'))],
    ['Descrição', escapeHtml(String(details.descricao || '—'))],
    ['Protocolo da inscrição', escapeHtml(protocoloDocId)]
  ];
  const trs = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;width:38%;">${k}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${v}</td></tr>`
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;color:#111827;">
<p>Olá, <strong>${escapeHtml(details.nome)}</strong>,</p>
<p>Obrigado por se inscrever. Sua inscrição no <strong>2º Treino Cronometrado CBT</strong> está <strong>confirmada</strong> — o pagamento foi aprovado pelo Mercado Pago. Guarde este e-mail: nele constam o <strong>protocolo</strong> e todos os dados da sua inscrição.</p>
<p style="margin:20px 0 8px;">
  <a href="${escapeHtml(urlHome)}" style="display:inline-block;padding:10px 16px;background:#166534;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Acessar o site CBT</a>
</p>
<p style="font-size:14px;margin:0 0 16px;">
  <a href="${escapeHtml(urlInscricao)}" style="color:#15803d;">Página de inscrição</a>
  &nbsp;·&nbsp;
  <a href="${escapeHtml(urlConfirmacao)}" style="color:#15803d;">Página de confirmação</a>
</p>
<table style="border-collapse:collapse;width:100%;max-width:560px;margin:16px 0;">${trs}</table>
<p style="font-size:14px;color:#6b7280;">Em caso de dúvidas, fale conosco pelos canais indicados no site.</p>
<p style="font-size:14px;color:#6b7280;margin-top:8px;">Cerrado Bike Trilhas (CBT)</p>
</body></html>`;
}

/**
 * Envia e-mail de confirmação via Resend (https://resend.com).
 * Requer RESEND_API_KEY na Vercel. Falhas são apenas logadas — a inscrição já foi salva.
 */
async function sendConfirmationEmail(details, protocoloDocId) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const to = String(details.email || '').trim();
  if (!apiKey) {
    console.warn('[Confirm] RESEND_API_KEY não definido; e-mail de confirmação não enviado.');
    return { sent: false, reason: 'no_api_key' };
  }
  if (!isValidEmail(to)) {
    console.warn('[Confirm] E-mail do participante inválido; confirmação não enviada.');
    return { sent: false, reason: 'invalid_email' };
  }

  const from =
    String(process.env.RESEND_FROM || '').trim() ||
    'Cerrado Bike Trilhas <onboarding@resend.dev>';
  const subject = 'CBT · Inscrição confirmada — 2º Treino Cronometrado';
  const siteBase = getPublicSiteBase();
  const html = buildConfirmationEmailHtml(details, protocoloDocId, siteBase);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html
    })
  });

  const raw = await res.text();
  if (!res.ok) {
    let msg = raw;
    try {
      const j = JSON.parse(raw);
      msg = j.message || JSON.stringify(j);
    } catch {
      /* ignore */
    }
    throw new Error(`Resend HTTP ${res.status}: ${msg}`);
  }
  return { sent: true };
}

/** Resolve payment id do POST do site ou do webhook Mercado Pago. */
function extractPaymentId(body, query) {
  const q = query || {};
  const qDataId = q['data.id'] ? String(q['data.id']) : null;
  const topicOrType = String(q.topic || q.type || '');
  const fromQuery =
    qDataId || (topicOrType === 'payment' && q.id ? String(q.id) : null);

  const fromBody =
    body.paymentId ||
    body.payment_id ||
    body.collection_id ||
    (body.type === 'payment' && body.data?.id ? String(body.data.id) : null) ||
    (body.topic === 'payment' && body.id ? String(body.id) : null);

  return fromBody || fromQuery || null;
}

/**
 * Valida x-signature quando MERCADO_PAGO_WEBHOOK_SECRET está definido.
 * @see https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications
 */
function validateMercadoPagoWebhookSignature(req, body, paymentIdHint) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const sigHeader = req.headers['x-signature'];
  if (!sigHeader) return true;

  const xRequestId = req.headers['x-request-id'] || '';

  const q = req.query || {};
  let dataId = q['data.id'] ? String(q['data.id']) : '';
  if (!dataId && body?.data?.id) dataId = String(body.data.id);
  if (!dataId && paymentIdHint) dataId = String(paymentIdHint);

  let ts;
  let v1;
  for (const part of String(sigHeader).split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === 'ts') ts = val;
    if (key === 'v1') v1 = val;
  }
  if (!ts || !v1) return false;

  /** MP: omitir partes ausentes do template; ordem id → request-id → ts */
  const templates = [];
  if (dataId && xRequestId) {
    templates.push(`id:${dataId};request-id:${xRequestId};ts:${ts};`);
  }
  if (dataId) {
    templates.push(`id:${dataId};ts:${ts};`);
  }

  return templates.some((template) => {
    const hmac = crypto.createHmac('sha256', secret).update(template).digest('hex');
    return hmac === v1;
  });
}

/** Monta payload padrao da inscricao */
function buildInscriptionData(paymentData, formData, paymentId) {
  const metadata = paymentData.metadata || {};
  const categoryMap = {
    elite: 'Elite',
    iniciante: 'Iniciante',
    feminino: 'Feminino',
    master: 'Master',
    ebike: 'E-bike',
    // legado (preferências/pagamentos antigos)
    sport: 'Iniciante',
    amador: 'Amador'
  };

  const categoriaRaw = formData?.categoria || metadata.categoria || '';

  return {
    nome: formData?.nome || metadata.nome || paymentData.payer?.first_name || 'N/A',
    email: formData?.email || metadata.email || paymentData.payer?.email || 'N/A',
    cpf: onlyDigits(formData?.cpf || metadata.cpf || paymentData.payer?.identification?.number || ''),
    dataNasc: formData?.dataNasc || metadata.dataNasc || null,
    telefone: onlyDigits(formData?.telefone || metadata.telefone || paymentData.payer?.phone?.number || ''),
    cidade: formData?.cidade || metadata.cidade || 'N/A',
    categoria: categoryMap[categoriaRaw] || categoriaRaw || 'N/A',
    status: 'confirmado',
    idPagamento: String(paymentId),
    valor: paymentData.transaction_amount ?? 0,
    dataPagamento: serverTimestamp(),
    dataInscricao: serverTimestamp(),
    referencia: paymentData.external_reference || '',
    descricao: paymentData.description || '2º Treino Cronometrado CBT',
    metodo: paymentData.payment_method_id || 'N/A',
    timestamp: new Date().toISOString()
  };
}

/**
 * Handler da função
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (body == null || body === '') {
      body = {};
    }
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body.trim() || '{}');
      } catch {
        return res.status(400).json({ success: false, error: 'Corpo JSON inválido' });
      }
    }
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ success: false, error: 'Corpo da requisição inválido' });
    }

    const envToken = normalizeAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);
    const accessToken = envToken || TEST_ACCESS_TOKEN;

    if (!envToken && isProduction) {
      return res.status(500).json({
        success: false,
        error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado em produção'
      });
    }

    const paymentId = extractPaymentId(body, req.query);
    const formData = body.formData || body.inscriptionData || null;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'paymentId é obrigatório'
      });
    }

    if (!validateMercadoPagoWebhookSignature(req, body, paymentId)) {
      console.warn('[Confirm] Assinatura de webhook inválida');
      return res.status(401).json({ success: false, error: 'Assinatura inválida' });
    }

    // Sempre valida o pagamento com o Mercado Pago no backend
    const mercadopago = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(mercadopago);
    const paymentData = await paymentClient.get({ id: String(paymentId) });

    if (paymentData.status !== 'approved') {
      return res.status(200).json({
        success: false,
        status: paymentData.status,
        message: 'Pagamento ainda não aprovado'
      });
    }

    const inscriptionData = buildInscriptionData(paymentData, formData, paymentId);

    const inscricoesRef = collection(db, 'inscricoes');
    const dupQ = query(
      inscricoesRef,
      where('idPagamento', '==', String(paymentId)),
      limit(1)
    );
    const dupSnap = await getDocs(dupQ);
    if (!dupSnap.empty) {
      const existing = dupSnap.docs[0];
      return res.status(200).json({
        success: true,
        message: 'Inscrição já registrada',
        docId: existing.id,
        status: 'confirmado'
      });
    }

    const docRef = await addDoc(inscricoesRef, inscriptionData);

    try {
      await sendConfirmationEmail(inscriptionData, docRef.id);
    } catch (emailErr) {
      console.error('[Confirm] Falha ao enviar e-mail de confirmação:', emailErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Inscrição confirmada e salva no Firestore',
      docId: docRef.id,
      status: 'confirmado'
    });

  } catch (error) {
    console.error('[Confirm] Erro ao processar:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar webhook'
    });
  }
}
