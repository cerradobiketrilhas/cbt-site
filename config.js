/**
 * Carrega configurações globais e as expõe via CONFIG object
 * Singleton pattern para garantir uma única instância
 */
const CONFIG = (() => {
  let config = null;

  const load = async () => {
    if (config) return config;

    try {
      const response = await fetch('config.json?v=' + Date.now());
      config = await response.json();
      return config;
    } catch (error) {
      console.error('[CONFIG] Erro ao carregar config.json:', error);
      // Fallback em caso de erro
      return getDefaultConfig();
    }
  };

  const getDefaultConfig = () => ({
    apiBaseUrl: '',
    donation: {
      meta: 5000,
      arrecadado: 1850,
      pixCode: "00020126710014BR.GOV.BCB.PIX0114+55619997134370231As trilhas agradecem pela ajuda5204000053039865802BR5921Raniel Mourao de Melo6009SAO PAULO61080540900062160512NUiNnO7MmSjq630419AD",
      pixLink: "https://nubank.com.br/pagar/4lloa/iNnO7MmSjq"
    },
    organization: {
      name: "Cerrado Bike Trilhas",
      location: "Luziânia • GO",
      instagram: "cerradobiketrilhas",
      instagramUrl: "https://www.instagram.com/cerradobiketrilhas"
    }
  });

  return { load };
})();

// Pré-carrega config quando o DOM está pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", CONFIG.load, { once: true });
} else {
  CONFIG.load();
}
