import Storage from 'expo-sqlite/kv-store';
import { StorageAdapter } from './storage.types';
export const storage: StorageAdapter = {
  getItem: (key) => Storage.getItem(key),
  setItem: (key, value) => Storage.setItem(key, value),
  removeItem: (key) => Storage.removeItem(key),
};
