
com.wuxuan.fromwheretowhere.remote = function(){
  var pub={};
  var URL = "http://fromwheretowhere.net/fwtw-svr/ajax.php";
  var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
    
  pub.addThread = function(subject, body){
	var feedback = " when sharing";
    xhr.open("POST", URL, true);

    var jsonString = 'add=true&subject='+escape(subject)+'&body='+escape(body);//{"words":["spring"],"optional":[]}'//"load=true";//JSON.stringify(obj);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");//"application/json");//
    //alert(jsonString);
    xhr.setRequestHeader("Content-Length",jsonString.length);
    xhr.onreadystatechange = function (oEvent) {  
        if (xhr.readyState === 4) {  
          if (xhr.status === 200) {  
            var response = JSON.parse(xhr.responseText);
            if(!response){
                pub.popNotification("Server returns inrecognizable response"+feedback+".");
                return;
            }else{
                if(response.error){
                    pub.popNotification("Server error"+feedback+": "+response.info);
                    return;
                }else if(response.warn){
                    pub.popNotification("Server info"+feedback+": "+response.info);
                }
            }
            pub.popNotification("SHARED: "+subject);
          } else {  
            pub.popNotification("Server returns error"+feedback+": "+xhr.statusText);  
          }  
        }
    };
    xhr.send(jsonString);
  };
  
  //TODO: can't search for terms containing '&': escape
  pub.getAll = function(keywords, topNodes, main){
    //var http = new XMLHttpRequest();
    var feedback = " when searching";
    xhr.open("POST", URL, true);

    var jsonString = 'search=true&keywords='+JSON.stringify(keywords);//{"words":["spring"],"optional":[]}'//"load=true";//JSON.stringify(obj);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");//"application/json");//
    xhr.setRequestHeader("Content-Length",jsonString.length);
    xhr.onreadystatechange = function (oEvent) {  
        if (xhr.readyState === 4) {  
          if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            if(!response){
                pub.popNotification("Server returns inrecognizable response"+feedback+".");
                return;
            }else{
                if(response.error){
                    pub.popNotification("Server error"+feedback+": "+response.info);
                    return;
                }else if(response.warn){
                    pub.popNotification("Server info"+feedback+": "+response.info);
                }
            }
            var threads = response.threads;
			//TODO: some content is null somehow...temp fix now! 'velocity...' in note for test
			threads=threads.filter(function(a){return !(!a||!a.content||!a.content.length);});
			alert(threads.length);
			//find dup by first order then compare same neighbors
            var tids = pub.getDupThreads(threads);
            var dupIds = [];
            for(var i in tids){
                dupIds=dupIds.concat(tids[i]);
            }
			alert(dupIds);
            if(tids.length!=0){
                pub.reportDupThreads(tids);
            }
            var nodes = [];
            for(var i in threads){
                if(dupIds.indexOf(threads[i].thread_id)<0){
				  nodes=nodes.concat(JSON.parse(threads[i].content));
				}
            }
            nodes = main.localmanager.filterTree(nodes, keywords.words, keywords.optional, keywords.excluded, keywords.site);
            nodes = pub.markRemote(nodes);
            for(var i in nodes){
				topNodes.splice(0,0,main.putNodeToLevel0(nodes[i]));
                //alert(nodes[i].label);
			}
            var updateLen = nodes.length;
            //alert(updateLen);
            main.treeView.treeBox.rowCountChanged(0, updateLen);
            //alert(origLen+" -> "+updateLen+":::"+JSON.stringify(nodes));
            //callback();
          } else {  
            pub.popNotification("Server returns error"+feedback+": "+xhr.statusText);  
          }  
        }
    };
    xhr.send(jsonString);
  };
  
  pub.reportDupThreads = function(tids){
	var feedback = " reporting duplicate threads";
    xhr.open("POST", URL, true);

    var jsonString = 'report_dup=true&dups='+JSON.stringify(tids);//{"words":["spring"],"optional":[]}'//"load=true";//JSON.stringify(obj);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");//"application/json");//
    //alert(jsonString);
    xhr.setRequestHeader("Content-Length",jsonString.length);
    xhr.onreadystatechange = function (oEvent) {  
        if (xhr.readyState === 4) {  
          if (xhr.status === 200) {  
            var response = JSON.parse(xhr.responseText);
            if(!response){
                pub.popNotification("Server returns inrecognizable response"+feedback+".");
                return;
            }else{
                if(response.error){
                    pub.popNotification("Server error"+feedback+": "+response.info);
                    return;
                }else if(response.warn){
                    pub.popNotification("Server info"+feedback+": "+response.info);
                }
            }
            //pub.popNotification("SHARED: "+subject);
          } else {  
            pub.popNotification("Server returns error"+feedback+": "+xhr.statusText);  
          }  
        }
    };
    xhr.send(jsonString);
  };
						 
  pub.popNotification = function(txt){
    var addnote = document.getElementById("saved_note");
    if(!addnote){
      addnote = document.getElementById("shared_note");
      addnote.value = txt;
      document.getElementById("shared_notification").openPopup(null, "", 60, 50, false, false);
    }else{
	  addnote.value = txt;
	  document.getElementById("saved_notification").openPopup(null, "", 60, 50, false, false);
    }
  };
  
  pub.markRemote = function(threads){
    for(var i in threads){
        //TODO: change to style later
        threads[i].label = "[SHARED] "+threads[i].label;
    }
    return threads;
  };
  
  pub.getDupThreads = function(arr) {
        if(!arr || !arr.length || arr.length<=1)
            return [];
        var a = arr.concat();
        a.sort(function(a,b){return a.content.length<b.content.length;});
        //only work for string type
        var origLen = a.length;
        var repeated = [];
        for(var i=1; i<origLen; ++i) {
          if(a[i].content == a[i-1].content){
            if(!repeated[a[i].thread_id])
                repeated[a[i-1].thread_id] = [a[i].thread_id];
            else
                repeated[a[i-1].thread_id].push(a[i].thread_id);
            }
        }
        return repeated;
      };
	  
  return pub;
}();
  