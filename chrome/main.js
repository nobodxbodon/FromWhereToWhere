$(function () {
  // select the tree container using jQuery
  $("#demo1").dynatree({
            onActivate: function(node) {
                // A DynaTreeNode object is passed to the activation handler
                // Note: we also get this event, if persistence is on, and the page is reloaded.
                //alert("You activated " + node.data.title);
                if( node.data.more) {
                    //alert("start from id="+node.data.minId);
                    model.searchNote(null, node.data.minId);
                }
                if( node.data.href ){
					// Open target
					window.open(node.data.href, node.data.target);
                    //window.location.href = node.data.href;
					// or open target in iframe
//                $("[name=contentFrame]").attr("src", node.data.href);
				}
            },
            onExpand: function(flag, node){
                node.visit(function(node){
                    node.expand(true);
                });
            },
            persist: true
        });
  /*if(!chrome)
    console.log("NO CHROME@$#)U(%RIFJDPOFPUHF");
  else
    console.log("chrome there");
  if(!chrome.history)
    console.log("no chrome history");
  else
    console.log("history there");
  if(!chrome.history.search)
    console.log("no chrome history search");
  else
    console.log("history search there");*/
    
  var treeRoot = $("#demo1").dynatree("getRoot");
  // Maps URLs to a count of the number of times the user typed that URL into
  // the omnibox.
  var urlToCount = {};
  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;
  
  
  var Set = function() {}
Set.prototype.add = function(o) {this[o] = true;}
Set.prototype.remove = function(o) {delete this[o];}

  var titles = {};
  var titleByVisitId = {}; //visitId->title
  var urlByVisitId = {};//visitId->url
  var referrByVisitId = {};//visitId -> referrerId
  var typeByVisitId={};
  var idByVisitId={};
  var historyByVisitId={};
  var children = [];
  
  /* exceptions: ignore these visitItems */
  /* need to take all visit items into account, as they all can be root (title empty, typed, etc) */
  var processVisits = function(url, title, historyId, visitItems) {
    //if(title && title!=""){
      
      for(var v in visitItems){
        var visitId = visitItems[v].visitId;
        /*console.log(visitId);
        
        if(visitId==58507)
          for(var e in visitItems[v])
            console.log(e);*/
        
        //ignore all 'reload' type
        if(visitItems[v].transition=="reload"){
          continue;
        }
        
        /*if(referrByVisitId[visitId]!=null)
          console.log(visitId+": "+referrByVisitId[visitId]);*/
        referrByVisitId[visitId]=visitItems[v].referringVisitId;
        idByVisitId[visitId]=visitItems[v].id;
        historyByVisitId[visitId]=historyId;
        urlByVisitId[visitId]=url;
        titleByVisitId[visitId]=title;
        typeByVisitId[visitId]=visitItems[v].transition;
        /*console.log(visitItems[v].visitTime +" "+visitItems[v].referringVisitId+url);*/
      }
    if (!--numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
    
  };
  
  //var rootSetByHistoryId= new Set();
  var roots = [];
  var walked = new Set();
  var links = {};
  // This function is called when we have the final list of URls to display.
  //TODO: infinite loop somewhere!
  var onAllVisitsProcessed = function() {
    /*for(var visitId in urlByVisitId){
      console.log(titleByVisitId[visitId]+" id:"+idByVisitId[visitId]+" "+visitId+" "+typeByVisitId[visitId]+" "+referrByVisitId[visitId]+" "+titleByVisitId[referrByVisitId[visitId]]+" id:"+idByVisitId[referrByVisitId[visitId]]);
    }*/
    var LIMIT=3;
    for(var visitId in urlByVisitId){
      //loop to get top root
      var i = 0;
      var currentVisitId=visitId;
      while(referrByVisitId[currentVisitId]!=null&&referrByVisitId[currentVisitId]!=0&&i<LIMIT){
        i++;
        
        if(currentVisitId in walked){
          continue;
        }
        if(links[referrByVisitId[currentVisitId]]==null)
          links[referrByVisitId[currentVisitId]]=[];
        links[referrByVisitId[currentVisitId]].push(currentVisitId);
        walked.add(currentVisitId);
        currentVisitId=referrByVisitId[currentVisitId];
        
        /*console.log(currentVisitId+" "+titleByVisitId[currentVisitId]+" <-- "+referrByVisitId[currentVisitId]+" "+titleByVisitId[referrByVisitId[currentVisitId]]);*/
        /*console.log(titleByVisitId[visitId]+" id:"+idByVisitId[visitId]+" "+visitId+" "+urlByVisitId[visitId]+" "+referrByVisitId[visitId]+" "+titleByVisitId[referrByVisitId[visitId]]+" id:"+idByVisitId[referrByVisitId[visitId]]);*/
      }
      if(!(currentVisitId in walked)){
        var historyId = historyByVisitId[currentVisitId];
        /*console.log("root:"+historyId+" visit:"+currentVisitId+" "+titleByVisitId[currentVisitId]+" url:"+urlByVisitId[currentVisitId]);*/
        walked.add(currentVisitId);
        roots.push(currentVisitId);
        /*if(!(historyId in rootSetByHistoryId)){
          rootSetByHistoryId.add(historyId);
          roots.push(currentVisitId);
        }*/
      }
      
    }
    
    var children = [];
    var lastUrl = "";
    var count=1;
    if(roots.length==0)
      return;
    
    var lastRoot = generateTree(roots[0]);
    lastUrl=lastRoot.href;
    if(roots.length==1){
      children.push(lastRoot);
      children.push(root);
      return;
    }
    for(var r=1;r<roots.length;r++){
      //group those that have same url continuously, shown times in front
      var root = generateTree(roots[r]);
      if(lastUrl==root.href){
        count++;
        continue;
      }else if(root.href==null){
        //ignore those with null url
        continue;
      }
      else{
        if(count!=1){
          lastRoot.title="("+count+") "+lastRoot.title;
        }
        count=1;
      }
      children.push(lastRoot);
      lastRoot = root;
      lastUrl=root.href;
    }
    
    treeRoot.addChild(children);
  }
  
  function notEmptyArray(array){
    if (array && array.length > 0)
      return true;
    return false;
  }

  function generateTree(visitId){
    var node={title:titleByVisitId[visitId],href:urlByVisitId[visitId]};
    /*console.log(visitId+" -> "+links[visitId]);*/
    if(notEmptyArray(links[visitId])){
      node.isFolder=true;
      node.children=[];
      for(var c in links[visitId])
        node.children.push(generateTree(links[visitId][c]));
    }
    return node;
  }
  
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 1;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
  chrome.history.search({
    'text': "",              // Return every history item....
    'startTime': oneWeekAgo  // that was accessed less than one week ago.
    //'maxResults':1
  },
  function(historyItems) {
    // For each history item, get details on all visits.
    
    for (var i = 0; i < historyItems.length; ++i) {
      var url = historyItems[i].url;
      var title = historyItems[i].title;
      var historyId = historyItems[i].id;
      for(var e in historyItems[i])
      /*console.log(title+" "+historyItems[i].id+" from:"+historyItems[i].fromId);*/
      var processVisitsWithUrl = function(url, title, historyId) {
        // We need the url of the visited item to process the visit.
        // Use a closure to bind the  url into the callback's args.
        return function(visitItems) {
          processVisits(url, title, historyId, visitItems);
        };
      };
      chrome.history.getVisits({url: url}, processVisitsWithUrl(url, title, historyId));
      numRequestsOutstanding++;
    }
    if (!numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
  });
  //console.log("after all");
  
});