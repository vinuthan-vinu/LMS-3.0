import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Same keys as legacy web-only code so existing browser sessions keep working. */
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function hasWebLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

export async function getAccessToken() {
  if (hasWebLocalStorage()) {
    return localStorage.getItem(TOKEN_KEY);
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setAccessToken(token) {
  if (hasWebLocalStorage()) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getStoredUserJson() {
  if (hasWebLocalStorage()) {
    return localStorage.getItem(USER_KEY);
  }
  return AsyncStorage.getItem(USER_KEY);
}

export async function getStoredUser() {
  const raw = await getStoredUserJson();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setStoredUser(user) {
  const str = JSON.stringify(user);
  if (hasWebLocalStorage()) {
    localStorage.setItem(USER_KEY, str);
    return;
  }
  await AsyncStorage.setItem(USER_KEY, str);
}

export async function clearAuthCredentials() {
  if (hasWebLocalStorage()) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return;
  }
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function saveAuthSession(token, user) {
  await setAccessToken(token);
  await setStoredUser(user);
}
