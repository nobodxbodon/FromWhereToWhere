// save to local .sqlite, support management (query, delete, rename, etc.)
if(!com)
  var com={};
  
if(!com.wuxuan)
  com.wuxuan={};

if(!com.wuxuan.fromwheretowhere)
  com.wuxuan.fromwheretowhere = {};
  
com.wuxuan.fromwheretowhere.localmanager = function(){
  var pub={};
  
  pub.LOCALRECORDFILE = "fwtw_local_record.sqlite";
  pub.RECORDTABLENAME = "localRecord_0_20_0";
  
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
    if(term!=""){
      statement.params.term = term;
    } else if(currenturi!=""){
      statement.params.currenturi = currenturi;
    }
    
    try {
      statement.executeStep();
    } 
    catch (e) {
      alert("add record exception!");
      statement.reset();
    }
  };
  
  pub.queryAll = function(){
    var statement = pub.localRecord.createStatement("SELECT * from " + pub.RECORDTABLENAME);
    var items = [];
    try {
      while (statement.executeStep()) {
        items.push(statement.getString(1));
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
    //TODO: add pre-processing to check table from former version if format changes
    pub.localRecord.executeSimpleSQL("CREATE TABLE IF NOT EXISTS " + pub.RECORDTABLENAME + "(type INTEGER, name STRING, url STRING, searchterm STRING, currentURI STRING, content STRING, savedate INTEGER)");
  };
  
  return pub;
}();

