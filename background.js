self.importScripts('template.js');

chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings) {
    await chrome.storage.sync.set({ settings: ReleaseMailTemplate.DEFAULT_SETTINGS });
  }
});
