
com.wuxuan.fromwheretowhere.main = function(){
  var pub={};

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
  
  pub.searchIdbyKeywords = function(words, excluded, site){
    //SELECT * FROM moz_places where title LIKE '%sqlite%';
    //NESTED in reverse order, with the assumption that the word in front is more frequently used, thus return more items in each SELECT
    var term = "";
		
		//add site filter
		var siteTerm = "moz_places";
		if(site.length!=0){
      for(var i = site.length-1; i>=0; i--){
        siteTerm = "(SELECT * FROM " + siteTerm + " WHERE URL LIKE '%" + site[i] + "%')";
      }
    }
		
		//TODO: seems dup condition, to simplify
    var excludeTerm = siteTerm;
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
		//placeid is not applicable across profiles, so don't use it for sharing at all!
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
  pub.keywords = "";
  pub.currentURI = Application.storage.get("currentURI", false);
  pub.retrievedId = pub.getIdfromUrl(pub.currentURI);
  //pub.treeView = (function(){return Application.storage.get("fromwheretowhere.currentView", false);})();

pub.mainThread = function(threadID, item, idx) {
  this.threadID = threadID;
  this.item = item;
  this.idx = idx;
};

pub.mainThread.prototype = {
  run: function() {
    try {
			pub.alreadyExpandedPids = [this.item.placeId];
      //CAN'T alert here!! will crash!
      if(this.item.isContainer && this.item.children.length==0){
				this.item = pub.allChildrenfromPid(this.item);
      }
      //alert(pub.timestats1);
      // This is where we react to the completion of the working thread.
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
    
    //show the current url if no parents found
    if(nodes.length==0){
      if(pid){
	nodes.push(pub.nodefromPlaceid(pid));
      } else {
	nodes.push(pub.ReferedHistoryNode(-1, -1, "No history found", null, false, false, [], 1));
      }
    }
		
    //add from-to from local notes, using the same URI
    var rawLocalNotes = pub.localmanager.getNodesRawfromURI(pub.currentURI);
		//alert(rawLocalNotes);
		for(var i in rawLocalNotes){
			var localNodes = []
			try{
				localNodes = pub.nativeJSON.decode(rawLocalNotes[i]);
			}catch(err){
				//if(json && json!="[]"){
					alert("record corrupted:\n" + json + " " + err);
				//}
			}
			//alert(localNodes[0].label);
			nodes = localNodes.concat(nodes);//splice(0,0,localNodes[0]);	
		}
		
    return nodes;
  };
  
  pub.selectNodeLocal = null;
  pub.showMenuItems = function(){
    var localItem = document.getElementById("local");
    var openinnewtab = document.getElementById("openinnewtab");
    var node = pub.treeView.visibleData[pub.treeView.selection.currentIndex];
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
    var numRanges = pub.treeView.selection.getRangeCount();
    var index = [];
    for (var t = 0; t < numRanges; t++){
      pub.treeView.selection.getRangeAt(t,start,end);
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
  
	//TODO: if the node.level=0, no need to move at all
  pub.putNodeToLevel0 = function(node){
    var currentLevel = node.level;
    return pub.decreaseLevelandCollapse(node, currentLevel);
  };
  
  pub.getCurrentSelected = function(){
    var selectCount = pub.treeView.selection.count;
    var selectedIndex = pub.getAllSelectedIndex();
    //verify 
    if(selectCount!=selectedIndex.length){
      alert("Error when getting selected rows");
    }
    var selected = [];
    for(var i in selectedIndex){
      var node = pub.treeView.visibleData[selectedIndex[i]];
      //clean away id/pid from the node, as it's useless for other instances of FF
      selected.push(pub.clearReferedHistoryNode(com.wuxuan.fromwheretowhere.utils.cloneObject(node)));
    }
    return selected;
  };
  
  /* for now there's no circular reference within nodes, so JSON has no problem.
    TOIMPROVE until there's built-in support, as it should make loop detection more elegant? */
  //if it's a container, but never opened before, then it has no children.
  //For now have to manually open it first to get all the children, and then "export the whole trace"
  pub.property = function() {
		var tosave = pub.getCurrentSelected();
    var json = pub.nativeJSON.encode(tosave);
    var params = {inn:{property:json}, out:null};       
    window.openDialog("chrome://FromWhereToWhere/content/propdialog.xul", "",
      "chrome, centerscreen, dialog, resizable=yes", params).focus();
  };
  
	pub.isSidebarFWTW = function(){
		var sidebarWindow = pub.mainWindow.document.getElementById("sidebar").contentWindow;
		//alert(sidebarWindow.location.href);
		var sidebarRef = "chrome://FromWhereToWhere/content/sidebar.xul".toLowerCase();
		return sidebarWindow.location.href == sidebarRef;
	};
	
  // recordType: 0 - from URI; 1 - from searching keywords; 2 - imported; -1 - invalid.
  // TODO: make constants!
	// TODO: if sidebar is open, close it first to save the sync trouble
  pub.saveNodetoLocal = function() {
		if (pub.isSidebarFWTW()) {
			pub.mainWindow.toggleSidebar('viewEmptySidebar');  
		} 

    var select = pub.getCurrentSelected();
    var json = pub.nativeJSON.encode(select);
    var recordName = "";
    var recordType = -1;
    var recordUrl = "";
    var searchTerm = "";
    var currentURI = "";
    var saveDate = (new Date()).getTime();
    if(select.length==0){
      alert("No record is saved");
    } else {
      recordName = select[0].label;
      recordUrl = select[0].url;
      /* recordName can duplicate in the records */
      /* the order matters now, as keyword searching is allowed when pub.currentURI is valid*/
      // if there's keywords, recordUrl isn't set
      if(pub.keywords!=""){  
        searchTerm = pub.keywords;
	recordType = 1;
      } else if(pub.currentURI){
        currentURI = pub.currentURI;
	recordType = 0;
      } else if(select[0].id==null) {
        // imported: use the label of first top node as name for now
        // TODO: pick tags
	recordType = 2;
      }
      pub.localmanager.addRecord(recordType, recordName, recordUrl, searchTerm, currentURI, json, saveDate);
			var savenote = document.getElementById("saved_note");
			savenote.value = "Note saved:\n"+recordName;
			document.getElementById("saved_notification").openPopup(null, "", 60, 50, false, false);
    }
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
      if(pub.treeView.visibleData.length==1 && pub.treeView.visibleData[0].id == -1){
	pub.treeView.visibleData = [];
	pub.treeView.treeBox.rowCountChanged(0, -1);
      }
      for (var i = 0; i < newNodes.length; i++) {
	newNodes[i]=pub.putNodeToLevel0(newNodes[i]);
	pub.treeView.visibleData.splice(pub.treeView.visibleData.length, 0, newNodes[i]);
      }
      pub.treeView.treeBox.rowCountChanged(pub.treeView.visibleData.length, newNodes.length);
    }
  };
  
  pub.showLocalNotes = function(){
    pub.mainWindow.toggleSidebar('viewEmptySidebar');  
  };
  
  pub.getAllNotes = function() {
    return pub.localmanager.queryAll();
  };
  
  pub.pidwithKeywords = [];
  
	//walk and search through node, TODO: more generic
	//RM flag: remove or not
  //TODO: index to speed up
  pub.walkAll = function(maybes, words, excluded, site, RM){
    for(var i in maybes){
      if(pub.walkNode(maybes[i], words, excluded, site).length==0 && RM){
        //alert("rule out:     "+pub.nativeJSON.encode(maybes[i]));
        maybes.splice(i, 1);
      }
    }
    return maybes;
  };
  
  //indexOf is case-sensitive!
  pub.walkNode = function(maybe, words, excluded, site){
    var label = maybe.label.toLowerCase();
    var url = maybe.url.toLowerCase();
    for(var w in words){
      if(label.indexOf(words[w])==-1){
        return pub.walkAll(maybe.children, words, excluded, site, false);
      }
    }
    for(var e in excluded){
      if(label.indexOf(excluded[e])!=-1){
        return pub.walkAll(maybe.children, words, excluded, site, false);
      }
    }
    for(var s in site){
      if(url.indexOf(site[s])==-1){
        return pub.walkAll(maybe.children, words, excluded, site, false);
      }
    }
		//alert(maybe.label);
		maybe.haveKeywords = true;
		//TODO: this is just to check keywords
		pub.walkAll(maybe.children, words, excluded, site, false);
    return [].push(maybe);
  };
	
	//TODO: call getIncludeExclude here, save passing arguments?
  pub.searchThread = function(threadID, keywords, words, excluded, site) {
    this.threadID = threadID;
    this.keywords = keywords;
    this.words = words;
    this.excluded = excluded;
		this.site = site;
  };
  
  pub.searchThread.prototype = {
    run: function() {
      try {
	
        var topNodes = [];
        if(this.words.length!=0){
          var allpids = [];
          // improve by search id from keywords directly instead of getting urls first
          allpids = pub.searchIdbyKeywords(this.words, this.excluded, this.site);
          pub.pidwithKeywords = [].concat(allpids);
          topNodes = pub.createParentNodesCheckDup(allpids);
        }
	
				//search in local notes, latest first
				//7 short records 1 long: 7ms; 7 short 11 long: 37ms
				//var start = (new Date()).getTime();
				var maybeNodes = pub.localmanager.searchNotesbyKeywords(this.words, this.excluded, this.site);
				//lowercase for all keywords
				for(var w in this.words){
					this.words[w] = this.words[w].toLowerCase();
				}
				for(var e in this.excluded){
					this.excluded[e] = this.excluded[e].toLowerCase();
				}
				for(var s in this.site){
					this.site[s] = this.site[s].toLowerCase();
				}
				var localNodes = pub.walkAll(maybeNodes, this.words, this.excluded, this.site, true);
				for(var i in localNodes){
					topNodes.splice(0,0,pub.putNodeToLevel0(localNodes[i]));
				}
				//alert((new Date()).getTime()-start);
				
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

  pub.search = function() {
    pub.treeView.treeBox.rowCountChanged(0, -pub.treeView.visibleData.length);
    pub.treeView.addSuspensionPoints(-1, -1);
    pub.keywords = document.getElementById("keywords").value;
    var w = com.wuxuan.fromwheretowhere.utils.getIncludeExcluded(pub.keywords);
    pub.main.dispatch(new pub.searchThread(1, w.origkeywords, w.words, w.excluded, w.site), pub.main.DISPATCH_NORMAL);
      
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
  
  pub.mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation)
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
        .rootTreeItem
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIDOMWindow);
 
  pub.init = function() {
      
    pub.nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
    pub.ios = Components.classes["@mozilla.org/network/io-service;1"].
	        getService(Components.interfaces.nsIIOService);
    pub.fis = Components.classes["@mozilla.org/browser/favicon-service;1"].
		getService(Components.interfaces.nsIFaviconService);
    pub.aserv=Components.classes["@mozilla.org/atom-service;1"].
                getService(Components.interfaces.nsIAtomService);
    pub.main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
    //add here to check the top level nodes - ?
    com.wuxuan.fromwheretowhere.sb.urlInit();
    pub.localmanager = com.wuxuan.fromwheretowhere.localmanager;
    pub.localmanager.init();
    //document.getElementById("elementList").addEventListener("click", function (){getURLfromNode(treeView);}, false);
  }
  
  return pub;
}();