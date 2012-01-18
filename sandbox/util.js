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
		var DEBUG=false;
        
        function dAlert(msg){
            if(DEBUG)
                alert(msg);
        }
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
        dAlert("Invalid date: "+ts[1]+". Search without it anyway");
    //if time1-, means since time1
    }if(ts[0]!=""){
      var since = new Date(ts[0]).getTime();
      if(since>t.since)
        t.since = since;
      else
        dAlert("Invalid date: "+ts[0]+". Search without it anyway");
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
          dAlert("Fail to parse time interval: "+ti+". Search without it anyway");
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
  
  //if branch, wrap <ol> to get indent
  //same level wrap by package <ol>
  this.exportHTML = function(nodes){
    var src="";
    //get src for each node in the array
    for(var i=0;i<nodes.length;i++){
      src+=this.exportHTMLforNode(nodes[i]);
      if(i!=nodes.length-1)
        src+="\n";
    }
    return this.exportHelperWrap(src, "ol", "", "");
  };
  
  this.exportHTMLforNode = function(node){
    var src="";
    //if branch, type=circle, else type=disc
    if(node.children.length!=0){
      src = this.exportHTML(node.children);
    }
    var link = this.exportHelperWrap(node.label,"a","href",node.url);
    if(node.children.length==0){
      src = this.exportHelperWrap(link,"li","type","disc");
    }else{
      src = this.exportHelperWrap(link+src,"li","type","circle");
    }
    return src;
  };
  
  //TODO: more general (setAttribute)
  this.exportHelperWrap = function(orig, tag, attr, value){
    var src="";
    if(attr=="")
      src="<"+tag+">"+orig+"</"+tag+">";
    else
      src="<"+tag+" "+attr+"="+value+">"+orig+"</"+tag+">";
    return src;
  };
  
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
	
    this.getSQLquerybyKeywords = function(words, optional, excluded, site){
		//add site filter
		var left = "";
        var right = "";
		if(site && site.length!=0){
        for(var i = site.length-1; i>=0; i--){
          left = "(SELECT * FROM " + left;
          right = right + " WHERE content LIKE '%" + site[i] + "%')";
        }
      }
      dAlert("in getSQLquery: "+words[0]+"\nleft:"+left+"\nright:"+right);
      if(words && words.length!=0){
        for(var i = words.length-1; i>=0; i--){
          var partTerm = this.getRightQuote(words[i]);
          if(i==words.length-1){
            left = "SELECT * FROM " + left;
            right = right + " WHERE content LIKE "+partTerm;//'%" + words[i] + "%'";
          } else if(i!=0){
            left = "SELECT * FROM (" + left;
            right = right + ") WHERE content LIKE "+partTerm;//'%" + words[i] + "%'";
          }
        }
      }
      dAlert("in getSQLquery after words: "+"\nleft:"+left+"\nright:"+right);
      var optionalTerm = "";
      if(optional){
          for(var i=0;i<optional.length;i++){
          var partTerm = this.getRightQuote(optional[i]);
                if(i==0){
                    optionalTerm+=" content LIKE "+partTerm;//'%" + optional[i] + "%'"
                }else{
                    optionalTerm+=" OR content LIKE "+partTerm;//'%" + optional[i] + "%'"
                }
            }
        if(optional.length>0){
            left = "SELECT * FROM (" + left;
            right = right + ") WHERE" + optionalTerm;
        }
      }
      dAlert("in getSQLquery after optional: "+"\nleft:"+left+"\nright:"+right);
      dAlert(left+" TABLE_NAME "+right);
      return {left:left,right:right};
    };
    
    this.getRightQuote = function(word){
		//if it has \', replace sql term with \"
		var partTerm = "";
		if(word.match(/\'/)){
			partTerm = "\"%" + word + "%\"";
		}else{
			partTerm = "'%" + word + "%'";
		}
		return partTerm;
	};
    
    this.getDupThreads = function(arr) {
        if(!arr || !arr.length || arr.length<=1)
            return [];
        var a = arr.concat();
        a.sort(function(a,b){
            //temp fix: content can be null because of encoding error in php
            if(a.content==null&&b.content!=null){
                dAlert('a is null: '+'sub:'+a.subject+' id:'+a.thread_id);
                return true;
            }
            if(b.content==null){
                dAlert('b is null: '+'sub:'+b.subject+' id:'+b.thread_id);
                return false;
            }
            return a.content.length<b.content.length;});
        //only work for string type
        var origLen = a.length;
        var repeated = [];
        for(var i=1; i<origLen; ++i) {
            dAlert(a[i].content);
          if(a[i].content == a[i-1].content){
            if(!repeated[a[i].thread_id])
                repeated[a[i-1].thread_id] = [a[i].thread_id];
            else
                repeated[a[i-1].thread_id].push(a[i].thread_id);
            }
        }
        return repeated;
      };
	}
});
