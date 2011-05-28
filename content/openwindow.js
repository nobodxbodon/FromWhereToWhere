  
com.wuxuan.fromwheretowhere.openWindow = function(){
  var pub={};
  
  pub.PREF = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefBranch);
  
  //get current tab url before open new tab and switch there!!
  pub.searchhistory = function(){
    Application.storage.set("currentURI", gBrowser.currentURI.spec);
    gBrowser.selectedTab = gBrowser.addTab("chrome://FromWhereToWhere/content/custtreeview.xul");
  };
  
  pub.action = function(){
    var act = pub.PREF.getIntPref("extensions.fromwheretowhere.buttonAction");
    if(act==0){
      //alert(act);
    }
    else if(act==1)
      pub.searchhistory();
    else if(act==2){
      var recPanel = document.getElementById("fwtwRelPanel");
      if(recPanel==null){
        com.wuxuan.fromwheretowhere.recommendation.init();
        com.wuxuan.fromwheretowhere.recommendation.popUp("","",[],[]);
      }else{
        if(recPanel.state=="open"){
          recPanel.hidePopup();
        }else{
          recPanel.openPopup(null, "start_end", 60, 80, false, false);
        }
      }
    }
  };
  
  return pub;
}();