/**
 * Vercel Function: Webhook - Confirmação de Inscrição
 * POST /api/confirm-inscription
 * Recebe notificação do Mercado Pago e salva no Firebase Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

/**
 * Validar assinatura do Mercado Pago (webhook verification)
 * Nota: Implementar validação real com X-Signature header
 */
function validateWebhookSignature(req) {
  // TODO: Implementar validação de assinatura real
  // const signature = req.headers['x-signature'];
  // const ts = req.headers['x-request-id'];
  // Validar HMAC com webhook secret do Mercado Pago
  return true;
}

/**
 * Handler da função
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Webhook] Recebido:', req.body);

    // Validar assinatura (opcional para ambiente de teste)
    if (!validateWebhookSignature(req)) {
      console.warn('[Webhook] Assinatura inválida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Extrair dados do webhook do Mercado Pago
    const { type, data } = req.body;

    // Processar apenas notificações de pagamento
    if (type !== 'payment') {
      console.log('[Webhook] Tipo não suportado:', type);
      return res.status(200).json({ message: 'Event type not processed' });
    }

    // Buscar dados do pagamento (em produção, seria necessário chamar a API do MP para mais detalhes)
    const paymentId = data.id;
    const metadata = data.metadata || {};

    // Apenas processar pagamentos aprovados
    if (data.status !== 'approved') {
      console.log('[Webhook] Pagamento não aprovado:', data.status);
      return res.status(200).json({ message: 'Payment not approved' });
    }

    // Preparar documento para Firestore
    const inscriptionData = {
      // Dados pessoais
      nome: metadata.nome || 'N/A',
      email: data.payer?.email || 'N/A',
      cpf: metadata.cpf || data.payer?.identification?.number || 'N/A',
      dataNasc: metadata.dataNasc || null,
      telefone: metadata.telefone || 'N/A',
      cidade: metadata.cidade || 'N/A',
      categoria: metadata.categoria || 'N/A',

      // Dados de pagamento
      status: 'confirmado',
      idPagamento: paymentId,
      valor: data.transaction_amount || 80,
      dataPagamento: serverTimestamp(),
      dataInscricao: metadata.dataInscricao ? new Date(metadata.dataInscricao) : serverTimestamp(),

      // Metadados adicionais
      referencia: data.external_reference || '',
      descricao: data.description || '',
      metodo: data.payment_method?.type || 'N/A',
      timestamp: new Date().toISOString()
    };

    // Salvar no Firestore
    const inscricoesRef = collection(db, 'inscricoes');
    const docRef = await addDoc(inscricoesRef, inscriptionData);

    console.log('[Webhook] Inscrição salva:', docRef.id);

    // TODO: Enviar e-mail de confirmação ao usuário
    // Seria necessário usar serviço como SendGrid, Resend, ou Brevo

    // Responder ao Mercado Pago com 200 OK
    return res.status(200).json({
      success: true,
      message: 'Inscrição confirmada e salva',
      docId: docRef.id
    });

  } catch (error) {
    console.error('[Webhook] Erro ao processar:', error);

    // Responder com 200 mesmo em caso de erro (para não fazer retry infinito)
    return res.status(200).json({
      success: false,
      error: error.message || 'Erro ao processar webhook'
    });
  }
}
