import { createClient } from '@aroma/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appAromaUrl } = appParams;

//Create a client with authentication required
export const aroma = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appAromaUrl
});
