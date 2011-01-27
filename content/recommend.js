com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
  
  var starttime = 0;
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
    starttime = (new Date()).getTime();
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
          //allLinks[i].text = trimed + " +++ "+ allRelated[j];
          recLinks.push(allLinks[i]);
          //TODO: less rigid
          break;
        }
      }
    }
    pub.popUp(recLinks);
    return recLinks;
  };

  pub.createElement = function(parent, name, atts){
    var ele=parent.createElement(name);
    for(var i in atts){
      ele.setAttribute(i, atts[i]);
    }
    return ele;
  };

  pub.popUp = function(recLinks){
    var menus = document.getElementById("menu_ToolsPopup");
    //const nm = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    //var overlay = document.getElementById("FromWhereToWhereOverlay");
    var savePanel = pub.createElement(document, "panel", {"titlebar":"normal","noautohide":"true","close":"true"});
    //popup.hidePopup();
    //savePanel.setAttribute("fade", "fast");
    var vbox = document.createElement("vbox");
    //var desc = document.createElement("description");
    //<textbox id="property" readonly="true" multiline="true" clickSelectsAll="true" rows="20" flex="1"/>
    //TODO: put links instead of pure text, and point to the links in page, may need to add bookmark in the page??
    var desc = pub.createElement(document, "textbox", {"readonly":"true", "multiline":"true", "rows":"10", "cols":"100"})
    var outputLinks = "";
    outputLinks += "time: "+((new Date()).getTime()-starttime)+"\n";
    for(var i=0;i<recLinks.length;i++){
      outputLinks+=recLinks[i].text.trim()+"\n";
    }
    if(recLinks.length>0){
      var testLink = pub.createElement(document, "label", {"value":"test link","onclick":"window.open(\'"+recLinks[0].href+"\')"});
      savePanel.appendChild(testLink);
    }
    desc.setAttribute("value",outputLinks);
    vbox.appendChild(desc);
    savePanel.appendChild(vbox);
    //this put the panel on the menu bar
    //menus.parentNode.appendChild(savePanel);
    menus.parentNode.parentNode.appendChild(savePanel);
    //overlay.appendChild(savePanel);
    savePanel.openPopup(null, "", 60, 50, false, false);
    //get all the links on current page, and their texts shown on page
    //can't get from overlay, still wondering
    //alert(eventNum + " "+doc.title + " " + lasttitle);
  };
  
  pub.init = function(){
    pub.history = com.wuxuan.fromwheretowhere.historyQuery;
  };
    
  return pub;
}();