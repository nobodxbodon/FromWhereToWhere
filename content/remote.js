
com.wuxuan.fromwheretowhere.remote = function(){
  var pub={};
  var URL = "http://fromwheretowhere.net/fwtw-svr/ajax.php";
  var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
  
	var DEBUG=false;
	pub.dalert = function(str){
		if(DEBUG)
			alert(str);
	}
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
  
	pub.processEach=function(func){
		return function(element, index, array){array[index]=func(array[index]);}
	};
	
  //TODO: can't search for terms containing '&': escape
  pub.getAll = function(keywords, topNodes, main){
    //var http = new XMLHttpRequest();
    var feedback = " when searching";
    xhr.open("POST", URL, true);

		keywords.words.forEach(pub.processEach(escape));
		keywords.optional.forEach(pub.processEach(escape));
		keywords.excluded.forEach(pub.processEach(escape));
		keywords.site.forEach(pub.processEach(escape));
    var jsonString = 'search=true&keywords='+JSON.stringify(keywords);//{"words":["spring"],"optional":[]}'//"load=true";//JSON.stringify(obj);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");//"application/json");//
    xhr.setRequestHeader("Content-Length",jsonString.length);
    xhr.onreadystatechange = function (oEvent) {  
      if (xhr.readyState === 4) {  
        if (xhr.status === 200) {
					pub.dalert(xhr.responseText);
          var response = JSON.parse(xhr.responseText);
          if(!response){
              pub.popNotification("Server returns inrecognizable response"+feedback+".");
              return;
          }else{
              if(response.error){
								dalert("res error: "+response.error);
                pub.popNotification("Server error"+feedback+": "+response.info);
                return;
              }else if(response.warn){
                pub.popNotification("Server info"+feedback+": "+response.info);
              }
          }
          var threads = response.threads;
					if(!threads){
						pub.popNotification("No one has shared such threads. You can be the first.");
						return;
					}
					//TODO: some content is null somehow...temp fix now! 'velocity...' in note for test
					threads=threads.filter(function(a){pub.dalert(a.content);return !(!a||!a.content||!a.content.length);});
					for(var i in threads){
						pub.dalert(threads[i].content);
						threads[i].content = JSON.parse(threads[i].content);
					}
					//threads.forEach(function(element, index, array){array[index].content=JSON.parse(array[index].content);});
					//threads=threads.filter(function(a){return !(!a.content[0]||!a.content[0].label||!a.content[0].label.length);})
					//find dup by first order then compare same neighbors
					pub.dalert(threads.length);
					var tids = pub.getDupThreads(threads);
					var dupIds = [];
					for(var i in tids){
						dupIds=dupIds.concat(tids[i]);
					}
					pub.dalert("dups:"+dupIds);
					if(tids.length!=0){
						pub.reportDupThreads(tids);
					}
					var nodes = [];
					for(var i in threads){
						if(dupIds.indexOf(threads[i].thread_id)<0){
							nodes=nodes.concat(threads[i].content);
						}
					}
					nodes = main.localmanager.filterTree(nodes, keywords.words, keywords.optional, keywords.excluded, keywords.site);
					nodes = pub.markRemote(nodes);
					pub.dalert(topNodes.length);
					if(topNodes[0].placeId==-1){
						pub.dalert("rm sus first");
						main.treeView.delSuspensionPoints(-1);
					}
					for(var i in nodes){
						topNodes.splice(0,0,main.putNodeToLevel0(pub.recursiveProcess(nodes[i], unescape)));
					}
					var updateLen = nodes.length;
					main.treeView.treeBox.rowCountChanged(0, updateLen);
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
  
	pub.recursiveProcess = function(node, func){
		if(!node)
			return node;
		if(node.label)
			node.label=func(node.label);
		if(node.children){
			for(var i in node.children){
				pub.recursiveProcess(node.children[i], func);
			}
		}
		return node;
	};
	
  pub.getDupThreads = function(arr) {
        if(!arr || !arr.length || arr.length<=1)
            return [];
        var a = arr.concat();
        a.sort(function(a,b){return a.content[0].label.length<b.content[0].label.length;});
        //only work for string type
        var origLen = a.length;
        var repeated = [];
        for(var i=1; i<origLen; ++i) {
		  //TODO: only compare the first one here
          if(pub.sameThreads(a[i].content[0],a[i-1].content[0])){
            if(!repeated[a[i].thread_id])
                repeated[a[i-1].thread_id] = [a[i].thread_id];
            else
                repeated[a[i-1].thread_id].push(a[i].thread_id);
            }
        }
        return repeated;
      };
  
  //if all the nodes are the same (label, url)
  pub.sameThreads = function(t1, t2){
	if(!t1||!t2||t1.label!=t2.label||t1.url!=t2.url)
	  return false;
	var ch1=t1.children;
	var ch2=t2.children;
	if(!ch1&&!ch2)
	  return true;
	if((!ch1&&ch2)||(!ch2&&ch1)||ch1.length!=ch2.length)
	  return false;
	for(var i=0;i<ch1.length;i++){
	  if(!pub.sameThreads(ch1[i], ch2[i]))
		return false;
	}
	return true;
  };
  
  return pub;
}();
  