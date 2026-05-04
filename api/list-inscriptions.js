/**
 * Lista inscrições confirmadas agrupadas por categoria (somente nome + categoria).
 * GET /api/list-inscriptions
 */

import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

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

/** Ordem de exibição das categorias na página */
const CATEGORIA_ORDER = [
  'Elite',
  'Iniciante',
  'Feminino',
  'Master',
  'E-bike',
  'Sport',
  'Amador'
];

function orderGroupKeys(keys) {
  const seen = new Set();
  const out = [];
  for (const k of CATEGORIA_ORDER) {
    if (keys.includes(k) && !seen.has(k)) {
      out.push(k);
      seen.add(k);
    }
  }
  const rest = keys
    .filter((k) => !seen.has(k))
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  return out.concat(rest);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const snap = await getDocs(collection(db, 'inscricoes'));
    const byCat = new Map();

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.status && d.status !== 'confirmado') {
        return;
      }
      const nome = String(d.nome || '').trim();
      if (!nome || nome === 'N/A') {
        return;
      }
      const cat = String(d.categoria || '—').trim() || '—';
      if (!byCat.has(cat)) {
        byCat.set(cat, new Set());
      }
      byCat.get(cat).add(nome);
    });

    for (const [cat, set] of byCat) {
      const arr = [...set].sort((a, b) =>
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
      );
      byCat.set(cat, arr);
    }

    const keys = orderGroupKeys([...byCat.keys()]);
    const grupos = keys.map((categoria) => ({
      categoria,
      nomes: byCat.get(categoria) || []
    }));

    const total = [...byCat.values()].reduce((sum, arr) => sum + arr.length, 0);

    return res.status(200).json({
      success: true,
      total,
      grupos
    });
  } catch (err) {
    console.error('[list-inscriptions]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao carregar inscrições'
    });
  }
}
