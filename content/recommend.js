com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
  
  Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j, 1);
        }
    }
    return a;
  };

  pub.getTopic = function(title, stopwords, specials){
    var allwords = title.split(" ");
    //alert(allwords);
    for(var i=0; i<allwords.length; i++){
      allwords[i] = allwords[i].toLowerCase();
      if(stopwords.indexOf(allwords[i])>-1 || specials.indexOf(allwords[i])>-1){
        allwords.splice(i, 1);
        i--;
      }
    }
    return allwords;
  };
  
  pub.recommend = function(title, allLinks){
    var stopwords = com.wuxuan.fromwheretowhere.corpus.stopwords_en_NLTK;
    var specials = com.wuxuan.fromwheretowhere.corpus.special;
    //TODO: put in topicTracker
    var allwords = pub.getTopic(title, stopwords, specials);
    //without any history tracking
    //TODO: only pick the words related to interest, not every non-stopword
    //TODO: search for allwords in history, get the direct children, get all words from them, and choose the link that have those words.
    var pidsWithWord=[];
    for(var i=0;i<allwords.length;i++){
      var pids = pub.history.searchIdbyKeywords([allwords[i]], [], [], []);
      //if too many pids with one single word, may mean sth...
      pidsWithWord = pidsWithWord.concat(pids);
    }
    pidsWithWord = pidsWithWord.unique();
    var allRelated=[];
    for(var i=0;i<pidsWithWord.length;i++){
      var t = pub.history.getTitlefromId(pidsWithWord[i]);
      var relatedWords=pub.getTopic(t, stopwords, specials);
      allRelated=allRelated.concat(relatedWords);
    }
    allRelated = allRelated.unique();
    alert(allRelated);
    //first get all "context" word, can be anormous...let's see
    var recLinks = [];
    for(var i=0;i<allLinks.length;i++){
      var text = allLinks[i].text.split(" ");
      for(var j=0;j<allRelated.length;j++){
        if(text.indexOf(allRelated[j])>-1){
          //don't recommend those with only one word, like "msnbc.com"
          if(text.length==1 && text[0]==allRelated[j])
            break;
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
    pub.history = com.wuxuan.fromwheretowhere.historyQuery;
  };
    
  return pub;
}();