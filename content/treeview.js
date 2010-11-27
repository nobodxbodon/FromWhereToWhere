
com.wuxuan.fromwheretowhere.mainView = function(){
  var pub={};

  var devOptions=false;
  //var testConstruct=(function(){alert("mainView cons here");})();
  
  //TODO: if isRecord, there's no need to check for infinite expansion
  pub.createView = function(main, sb, isRecord){
    return {
  // have to separate the looks of node from the content!!!!!!
  
  visibleData : null,
  treeBox: null,  
  selection: null,  
  
  get rowCount()                     { return this.visibleData.length; },
  
  //fold all top nodes
  getVisibleLength: function(visibleData){
    var len = 0;
    for(var i in visibleData){
        visibleData[i].isFolded=false;
    }
    return len;
  },
  
  setTree: function(treeBox){
    //get the length of last visibleData, for rowCountChanged
    var lastVisibleLen = 0;
    if(this.visibleData!=null){
        lastVisibleLen = this.visibleData.length;
    }
    var newNodes = Application.storage.get("fromwheretowhere.currentData", false);
    
    if(treeBox!=null){
        this.treeBox = treeBox;
    }
    //refresh the tree
    if(newNodes.length>0){
      this.visibleData = [];
      this.treeBox.rowCountChanged(0, -1);
    }
    for (var i = 0; i < newNodes.length; i++) {
      newNodes[i]=main.putNodeToLevel0(newNodes[i]);
      this.visibleData.splice(this.visibleData.length, 0, newNodes[i]);
    }
    this.treeBox.rowCountChanged(lastVisibleLen,this.visibleData.length-lastVisibleLen+1);
  },
  
  getCellText: function(idx, column) {
    if(this.visibleData[idx]) {
      if(column.id == "element") {
	return this.visibleData[idx].label;
      } else if (column.id == "url") {
	return this.visibleData[idx].url;
      } else if (column.id == "date") {
        if (this.visibleData[idx].placeId){
            return com.wuxuan.fromwheretowhere.utils.formatDate(main.getFirstDatefromPid(this.visibleData[idx].placeId));
        } else {
            return null;
        }
      }else {
        return "NotDefined";
      }
    }
  },
    
  isContainer: function(idx){
    if(this.visibleData[idx]){
      return this.visibleData[idx].isContainer;
    } else {
      return false;
    }
  },  
  isContainerOpen: function(idx)     { return this.visibleData[idx].isFolded; },  
  isContainerEmpty: function(idx)    { return false; },  
  isSeparator: function(idx)         { return false; },  
  isSorted: function()               { return false; },  
  isEditable: function(idx, column)  { return false; },  
  
  getParentIndex: function(idx) {  
    //if (this.isContainer(idx)) return -1;  
    for (var t = idx - 1; t >= 0 ; t--) {  
      if (this.visibleData[t].level<this.visibleData[idx].level) return t;  
    }
    return -1;
  },  
  getLevel: function(idx) {
    if(this.visibleData[idx]){
      return this.visibleData[idx].level;
    }
  },
  // UNrefed now
  hasNextSibling: function(idx, after) {  
    var thisLevel = this.getLevel(idx);  
    for (var t = after + 1; t < this.visibleData.length; t++) {  
      var nextLevel = this.getLevel(t);  
      if (nextLevel == thisLevel) return true;  
      if (nextLevel < thisLevel) break;  
    }  
    return false;  
  },
  
  //expand using the children cached in item, hopefully save expanding time
  expandFromNodeInTree: function(item, idx) {
    var vis = this.visibleData;
    if (!item.children || item.children.length==0) {
      return 0;
    }
    // need to check here. Otherwise if check the children, the first parent won't be recorded as existInVisible.
    if(isRecord && main.existInVisible(item)){
      return 0;
    }
    item.isFolded = true;
    for (var i = 0; i < item.children.length; i++) {  
      vis.splice(idx + i + 1, 0, item.children[i]);
    }
    // adjust the index offset of the node to expand
    var offset = 0;
    for (var i = 0; i < item.children.length; i++) {
      var child = item.children[i];
      offset += this.expandFromNodeInTree(child, idx+i+1+offset);
    }
    //only add the length of its own direct children, the children will count in the length of their own children themselves
    this.treeBox.rowCountChanged(idx + 1, item.children.length);
    return offset+item.children.length;
  },
  
  addSuspensionPoints: function(level, idx) {
    var sp = main.ReferedHistoryNode(-1, -1, "searching...", null, false, false, [], level+1);
    this.visibleData.splice(idx+ 1, 0, sp);
    this.treeBox.rowCountChanged(idx + 1, 1);
  },
  delSuspensionPoints: function(idx) {
    this.visibleData.splice(idx+ 1, 1);
    this.treeBox.rowCountChanged(idx + 1, -1);
  },
  
  toggleOpenState: function(idx) {  
    var item = this.visibleData[idx];  
    if (!item.isContainer) return;  
  
    if (item.isFolded) {  
      item.isFolded = false;  
  
      var thisLevel = this.getLevel(idx);  
      var deletecount = 0;  
      for (var t = idx + 1;; t++) {
        if (this.visibleData[t] != null && (this.getLevel(t) > thisLevel)) deletecount++;  
        else break;  
      }  
      if (deletecount) {  
        this.visibleData.splice(idx + 1, deletecount);  
        this.treeBox.rowCountChanged(idx + 1, -deletecount);  
      }
    }  
    else {
      com.wuxuan.fromwheretowhere.sb.urlInit();
      main.main.dispatch(new main.mainThread(1, item, idx), main.DISPATCH_NORMAL);
      this.addSuspensionPoints(item.level, idx);
      
    }  
    this.treeBox.invalidateRow(idx);
  },  
  
  getImageSrc: function(idx, column) {
    var vis = this.visibleData;
    if(column.id == "element") {
      return main.getImagefromUrl(vis[idx].url);
    }
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
    var vis = this.visibleData;
    var pid = vis[row].placeId;
    var haveKeywords = main.pidwithKeywords.indexOf(pid);
    //CAN'T alert here!
    //in case pid is null, which means new imported nodes
    if(pid && pid==main.retrievedId){
      props.AppendElement(main.aserv.getAtom("makeItRed"));
    }else if(haveKeywords!=-1){
      props.AppendElement(main.aserv.getAtom("makeItBlue"));
    }
    //if it's red or blue already, just curve, otherwise make it olive
    if(sb.urls.indexOf(this.visibleData[row].url)!=-1){
      if(haveKeywords!=-1 || (pid && pid==main.retrievedId) ){
	props.AppendElement(main.aserv.getAtom("makeItCurve"));
      } else {
	props.AppendElement(main.aserv.getAtom("makeItOlive"));
	props.AppendElement(main.aserv.getAtom("makeItCurve"));
      }
    }
    if(devOptions){
      var pIdx = this.getParentIndex(row);
      if(pIdx!=-1 && this.visibleData[row].label==this.visibleData[pIdx].label){
	props.AppendElement(main.aserv.getAtom("makeItSmall"));
      }
    }
  },
  
  getColumnProperties: function(column, element, prop) {},
  click: function() {}
}};

  pub.init = function(main){
    main.init();
    var sb = com.wuxuan.fromwheretowhere.sb;
    sb.urlInit();
    // Main Tree definition
    var newNodes = main.createParentNodes(main.retrievedId);
    
    Application.storage.set("fromwheretowhere.currentData", newNodes);
    pub.treeView = pub.createView(main, sb, false);
    //TODO: remove this, pass as parameter
    main.treeView = pub.treeView;
    document.getElementById("elementList").view = pub.treeView;
  };
  
  return pub;
}();
