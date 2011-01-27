com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
  
  //remove all duplicate element from an array
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
      
  //remove all spaces \n in front and at end of a string
  String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
  };

  pub.filter = function(allwords, stopwords, specials){
    for(var i=0; i<allwords.length; i++){
      allwords[i] = allwords[i].toLowerCase();
      //stupid way to get rid of special char from the utterance
      //those with , and : -- useful semantic, but for now clean up
      for(var j=0;j<specials.length;j++){
        allwords[i]=allwords[i].replace(specials[j],"");
      }
      if(stopwords.indexOf(allwords[i])>-1 || specials.indexOf(allwords[i])>-1 || allwords[i]=="" || allwords[i]==" "){
        allwords.splice(i, 1);
        i--;
      }
    }
    return allwords;
  };
  
  pub.getTopic = function(title, stopwords, specials){
    var allwords = title.split(" ");
    //alert(allwords);
    return pub.filter(allwords, stopwords, specials);
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
    //var mapWordToPids=[];
    for(var i=0;i<allwords.length;i++){
      var pids = pub.history.searchIdbyKeywords([allwords[i]], [], [], []);
      //mapWordToPids[allwords[i]]=pids;
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
    //first get all "context" word, can be anormous...let's see
    var recLinks = [];
    var recTitles = [];
    for(var i=0;i<allLinks.length;i++){
      var trimed = allLinks[i].text.trim();
      var t = trimed.toLowerCase();
      //remove the duplicate links (titles)
      if(recTitles.indexOf(t)>-1){
        continue;
      }else{
        recTitles.push(t);
      }
      var text = t.split(" ");
      for(var j=0;j<allRelated.length;j++){
        if(text.indexOf(allRelated[j])>-1){
          //don't recommend those with only one word, like "msnbc.com"
          if(text.length==1 && text[0]==allRelated[j])
            break;
          allLinks[i].text = trimed + " +++ "+ allRelated[j];
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