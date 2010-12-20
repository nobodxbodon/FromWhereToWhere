// save to local .sqlite, support management (query, delete, rename, etc.)
  
com.wuxuan.fromwheretowhere.localmanager = function(){
  var pub={};
  
  pub.LOCALRECORDFILE = "fwtw_local_record.sqlite";
  pub.RECORDTABLENAME = "localRecord_0_20_0";
  
  pub.getBrowserWindow = function(){
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]  
                   .getService(Components.interfaces.nsIWindowMediator);  
    var enumerator = wm.getEnumerator("navigator:browser");
    var i = 0;
    while(enumerator.hasMoreElements()) {  
      var win = enumerator.getNext();  
      if(win==pub.mainWindow){
        alert("the top windows is a browser for sure!");
      }else{
        alert(i++);
      }
    }
  };

  pub.localRecord = function(){
    var file = Components.classes["@mozilla.org/file/directory_service;1"]  
                      .getService(Components.interfaces.nsIProperties)  
                      .get("ProfD", Components.interfaces.nsIFile);  
    file.append(pub.LOCALRECORDFILE);  
   
    var storageService = Components.classes["@mozilla.org/storage/service;1"]  
                         .getService(Components.interfaces.mozIStorageService);  
    return storageService.openDatabase(file);
  }();
  
  //for now no automatic merging. No checking for duplicate content (json). 
  pub.addRecord = function(type, name, url, term, currenturi, content, date){
    var statement = pub.localRecord.createStatement("INSERT INTO " + pub.RECORDTABLENAME + "(type, name, url, searchterm, currentURI, content, savedate) VALUES (:type, :name, :url, :term, :currenturi, :content, :date)")
    statement.params.type = type;
    statement.params.name = name;
    statement.params.content = content;
    statement.params.url = url;
    statement.params.date = date;
    //alert("statement done");
    if(term!=""){
      statement.params.term = term;
    } else if(currenturi!=""){
      statement.params.currenturi = currenturi;
    }
    
    try {
      statement.executeStep();
      //alert("saved");
    } 
    catch (e) {
      alert("add record exception!");
      statement.reset();
    }
  };
  
  //one for now
  pub.deleteRecords = function(recordIds){
    var statement = pub.localRecord.createStatement("DELETE FROM " + pub.RECORDTABLENAME + " WHERE rowid=:recordIds")
    statement.params.recordIds = recordIds;
    
    try {
      statement.executeStep();
      //alert("saved");
    } 
    catch (e) {
      alert("delete record exception!");
      statement.reset();
    }
  };
  
  pub.queryAll = function(){
    var statement = pub.localRecord.createStatement("SELECT rowid,* from " + pub.RECORDTABLENAME);
    var items = [];
    try {
      while (statement.executeStep()) {
        var item = {};
        item.id = statement.getInt64(0);
        item.name = statement.getString(2);
        item.url = statement.getString(3);
        item.date = statement.getInt64(7);
        items.push(item);
      }
      statement.reset();
      return items;  
    } 
    catch (e) {
      statement.reset();
    }
  };
  
  pub.getNodesRawfromURI = function(uri){
    var statement = pub.localRecord.createStatement("SELECT content from " + pub.RECORDTABLENAME + " where content LIKE '%" + uri + "%'");
    var nodes = [];
    try {
      while (statement.executeStep()) {
        nodes.push(statement.getString(0));
      }
      statement.reset();
      return nodes;  
    } 
    catch (e) {
      statement.reset();
    }
  };
  
  pub.searchNotesbyKeywords = function(words, excluded, site){
		//add site filter
		var term = pub.RECORDTABLENAME;
		if(site.length!=0){
      for(var i = site.length-1; i>=0; i--){
        term = "(SELECT content FROM " + term + " WHERE content LIKE '%" + site[i] + "%')";
      }
    }

    if(words.length!=0){
      for(var i = words.length-1; i>=0; i--){
        term = "SELECT content FROM " + term + " WHERE content LIKE '%" + words[i] + "%'";
      }
    }
    //alert(term);
    var statement = pub.localRecord.createStatement(term);
    var nodes = [];
    try {
      while (statement.executeStep()) {
        //decode, walk through each node for confirmation
        var str = statement.getString(0);
        //alert(str);
        var maybeNotes = pub.nativeJSON.decode(str);
        nodes = nodes.concat(pub.walkAll(maybeNotes, words, excluded, site));
      }
      statement.reset();
      return nodes;  
    } 
    catch (e) {
      statement.reset();
    }
  };
  
  //TODO: index to speed up
  pub.walkAll = function(maybes, words, excluded, site){
    for(var i in maybes){
      if(pub.walkNode(maybes[i], words, excluded, site).length==0){
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
      if(label.indexOf(words[w].toLowerCase())==-1){
        return pub.walkAll(maybe.children, words, excluded, site);
      }
    }
    for(var e in excluded){
      if(label.indexOf(excluded[e].toLowerCase())!=-1){
        return pub.walkAll(maybe.children, words, excluded, site);
      }
    }
    for(var s in site){
      if(url.indexOf(site[s].toLowerCase())==-1){
        return pub.walkAll(maybe.children, words, excluded, site);
      }
    }
    return [].push(maybe);
  };
		//TODO: seems dup condition, to simplify
    /*var excludeTerm = siteTerm;
    if(excluded.length!=0){
      for(var i = excluded.length-1; i>=0; i--){
        if(i==excluded.length-1){
          excludeTerm = "(SELECT * FROM " + excludeTerm + " WHERE TITLE NOT LIKE '%" + excluded[i] + "%')";
        } else {
          excludeTerm = "(SELECT * FROM " + excludeTerm + " WHERE TITLE NOT LIKE '%" + excluded[i] + "%')";
        }
      }
    }
    
  };*/
  
  pub.getNodeContent = function(rowid){
    var statement = pub.localRecord.createStatement("SELECT content from " + pub.RECORDTABLENAME + " where rowid=" + rowid);
    try {
      if (statement.executeStep()) {
        return statement.getString(0);
      }
      statement.reset();
      return items;  
    } 
    catch (e) {
      statement.reset();
    }
  };
  
  //built-in rowid, can't guarantee same order as savedate, if renaming is allowed
  pub.init = function(){
    pub.nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
    //TODO: add pre-processing to check table from former version if format changes
    var statement = pub.localRecord.createStatement("CREATE TABLE IF NOT EXISTS " + pub.RECORDTABLENAME + "(type INTEGER, name STRING, url STRING, searchterm STRING, currentURI STRING, content STRING, savedate INTEGER)");
    try {
      if (statement.executeStep()) {
        alert("table opened");
      }
      statement.reset();
    } 
    catch (e) {
      alert(e);
      statement.reset();
    }
  };
  
  return pub;
}();

