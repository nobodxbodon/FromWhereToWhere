
com.wuxuan.fromwheretowhere.topicTracker = function(){
  var pub={};
	
	pub.getSameWords = function(str1, str2){
		var str1Words = pub.utils.splitWithSpaces(str1);
		var str2Words = pub.utils.splitWithSpaces(str2);
		//alert(str1Words);
		//alert(str2);
		var dups = [];
		for(var i in str1Words){
			if(str2Words.indexOf(str1Words[i])!=-1){
				if(!pub.utils.containInArray(pub.specials, str1Words[i]))
					dups.push(str1Words[i]);
			}
		}
		return dups;
	};
	
	pub.getSharedTopic = function(str1, str2){
		return pub.getSameWords(str1, str2);
	};
	
	pub.isWanted = function(topics, str){
		return topics.length>0;
	};
	
	// LR
	//if the label is a word/words that's not in dictionary, just ignore it? no...url can be a word, so add special case for now
	// TODO: words around shared word are associated in some way! learn the unpredicted in the same way!
	pub.followContent = function(content){
		content = content.toLowerCase();
		var lastContent = pub.mem[pub.mem.length-1];
		if(pub.utils.containInArray(pub.redirectList, content) || lastContent==content){
			// no more new topic discovered
			return [""];
		}
		pub.mem.push(content);
		if(lastContent){
			//TODO: for now just expand/recommend based on similar topic, but what's needed is to "understand" the need / tendency based on history (meta-knowledge, like howto A, now is howto B)
			var topic = pub.getSharedTopic(lastContent, content);
			//if(similar.length==0)
			//	alert(lastContent + " --- " + content + "\n" + similar);
			return pub.isWanted(topic, content);
		}
	};
	
	pub.init = function(){
		//DON'T rely on filter!!!! should go jumping, can learn this list from context-independent single word?
		pub.redirectList = ["url","redirecting"];
		pub.mem = [];
		pub.utils = com.wuxuan.fromwheretowhere.utils;
		pub.specials = ["-",","];
	};
	
  return pub;
}();