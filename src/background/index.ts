// Listen for keyboard command
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // Send message to content script to show the search overlay
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-omnitab' });
      }
    });
  }
});

// Also listen for action clicks (when user clicks the extension icon)
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle-omnitab' });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'search-tabs') {
    // Search all tabs across all windows
    chrome.tabs.query({}, (tabs) => {
      const searchTerm = request.searchTerm.toLowerCase();
      const filteredTabs =
        searchTerm === ''
          ? tabs // Return all tabs if no search term
          : tabs.filter(
              (tab) =>
                tab.title?.toLowerCase().includes(searchTerm) ||
                tab.url?.toLowerCase().includes(searchTerm)
            );

      // Return filtered tabs with necessary info
      const results = filteredTabs.map((tab) => ({
        id: tab.id,
        title: tab.title || 'Untitled',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl || '',
        windowId: tab.windowId,
      }));

      sendResponse({ tabs: results });
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'switch-tab') {
    // Switch to the selected tab
    chrome.tabs.update(request.tabId, { active: true });
    chrome.windows.update(request.windowId, { focused: true });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'close-tab') {
    // Close the selected tab
    chrome.tabs.remove(request.tabId, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  return false; // Return false for unhandled messages
});

export {};
