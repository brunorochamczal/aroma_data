import { createClient } from '@aroma/sdk';

const appId = import.meta.env.VITE_APP_ID;
const token = import.meta.env.VITE_TOKEN;
const appAromaUrl = import.meta.env.VITE_AROMA_URL;

export const aroma = createClient({
  appId,
  token,
  serverUrl: '',
  requiresAuth: false,
  appAromaUrl
});
