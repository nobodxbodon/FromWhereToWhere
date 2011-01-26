com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
  
  pub.recommend = function(title, allLinks){
    var stopwords = com.wuxuan.fromwheretowhere.corpus.stopwords_en_NLTK;
    var specials = com.wuxuan.fromwheretowhere.corpus.special;
    var allwords = title.split(" ");
    //alert(allwords);
    for(var i=0; i<allwords.length; i++){
      allwords[i] = allwords[i].toLowerCase();
      if(stopwords.indexOf(allwords[i])>-1 || specials.indexOf(allwords[i])>-1){
        allwords.splice(i, 1);
        i--;
      }
    }
    //without any history tracking
    //TODO: search for allwords in history, get the direct children, get all words from them, and choose the link that have those words.
    var recLinks = [];
    for(var i=0;i<allLinks.length;i++){
      var text = allLinks[i].text.split(" ");
      for(var j=0;j<allwords.length;j++){
        if(text.indexOf(allwords[j])>-1){
          //alert(text + " has "+ allwords[j]);
          recLinks.push(allLinks[i]);
          //TODO: less rigid
          break;
        }
      }
    }
    return recLinks;
  };

  pub.init = function(){
    
  };
    
  return pub;
}();