com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
  
  pub.recommend = function(title){
    var stopwords = com.wuxuan.fromwheretowhere.corpus.stopwords_en_NLTK;
    var allwords = title.split(" ");
    alert(allwords);
    for(var i=0; i<allwords.length; i++){
      allwords[i] = allwords[i].toLowerCase();
      if(stopwords.indexOf(allwords[i])>-1){
        allwords.splice(i, 1);
        i--;
      }
    }
    alert(allwords);
  };

  pub.init = function(){
    
  };
    
  return pub;
}();