$(function () {
  $("#submitKeywords").on('click', function(){
    var keywords = $("#keywords").val();
    console.log(keywords);
    searchByKeywords(keywords);
  });
  $("#keywords").keypress(function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            $('#submitKeywords').click();
            return false;
        } else {
            return true;
        }
    });
  // select the tree container using jQuery
  $("#demo1").dynatree({
    onActivate: function(node, event) {
      //alert(node.data.title);
      if( node.data.href ){
        //event.preventDefault();
        window.open(node.data.href, node.data.target);
      }
    },
      onCustomRender: function(node) {
        // Render title as columns
        if(node.data.lastVisitTime==null){
          // Default rendering
          return false;
        }
        
        var html = "<a class='dynatree-title' href='"+node.data.href+"'>";
        //for(var i=0; i<cols.length; i++){
          html += "<span class='td'>" + node.data.title + "</span>";
          html += "<span class='td'>" + node.data.lastVisitTime + "</span>";
        //}
        return html + "</a>";
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
  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;
  
  
  var Set = function() {}
Set.prototype.add = function(o) {this[o] = true;}
Set.prototype.remove = function(o) {delete this[o];}

  var titleByVisitId = {}; //visitId->title
    var urlByVisitId = {};//visitId->url
    var referrByVisitId = {};//visitId -> referrerId
    var typeByVisitId={};
    var idByVisitId={};
    var historyByVisitId={};
    var timeByVisitId={};
    var children = [];
  /* exceptions: ignore these visitItems */
  /* need to take all visit items into account, as they all can be root (title empty, typed, etc) */
  var processVisits = function(url, title, historyId, visitItems) {
    
      //filter self by url
    if(url.indexOf("fromwheretowhere_threads.html")==-1){
      for(var v in visitItems){
        var visitId = visitItems[v].visitId;
        /*console.log(visitId);
        
        if(visitId==58507)
          for(var e in visitItems[v])
            console.log(e);*/
        
        //ignore all 'reload' type
        /*if(visitItems[v].transition=="reload"){
          continue;
        }*/
        
        /*if(referrByVisitId[visitId]!=null)
          console.log(visitId+": "+referrByVisitId[visitId]);*/
        referrByVisitId[visitId]=visitItems[v].referringVisitId;
        idByVisitId[visitId]=visitItems[v].id;
        historyByVisitId[visitId]=historyId;
        urlByVisitId[visitId]=url;
        titleByVisitId[visitId]=title;
        typeByVisitId[visitId]=visitItems[v].transition;
        timeByVisitId[visitId]=visitItems[v].visitTime;
        //console.log("visitid:"+visitId+" <- "+visitItems[v].referringVisitId+" title:"+title+" url:"+url);
      }
    }
    if (!--numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
    
  };
  
  // This function is called when we have the final list of URls to display.
  //TODO: infinite loop somewhere!
  var onAllVisitsProcessed = function() {
    var roots = [];
    var walked = new Set();
    var links = {};
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
        
        //visitId can be wrong: no url/title, maybe a redirect? so if it's not urlByVisitId, it's invalid, and be discarded for now
        if(!(referrByVisitId[currentVisitId] in urlByVisitId))
          break;
        
        if(links[referrByVisitId[currentVisitId]]==null)
          links[referrByVisitId[currentVisitId]]=[];
        //console.log("add "+currentVisitId+"<-"+referrByVisitId[currentVisitId]);
        links[referrByVisitId[currentVisitId]].push(currentVisitId);
        walked.add(currentVisitId);
        currentVisitId=referrByVisitId[currentVisitId];
        
        //console.log(currentVisitId+" "+titleByVisitId[currentVisitId]+" <-- "+referrByVisitId[currentVisitId]+" "+titleByVisitId[referrByVisitId[currentVisitId]]);
        /*console.log(titleByVisitId[visitId]+" id:"+idByVisitId[visitId]+" "+visitId+" "+urlByVisitId[visitId]+" "+referrByVisitId[visitId]+" "+titleByVisitId[referrByVisitId[visitId]]+" id:"+idByVisitId[referrByVisitId[visitId]]);*/
      }
      if(!(currentVisitId in walked) && (currentVisitId in urlByVisitId)){
        var historyId = historyByVisitId[currentVisitId];
        //console.log("root:"+historyId+" visit:"+currentVisitId+" "+titleByVisitId[currentVisitId]+" url:"+urlByVisitId[currentVisitId]);
        walked.add(currentVisitId);
        roots.push(currentVisitId);
        /*if(!(historyId in rootSetByHistoryId)){
          rootSetByHistoryId.add(historyId);
          roots.push(currentVisitId);
        }*/
      }
      
    }
    console.log(roots.length);
    var children = [];
    var lastUrl = "";
    var count=1;
    if(roots.length==0)
      return;
    
    var lastRoot = generateTree(roots[0], links);
    lastUrl=lastRoot.href;
    if(roots.length==1){
      children.push(lastRoot);
      children.push(root);
      return;
    }
    //in reverse order, to make latest on top
    for(var r=roots.length-1;r>=1;r--){
      //group those that have same url continuously, shown times in front
      var root = generateTree(roots[r], links);
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
    treeRoot.removeChildren();
    console.log("remove all");
    treeRoot.addChild(children);
  }
  
  function notEmptyArray(array){
    if (array && array.length > 0)
      return true;
    return false;
  }

  function generateTree(visitId, links){
    var node={title:titleByVisitId[visitId],lastVisitTime:new Date(timeByVisitId[visitId]),href:urlByVisitId[visitId]};
    /*console.log(visitId+" -> "+links[visitId]);*/
    if(notEmptyArray(links[visitId])){
      node.isFolder=true;
      node.children=[];
      for(var c in links[visitId])
        node.children.push(generateTree(links[visitId][c], links));
    }
    return node;
  }
  
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 1;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
  
  /* search by keywords, only show the referrers; when keywords is empty, show a week's history */
  var searchByKeywords = function(keywords){
    //init the maps
    titleByVisitId = {}; //visitId->title
    urlByVisitId = {};//visitId->url
    referrByVisitId = {};//visitId -> referrerId
    typeByVisitId={};
    idByVisitId={};
    historyByVisitId={};
    timeByVisitId={};
    children = [];
    //init ends
    
    var searchOptions = {
      'text': keywords,              // Return every history item....
      'startTime': 0,
      'maxResults':0
    };
    if(keywords==''){
      searchOptions.startTime = oneWeekAgo;
      searchOptions.text = "";
    }
    console.log(searchOptions);
  chrome.history.search(searchOptions,
  function(historyItems) {
    // For each history item, get details on all visits.
    console.log("history number:"+historyItems.length);
    for (var i = 0; i < historyItems.length; ++i) {
      var url = historyItems[i].url;
      var title = historyItems[i].title;
      var historyId = historyItems[i].id;
      
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
  }
  
  searchByKeywords("");
  //console.log("after all");
  
});