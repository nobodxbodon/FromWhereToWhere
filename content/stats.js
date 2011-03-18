com.wuxuan.fromwheretowhere.stats = function(){
  var pub={};
  
  pub.all=function(){
    
  };
  
  pub.openPlacesDatabase = function(){
    var db = Components.classes["@mozilla.org/browser/nav-history-service;1"].  
                      getService(Components.interfaces.nsPIPlacesDatabase).DBConnection;  
    return db;
  };
  
  pub.mDBConn = pub.openPlacesDatabase();
  
  pub.getAllTitles = function(){
    //SELECT * FROM moz_places where title LIKE '%sqlite%';
    //NESTED in reverse order, with the assumption that the word in front is more frequently used, thus return more items in each SELECT
    
		var siteTerm = "moz_places";
    var term = "SELECT title FROM "+siteTerm;//+" WHERE id<10000";
    var statement = pub.mDBConn.createStatement(term);
    return com.wuxuan.fromwheretowhere.main.queryAll(statement, "str", 0);
  };
  
  pub.searchThread = function(threadID) {
    this.threadID = threadID;
    /*this.keywords = query.origkeywords;
    this.words = query.words;
    this.excluded = query.excluded;
		this.site = query.site;
		this.time = query.time;
		this.query = query;*/
  };
  
  pub.searchThread.prototype = {
    run: function() {
      try {
        var titles = pub.getAllTitles();
        var len = titles.length;
        var allwords = [];
        var counts = [];
        for(var i=0;i<len;i++){
          if(titles[i]==null)
            continue;
          var words=titles[i].split(" ");
          var l = words.length;
          for(var j=0;j<l;j++){
            var word = words[j].toLowerCase();
            var reg = new RegExp('[a-z]+');
            //if the word doesn't exclusively have English in it, skip
            if(word!=word.match(reg))
              continue;
            var idx = allwords.indexOf(word);
            if(idx>-1){
              counts[idx]+=1;
            }else{
              allwords.push(word);
              counts.push(1);
            }
          }
        }
        if(allwords.length==counts.length){
          var len=allwords.length;
          var output="";
          for(var i=0;i<len;i++){
            if(com.wuxuan.fromwheretowhere.corpus.stopwords_en_NLTK.indexOf(allwords[i])>-1)
              continue;
            output+=allwords[i]+" "+counts[i]+"\n";
          }
          //alert(output);
          var params = {inn:{property:output}, out:null};       
          window.openDialog("chrome://FromWhereToWhere/content/propdialog.xul", "",
            "chrome, centerscreen, dialog, resizable=yes", params).focus();
        }
      } catch(err) {
        Components.utils.reportError(err);
      }
    },
  
    QueryInterface: function(iid) {
      if (iid.equals(Components.interfaces.nsIRunnable) ||
          iid.equals(Components.interfaces.nsISupports)) {
              return this;
      }
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
  };

  pub.getOrig = function(word){  
    var orig = pub.mapOrigVerb[word];
    //need to check type because array have function like "match, map"
    if((typeof orig)=="string" && orig){
      //alert(word+"->"+orig);
      return orig;
    }
    else
      return word;
  };
	
	pub.filter = function(allwords, stopwords, specials){
    for(var i=0; i<allwords.length; i++){
      allwords[i] = allwords[i].toLowerCase();
      var orig = allwords[i];
      //only get the first part here
      allwords[i] = orig.replace(/\W*(\w+)\W*/,"$1");
      allwords[i] = pub.getOrig(allwords[i]);
      if(stopwords.indexOf(allwords[i])>-1 || specials.indexOf(allwords[i])>-1 || allwords[i]=="" || allwords[i].length<=1 || allwords[i].match(/[0-9]/)!=null){
        allwords.splice(i, 1);
        i--;
      }
    }
    return allwords;
  };
	
	pub.getTopic = function(title, sp, stopwords, specials){
    if(title==null){
      return [];
    }
    //TODO: some language requires more complex segmentation, like CHN
    var allwords = title.split(sp);//(" ");/\W/
    return pub.filter(allwords, stopwords, specials);
  };
	
	pub.getPattern = function(pTitle, cTitles){
		var stopwords = com.wuxuan.fromwheretowhere.corpus.stopwords_en_NLTK;
    var specials = com.wuxuan.fromwheretowhere.corpus.special;
    var keywords = pub.getTopic(pTitle, " ", stopwords, specials);
		for(var t in cTitles){
			for(var i in keywords){
				//var p = cTitles[i].replace(/w+)
			}
		}
	};
	
	pub.patternThread = function(threadID) {
    this.threadID = threadID;
	};
	
	pub.patternThread.prototype = {
    run: function() {
      try {
        pub.history = com.wuxuan.fromwheretowhere.historyQuery;
				pub.mapOrigVerb = com.wuxuan.fromwheretowhere.corpus.mapOrigVerb();
				pub.history.init();
				var allPid = pub.history.searchIdbyKeywords("", [],[],[],[]);
				var pats = [];
				for(var i in allPid){
					var pTitle = pub.history.getTitlefromId(allPid[i]);
					var allChild = pub.history.getAllChildrenfromPlaceId(allPid[i], null);
					var cTitles = [];
					for(var j in allChild){
						cTitles.push(pub.history.getTitlefromId(allChild[j]));
					}
					pats = pats.concat(pub.getPattern(pTitle, cTitles));
				}
        //alert(output);
        var params = {inn:{property:pats}, out:null};       
        window.openDialog("chrome://FromWhereToWhere/content/propdialog.xul", "",
            "chrome, centerscreen, dialog, resizable=yes", params).focus();
      } catch(err) {
        Components.utils.reportError(err);
      }
    },
  
    QueryInterface: function(iid) {
      if (iid.equals(Components.interfaces.nsIRunnable) ||
          iid.equals(Components.interfaces.nsISupports)) {
              return this;
      }
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
  };
	
	pub.getAllCommonHead = function(words){
		words.sort(function(a,b){return a>b;});
		var newwords = [];
		var len = words.length-1;
		for(var i=0;i<len;i++){
			var w1 = words[i];
			var w2 = words[i+1];
			var maxLen = (w1.length>w2.length)?w1.length:w2.length;
			for(var j=0;j<maxLen;j++){
				if(w1[j]!=w2[j]){
					if(j>1){
						var w = w1.substring(0,j);
						if(newwords.indexOf(w)==-1){
							//alert(w);
							newwords.push(w);
							//alert(newwords);
						}
					}
					break;
				}
			}
			
		}
		return newwords;
	};
	
	pub.getAllChnWords = function(newwords, words){
    //var words = w;
		//var newwords = words;
		while(newwords.length!=0){
			var news = [];
			for(var i=0;i<newwords.length;i++){
				for(var j=0;j<words.length;j++){
					if(words[j]==newwords[i] || words[j].length<newwords[i].length)
						continue;
					var sp = words[j].split(newwords[i]);
					if(sp.length>1){
						var seg = false;
						//if splitted, start checking from here
						var origIdx = j;
						for(var l=0;l<sp.length;l++){
							if(sp[l].length>1){
								if(words.indexOf(sp[l])==-1){
									j+=1;
									words.splice(j,0,sp[l]);
									news.push(sp[l]);
								}
								seg = true;
							}
						}
						if(seg){
							words.splice(origIdx,1);
							j--;
						}
					}
				}
			}
			newwords = news;
    }
    return words;
  };
	
  pub.all = function() {
		var allRelated = pub.allwords;
		var chn = [];
    var nonChn = [];
		var start = (new Date()).getTime();
    for(var i=0;i<allRelated.length;i++){
      if(/.*[\u4e00-\u9fa5]+.*$/.test(allRelated[i]))
        chn.push(allRelated[i]);
      else
        nonChn.push(allRelated[i]);
    }
		//alert(chn.length);;
    var chnwords = pub.getAllChnWords(chn,chn);
		var findMaxGramHead = pub.getAllCommonHead(chnwords);
		var newfinds = pub.getAllChnWords(findMaxGramHead,findMaxGramHead);
		chnwords = chnwords.concat(newfinds);
		//alert(findMaxGramHead);
		chnwords = pub.getAllChnWords(newfinds,chnwords);
		//alert(chn.length);
    //if(pub.DEBUG){
    //var newwords = chnwords.filter(function isNew(str){return orig.indexOf(str)==-1;});
    //}
    allRelated = nonChn.concat(chnwords);
    var segtime = (new Date()).getTime() -start;
		var output="";
		var shorts = chnwords;//chnwords.filter(function lessthen(str){return str.length<4;});
		for(var l=0;l<shorts.length;l++){
			output+=shorts[l]+"\n";
		}
		alert(segtime+"\n"+findMaxGramHead.length+"\n"+output);
    //pub.main.dispatch(new pub.searchThread(1), pub.main.DISPATCH_NORMAL);
    //pub.main.dispatch(new pub.patternThread(1), pub.main.DISPATCH_NORMAL);
  };
  
  pub.main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
  
	pub.allwords = [];
  return pub;
}();