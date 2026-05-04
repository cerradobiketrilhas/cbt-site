/**
 * Vercel Function: Confirmação de Inscrição
 * POST /api/confirm-inscription
 * Valida o pagamento no Mercado Pago e salva no Firebase Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || TEST_ACCESS_TOKEN
});

/**
 * Remove tudo que não for digito
 */
function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

/**
 * Monta payload padrao da inscricao
 */
function buildInscriptionData(paymentData, formData, paymentId) {
  const metadata = paymentData.metadata || {};
  const categoryMap = {
    elite: 'Elite',
    sport: 'Sport',
    amador: 'Amador',
    feminino: 'Feminino',
    master: 'Master'
  };

  const categoriaRaw = formData?.categoria || metadata.categoria || '';

  return {
    nome: formData?.nome || metadata.nome || paymentData.payer?.first_name || 'N/A',
    email: formData?.email || paymentData.payer?.email || 'N/A',
    cpf: onlyDigits(formData?.cpf || metadata.cpf || paymentData.payer?.identification?.number || ''),
    dataNasc: formData?.dataNasc || metadata.dataNasc || null,
    telefone: onlyDigits(formData?.telefone || metadata.telefone || paymentData.payer?.phone?.number || ''),
    cidade: formData?.cidade || metadata.cidade || 'N/A',
    categoria: categoryMap[categoriaRaw] || categoriaRaw || 'N/A',
    status: 'confirmado',
    idPagamento: String(paymentId),
    valor: paymentData.transaction_amount || 80,
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
    const paymentId = req.body.paymentId || req.body.payment_id;
    const formData = req.body.formData || req.body.inscriptionData || null;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'paymentId é obrigatório'
      });
    }

    // Sempre valida o pagamento com o Mercado Pago no backend
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

    // Salvar no Firestore
    const inscricoesRef = collection(db, 'inscricoes');
    const docRef = await addDoc(inscricoesRef, inscriptionData);

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
