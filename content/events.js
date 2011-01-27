com.wuxuan.fromwheretowhere.events = function(){
  var pub={};
  
  var lasttitle = "";
  var eventNum = 0;

  pub.recommendThread = function(threadID, doc) {
    this.threadID = threadID;
    this.doc = doc;
  };
  
  pub.recommendThread.prototype = {
    run: function() {
      try {
        var recLinks=[];
        //TODO: this.doc seems unnecessary??
        if (this.doc.nodeName == "#document") {
        //if (doc instanceof HTMLDocument) {
          // is this an inner frame?
          if (this.doc.defaultView.frameElement) {
            // Frame within a tab was loaded.
            // Find the root document:
            while (this.doc.defaultView.frameElement) {
              this.doc = this.doc.defaultView.frameElement.ownerDocument;
            }
            var currentDoc = gBrowser.selectedBrowser.contentDocument;//pub.mainWindow.document;
            if(currentDoc.title!=lasttitle){
              lasttitle=currentDoc.title;
              //alert(currentDoc.title);
              var links = document.commandDispatcher.focusedWindow.document.getElementsByTagNameNS("*", "a")
              var len = links.length;
              var alllinks = [];
              for(var i=0;i<len;i++){
                if(links[i]){
                  alllinks.push(links[i]);//links[i].href;
                }
              }
              recLinks = com.wuxuan.fromwheretowhere.recommendation.recommend(lasttitle, alllinks);
            }
          }
        }
      } catch(err) {
        Components.utils.reportError(err);
      }
    },
  
    QueryInterface: function(iid) {
      if (iid.equals(Components.interfaces.nsIRunnable) ||
          iid.equals(Components.interfaces.nsISupports)) {
              return this;
      }
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
  };
  
  pub.onPageLoad = function(event){
    //alert("page loaded");
    eventNum +=1;
    // this is the content document of the loaded page.
    var doc = event.originalTarget;
    pub.main.dispatch(new pub.recommendThread(1, doc), pub.main.DISPATCH_NORMAL);
    //return alllinks;
  };
  
  pub.mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIWebNavigation)
      .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
      .rootTreeItem
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIDOMWindow);
        
  pub.init = function(){
    //TODO: document.? gbrowser.? difference?
    pub.mainWindow.addEventListener("DOMContentLoaded", pub.onPageLoad, false);
    //window.addEventListener("DOMTitleChanged", pub.onPageLoad, false);
    /*pub.mainWindow.addEventListener(
      "load",
      function(event) {
        pub.savenote = document.getElementById("current_title");
        pub.panel=document.getElementById("currentTitle");
      },
      false
    );*/
    pub.main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
    com.wuxuan.fromwheretowhere.recommendation.init();
    alert("init recommend");
  };
  
  pub.down = function(){
    pub.mainWindow.removeEventListener("DOMContentLoaded", pub.onPageLoad, false);
    //window.addEventListener("DOMTitleChanged", pub.onPageLoad, false);
    alert("rm recommend");
  };
    
  return pub;
}();