$(function () {
          // TO CREATE AN INSTANCE
          // select the tree container using jQuery
          $("#demo1")
              // call `.jstree` with the options object
              .jstree({
                  // the `plugins` array allows you to configure the active plugins on this instance
                  "plugins" : ["themes","html_data","ui","crrm"],//,"hotkeys"],
                  // each plugin you have included can have its own config object
                  "core" : { "initially_open" : [ "phtml_1" ] }
                  // it makes sense to configure a plugin only if overriding the defaults
              })
              // EVENTS
              // each instance triggers its own events - to process those listen on the container
              // all events are in the `.jstree` namespace
              // so listen for `function_name`.`jstree` - you can function names from the docs
              .bind("loaded.jstree", function (event, data) {
                  // you get two params - event & data - check the core docs for a detailed description
              });
          // INSTANCES
          // 1) you can call most functions just by selecting the container and calling `.jstree("func",`
          //setTimeout(function () { $("#demo1").jstree("set_focus"); }, 500);
          // with the methods below you can call even private functions (prefixed with `_`)
          // 2) you can get the focused instance using `$.jstree._focused()`. 
          //setTimeout(function () { $.jstree._focused().select_node("#phtml_1"); }, 1000);
          // 3) you can use $.jstree._reference - just pass the container, a node inside it, or a selector
          //setTimeout(function () { $.jstree._reference("#phtml_1").close_node("#phtml_1"); }, 1500);
          // 4) when you are working with an event you can use a shortcut
          //$("#demo1").bind("open_node.jstree", function (e, data) {
              // data.inst is the instance which triggered this event
          //    data.inst.select_node("#phtml_2", true);
          //});
          //setTimeout(function () { $.jstree._reference("#phtml_1").open_node("#phtml_1"); }, 2500);
          console.log("going search history");
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
          var processVisits = function(url, visitItems) {
            //alert("process visit");
            for (var i = 0, ie = visitItems.length; i < ie; ++i) {
              // Ignore items unless the user typed the URL.
              if (visitItems[i].transition != 'typed') {
                console.log(url+" isn't typed.");
              }
        
              else{
                console.log(url);
                $("#demo1").jstree("create","#phtml_1","first",url); 
              }
            }
        
            // If this is the final outstanding call to processVisits(),
            // then we have the final results.  Use them to build the list
            // of URLs to show in the popup.
            //if (!--numRequestsOutstanding) {
            //  onAllVisitsProcessed();
            //}
          };
          
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
          //alert(oneWeekAgo);
          chrome.history.search({
            'text': '',              // Return every history item....
            'startTime': oneWeekAgo  // that was accessed less than one week ago.
            //maxResults:10
          },
          function(historyItems) {
            //alert("in history callback: ");//+historyItems.length);
            // For each history item, get details on all visits.
            for (var i = 0; i < historyItems.length; ++i) {
              var url = historyItems[i].url;
              var processVisitsWithUrl = function(url) {
                // We need the url of the visited item to process the visit.
                // Use a closure to bind the  url into the callback's args.
                return function(visitItems) {
                  processVisits(url, visitItems);
                  //alert("to process visit");
                };
              };
              chrome.history.getVisits({url: url}, processVisitsWithUrl(url));
              //numRequestsOutstanding++;
            }
            //if (!numRequestsOutstanding) {
            //  onAllVisitsProcessed();
            //}
          });
          console.log("after all");
      });