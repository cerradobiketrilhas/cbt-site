/**
 * Vercel Function: Criar Preferência de Pagamento Mercado Pago
 * POST /api/create-preference
 */

import { MercadoPagoConfig, Preference } from 'mercadopago';

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://cerradobiketrilhas.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nome, email, cpf, dataNasc, telefone, cidade, categoria } = req.body;

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

    // Criar preferência no Mercado Pago
    const preference = new Preference(mercadopago);

    const response = await preference.create({
      body: {
        items: [
          {
            id: '2-treino-cbt',
            title: '2º Treino Cronometrado - CBT',
            quantity: 1,
            unit_price: 80,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: nome,
          email: email,
          phone: {
            number: telefone
          },
          identification: {
            type: 'CPF',
            number: cpf
          },
          address: {
            zip_code: '73000-000',
            street_name: 'Luziânia',
            city_name: cidade.split(',')[0]
          }
        },
        back_urls: {
          success: 'https://cerradobiketrilhas.com/confirmacao.html',
          failure: 'https://cerradobiketrilhas.com/inscricao.html',
          pending: 'https://cerradobiketrilhas.com/confirmacao.html'
        },
        auto_return: 'approved',
        notification_url: 'https://cerradobiketrilhas.com/api/confirm-inscription',
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

    // Retornar preferenceId e checkout URL
    return res.status(200).json({
      preferenceId: response.id,
      checkoutUrl: response.init_point || `https://www.mercadopago.com.br/checkout/v1/redirect?preference-id=${response.id}`
    });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Falha ao processar inscrição'
    });
  }
}
