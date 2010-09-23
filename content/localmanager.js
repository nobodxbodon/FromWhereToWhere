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
  pub.RECORDTABLENAME = "localRecord";
  
  pub.localRecord = function(){
    var file = Components.classes["@mozilla.org/file/directory_service;1"]  
                      .getService(Components.interfaces.nsIProperties)  
                      .get("ProfD", Components.interfaces.nsIFile);  
    file.append(pub.LOCALRECORDFILE);  
   
    var storageService = Components.classes["@mozilla.org/storage/service;1"]  
                         .getService(Components.interfaces.mozIStorageService);  
    return storageService.openDatabase(file);
  }();
  
  pub.addRecord = function(type, name, content){
    var statement = pub.localRecord.createStatement("INSERT INTO " + pub.RECORDTABLENAME + "(type, name, content) VALUES (:type, :name, :content)")
    statement.params.type = type;
    statement.params.name = name;
    statement.params.content = content;
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
    var item = {};
    var items = [];
    try {
      while (statement.executeStep()) {
        item.type = statement.getInt32(0);
        item.name = statement.getString(1);
        item.content = statement.getString(2);
        items.push(item);
      }
      statement.reset();
      return items;  
    } 
    catch (e) {
      statement.reset();
    }
  };
  
  pub.init = function(){
    pub.localRecord.executeSimpleSQL("CREATE TABLE IF NOT EXISTS " + pub.RECORDTABLENAME + " (type INTEGER, name STRING, content STRING)");
  };
  
  return pub;
}();

