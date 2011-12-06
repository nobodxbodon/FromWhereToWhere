
com.wuxuan.fromwheretowhere.noteSidebar = function(){
  var pub={};
  
  var TVURI = "chrome://FromWhereToWhere/content/custtreeview.xul".toLowerCase();
  
  pub.mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
 .getInterface(Components.interfaces.nsIWebNavigation)
 .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
 .rootTreeItem
 .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
 .getInterface(Components.interfaces.nsIDOMWindow);
 
  pub.init = function(){
    pub.localManager = com.wuxuan.fromwheretowhere.localmanager;
    pub.remote = com.wuxuan.fromwheretowhere.remote;
    pub.UIutils = com.wuxuan.fromwheretowhere.UIutils;
    //use function or there'll be 'not found' issue
    pub.treeView = pub.createView();
    document.getElementById("recordList").view = pub.treeView;
  };
  
  pub.createView = function(){
    return {
  // have to separate the looks of node from the content!!!!!!
  
    visibleData : function(){
      return pub.localManager.queryAll();
    }(),
  
    treeBox: null,  
    selection: null,  
    
    get rowCount()                     { return this.visibleData.length; },
    
    setTree: function(treeBox){
      //get the length of last visibleData, for rowCountChanged
      var lastVisibleLen = 0;
      if(this.visibleData!=null){
          lastVisibleLen = this.visibleData.length;
      }
      if(treeBox==null){
        //refresh the tree
        this.visibleData = pub.localManager.queryAll();
        this.treeBox.rowCountChanged(lastVisibleLen,this.visibleData.length-lastVisibleLen);
      }else{
        this.treeBox = treeBox;
      }
    },
    
    getCellText: function(idx, column) {
      if(this.visibleData[idx]) {
        if(column.id == "title") {
          return this.visibleData[idx].name;
        } else if (column.id == "date") {
          return new Date(this.visibleData[idx].date);
        }
      }
      return "NotDefined";
    },
      
    isContainer: function(idx){
      return false;
    },  
    isContainerOpen: function(idx)     { return false; },  
    isContainerEmpty: function(idx)    { return false; },  
    isSeparator: function(idx)         { return false; },  
    isSorted: function()               { return false; },  
    isEditable: function(idx, column)  { return false; },  
    
    getParentIndex: function(idx) {
      return -1;
    },  
    getLevel: function(idx) {
      return 0;
    },  
    
    addSuspensionPoints: function(level, idx) {
      var sp = pub.ReferedHistoryNode(-1, -1, "searching...", null, false, false, [], level+1);
      this.visibleData.splice(idx+ 1, 0, sp);
      this.treeBox.rowCountChanged(idx + 1, 1);
    },
    delSuspensionPoints: function(idx) {
      this.visibleData.splice(idx+ 1, 1);
      this.treeBox.rowCountChanged(idx + 1, -1);
    },
    
    toggleOpenState: function(idx) {   
    },  
    
    getImageSrc: function(idx, column) {
      //can't access .main like it's global
    },
    
    getProgressMode : function(idx,column) {},  
    getCellValue: function(idx, column) {},  
    cycleHeader: function(col, elem) {},  
    selectionChanged: function() {},  
    cycleCell: function(idx, column) {},  
    performAction: function(action) {},  
    performActionOnCell: function(action, index, column) {},  
    getRowProperties: function(idx, column, prop) {},  
    
    getCellProperties: function(row,col,props){
    },
    
    getColumnProperties: function(column, element, prop) {},
    click: function() {}
  };
  };
  
  pub.showMenuItems = function(){
    var node = null;
    if(pub.treeView.selection!=null)
      node = pub.treeView.visibleData[pub.treeView.selection.currentIndex];
    var openItem = document.getElementById("openlocalnote");
    openItem.hidden = (node==null);
    var deleteItem = document.getElementById("delete");
    deleteItem.hidden = (node==null);
		var shareThread = document.getElementById("share");
		var selectedIndex = pub.UIutils.getAllSelectedIndex(pub.treeView);
    shareThread.hidden = (selectedIndex.length!=1);
  };
  
  pub.deleteNotes = function(){
    var selectedIndex = pub.UIutils.getAllSelectedIndex(pub.treeView);
    selectedIndex = selectedIndex.map(function(x){return pub.treeView.visibleData[x].id;});
    pub.localManager.deleteRecords(selectedIndex);
    pub.treeView.setTree(null);
  };
  
  //TODO: merge the code with ImportNode in main
  pub.openNode = function(){
    //get nodes content first
    var node = null;
    if(pub.treeView.selection!=null)
      node = pub.treeView.visibleData[pub.treeView.selection.currentIndex];
    if(node==null){
      return;
    }
    var json = pub.localManager.getNodeContent(node.id);

    var newNodes = [];
    try{
      newNodes = JSON.parse(json);
    }catch(err){
      if(json && json!="[]"){
        alert("record corrupted:\n" + json + " " + err);
      }
    }
    Application.storage.set("fromwheretowhere.currentData", newNodes);
    //if current tab is the main treeview, open 
    if(pub.mainWindow.gBrowser.currentURI.spec!=TVURI){
      //alert(pub.mainWindow.gBrowser.currentURI.spec);
      pub.mainWindow.gBrowser.selectedTab = pub.mainWindow.gBrowser.addTab(TVURI);
    } else {
      //compliant issue: for 4.0
      var ele = pub.mainWindow.content.document.getElementById("elementList");
      var treeView = ele.view;
      if(treeView==null){
        //for 3.6.x
        treeView = ele.wrappedJSObject.view;
      }
      //just to reset visibleData, seems this hack works
      treeView.setTree(null);
    }
  };
  
  //same as local notes, but only send subject & node for now
  pub.shareToAll = function(){
    //get nodes content first
    var node = null;
    if(pub.treeView.selection!=null)
      node = pub.treeView.visibleData[pub.treeView.selection.currentIndex];
    if(node==null){
      return;
    }
    var json = pub.localManager.getNodeContent(node.id);
	pub.remote.addThread(node.name, json);
  }
    
  return pub;
}();