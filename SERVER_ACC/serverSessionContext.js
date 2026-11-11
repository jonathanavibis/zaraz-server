import { AsyncLocalStorage } from 'node:async_hooks';

export const serverContextStorage = new AsyncLocalStorage();

export const getCurrentServerAccount = () =>
  serverContextStorage.getStore() || null;
