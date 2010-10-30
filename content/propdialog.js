
com.wuxuan.fromwheretowhere.propdialog = function(){
  var pub={};
  // Called once when the dialog displays
  pub.onLoad = function() {
  // Use the arguments passed to us by the caller
    document.getElementById("property").value = window.arguments[0].inn.property;
  }
  
  return pub;
}();

