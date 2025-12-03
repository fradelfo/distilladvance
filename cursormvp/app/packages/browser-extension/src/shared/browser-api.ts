/**
 * Browser API Abstraction Layer
 *
 * Uses webextension-polyfill to provide a unified API that works
 * on both Chrome and Firefox. This module re-exports the polyfill's
 * browser object which provides Promise-based APIs.
 *
 * Usage:
 *   import { browser } from '@/shared/browser-api';
 *   const result = await browser.storage.local.get('key');
 *
 * The polyfill handles:
 * - Chrome's callback-based APIs → Promise-based
 * - Firefox's browser.* namespace → works natively
 * - Chrome's chrome.* namespace → shimmed to browser.*
 */

import browserPolyfill from 'webextension-polyfill';

/**
 * Unified browser API that works on Chrome and Firefox.
 * Prefer using this over direct chrome.* calls.
 */
export const browser = browserPolyfill;

/**
 * Type-safe wrapper for storage operations
 */
export const storage = {
  local: {
    get: <T = Record<string, unknown>>(keys?: string | string[] | null) =>
      browser.storage.local.get(keys) as Promise<T>,
    set: (items: Record<string, unknown>) => browser.storage.local.set(items),
    remove: (keys: string | string[]) => browser.storage.local.remove(keys),
    clear: () => browser.storage.local.clear(),
  },
  sync: {
    get: <T = Record<string, unknown>>(keys?: string | string[] | null) =>
      browser.storage.sync.get(keys) as Promise<T>,
    set: (items: Record<string, unknown>) => browser.storage.sync.set(items),
    remove: (keys: string | string[]) => browser.storage.sync.remove(keys),
    clear: () => browser.storage.sync.clear(),
  },
};

/**
 * Type-safe wrapper for runtime operations
 */
export const runtime = {
  sendMessage: <T = unknown>(message: unknown) =>
    browser.runtime.sendMessage(message) as Promise<T>,
  getManifest: () => browser.runtime.getManifest(),
  getURL: (path: string) => browser.runtime.getURL(path),
  onMessage: browser.runtime.onMessage,
  onInstalled: browser.runtime.onInstalled,
};

/**
 * Type-safe wrapper for tabs operations
 */
export const tabs = {
  query: (queryInfo: browser.Tabs.QueryQueryInfoType) => browser.tabs.query(queryInfo),
  sendMessage: <T = unknown>(tabId: number, message: unknown) =>
    browser.tabs.sendMessage(tabId, message) as Promise<T>,
  create: (createProperties: browser.Tabs.CreateCreatePropertiesType) =>
    browser.tabs.create(createProperties),
  update: (tabId: number, updateProperties: browser.Tabs.UpdateUpdatePropertiesType) =>
    browser.tabs.update(tabId, updateProperties),
};

/**
 * Type-safe wrapper for cookies operations
 */
export const cookies = {
  getAll: (details: browser.Cookies.GetAllDetailsType) => browser.cookies.getAll(details),
  get: (details: browser.Cookies.GetDetailsType) => browser.cookies.get(details),
  set: (details: browser.Cookies.SetDetailsType) => browser.cookies.set(details),
  remove: (details: browser.Cookies.RemoveDetailsType) => browser.cookies.remove(details),
};

/**
 * Type-safe wrapper for commands
 */
export const commands = {
  onCommand: browser.commands.onCommand,
  getAll: () => browser.commands.getAll(),
};

/**
 * Type-safe wrapper for context menus
 */
export const contextMenus = {
  create: (createProperties: browser.Menus.CreateCreatePropertiesType) =>
    browser.contextMenus.create(createProperties),
  remove: (menuItemId: string | number) => browser.contextMenus.remove(menuItemId),
  removeAll: () => browser.contextMenus.removeAll(),
  onClicked: browser.contextMenus.onClicked,
};

// Re-export types for convenience
export type { Browser } from 'webextension-polyfill';
