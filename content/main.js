
com.wuxuan.fromwheretowhere.main = function(){
  var pub={};

  pub.getCurrentURI = function() {
    if(!window.opener){
      return "none";
    }
    return window.opener.getBrowser().mCurrentBrowser.currentURI.spec;
  };
  
  pub.getURLfromNode = function(treeView) {
    var sel = pub.getCurrentSelected();
		//only when 1 selected, may switch to current tab
		if(sel.length==1){
			var switchToTab = document.getElementById("switchToTab");
			var foundTab = switchToTab.fromwheretowhere.foundTab;
			if(foundTab.tab){
				// The URL is already opened. Select this tab.
				foundTab.browser.selectedTab = foundTab.tab;
				// Focus *this* browser-window
				foundTab.window.focus();
			}else
				window.open(sel[0].url);
		}else{
			for(var i in sel){
				window.open(sel[i].url);
			}
		}
  };
  
	pub.DEBUG = false;
  // Utils functions finish
  pub.keywords = "";
  pub.currentURI = Application.storage.get("currentURI", false);

	//if a node's level==0, seen as start of a session
	pub.isNewSession = function(item){
		return item.level==0;
	};
	
pub.mainThread = function(threadID, item, idx, query, findNext) {
  this.threadID = threadID;
  this.item = item;
  this.idx = idx;
	this.query = query;
	this.findNext = findNext;
};

pub.mainThread.prototype = {
  run: function() {
    try {
			if(pub.isNewSession(this.item))
				pub.alreadyExpandedPids = [];
			pub.alreadyExpandedPids.push(this.item.placeId);
      //CAN'T alert here!! will crash!
      if(this.item.isContainer){
				//if there are children already, means local notes
				if(this.item.children.length==0){
					var onTopic = false;
					if(this.item.notRelated){
						//thought not related, but user is interested. learn from this record
						pub.topicTracker.learnFromCase(this.item);
						this.item.notRelated=false;
					}
					if(pub.topicTracker)
						onTopic = pub.topicTracker.followContent(this.item.label, pub.isNewSession(this.item));
					//TODO: if still !onTopic, need to re-learn
					//the start of a session, always expand
					this.item = pub.allChildrenfromPid(this.item, this.query);
				} else {
					//TODO: make sure after this, the title will be guarantee "onTopic"
					// walk through the already existed children list, and mark "noNeedExpand"
					this.item = pub.checkIfExpand(this.item, true);
				}
      }
      //alert(pub.timestats1);
      // This is where we react to the completion of the working thread.
      pub.treeView.delSuspensionPoints(this.idx);
      pub.treeView.expandFromNodeInTree(this.item, this.idx);
			if(this.findNext){
				//alert("find Next");
				pub.treeView.findNext(this.idx);
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


  pub.allChildrenfromPid = function(parentNode, query) {
    parentNode.isFolded = true;
    var parentLevel = parentNode.level;
    var allChildrenPId = pub.history.getAllChildrenfromPlaceId(parentNode.placeId, query);
    var urls = [];
		
    for(var i=0; i<allChildrenPId.length; i++) {
      var tu = pub.history.getTitleAndUrlfromId(allChildrenPId[i]);
      var newChildNode = pub.history.ReferedHistoryNode(null, allChildrenPId[i], tu.title, tu.url, false, false, [], parentLevel+1);
      
			//track topic since expanding, and keep short/long term memory
			if(pub.topicTracker){
				//child.level always !=0
				var onTopic = pub.topicTracker.followContent(childTitle, false);
				if(onTopic){
					if(!pub.existInVisible(newChildNode)){
						newChildNode = pub.allChildrenfromPid(newChildNode, query);
					}
				}else{
					alert("not topic: " + newChildNode.label);
					newChildNode.notRelated=true;
					newChildNode.isContainer = (pub.history.getAllChildrenfromPlaceId(newChildNode.placeId, query).length>0)
				}
			} else {
				//TODO: if opened node was container, get the same properties as that!     
				if(!pub.existInVisible(newChildNode)){
					newChildNode = pub.allChildrenfromPid(newChildNode, query);
				}
			}

      urls.push(newChildNode);
      
    }
    parentNode.children = urls;
    parentNode.isContainer = (urls.length>0);
    return parentNode;
  };
  
	pub.checkIfExpandSub = function(ch){
		//var children = parentNode.children;
		for(var i=0; i<ch.length; i++) {
			pub.checkIfExpand(ch[i], false);
		}
	};
	
	pub.checkIfExpand = function(parentNode, mustExpand){
		if(mustExpand && parentNode.notRelated){
			//thought not related, but user is interested. learn from this record
			pub.topicTracker.learnFromCase(parentNode);
			parentNode.notRelated=false;
		}
		if(pub.topicTracker){
			var onTopic = pub.topicTracker.followContent(parentNode.label, pub.isNewSession(parentNode));
			if(!onTopic){
				if(mustExpand){
					//TODO: means learning is not working, or learning can happen here instead
					//TODO: clean this logic up, too much dup!
					pub.checkIfExpandSub(parentNode.children);
				}else{
					alert("not topic: " + parentNode.label);
					parentNode.notRelated=true;
					parentNode.isFolded=false;
				}
			}else{
				pub.checkIfExpandSub(parentNode.children);
			}
		}
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
  
  // get pid from id, and then the same as createParentNodesCheckDup, only with no initial pid set to check dup
  pub.createParentNodes = function(pid) {
    var nodes = [];
    if(pid){
      nodes = pub.history.createParentNodesCheckDup([pid], null);
			
			//add from-to from local notes, using the same URI
			var rawLocalNotes = pub.localmanager.getNodesRawfromURI(pub.currentURI);
			for(var i in rawLocalNotes){
				var localNodes = []
				try{
					localNodes = JSON.parse(rawLocalNotes[i]);
				}catch(err){
					//if(json && json!="[]"){
						alert("record corrupted:\n" + json + " " + err);
					//}
				}
				nodes = localNodes.concat(nodes);
			}
    }
    
    //show the current url if no parents found
    if(nodes.length==0){
      if(pid){
	nodes.push(pub.history.nodefromPlaceid(pid, null));
      } else {
	nodes.push(pub.history.ReferedHistoryNode(-1, -1, "No history found", null, false, false, [], 1));
      }
    }
		
    return nodes;
  };
  
  pub.selectNodeLocal = null;
  pub.showMenuItems = function(){
    var localItem = document.getElementById("local");
		var switchToTab = document.getElementById("switchToTab");
    var openinnewtab = document.getElementById("openinnewtab");
    var node = pub.treeView.visibleData[pub.treeView.selection.currentIndex];
    if(node){
      var exists = com.wuxuan.fromwheretowhere.sb.urls.indexOf(node.url);
      pub.selectNodeLocal = exists;
      localItem.hidden = (exists == -1);
    }
		//check if the tab is opened already
		var foundTab = pub.UIutils.findTabByDocUrl(null, node.url);
    openinnewtab.hidden = (node==null || foundTab.tab!=null);
		switchToTab.hidden = (foundTab.tab==null);
		switchToTab.fromwheretowhere = {};
		switchToTab.fromwheretowhere.foundTab = foundTab;
		
    var selectedIndex = pub.UIutils.getAllSelectedIndex(pub.treeView);
    var propertyItem = document.getElementById("export-menu");
    propertyItem.hidden = (selectedIndex.length==0);
  };
  
  pub.showSearchMenuItems = function(){
    var findNextItem = document.getElementById("findNext");
    findNextItem.hidden = (pub.keywords=="" && Application.storage.get("currentURI", "")=="");
  };
	
  pub.openlocal = function(){
    var uri = com.wuxuan.fromwheretowhere.sb.getLocalURIfromId(com.wuxuan.fromwheretowhere.sb.ids[pub.selectNodeLocal]);
    window.open(uri);
  };
  
  pub.openlink = function(){
    pub.getURLfromNode(pub.treeView);
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
  
	//TODO: if node.level==0, no need to shift, but saving is limited
  pub.putNodeToLevel0 = function(node){
    var currentLevel = node.level;
    return pub.decreaseLevelandCollapse(node, currentLevel);
  };
  
  pub.getCurrentSelected = function(){
    var selectCount = pub.treeView.selection.count;
    var selectedIndex = pub.UIutils.getAllSelectedIndex(pub.treeView);
    //verify 
    if(selectCount!=selectedIndex.length){
      alert("Error when getting selected rows");
    }
    var selected = [];
    for(var i in selectedIndex){
      var node = pub.treeView.visibleData[selectedIndex[i]];
      //clean away id/pid from the node, as it's useless for other instances of FF
      selected.push(pub.history.clearReferedHistoryNode(pub.utils.cloneObject(node)));
    }
    return selected;
  };
  
	pub.openPropertyDialog = function(prop){
		var params = {inn:{property:prop}, out:null};       
    window.openDialog("chrome://FromWhereToWhere/content/propdialog.xul", "",
      "chrome, centerscreen, dialog, resizable=yes", params).focus();
	};
	
  /* for now there's no circular reference within nodes, so JSON has no problem.
    TOIMPROVE until there's built-in support, as it should make loop detection more elegant? */
  //if it's a container, but never opened before, then it has no children.
  //For now have to manually open it first to get all the children, and then "export the whole trace"
  pub.exportJSON = function() {
		var tosave = pub.getCurrentSelected();
    var json = JSON.stringify(tosave);
    pub.openPropertyDialog(json);
  };
  
	pub.exportHTML = function() {
		var tosave = pub.getCurrentSelected();
		var htmlSrc = pub.utils.exportHTML(tosave);
		pub.openPropertyDialog(htmlSrc);
	};
	
	pub.isSidebarFWTW = function(){
		var sidebarWindow = pub.mainWindow.document.getElementById("sidebar").contentWindow;
		var sidebarRef = "chrome://FromWhereToWhere/content/sidebar.xul".toLowerCase();
		return sidebarWindow.location.href == sidebarRef;
	};
	
  // recordType: 0 - from URI; 1 - from searching keywords; 2 - imported; -1 - invalid.
  // TODO: make constants!
  pub.saveNodetoLocal = function() {
    var select = pub.getCurrentSelected();
    var json = JSON.stringify(select);
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
			//id is null always, placeId isn't null unless it's imported
      } else if(select[0].placeId==null) {
        // imported: use the label of first top node as name for now
        // TODO: pick tags
				recordType = 2;
      }
      var saved = pub.localmanager.addRecord(recordType, recordName, recordUrl, searchTerm, currentURI, json, saveDate);
			if(saved!=-1){
				var savenote = document.getElementById("saved_note");
				savenote.value = "SAVED: "+recordName;
				document.getElementById("saved_notification").openPopup(null, "", 60, 50, false, false);
			}
			// if sidebar is open, close it first to save the sync trouble
			if (pub.isSidebarFWTW()) {
				//pub.mainWindow.toggleSidebar('viewEmptySidebar');
				//refresh the note view
				var ele = pub.mainWindow.document.getElementById("sidebar").contentDocument.getElementById("recordList");
				var treeView = ele.view;
				if(treeView==null){
				  //for 3.6.x
				  treeView = ele.wrappedJSObject.view;
				}
				//just to reset visibleData, seems this hack works
				treeView.setTree(null);
			} 
    }
  };
  
  //when the first node is "no result found", remove it first, otherwise FF freezes when the next node is collapsed
  pub.importNodes = function(){
    var json = window.prompt("Please paste the nodes' property (JSON format):", "[]");
    var newNodes = [];
    try{
      newNodes = JSON.parse(json);
    }catch(err){
      if(json && json!="[]"){
	alert("Input incomplete or corrupted:\n" + json);
      }
    }
    if(newNodes.length>0){
      if(pub.treeView.visibleData.length==1 && pub.treeView.visibleData[0].placeId == -1){
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
  	
	pub.timeInterpret = function(times){
		var feedback = "";
		for(var i in times){
			if(times[i].since!=-1){
				if(i!=0)
					feedback = feedback+" AND";
				feedback = feedback+" since "+(new Date(times[i].since));
			}
			if(times[i].till!=Number.MAX_VALUE){
				if(i!=0)
					feedback = feedback+" AND";
				feedback = feedback+" till "+(new Date(times[i].till));
			}
		}
		return feedback;
	};
	
	pub.buildFeedback = function(words, optional, excluded, site, time){
		var feedback = "No history found";
		if(words.length>0){
			feedback += " with all of ["+words+"],";
		}
		if(optional.length>0){
			feedback += " with any of ["+optional+"],";
		}
		if(excluded.length>0){
			feedback += " without " + excluded;
		}
		feedback+=" in title";
		if(site.length>0){
			feedback+=", AND url with "+site;
		}
		if(time.length>0){
			feedback+=", AND visit time"+pub.timeInterpret(time);
		}
		return feedback;
	};
	
	//TODO: call getIncludeExclude here, save passing arguments?
  pub.searchThread = function(threadID, query) {
    this.threadID = threadID;
    this.keywords = query.origkeywords;
    this.words = query.words;
		this.optional = query.optional;
    this.excluded = query.excluded;
		this.site = query.site;
		this.time = query.time;
		this.query = query;
  };
  
  pub.searchThread.prototype = {
    run: function() {
      try {
				var querytime = {};
        var topNodes = [];
        if(this.words.length!=0 ||  this.optional.length!=0){
          var allpids = [];
          // improve by search id from keywords directly instead of getting urls first
					if(pub.DEBUG)
						querytime.tmp = (new Date()).getTime();
					allpids = pub.history.searchIdbyKeywords(this.words, this.optional, this.excluded, this.site, this.time);
					if(pub.DEBUG){
						querytime.search = ((new Date()).getTime() - querytime.tmp);
						querytime.tmp = (new Date()).getTime();
						pub.history.querytime.search=0;
						pub.history.querytime.getParentTime=0;
						pub.history.querytime.indexof=0;
						pub.history.querytime.indextime=0;
						pub.history.querytime.bindexof=0;
						pub.history.querytime.bindextime=0;
						pub.history.querytime.getParentEasyTime=0;
						pub.history.querytime.getParentEasy=0;
						pub.history.querytime.getParentHardTime=0;
						pub.history.querytime.getParentHard=0;
					}
          pub.pidwithKeywords = [].concat(allpids);
          topNodes = pub.history.createParentNodesCheckDup(allpids, this.query);
					if(pub.DEBUG){
						querytime.parent = ((new Date()).getTime() - querytime.tmp);
						querytime.tmp = (new Date()).getTime();
					}
					//search in local notes, latest first
					//7 short records 1 long: 7ms; 7 short 11 long: 37ms; if site filter: 75ms
					//var start = (new Date()).getTime();
					var filtered = pub.localmanager.searchNotesbyKeywords(this.words, this.optional, this.excluded, this.site);
					//alert((new Date()).getTime()-start);
					for(var i in filtered){
						topNodes.splice(0,0,pub.putNodeToLevel0(filtered[i]));
					}
					if(pub.DEBUG){
						querytime.local = ((new Date()).getTime() - querytime.tmp);
						alert("search: "+querytime.search+" parent: "+querytime.parent+" local: "+querytime.local+
									"\n"+pub.history.querytime.search+" in "+pub.history.querytime.getParentTime+
									"\n"+pub.history.querytime.indexof + " in " + pub.history.querytime.indextime+
									"\n"+pub.history.querytime.bindexof + " in " + pub.history.querytime.bindextime+
									"\n"+pub.history.allKnownParentPids.length+
									"\nEasy parent: "+pub.history.querytime.getParentEasy+" in "+pub.history.querytime.getParentEasyTime+
									"\nHard parent: "+pub.history.querytime.getParentHard+" in "+pub.history.querytime.getParentHardTime);
					}
				}
				
				//refresh tree, remove all visibledata and add new ones
        pub.treeView.delSuspensionPoints(-1);
        if(this.words.length==0 && this.optional.length==0){
          alert("no keywords input");
          //cancel "searching..." after "OK", and redisplay the former result      
          pub.treeView.treeBox.rowCountChanged(0, pub.treeView.visibleData.length);
          return;
        }
        //when allPpids = null/[], show "no result with xxx", to distinguish with normal nothing found
				if(topNodes.length==0){
          var nodes = [];
          nodes.push(pub.history.ReferedHistoryNode(-1, -1, pub.buildFeedback(this.words, this.optional, this.excluded, this.site, this.time), null, false, false, [], 1));
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
    //alert(Application.storage.get("currentPage", false));
    pub.treeView.treeBox.rowCountChanged(0, -pub.treeView.visibleData.length);
    pub.treeView.addSuspensionPoints(-1, -1);
    pub.keywords = document.getElementById("keywords").value;
		pub.query = pub.utils.getIncludeExcluded(pub.keywords);
    pub.main.dispatch(new pub.searchThread(1, pub.query), pub.main.DISPATCH_NORMAL);
    Application.storage.set("currentURI", "");
  };
  
	pub.findNext = function(){
		//pub.treeView.toggleOpenState(0);
		pub.treeView.findNext();
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
      
    pub.aserv=Components.classes["@mozilla.org/atom-service;1"].
                getService(Components.interfaces.nsIAtomService);
    pub.main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
    //add here to check the top level nodes - ?
    com.wuxuan.fromwheretowhere.sb.urlInit();
    pub.localmanager = com.wuxuan.fromwheretowhere.localmanager;
    pub.localmanager.init();
		pub.utils = com.wuxuan.fromwheretowhere.utils;
		pub.topicTracker = com.wuxuan.fromwheretowhere.topicTracker;
		pub.history = com.wuxuan.fromwheretowhere.historyQuery;
		pub.history.init();
		pub.retrievedId = pub.history.getIdfromUrl(pub.currentURI);
		pub.UIutils = com.wuxuan.fromwheretowhere.UIutils;
		if(pub.topicTracker)
			pub.topicTracker.init();
    //document.getElementById("elementList").addEventListener("click", function (){getURLfromNode(treeView);}, false);
  }
  
  return pub;
}();