
com.wuxuan.fromwheretowhere.utils = function(){
  var pub={};
  
  // Utils functions from here
  pub.cloneObject = function(obj){
    var clone = (obj instanceof Array) ? [] : {};;
    for(var i in obj) {
      if(typeof(obj[i])=="object")
        clone[i] = pub.cloneObject(obj[i]);
      else
        clone[i] = obj[i];
    }
    return clone;
  };

  pub.formatDate = function(intDate) {
    var myDate = new Date(intDate/1000);
    var formated = myDate.toLocaleString();
    return formated;
  };
  
  //TODO: reg expr instead
  pub.splitWithSpaces = function(myString) {
    var words = myString.split(" ");
    for(var i=0; i<words.length; i++){
      if(words[i]==''){
        words.splice(i, 1);
        i--;
      }
    }
    return words;
  };
  
  pub.getIncludeExcluded = function(keywords){
    var origkeywords = keywords;
    var excludePreciseReg = /-\"([\s|\w|\W]*)\"/g;
    var excludeQuotes = keywords.match(excludePreciseReg);
    var quotedWords = [];
    var excluded = [];
    //get all the excluded and quoted keywords, remove them
    for(var i in excludeQuotes){
      excluded.push(excludeQuotes[i].substring(2,excludeQuotes[i].length-1));
    }
    if(excludeQuotes){
      keywords = keywords.replace(excludePreciseReg, "");
    }
    var quoteReg = /\"([\s|\w|\W]*)\"/g;
    var quotes = keywords.match(quoteReg);
    for(var i in quotes){
      quotedWords.push(quotes[i].substring(1,quotes[i].length-1));
    }
    var words = [];
    if(!quotes){
      words = pub.splitWithSpaces(keywords);
    } else {
      words = pub.splitWithSpaces(keywords.replace(quoteReg, ""));
    }
    //put quoted words at the end, which will be the first to search from, more likely to reduce results
	
    for(var i=0; i<words.length; i++){
      if(words[i][0]=='-'){
        excluded.push(words[i].substring(1));
        words.splice(i,1);
        i--;
      }
    }
    words = words.concat(quotedWords);
    return {origkeywords : origkeywords, words : words, excluded : excluded};
  };
  
  return pub;
}();