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
        //if (this.doc instanceof HTMLDocument) {
          // is this an inner frame?
          //TODO: defaultView can be null!
          if (this.doc.defaultView.frameElement) {
            // Frame within a tab was loaded.
            // Find the root document:
            while (this.doc.defaultView.frameElement) {
              this.doc = this.doc.defaultView.frameElement.ownerDocument;
            }
          }
        }
        var currentDoc = this.doc;//gBrowser.selectedBrowser.contentDocument;//pub.mainWindow.document;
        //only recommond for current page, and when it's loaded
        if(currentDoc == gBrowser.selectedBrowser.contentDocument && currentDoc.title!=lasttitle){
          lasttitle=currentDoc.title;
          /*var links = currentDoc.links;//.getElementsByTagNameNS("*", "a");
          if(!links)
            return;
          var len = links.length;
          var alllinks = [];
          for(var i=0;i<len;i++){
            if(links[i]){
              alllinks.push(links[i]);
            }
          }*/
          recLinks = com.wuxuan.fromwheretowhere.recommendation.recommendInThread(currentDoc);
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
  
  pub.toggleRecommend = function(event){
    //alert("in toggle");
    var rec = event.target;
    if (rec.getAttribute("checked") == "true"){
      com.wuxuan.fromwheretowhere.events.down();
      rec.removeAttribute("checked");
    }
    else{
      com.wuxuan.fromwheretowhere.events.init();
      rec.setAttribute("checked", "true");
    }
    //alert("toggle exit");
  };
  
  pub.closePanel = function(event){
    var savePanel = document.getElementById("fwtwRelPanel");
    if(savePanel!=null){
      savePanel.hidePopup();
    } else{
      alert("no panel detected!");
    }
  };
  
  pub.init = function(){
    //TODO: document.? gbrowser.? difference?
    pub.mainWindow.addEventListener("DOMContentLoaded", pub.onPageLoad, false);
    //TODO: when current document is closed, the current suggestion should be closed too
    //pub.mainWindow.addEventListener("close", pub.closePanel, false);
    pub.main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
    com.wuxuan.fromwheretowhere.recommendation.init();
    com.wuxuan.fromwheretowhere.recommendation.popUp("","",[],[]);
  };
  
  pub.down = function(){
    pub.mainWindow.removeEventListener("DOMContentLoaded", pub.onPageLoad, false);
  };
    
  return pub;
}();