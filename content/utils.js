
com.wuxuan.fromwheretowhere.utils = function(){
  var pub={};
  
  pub.INTERVAL_DEF = {since: -1, till: Number.MAX_VALUE};
  
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
  
  //remove all duplicate element from an array
  pub.uniqueArray = function(arr, freq) {
    var a = arr.concat();
    //only work for string type
    var origLen = a.length;
    var allfreq = [];
    for(var i=0; i<a.length; ++i) {
      if(freq){
          allfreq[a[i]]=1;
      }
      for(var j=i+1; j<a.length; ++j) {
        if(a[i] === a[j]){
          a.splice(j, 1);
          //HAVE to go back one
          j--;
          if(freq){
            allfreq[a[i]]+=1;
          }
        }//ONLY work for sorted arr. If length isn't the same, str[i] has no dup afterwards
        else if(a[i].length!=a[j].length){
          break;
        }
      }
    }
    if(freq){
      //allfreq.length always 0, can only get through word index
      for(var i in allfreq){
        allfreq[i]=(allfreq[i]+0.0)/origLen;
      }
      return {arr:a,freq:allfreq};
    }
    return a;
  };
      
  //remove all spaces \n in front and at end of a string
  pub.trimString = function (str) {
    return str.replace(/^\s*/, "").replace(/\s*$/, "");
  };
  
  //remove all empty lines in between (there's no empty lines at front/end in input)
  //don't think it can be infinite loop, but just be cautious, set max loop 40
  pub.removeEmptyLine = function(str){
    var rs = "";
    for(var i=0;i<40;i++){
      rs = str.replace(/\n\n/g, "\n");
      if(rs==str)
        break;
      else
        str = rs;
    }
    return rs;
  };
  
  //remove all string that contain one other element, str is with freq
  //NOTE: a.arr is sorted by string length (ascend) already, and have no dup
  //this is very naive form of stemming
  pub.removeHaveSubstring = function(a){
    var str = a.arr;
    var freq = a.freq;
    for(var i=0;i<str.length;i++){
      for(var j=i+1;j<str.length;j++){
        if(str[j].indexOf(str[i])>-1){
          freq[str[i]]+=freq[str[j]];
          str.splice(j,1);
          freq.splice(j,1);
          j--;
        }
      }
    }
    return a;
  };
  
  //return the count of occurrences of ch in str
  pub.countChar = function(ch, str){
    var all = str.match(new RegExp(ch,"g"));
    if(all)
      return all.length;
    else
      return 0;
  };
  
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
  
  //ts.length=2
  // time1-time2 => since time1 till time2
  // time1- => since time1
  // -time2 => till time2
  pub.parseTime = function(ts){
    var t = pub.cloneObject(pub.INTERVAL_DEF);
    if(ts[1]!=""){
      var till = new Date(ts[1]).getTime();
      if(till<t.till)
        t.till = till;
      else
        alert("Invalid date: "+ts[1]+". Search without it anyway");
    //if time1-, means since time1
    }if(ts[0]!=""){
      var since = new Date(ts[0]).getTime();
      if(since>t.since)
        t.since = since;
      else
        alert("Invalid date: "+ts[0]+". Search without it anyway");
    }
    return t;
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
        var ti = words[i].substring(5);
        var ts = ti.split("-");
        // can be ~, need to be smarter, but later
        if(ts.length==1)
          ts = ti.split("~");
        if(ts.length!=2){
          alert("Fail to parse time interval: "+ti+". Search without it anyway");
          words.splice(i,1);
          i--;
          continue;
        }
        var t=pub.parseTime(ts);
        time.push(t);
        words.splice(i,1);
        i--;
      }
    }
    words = words.concat(quotedWords);
    return {origkeywords : origkeywords, words : words, excluded : excluded, site : site, time : time};
  };
  
  pub.getFFVersion = function(){
    if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){ //test for Firefox/x.x or Firefox x.x (ignoring remaining digits);
      var ffversion=new Number(RegExp.$1) // capture x.x portion and store as a number
      return ffversion;
    }
    else
      return null;
  };
  
  return pub;
}();