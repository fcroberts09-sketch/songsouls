/**
 * Phase 0 placeholder service worker. Phase 1 adds: per-domain enable/disable, runtime-registered content
 * scripts driven by parser recipes fetched from the API, signed observation submission, and the inline card.
 */
chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.set({ enabledDomains: [] });
});
