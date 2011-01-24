com.wuxuan.fromwheretowhere.stats = function(){
  var pub={};
  
  pub.all=function(){
    
  };
  
  pub.openPlacesDatabase = function(){
    var db = Components.classes["@mozilla.org/browser/nav-history-service;1"].  
                      getService(Components.interfaces.nsPIPlacesDatabase).DBConnection;  
    return db;
  };
  
  pub.mDBConn = pub.openPlacesDatabase();
  
  pub.getAllTitles = function(){
    //SELECT * FROM moz_places where title LIKE '%sqlite%';
    //NESTED in reverse order, with the assumption that the word in front is more frequently used, thus return more items in each SELECT
    
		var siteTerm = "moz_places";
    var term = "SELECT title FROM "+siteTerm;//+" WHERE id<10000";
    var statement = pub.mDBConn.createStatement(term);
    return com.wuxuan.fromwheretowhere.main.queryAll(statement, "str", 0);
  };
  
  pub.searchThread = function(threadID) {
    this.threadID = threadID;
    /*this.keywords = query.origkeywords;
    this.words = query.words;
    this.excluded = query.excluded;
		this.site = query.site;
		this.time = query.time;
		this.query = query;*/
  };
  
  pub.searchThread.prototype = {
    run: function() {
      try {
        var titles = pub.getAllTitles();
        var len = titles.length;
        var allwords = [];
        var counts = [];
        for(var i=0;i<len;i++){
          if(titles[i]==null)
            continue;
          var words=titles[i].split(" ");
          var l = words.length;
          for(var j=0;j<l;j++){
            var word = words[j].toLowerCase();
            var reg = new RegExp('[a-z]+');
            //if the word doesn't exclusively have English in it, skip
            if(word!=word.match(reg))
              continue;
            var idx = allwords.indexOf(word);
            if(idx>-1){
              counts[idx]+=1;
            }else{
              allwords.push(word);
              counts.push(1);
            }
          }
        }
        if(allwords.length==counts.length){
          var len=allwords.length;
          var output="";
          for(var i=0;i<len;i++){
            if(com.wuxuan.fromwheretowhere.corpus.stopwords_en_NLTK.indexOf(allwords[i])>-1)
              continue;
            output+=allwords[i]+" "+counts[i]+"\n";
          }
          //alert(output);
          var params = {inn:{property:output}, out:null};       
          window.openDialog("chrome://FromWhereToWhere/content/propdialog.xul", "",
            "chrome, centerscreen, dialog, resizable=yes", params).focus();
        }
      } catch(err) {
        Components.utils.reportError(err);
      }
    },
  
    QueryInterface: function(iid) {
      if (iid.equals(Components.interfaces.nsIRunnable) ||
          iid.equals(Components.interfaces.nsISupports)) {
              return this;
      }
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
  };

  pub.all = function() {
    pub.main.dispatch(new pub.searchThread(1), pub.main.DISPATCH_NORMAL);
      
  };
  
  pub.main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
  
  return pub;
}();