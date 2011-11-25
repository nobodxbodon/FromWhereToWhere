jQuery.extend({
	
	HashTable: function(){
		/**
		 * our local cache of $.Note objects
		 */
		var cache = new Array();
		/**
		 * a reference to ourselves
		 */
		var that = this;

		/**
		 * get contents of cache into an array
		 */
		this.toArray = function(){
			var a = new Array();
			for (var i in cache){
				a.push(cache[i]);
			}
			return a;
		}
		
		/**
		 * put a new item into the HashTable
		 */
		this.put = function(key, obj){
			cache[key] = obj;
		}
		
		/**
		 * clear out the item with
		 * the input key
		 */
		this.clear = function(key){
			delete cache[key];
		}
		
		/**
		 * return the item associated
		 * with key
		 */
		this.get = function(key){
			return cache[key];
		}	
	},
	
	FWTWUtils: function(){
		
//TODO: reg expr instead
  this.splitWithSpaces = function(myString) {
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
  this.parseTime = function(ts){
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
  this.getIncludeExcluded = function(keywords){
    var origkeywords = keywords;
    //this is for excluded, make sure there's one non-\" before -
    keywords=" "+keywords;
    var excludePreciseReg = /[^\"]-\"([^\"]*)\"?/g;
    var excludeQuotes = keywords.match(excludePreciseReg);
    var quotedWords = [];
    var excluded = [];
    //get all the excluded and quoted keywords, remove them
    for(var i in excludeQuotes){
      excluded.push(excludeQuotes[i].replace(excludePreciseReg, "$1"));
    }
    if(excludeQuotes){
      keywords = keywords.replace(excludePreciseReg, "");
    }
    //get all quoted phrases, put them in words and remove them from 'keywords'
    var quoteReg = /\s\"([^\"]*)\"?/g;
    var quotes = keywords.match(quoteReg);
    for(var i in quotes){
      quotedWords.push(quotes[i].replace(quoteReg, "$1"));
    }
    
    var words = [];
    if(!quotes){
      words = this.splitWithSpaces(keywords);
    } else {
      words = this.splitWithSpaces(keywords.replace(quoteReg, ""));
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
        var t=this.parseTime(ts);
        time.push(t);
        words.splice(i,1);
        i--;
      }
    }
    return {origkeywords : origkeywords, words: quotedWords, optional : words, excluded : excluded, site : site, time : time};
  }
  
  this.buildFeedback = function(state, words, optional, excluded, site, time){
		var feedback = "Searching";
		//state: 0 - searching, 1- found, -1 - failed
		if(state==-1)
			feedback = "No history found";
		else if(state==1)
			feedback = "Found some";
		if(words.length>0){
			feedback += " with all of ["+words+"],";
		}
		if(optional.length>0){
			feedback += " with any of ["+optional+"],";
		}
		if(excluded.length>0){
			feedback += " without " + excluded;
		}
		feedback+=" in title";
		if(site.length>0){
			feedback+=", AND url with "+site;
		}
		if(time.length>0){
			feedback+=", AND visit time"+this.timeInterpret(time);
		}
		return feedback;
	};
	
	}
});