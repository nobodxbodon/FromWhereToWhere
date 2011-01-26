com.wuxuan.fromwheretowhere.events = function(){
  var pub={};
  
  var lasttitle = "";
  var eventNum = 0;
  
  pub.createElement = function(parent, name, atts){
    var ele=parent.createElement(name);
    for(var i in atts){
      ele.setAttribute(i, atts[i]);
    }
    return ele;
  };
  
  String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
  };

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
              //com.wuxuan.fromwheretowhere.currentPage = doc;
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
                var menus = document.getElementById("menu_ToolsPopup");
                //const nm = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
                //var overlay = document.getElementById("FromWhereToWhereOverlay");
                var savePanel = document.createElement("panel");
                savePanel.setAttribute("fade", "fast");
                var vbox = document.createElement("vbox");
                //var desc = document.createElement("description");
                //<textbox id="property" readonly="true" multiline="true" clickSelectsAll="true" rows="20" flex="1"/>
                var desc = pub.createElement(document, "textbox", {"readonly":"true", "multiline":"true", "rows":"10", "cols":"100"})
                var outputLinks = "";
                for(var i=0;i<recLinks.length;i++){
                  outputLinks+=recLinks[i].text.trim()+"\n";
                }
                desc.setAttribute("value",outputLinks);
                vbox.appendChild(desc);
                savePanel.appendChild(vbox);
                //this put the panel on the menu bar
                //menus.parentNode.appendChild(savePanel);
                menus.parentNode.parentNode.appendChild(savePanel);
                //overlay.appendChild(savePanel);
                savePanel.openPopup(null, "", 60, 50, false, false);
                //get all the links on current page, and their texts shown on page
                
                //can't get from overlay, still wondering
                //alert(eventNum + " "+doc.title + " " + lasttitle);
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

  /*pub.search = function() {
    //alert(Application.storage.get("currentPage", false));
    pub.treeView.treeBox.rowCountChanged(0, -pub.treeView.visibleData.length);
    pub.treeView.addSuspensionPoints(-1, -1);
    pub.keywords = document.getElementById("keywords").value;
		pub.query = pub.utils.getIncludeExcluded(pub.keywords);
    pub.main.dispatch(new pub.searchThread(1, pub.query), pub.main.DISPATCH_NORMAL);
      
  };*/
  
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