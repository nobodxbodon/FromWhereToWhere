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
    //TODO: add pre-processing to check table from former version if format changes
    pub.localRecord.executeSimpleSQL("CREATE TABLE IF NOT EXISTS " + pub.RECORDTABLENAME + "(type INTEGER, name STRING, url STRING, searchterm STRING, currentURI STRING, content STRING, savedate INTEGER)");
    document.getElementById("recordList").view = pub.treeView;
    };
    
  pub.openNode = function(){
    alert(pub.getNodeContent(pub.treeView.visibleData[pub.treeView.selection.currentIndex].id));    
  };
  
  pub.treeView = {
  // have to separate the looks of node from the content!!!!!!
  
    visibleData : pub.queryAll(),
  
    treeBox: null,  
    selection: null,  
    
    get rowCount()                     { return this.visibleData.length; },
    
    setTree: function(treeBox){
      this.treeBox = treeBox;
    },
    
    getCellText: function(idx, column) {
      if(this.visibleData[idx]) {
        if(column.id == "title") {
          return this.visibleData[idx].name;
        } else if (column.id == "date") {
          return new Date(this.visibleData[idx].date);
        } else {
          return "NotDefined";
        }
      }
    },
      
    isContainer: function(idx){
      return false;
    },  
    isContainerOpen: function(idx)     { return false; },  
    isContainerEmpty: function(idx)    { return false; },  
    isSeparator: function(idx)         { return false; },  
    isSorted: function()               { return false; },  
    isEditable: function(idx, column)  { return false; },  
    
    getParentIndex: function(idx) {
      return -1;
    },  
    getLevel: function(idx) {
      return 0;
    },  
    
    addSuspensionPoints: function(level, idx) {
      var sp = pub.ReferedHistoryNode(-1, -1, "searching...", null, false, false, [], level+1);
      this.visibleData.splice(idx+ 1, 0, sp);
      this.treeBox.rowCountChanged(idx + 1, 1);
    },
    delSuspensionPoints: function(idx) {
      this.visibleData.splice(idx+ 1, 1);
      this.treeBox.rowCountChanged(idx + 1, -1);
    },
    
    toggleOpenState: function(idx) {   
    },  
    
    getImageSrc: function(idx, column) {
      //can't access .main like it's global
      /*if(column.id == "title") {
        return com.wuxuan.fromwheretowhere.main.getImagefromUrl(this.visibleData[idx].url);
      }*/
    },
    
    getProgressMode : function(idx,column) {},  
    getCellValue: function(idx, column) {},  
    cycleHeader: function(col, elem) {},  
    selectionChanged: function() {},  
    cycleCell: function(idx, column) {},  
    performAction: function(action) {},  
    performActionOnCell: function(action, index, column) {},  
    getRowProperties: function(idx, column, prop) {},  
    
    getCellProperties: function(row,col,props){
    },
    
    getColumnProperties: function(column, element, prop) {},
    click: function() {}
  };

  return pub;
}();

