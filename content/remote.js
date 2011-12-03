
com.wuxuan.fromwheretowhere.remote = function(){
  var pub={};
  
  pub.getAll = function(keywords, topNodes, main){
    //var http = new XMLHttpRequest();
    var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
    
    xhr.open("POST", "http://127.0.0.1/fwtw-svr/ajax.php", true);

    var jsonString = 'search=true&keywords='+JSON.stringify(keywords);//{"words":["spring"],"optional":[]}'//"load=true";//JSON.stringify(obj);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");//"application/json");//
    xhr.setRequestHeader("Content-Length",jsonString.length);
    xhr.onreadystatechange = function (oEvent) {  
        if (xhr.readyState === 4) {  
          if (xhr.status === 200) {  
            var response = JSON.parse(xhr.responseText);
            var threads = response.threads;
            var nodes = [];
            for(var i in threads){
                nodes=nodes.concat(JSON.parse(threads[i].content));
            }
            nodes = main.localmanager.filterTree(nodes, keywords.words, keywords.optional, keywords.excluded, keywords.site);
            nodes = pub.markRemote(nodes);
            var origLen = topNodes.length;
            for(var i in nodes){
				topNodes.splice(0,0,main.putNodeToLevel0(nodes[i]));
                //alert(nodes[i].label);
			}
            var updateLen = topNodes.length;
            //alert(origLen+" -> "+updateLen+":::"+JSON.stringify(nodes));
            //callback();
          } else {  
            alert("Error", xhr.statusText);  
          }  
        }/*else{
            alert("not ready: "+xhr.readyState);
        }*/
    };
    xhr.send(jsonString);
    //http.send(JSON.stringify({"load":"true"}));
    /*alert(body);
    xhr.send(body);*/
  };
  
  pub.markRemote = function(threads){
    for(var i in threads){
        //TODO: change to style later
        threads[i].label = "[REMOTE] "+threads[i].label;
    }
    return threads;
  };
  
  pub.useHttpResponse = function(http){
    if(http.status == 200)  
        alert(http.responseText); 
    if(http.readyState == 4)
    {
        //alert(http.readystate);
        alert("OMG IT WORKS!!!");
    }else{
        alert("wth is readystate: "+http.readyState);
    }
  }
  
  return pub;
}();
  