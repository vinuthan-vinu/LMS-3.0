import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAccessToken } from '../storage/authStorage';

const normalizeApiBase = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim().replace(/\/$/, '');
  if (!t) return null;
  return t.endsWith('/api') ? t : `${t}/api`;
};

/**
 * In Expo Go / dev client, Metro exposes your Mac/PC LAN IP (same as QR “exp://…” host).
 * Replacing localhost in apiUrl lets a physical iPhone reach the Node backend on port 5000.
 */
const getDevMachineHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;
  if (!hostUri || typeof hostUri !== 'string') return null;
  const host = hostUri.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : null;
};

const rewriteLocalhostForNative = (url) => {
  if (Platform.OS === 'web' || !url) return url;
  if (!/localhost|127\.0\.0\.1/i.test(url)) return url;
  const devHost = getDevMachineHost();
  return devHost ? url.replace(/127\.0\.0\.1|localhost/gi, devHost) : url;
};

/**
 * Resolve API base (must end with /api).
 * Priority: EXPO_PUBLIC_API_URL → app.json expo.extra.apiUrl (+ dev host rewrite) → LAN fallback.
 */
const getBaseUrl = () => {
  const envUrl =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
      ? normalizeApiBase(process.env.EXPO_PUBLIC_API_URL)
      : null;
  if (envUrl) return rewriteLocalhostForNative(envUrl);

  const extra =
    Constants?.expoConfig?.extra ||
    Constants?.manifest2?.extra?.expoClient?.extra ||
    Constants?.manifest?.extra;
  let fromExtra = normalizeApiBase(extra?.apiUrl);
  if (fromExtra) return rewriteLocalhostForNative(fromExtra);

  if (Platform.OS === 'web') {
    return 'http://localhost:5051/api';
  }

  const devHost = getDevMachineHost();
  if (devHost) return `http://${devHost}:5051/api`;

  return 'http://192.168.0.200:5051/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
