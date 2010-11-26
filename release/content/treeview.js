
if(!com)
  var com={};
  
if(!com.wuxuan)
  com.wuxuan={};

if(!com.wuxuan.fromwheretowhere)
  com.wuxuan.fromwheretowhere = {};

com.wuxuan.fromwheretowhere.main = function(){
  var pub={};

  var devOptions=false;

  //sqlite operations:

  pub.openPlacesDatabase = function(){
    var db = Components.classes["@mozilla.org/browser/nav-history-service;1"].  
                      getService(Components.interfaces.nsPIPlacesDatabase).DBConnection;  
    return db;
  };
    
  /*type = 32, getInt32; type = 64, getInt64; type = "str", getString */
  pub.queryAll = function(statement, type, idx) {
    var children = [];
    try {
      while (statement.executeStep()) {
	if(type == "str") {
	  children.push(statement.getString(idx));
	} else if(type == 32){
	  children.push(statement.getInt32(idx));
	} else if(type == 64){
	  children.push(statement.getInt64(idx));
	} else {
	  alert("wrong type: " + type);
	}
      }
      statement.reset();
      return children;  
    } 
    catch (e) {
      statement.reset();
    }
  };
  
  /*type = 32, getInt32; type = 64, getInt64; type = "str", getString */
  pub.queryOne = function(statement, type, idx) {
    var id = null;
    try {
      if (statement.executeStep()) {
	if(type == "str") {
	  if(statement.getIsNull(idx)){
	    id = "";
	  }else{
	    id = statement.getString(idx);
	  }
	} else if(type == 32){
	  id = statement.getInt32(idx);
	} else if(type == 64){
	  id = statement.getInt64(idx);
	} else {
	  alert("wrong type: " + type);
	}
	statement.reset();
	return id;
      }
    } 
    catch (e) {
      statement.reset();
    }
  };
  
  /* the url visited before are all associated with the first place_id */
  pub.getAllIdfromPlaceId = function(pid){
    var statement = pub.mDBConn.createStatement("SELECT id FROM moz_historyvisits where place_id=:pid");
    try{
      statement.params.pid=pid;
    }catch(err){
      alert(err);
    }
    return pub.queryAll(statement, 32, 0);
  };
    
  pub.getChildren = function(parentId) {
    //all from_visit between id and next larger id are the same
    var statement = pub.mDBConn.createStatement("SELECT place_id FROM moz_historyvisits where from_visit>=:id and from_visit< \
						(SELECT id FROM moz_historyvisits where id>:id limit 1)");
    statement.params.id=parentId;
    return pub.queryAll(statement, 32, 0);
  };
  
  //linear search in array, may improve if in order
  pub.addInArrayNoDup = function(pid, ls){
    if(ls.indexOf(pid)==-1){
      ls.push(pid);
    }
    return ls;
  };
  
  //pub.timestats1=0;
  /* placeId: the placeId of the parent, which is unique even when this url is visited multiple times
    retrievedId: the id of the child, which correspond to the current url only
    TOOPT: use pure SQL instead of concat and dupcheck*/
  pub.getAllChildrenfromPlaceId = function(placeId) {
    //var start = (new Date()).getTime();
    var potentialchildren = [];
    /*var statement = pub.mDBConn.createStatement("SELECT place_id FROM moz_historyvisits where from_visit>=thisid and from_visit<\
						(SELECT id FROM moz_historyvisits where id>thisid limit 1) where thisid IN \
						(SELECT id FROM moz_historyvisits where place_id=:pid)");
      statement.params.pid=placeId;*/
    var ids = pub.getAllIdfromPlaceId(placeId);
    
    for(var j = 0; j<ids.length; j++) {
      var newChildren = pub.getChildren(ids[j]);
      for(var i in newChildren){
	potentialchildren = pub.addInArrayNoDup(newChildren[i], potentialchildren);
      }
    }
    //potentialchildren = pub.queryAll(statement, 32, 0);
    //pub.timestats1+=(new Date()).getTime()-start;
    return potentialchildren;
  };
      
    
  pub.getCurrentURI = function() {
    if(!window.opener){
      return "none";
    }
    return window.opener.getBrowser().mCurrentBrowser.currentURI.spec;
  };
  
  pub.getIdfromUrl = function(url){
    var statement = pub.mDBConn.createStatement("SELECT id FROM moz_places where url=:url");
    if(!url) {
      return null;
    }
    statement.params.url=url;
    return pub.queryOne(statement, 32, 0);
  };
  
  pub.getUrlfromId = function(id){
    var statement = pub.mDBConn.createStatement("SELECT url FROM moz_places where id=:id");
    statement.params.id=id;
    return pub.queryOne(statement, "str", 0);
  };

  pub.getTitlefromId = function(id){
    var statement = pub.mDBConn.createStatement("SELECT title FROM moz_places where id=:id");
    statement.params.id=id;
    return pub.queryOne(statement, "str", 0); 
  };
  
  pub.getFirstDatefromPid = function(pid){
    var statement = pub.mDBConn.createStatement("SELECT visit_date FROM moz_historyvisits where place_id=:pid");
    statement.params.pid=pid;
    return pub.queryOne(statement, 64, 0);
  };
  
  pub.getIdfromPlaceId = function(pid){
    var statement = pub.mDBConn.createStatement("SELECT id FROM moz_historyvisits \
					    where place_id=:id");
    statement.params.id=pid;
    return pub.queryOne(statement, 32, 0);
  };
  
  pub.getImagefromUrl = function(url){
    try{
      var uri = pub.ios.newURI(url, null, null);
      return pub.fis.getFaviconImageForPage(uri).spec;
    }catch(e){}
  };
  
  pub.searchIdbyKeywords = function(words, excluded){
    //SELECT * FROM moz_places where title LIKE '%sqlite%';
    //NESTED in reverse order, with the assumption that the word in front is more frequently used, thus return more items in each SELECT
    var term = "";
    var excludeTerm = "moz_places";
    if(excluded.length!=0){
      for(var i = excluded.length-1; i>=0; i--){
        if(i==excluded.length-1){
          excludeTerm = "(SELECT * FROM " + excludeTerm + " WHERE TITLE NOT LIKE '%" + excluded[i] + "%')";
        } else {
          excludeTerm = "(SELECT * FROM " + excludeTerm + " WHERE TITLE NOT LIKE '%" + excluded[i] + "%')";
        }
      }
    }
    
    if(words.length==1){
      term = "SELECT id FROM " + excludeTerm + " WHERE TITLE LIKE '%" + words[0] + "%'";
    } else {
      for(var i = words.length-1; i>=0; i--){
        if(i==words.length-1){
          term = "SELECT * FROM " + excludeTerm + " WHERE TITLE LIKE '%" + words[i] + "%'";
        } else if(i!=0){
          term = "SELECT * FROM (" + term + ") WHERE TITLE LIKE '%" + words[i] + "%'";
        } else {
          term = "SELECT id FROM (" + term + ") WHERE TITLE LIKE '%" + words[i] + "%'";
        }
      }
    }
    var statement = pub.mDBConn.createStatement(term);
    return pub.queryAll(statement, 32, 0);
  };
  //sqlite operations finish

  pub.getParentPlaceidsfromPlaceid = function(pid){
    //as id!=0, from_visit=0 doesn't matter
    var statement = pub.mDBConn.createStatement("SELECT place_id FROM moz_historyvisits \
					    where id IN (SELECT from_visit FROM moz_historyvisits where \
						place_id==:id)");
    statement.params.id=pid;
    var pids = pub.queryAll(statement, 32, 0);
    if(pids.length==0){
      var statement = pub.mDBConn.createStatement("SELECT from_visit FROM moz_historyvisits where \
						place_id=:id and from_visit!=0");
      statement.params.id=pid;
      var placeids = pub.queryAll(statement, 32, 0);
      if(placeids.length==0){
	return [];
      } else {
	for(var i in placeids){
	  var rangeStart = 0;
	  var rangeEnd = 10;
	  var initInterval = 10;
	  //limit the range of "order by". Should break far before 10, just in case
	  for(var j=0;j<10;j++){
	    var statement1 = pub.mDBConn.createStatement("SELECT place_id FROM moz_historyvisits \
					    where id<=:id-:start and id>:id-:end \
					    order by -id limit 1");
	    statement1.params.id=placeids[i];
	    statement1.params.start=rangeStart;
	    statement1.params.end=rangeEnd;
	    var thispid = pub.queryOne(statement1, 32, 0);
	    if(thispid){
	      pids.push(thispid);
	      break;
	    }
	    initInterval = initInterval * 3;
	    rangeStart = rangeEnd;
	    rangeEnd += initInterval;
	  }
	}
      }
    }
    return pids;
  };
  
  // Main Datastructure for each Node
  pub.ReferedHistoryNode = function(id, placeId, label, url, isContainer, isFolded, children, level) {
    var obj = new Object();
    obj.id = id;
    obj.placeId = placeId;
    obj.label = label;
    obj.url = url;
    obj.isContainer = isContainer;
    obj.isFolded = isFolded;
    obj.children = children;
    obj.level = level;
    return obj;
  };
  
  pub.clearReferedHistoryNode = function(node){
    for(var i in node.children){
      node.children[i] = pub.clearReferedHistoryNode(node.children[i]);
    }
    node.id = null;
    node.placeId = null;
    return node;
  };
  
  pub.getURLfromNode = function(treeView) {
    var sel = treeView.selection;
    var node = treeView.visibleData[sel.currentIndex];
    if(node){
      window.open(node.url);
    }
  };
  
  // Utils functions finish
  pub.mDBConn = pub.openPlacesDatabase();
  
  pub.retrievedId = pub.getIdfromUrl(Application.storage.get("currentURI", false));

/*pub.workingThread = function(threadID, item, idx) {
  this.threadID = threadID;
  this.item = item;
  this.idx = idx;
  this.result = 0;
};*/

/*pub.workingThread.prototype = {
  run: function() {
    try {
      // This is where the working thread does its processing work.
      pub.alreadyExpandedPids = [this.item.placeId];
      //CAN'T alert here!! will crash!
      if(this.item.isContainer && this.item.children.length==0){
	this.item = pub.allChildrenfromPid(this.item);
      }
      
      // When it's done, call back to the main thread to let it know
      // we're finished.
      
      pub.main.dispatch(new pub.mainThread(this.threadID, this.item, this.idx),
        pub.background.DISPATCH_NORMAL);
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
};*/

pub.mainThread = function(threadID, item, idx) {
  this.threadID = threadID;
  this.item = item;
  this.idx = idx;
};

pub.mainThread.prototype = {
  run: function() {
    try {
      /*Current: if the item has children list available, don't check local.
      TOIMPROVE: merge with the children queryed from local history.
      Sometimes you don't care about local or online, but sometimes you do. */
      pub.alreadyExpandedPids = [this.item.placeId];
      //CAN'T alert here!! will crash!
      if(this.item.isContainer && this.item.children.length==0){
	this.item = pub.allChildrenfromPid(this.item);
      }
      // expand in UI
      pub.alreadyExpandedPids = [];
      pub.treeView.delSuspensionPoints(this.idx);
      pub.treeView.expandFromNodeInTree(this.item, this.idx);
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


  pub.allChildrenfromPid = function(parentNode) {
    parentNode.isFolded = true;
    var parentLevel = parentNode.level;
    var allChildrenPId = pub.getAllChildrenfromPlaceId(parentNode.placeId);
    var urls = [];

    for(var i=0; i<allChildrenPId.length; i++) {
      var thisid = pub.getIdfromPlaceId(allChildrenPId[i]);
      
      var newChildNode = pub.ReferedHistoryNode(thisid, allChildrenPId[i], pub.getTitlefromId(allChildrenPId[i]), pub.getUrlfromId(allChildrenPId[i]), false, false, [], parentLevel+1);
      
      //TODO: if opened node was container, get the same properties as that!     
      if(!pub.existInVisible(newChildNode)){
	newChildNode = pub.allChildrenfromPid(newChildNode);
      }

      urls.push(newChildNode);
      
    }
    parentNode.children = urls;
    parentNode.isContainer = (urls.length>0);
    return parentNode;
  };
  
  /* when detect a Pid that's expanded already, don't open again, and add it here */
  pub.alreadyExpandedPids = [];
  
  /* go through all invisible node that's expanded, if there exists dup place_id,
  add it to alreadyExpandedPids, and return true;
  Add for import, if pid is null, it means new nodes imported from outside. Treat as not expanded*/
  pub.existInVisible = function(item) {
    var pid = item.placeId;
    if(!pid){
      return false;
    }
    if(pub.alreadyExpandedPids.indexOf(pid)!=-1){
      return true;
    }else{
      pub.alreadyExpandedPids.push(pid);
      return false;
    }
  };
  
   
  pub.nodefromPlaceid = function(pid) {
    var potentialchildren = pub.getAllChildrenfromPlaceId(pid);
    var hasChildren = (potentialchildren!=null) && (potentialchildren.length>0);
    var id = pub.getIdfromPlaceId(pid);
    return pub.ReferedHistoryNode(id, pid, pub.getTitlefromId(pid), pub.getUrlfromId(pid), hasChildren, false, [], 0);
  };
  
  pub.allKnownParentPids = [];
  
  //return all the top ancesters of a placeid, and add to allKnownParents
  pub.getAllAncestorsfromPlaceid = function(pid, knownParentPids, parentNumber){
    var tops = [];
    //if it's its own ancester, still display it
    if(knownParentPids.indexOf(pid)!=-1){
      //if there's only one parent, the link circle is closed from pid
      if(parentNumber==1){
	tops=pub.addInArrayNoDup(pid,tops);
      }
    }else{
      knownParentPids.push(pid);
      var pParentPids = pub.getParentPlaceidsfromPlaceid(pid);
      if(pParentPids.length==0){
        if(pub.allKnownParentPids.indexOf(pid)==-1){
	  pub.allKnownParentPids.push(pid);
        }
        tops.push(pid);
      } else {
	//if multiple ancestors, latest first
	var parentNum = pParentPids.length;
        for(var j=parentNum-1;j>=0;j--){
	  if(pub.allKnownParentPids.indexOf(pParentPids[j])==-1){
	    pub.allKnownParentPids.push(pParentPids[j]);
	    var anc=pub.getAllAncestorsfromPlaceid(pParentPids[j], knownParentPids, parentNum);
	    for(var k in anc){
	      tops=pub.addInArrayNoDup(anc[k],tops);
	    }
	  }
        }
      }
    }
    return tops;
  };
  
  // those without parent are also added, can't only highlight the keywords instead of the whole title?
  pub.createParentNodesCheckDup = function(pids) {
    pub.allKnownParentPids = [];
    var nodes = [];
    var ancPids = [];
    //order by time: latest first by default
    for(var i=pids.length-1; i>=0; i--){
      var anc = pub.getAllAncestorsfromPlaceid(pids[i],[],0);
      for(var j in anc){
        ancPids = pub.addInArrayNoDup(anc[j],ancPids);
      }
    }
    for(var i in ancPids){
      nodes.push(pub.nodefromPlaceid(ancPids[i]));
    }
    return nodes;
  };
  
  // get pid from id, and then the same as createParentNodesCheckDup, only with no initial pid set to check dup
  pub.createParentNodes = function(pid) {
    var nodes = [];
    if(pid){
      nodes = pub.createParentNodesCheckDup([pid]);
    }
    
    //show the current url is no parents found
    if(nodes.length==0){
      if(pid){
	nodes.push(pub.nodefromPlaceid(pid));
      } else {
	nodes.push(pub.ReferedHistoryNode(-1, -1, "No history found", null, false, false, [], 1));
      }
    }
    return nodes;
  };
  
// Main Tree definition
pub.treeView = {
  // have to separate the looks of node from the content!!!!!!
  
  visibleData : pub.createParentNodes(pub.retrievedId),

  treeBox: null,  
  selection: null,  
  
  get rowCount()                     { return this.visibleData.length; },
  
  setTree: function(treeBox){
    this.treeBox = treeBox;
  },
  
  getCellText: function(idx, column) {
    if(this.visibleData[idx]) {
      if(column.id == "element") {
	return this.visibleData[idx].label;
      } else if (column.id == "url") {
	return this.visibleData[idx].url;
      } else if (column.id == "date") {
        return com.wuxuan.fromwheretowhere.utils.formatDate(pub.getFirstDatefromPid(this.visibleData[idx].placeId));
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
    if (!item.children || item.children.length==0) {
      return 0;
    }
    // need to check here. Otherwise if check the children, the first parent won't be recorded as existInVisible.
    if(pub.existInVisible(item)){
      return 0;
    }
    item.isFolded = true;
    for (var i = 0; i < item.children.length; i++) {  
      this.visibleData.splice(idx + i + 1, 0, item.children[i]);
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
    var sp = pub.ReferedHistoryNode(-1, -1, "searching...", null, false, false, [], level+1);
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
      //pub.background.dispatch(new pub.workingThread(1, item, idx), pub.background.DISPATCH_NORMAL);

      pub.main.dispatch(new pub.mainThread(this.threadID, item, idx),
        pub.main.DISPATCH_NORMAL);

    
      this.addSuspensionPoints(item.level, idx);
      
    }  
    this.treeBox.invalidateRow(idx);  
  },  
  
  getImageSrc: function(idx, column) {
    if(column.id == "element") {
      return pub.getImagefromUrl(this.visibleData[idx].url);
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
    var pid = this.visibleData[row].placeId;
    var haveKeywords = pub.pidwithKeywords.indexOf(pid);
    //CAN'T alert here!
    //in case pid is null, which means new imported nodes
    if(pid && pid==pub.retrievedId){
      props.AppendElement(pub.aserv.getAtom("makeItRed"));
    }else if(haveKeywords!=-1){
      props.AppendElement(pub.aserv.getAtom("makeItBlue"));
    }
    //if it's red or blue already, just curve, otherwise make it olive
    if(com.wuxuan.fromwheretowhere.sb.urls.indexOf(this.visibleData[row].url)!=-1){
      if(haveKeywords!=-1 || (pid && pid==pub.retrievedId) ){
	props.AppendElement(pub.aserv.getAtom("makeItCurve"));
      } else {
	props.AppendElement(pub.aserv.getAtom("makeItOlive"));
	props.AppendElement(pub.aserv.getAtom("makeItCurve"));
      }
    }
    if(devOptions){
      var pIdx = this.getParentIndex(row);
      if(pIdx!=-1 && this.visibleData[row].label==this.visibleData[pIdx].label){
	props.AppendElement(pub.aserv.getAtom("makeItSmall"));
      }
    }
  },
  
  getColumnProperties: function(column, element, prop) {},
  click: function() {}
};  
  pub.selectNodeLocal = null;
  pub.showMenuItems = function(){
    var localItem = document.getElementById("local");
    var openinnewtab = document.getElementById("openinnewtab");
    var node = this.treeView.visibleData[this.treeView.selection.currentIndex];
    if(node){
      var exists = com.wuxuan.fromwheretowhere.sb.urls.indexOf(node.url);
      pub.selectNodeLocal = exists;
      localItem.hidden = (exists == -1);
    }
    openinnewtab.hidden = (node==null);
    
    var selectedIndex = pub.getAllSelectedIndex();
    var propertyItem = document.getElementById("property");
    propertyItem.hidden = (selectedIndex.length==0);
  };
  
  pub.openlocal = function(){
    var uri = com.wuxuan.fromwheretowhere.sb.getLocalURIfromId(com.wuxuan.fromwheretowhere.sb.ids[pub.selectNodeLocal]);
    window.open(uri);
  };
  
  pub.openlink = function(){
    pub.getURLfromNode(pub.treeView);
  };
  
  pub.getAllSelectedIndex = function(){
    var start = new Object();
    var end = new Object();
    var numRanges = this.treeView.selection.getRangeCount();
    var index = [];
    for (var t = 0; t < numRanges; t++){
      this.treeView.selection.getRangeAt(t,start,end);
      for (var v = start.value; v <= end.value; v++){
        index.push(v);
      }
    }
    return index;
  };
  
  pub.decreaseLevelandCollapse = function(node, levels){
    var children = node.children;
    for(var i in children){
      children[i] = pub.decreaseLevelandCollapse(children[i], levels);
    }
    node.level = node.level - levels;
    node.isFolded = false;
    return node;
  };
  
  pub.putNodeToLevel0 = function(node){
    var currentLevel = node.level;
    return pub.decreaseLevelandCollapse(node, currentLevel);
  };
  
  pub.getCurrentSelected = function(){
    var selectCount = this.treeView.selection.count;
    var selectedIndex = pub.getAllSelectedIndex();
    //verify 
    if(selectCount!=selectedIndex.length){
      alert("Error when getting selected rows");
    }
    var selected = [];
    for(var i in selectedIndex){
      var node = this.treeView.visibleData[selectedIndex[i]];
      //clean away id/pid from the node, as it's useless for other instances of FF
      selected.push(pub.clearReferedHistoryNode(com.wuxuan.fromwheretowhere.utils.cloneObject(node)));
    }
    return selected;
  };
  
  /* for now there's no circular reference within nodes, so JSON has no problem.
    TOIMPROVE until there's built-in support, as it should make loop detection more elegant? */
  //if it's a container, but never opened before, then it has no children.
  //For now have to manually open it first to get all the children, and then "export the whole trace"
  //TODO: add separator in contextmenu for export part
  pub.property = function() {
    var json = pub.nativeJSON.encode(pub.getCurrentSelected());
    var params = {inn:{property:json}, out:null};       
    window.openDialog("chrome://FromWhereToWhere/content/propdialog.xul", "",
      "chrome, centerscreen, dialog, resizable=yes", params).focus();
  };
  
  //when the first node is "no result found", remove it first, otherwise FF freezes when the next node is collapsed
  pub.importNodes = function(){
    var json = window.prompt("Please paste the nodes' property:", "[]");
    var newNodes = [];
    try{
      newNodes = pub.nativeJSON.decode(json);
    }catch(err){
      if(json && json!="[]"){
	alert("Input properties incomplete or corrupted:\n" + json);
      }
    }
    if(newNodes.length>0){
      if(this.treeView.visibleData.length==1 && this.treeView.visibleData[0].id == -1){
	this.treeView.visibleData = [];
	this.treeView.treeBox.rowCountChanged(0, -1);
      }
      for (var i = 0; i < newNodes.length; i++) {
	newNodes[i]=pub.putNodeToLevel0(newNodes[i]);
	this.treeView.visibleData.splice(this.treeView.visibleData.length, 0, newNodes[i]);
      }
      this.treeView.treeBox.rowCountChanged(this.treeView.visibleData.length, newNodes.length);
    }
  };
  
  pub.pidwithKeywords = [];
  
  pub.searchThread = function(threadID, keywords, words, excluded) {
    this.threadID = threadID;
    this.keywords = keywords;
    this.words = words;
    this.excluded = excluded;
  };
  
  pub.searchThread.prototype = {
    run: function() {
      try {
	
        var topNodes = [];
        if(this.words.length!=0){
          var allpids = [];
          // improve by search id from keywords directly instead of getting urls first
          allpids = pub.searchIdbyKeywords(this.words, this.excluded);
          pub.pidwithKeywords = [].concat(allpids);
          topNodes = pub.createParentNodesCheckDup(allpids);
        }
	
        //pub.showTopNodes.dispatch(new pub.showTopNodesThread(this.threadID, topNodes, this.keywords, this.words),
        //  pub.searchThread.DISPATCH_NORMAL);
	//refresh tree, remove all visibledata and add new ones
        pub.treeView.delSuspensionPoints(-1);
        if(this.words.length==0){
          alert("no keywords input");
          //cancel "searching..." after "OK", and redisplay the former result      
          pub.treeView.treeBox.rowCountChanged(0, pub.treeView.visibleData.length);
          return;
        }
        //when allPpids = null/[], show "no result with xxx", to distinguish with normal nothing found
        if(topNodes.length==0){
          var nodes = [];
          nodes.push(pub.ReferedHistoryNode(-1, -1, "No history found with \""+this.keywords+"\" in title", null, false, false, [], 1));
          pub.treeView.visibleData = nodes;
        }else{
          pub.treeView.visibleData = topNodes;
        }
        pub.treeView.treeBox.rowCountChanged(0, pub.treeView.visibleData.length);
	
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

  /*pub.showTopNodesThread = function(threadID, topNodes, keywords, words) {
    this.threadID = threadID;
    this.topNodes = topNodes;
    this.keywords = keywords;
    this.words = words;
  };

  pub.showTopNodesThread.prototype = {
    run: function() {
      try {
        //refresh tree, remove all visibledata and add new ones
        pub.treeView.delSuspensionPoints(-1);
        if(this.words.length==0){
          alert("no keywords input");
          //cancel "searching..." after "OK", and redisplay the former result      
          pub.treeView.treeBox.rowCountChanged(0, pub.treeView.visibleData.length);
          return;
        }
        //when allPpids = null/[], show "no result with xxx", to distinguish with normal nothing found
        if(this.topNodes.length==0){
          var nodes = [];
          nodes.push(pub.ReferedHistoryNode(-1, -1, "No history found with \""+this.keywords+"\" in title", null, false, false, [], 1));
          pub.treeView.visibleData = nodes;
        }else{
          pub.treeView.visibleData = this.topNodes;
        }
        pub.treeView.treeBox.rowCountChanged(0, pub.treeView.visibleData.length);
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
  };*/

  pub.search = function() {
    pub.treeView.treeBox.rowCountChanged(0, -pub.treeView.visibleData.length);
    pub.treeView.addSuspensionPoints(-1, -1);
    var keywords = document.getElementById("keywords").value;
    var w = com.wuxuan.fromwheretowhere.utils.getIncludeExcluded(keywords);
    pub.main.dispatch(new pub.searchThread(1, w.origkeywords, w.words, w.excluded), pub.main.DISPATCH_NORMAL);
      
  };
  
  pub.keypress = function(event) {
    if(!event){
      alert("no event!");
      return;
    }
    var keyunicode=event.charCode || event.keyCode;
    if(keyunicode==13){
      pub.search();
    }
  };
  
  pub.init = function() {
      
    pub.nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
    pub.ios = Components.classes["@mozilla.org/network/io-service;1"].
	        getService(Components.interfaces.nsIIOService);
    pub.fis = Components.classes["@mozilla.org/browser/favicon-service;1"].
		getService(Components.interfaces.nsIFaviconService);
    pub.aserv=Components.classes["@mozilla.org/atom-service;1"].
                getService(Components.interfaces.nsIAtomService);
    //pub.background = Components.classes["@mozilla.org/thread-manager;1"].getService().newThread(0);
    pub.main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
    //pub.searchBackground = Components.classes["@mozilla.org/thread-manager;1"].getService().newThread(1);
    //pub.showTopNodes = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
    //add here to check the top level nodes
    com.wuxuan.fromwheretowhere.sb.urlInit();
    document.getElementById("elementList").view = pub.treeView;
    //document.getElementById("elementList").addEventListener("click", function (){getURLfromNode(treeView);}, false);
  }
  
  return pub;
}();
