import { Platform } from 'react-native';
import apiClient from '../api/client';

/**
 * Resolves a backend file path (like /uploads/abc.png) into a full URL
 * usable by <Image /> components in React Native.
 */
export const resolveAssetUrl = (path) => {
  if (!path) return null;
  
  // If it's already a full URL (http:// or https://), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Handle relative paths from backend
  const baseUrl = apiClient.defaults.baseURL; // e.g. http://192.168.1.10:5000/api
  
  if (!baseUrl) return path;

  // Remove /api from end of baseUrl to get server root
  const serverRoot = baseUrl.replace(/\/api\/?$/, '');
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${serverRoot}${cleanPath}`;
};
