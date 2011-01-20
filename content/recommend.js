com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
  
  var lasttitle = "";
  var eventNum = 0;
  pub.onPageLoad = function(event){
    eventNum +=1;
    // this is the content document of the loaded page.
    var doc = event.originalTarget;
    
    //Application.storage.set("currentPage", doc.location.href);
    if (doc.nodeName == "#document") {
    //if (doc instanceof HTMLDocument) {
      // is this an inner frame?
      if (doc.defaultView.frameElement) {
        // Frame within a tab was loaded.
        // Find the root document:
        com.wuxuan.fromwheretowhere.currentPage = doc;
        while (doc.defaultView.frameElement) {
          doc = doc.defaultView.frameElement.ownerDocument;
        }
        if(doc.title!=lasttitle){
          /*var savenote = document.getElementById("current_title");
          savenote.value = "title: "+doc.title;
          document.getElementById("currentTitle").openPopup(null, "", 60, 50, false, false);*/
          lasttitle=doc.title;
          alert(eventNum + " "+doc.title + " " + lasttitle);
          
        }
        //Application.storage.set("currentPage", doc.title);
      }
    }
  };
  
  pub.init = function(){
    window.addEventListener("DOMContentLoaded", pub.onPageLoad, false);
    //window.addEventListener("DOMTitleChanged", pub.onPageLoad, false);
    alert("init recommend");
  };
    
  return pub;
}();