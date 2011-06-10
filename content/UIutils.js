com.wuxuan.fromwheretowhere.UIutils = function(){
  var pub={};
  
  pub.getAllSelectedIndex = function(treeView){
    var start = new Object();
    var end = new Object();
    var numRanges = treeView.selection.getRangeCount();
    var index = [];
    for (var t = 0; t < numRanges; t++){
      treeView.selection.getRangeAt(t,start,end);
      for (var v = start.value; v <= end.value; v++){
        index.push(v);
      }
    }
    return index;
  };
  
  return pub;
}();