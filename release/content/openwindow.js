if(!com)
  var com={};
  
if(!com.wuxuan)
  com.wuxuan={};
  
if(!com.wuxuan.fromwheretowhere)
  com.wuxuan.fromwheretowhere = {};
  
com.wuxuan.fromwheretowhere.openWindow = function(){
  var pub={};
    
  //get current tab url before open new tab and switch there!!
  pub.searchhistory = function(){
    Application.storage.set("currentURI", gBrowser.currentURI.spec);
    gBrowser.selectedTab = gBrowser.addTab("chrome://FromWhereToWhere/content/custtreeview.xul");
  };
  
  return pub;
}();