chrome.tabs.create({'url': chrome.extension.getURL('fromwheretowhere_threads.html')}, function(tab) {
  // Tab opened.
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({
        'url': chrome.extension.getURL('fromwheretowhere_threads.html')
    }, function(tab) {

    });
});