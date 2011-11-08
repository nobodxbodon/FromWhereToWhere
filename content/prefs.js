com.wuxuan.fromwheretowhere.prefs = function(){
    pub={};
    
    pub.updateOptions=function(){
      //  alert("update");
      var showRelated=pub.showRelated();
      document.getElementById("option.related.highFrequency").setAttribute("disabled",!showRelated);
    };
    
    pub.showRelated = function(){
        return document.getElementById("option.related.showRelatedKeywords").checked;
    };
    
    pub.init = function(){
        //alert("init");
        pub.updateOptions();
        document.getElementById("option.related.showRelatedKeywords").onclick=pub.updateOptions;
    };
    return pub;
}();