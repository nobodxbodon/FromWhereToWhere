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
  if(!chrome)
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
    console.log("history search there");
    
  var treeRoot = $("#demo1").dynatree("getRoot");
  // Maps URLs to a count of the number of times the user typed that URL into
  // the omnibox.
  var urlToCount = {};
  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;
  
  var titles = {};
  
  var processVisits = function(url, title, visitItems) {
    if(!title || title=="")
      return;
    var node = {title:visitItems.length+" "+title,href:url};
    var referrs = [];
    for(var v in visitItems){
      if(visitItems[v].referringVisitId!=null && visitItems[v].transition=="link"){
        referrs.push(visitItems[v].referringVisitId);
      }
      console.log(visitItems[v].transition +" "+visitItems[v].referringVisitId+title);
    }
    
    if(referrs.length>0){
      node.children=referrs;
      node.isFolder=true;
    }
    treeRoot.addChild(node);
    
  };
  
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
  chrome.history.search({
    'text': '',              // Return every history item....
    'startTime': oneWeekAgo,  // that was accessed less than one week ago.
  },
  function(historyItems) {
    // For each history item, get details on all visits.
    
    for (var i = 0; i < historyItems.length; ++i) {
      var url = historyItems[i].url;
      var title = historyItems[i].title;
      var processVisitsWithUrl = function(url, title) {
        // We need the url of the visited item to process the visit.
        // Use a closure to bind the  url into the callback's args.
        return function(visitItems) {
          processVisits(url, title, visitItems);
        };
      };
      chrome.history.getVisits({url: url}, processVisitsWithUrl(url, title));
    }
  });
  console.log("after all");
});