
com.wuxuan.fromwheretowhere.utils = function(){
  var pub={};
  
  // Utils functions from here
  pub.cloneObject = function(obj){
    if(obj==null){
        return null;
    }
    var clone = (obj.constructor.name=="Array") ? [] : {};;
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
  
  pub.containInArray = function(arr, ele){
    for(var i in arr){
      //not sure the difference between ==
      if(arr[i]===ele){
        return true;
      }
    }
    return false;
  }
  //TODO: reg expr instead
  pub.splitWithSpaces = function(myString) {
    if(!myString){
      return [];
    }
    var words = myString.split(" ");
    for(var i=0; i<words.length; i++){
      if(words[i]==''){
        words.splice(i, 1);
        i--;
      }
    }
    return words;
  };
  
  // PRINCIPLE: conjunction for all
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
    //get all quoted phrases, put them in words and remove them from 'keywords'
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
    
    var site = [];
    var time = [];
    for(var i=0; i<words.length; i++){
      //get excluded words, single '-' is rec as keyword
      if(words[i][0]=='-' && words[i].length>1){
        excluded.push(words[i].substring(1));
        words.splice(i,1);
        i--;
      //get site
      } else if(words[i].indexOf("site:")==0){
        site.push(words[i].substring(5));
        words.splice(i,1);
        i--;
      //get temporal filter
      //TODO: throw exception and feedback when invalid date
      } else if(words[i].indexOf("time:")==0){
        var ts = words[i].substring(5).split("-");
        // can be ~, need to be smarter, but later
        if(ts.length==1)
          ts = words[i].substring(5).split("~");
        //if -time1, means till time1
        var t = {since: -1, till: Number.MAX_VALUE};
        if(ts[0]==""){
          var till = new Date(ts[1]).getTime();
          if(till<t.till)
            t.till = till;
        //if time1-, means since time1
        }else if(ts[1]==""){
          var since = new Date(ts[0]).getTime();
          if(since>t.since)
            t.since = since;
        //if time1-time2, means since time1 till time2
        }else{
          var till = new Date(ts[1]).getTime();
          var since = new Date(ts[0]).getTime();
          if(since>t.since)
            t.since = since;
          if(till<t.till)
            t.till = till;
        }
        time.push(t);
        words.splice(i,1);
        i--;
      }
    }
    words = words.concat(quotedWords);
    return {origkeywords : origkeywords, words : words, excluded : excluded, site : site, time : time};
  };
  
  return pub;
}();