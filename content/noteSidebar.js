
com.wuxuan.fromwheretowhere.noteSidebar = function(){
  var pub={};
  
  pub.mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
 .getInterface(Components.interfaces.nsIWebNavigation)
 .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
 .rootTreeItem
 .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
 .getInterface(Components.interfaces.nsIDOMWindow);
 
  pub.nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
    
  pub.initView = function(){
    document.getElementById("recordList").view = pub.treeView;
  };
    
  pub.treeView = {
  // have to separate the looks of node from the content!!!!!!
  
    visibleData : function(){
      alert("gen vis data");
      return com.wuxuan.fromwheretowhere.localmanager.queryAll();
    }(),
  
    treeBox: null,  
    selection: null,  
    
    get rowCount()                     { return this.visibleData.length; },
    
    setTree: function(treeBox){
      this.treeBox = treeBox;
    },
    
    getCellText: function(idx, column) {
      if(this.visibleData[idx]) {
        if(column.id == "title") {
          return this.visibleData[idx].name;
        } else if (column.id == "date") {
          return new Date(this.visibleData[idx].date);
        } else {
          return "NotDefined";
        }
      }
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
      /*if(column.id == "title") {
        return com.wuxuan.fromwheretowhere.main.getImagefromUrl(this.visibleData[idx].url);
      }*/
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
  
  //TODO: merge the code with ImportNode in main
  pub.openNode = function(){
    //pub.getBrowserWindow();
    //alert("main content location is " + content.document.getElementById("elementList"));
    var treeView = pub.mainWindow.content.document.getElementById("elementList").view;//pub.mainWindow.top.treeView;//.document.getElementById("elementList").view;
    var json = com.wuxuan.fromwheretowhere.localmanager.getNodeContent(pub.treeView.visibleData[pub.treeView.selection.currentIndex].id);
    alert(treeView);//pub.nativeJSON.encode(treeView.visibleData));
    alert(json);
    var newNodes = [];
    try{
      newNodes = pub.nativeJSON.decode(json);
    }catch(err){
      if(json && json!="[]"){
        alert("record corrupted:\n" + json + " " + err);
      }
    }
    if(newNodes.length>0){
      if(treeView.visibleData.length==1 && treeView.visibleData[0].id == -1){
        treeView.visibleData = [];
        treeView.treeBox.rowCountChanged(0, -1);
      }
      for (var i = 0; i < newNodes.length; i++) {
        newNodes[i]=com.wuxuan.fromwheretowhere.main.putNodeToLevel0(newNodes[i]);
        treeView.visibleData.splice(treeView.visibleData.length, 0, newNodes[i]);
      }
      treeView.treeBox.rowCountChanged(treeView.visibleData.length, newNodes.length);
    }
  };
  
  return pub;
}();