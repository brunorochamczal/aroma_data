// src/lib/app-params.js
// Versão para Aroma SDK - SEM BASE44

const getAromaParamValue = (paramName, defaultValue = null) => {
  // Para ambiente Node (build), retorna defaultValue
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    // Buscar da URL primeiro (para tokens)
    const urlParams = new URLSearchParams(window.location.search);
    const urlValue = urlParams.get(paramName);
    if (urlValue) {
      // Salvar no localStorage para sessões futuras
      localStorage.setItem(`aroma_${paramName}`, urlValue);
      return urlValue;
    }
    
    // Depois do localStorage
    const storedValue = localStorage.getItem(`aroma_${paramName}`);
    if (storedValue) return storedValue;
    
    // Por fim, variáveis de ambiente
    const envVar = import.meta.env[`VITE_AROMA_${paramName.toUpperCase()}`];
    return envVar || defaultValue;
  } catch (error) {
    console.warn('Erro ao acessar storage:', error);
    return defaultValue;
  }
};

// Objeto com todos os parâmetros da aplicação
export const appParams = {
  appId: getAromaParamValue('app_id', import.meta.env.VITE_AROMA_APP_ID),
  token: getAromaParamValue('access_token'),
  appAromaUrl: getAromaParamValue('app_aroma_url', import.meta.env.VITE_AROMA_URL || 'https://api.aroma.com'),
  functionsVersion: getAromaParamValue('functions_version', 'latest')
};

// Para compatibilidade com código existente
export const getAppParams = () => appParams;
