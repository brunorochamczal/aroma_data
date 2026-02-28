// Versão para Aroma SDK - sem Base44
const getAromaParamValue = (paramName, defaultValue = null) => {
  // Para desenvolvimento local
  if (typeof window === 'undefined') return defaultValue;
  
  // Buscar da URL primeiro (para tokens)
  const urlParams = new URLSearchParams(window.location.search);
  const urlValue = urlParams.get(paramName);
  if (urlValue) return urlValue;
  
  // Depois do localStorage
  const storageKey = `aroma_${paramName}`;
  const storedValue = localStorage.getItem(storageKey);
  if (storedValue) return storedValue;
  
  // Por fim, variáveis de ambiente
  const envVar = import.meta.env[`VITE_AROMA_${paramName.toUpperCase()}`];
  return envVar || defaultValue;
};

export const appParams = {
  appId: getAromaParamValue('app_id', import.meta.env.VITE_AROMA_APP_ID),
  token: getAromaParamValue('access_token'),
  appAromaUrl: getAromaParamValue('app_aroma_url', import.meta.env.VITE_AROMA_URL),
  functionsVersion: getAromaParamValue('functions_version', 'latest')
};
