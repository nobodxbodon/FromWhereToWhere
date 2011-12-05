
com.wuxuan.fromwheretowhere.remote = function(){
  var pub={};
  var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
    
  pub.addThread = function(subject, body){
    xhr.open("POST", "http://127.0.0.1/fwtw-svr/ajax.php", true);

    var jsonString = 'add=true&subject='+escape(subject)+'&body='+escape(body);//{"words":["spring"],"optional":[]}'//"load=true";//JSON.stringify(obj);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");//"application/json");//
    //alert(jsonString);
    xhr.setRequestHeader("Content-Length",jsonString.length);
    xhr.onreadystatechange = function (oEvent) {  
        if (xhr.readyState === 4) {  
          if (xhr.status === 200) {  
            var response = JSON.parse(xhr.responseText);
            if(!response){
                pub.popNotification("Server returns inrecognizable response.");
                return;
            }else{
                if(response.error){
                    pub.popNotification("Server error: "+response.info);
                    return;
                }else if(response.warn){
                    pub.popNotification("Server info: "+response.info);
                }
            }
            pub.popNotification("SHARED: "+subject);
          } else {  
            pub.popNotification("Server returns error: "+xhr.statusText);  
          }  
        }
    };
    xhr.send(jsonString);
  };
  
  //TODO: can't search for terms containing '&': escape
  pub.getAll = function(keywords, topNodes, main){
    //var http = new XMLHttpRequest();
    
    xhr.open("POST", "http://127.0.0.1/fwtw-svr/ajax.php", true);

    var jsonString = 'search=true&keywords='+JSON.stringify(keywords);//{"words":["spring"],"optional":[]}'//"load=true";//JSON.stringify(obj);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");//"application/json");//
    xhr.setRequestHeader("Content-Length",jsonString.length);
    xhr.onreadystatechange = function (oEvent) {  
        if (xhr.readyState === 4) {  
          if (xhr.status === 200) {  
            var response = JSON.parse(xhr.responseText);
            if(!response){
                pub.popNotification("Server returns inrecognizable response.");
                return;
            }else{
                if(response.error){
                    pub.popNotification("Server error: "+response.info);
                    return;
                }else if(response.warn){
                    pub.popNotification("Server info: "+response.info);
                }
            }
            var threads = response.threads;
            var nodes = [];
            for(var i in threads){
                nodes=nodes.concat(JSON.parse(threads[i].content));
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
            pub.popNotification("Server returns error: "+xhr.statusText);  
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
  
  return pub;
}();
  