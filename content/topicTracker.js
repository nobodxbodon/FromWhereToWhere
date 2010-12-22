
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
				dups.push(str1Words[i]);
			}
		}
		return dups;
	};
	
	// LR
	//if the label is a word/words that's not in dictionary, just ignore it? no...url can be a word, so add special case for now
	// TODO: words around shared word are associated in some way!
	pub.followContent = function(content){
		content = content.toLowerCase();
		var lastContent = pub.mem[pub.mem.length-1];
		if(pub.utils.containInArray(pub.redirectList, content) || lastContent==content){
			return;
		}
		pub.mem.push(content);
		if(lastContent)
			alert(lastContent + " --- " + content + "\n" + pub.getSameWords(lastContent, content));
		
	};
	
	pub.init = function(){
		//DON'T rely on filter!!!! should go jumping, can learn this list from context-independent single word?
		pub.redirectList = ["url","redirecting"];
		pub.mem = [];
		pub.utils = com.wuxuan.fromwheretowhere.utils;
	};
  return pub;
}();