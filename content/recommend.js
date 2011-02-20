com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
    
  pub.mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation)
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
        .rootTreeItem
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIDOMWindow);
 
  pub.DEBUG = true;
  pub.INPAGE = false;
  pub.DEBUGINFO = "";
  pub.TOOFEWWORDS = 4
  pub.MULTILINE_LIMIT = 3;
  pub.starttime = 0;
  pub.sqltime = {};
  
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
  
  //also remove all numbers, as they don't seem to carry much "theme" info
  //remove word.length==1
  pub.filter = function(allwords, stopwords, specials){
    for(var i=0; i<allwords.length; i++){
      allwords[i] = allwords[i].toLowerCase();
      //stupid way to get rid of special char from the utterance
      //those with , and : -- useful semantic, but for now clean up
      /*for(var j=0;j<specials.length;j++){
        allwords[i]=allwords[i].replace(new RegExp(specials[j],"g"),"");
      }*/
      //if there's \W in the end (hp,) get the first part; (doesn't) leave it as is
      if(allwords[i].match(/\w+\W$/)){
        allwords[i]=allwords[i].substring(0,allwords[i].length-1);
      }
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
  
  pub.tooSimple = function(allwords){
    var rmSpecials = pub.filter(allwords, [], com.wuxuan.fromwheretowhere.corpus.special);
    if(rmSpecials.length<pub.TOOFEWWORDS){
      return true;
    }else{
      return false;
    }
  };
  
  pub.recommend = function(title, allLinks){
    pub.DEBUGINFO = "";
    pub.starttime = (new Date()).getTime();
    var stopwords = com.wuxuan.fromwheretowhere.corpus.stopwords_en_NLTK;
    var specials = com.wuxuan.fromwheretowhere.corpus.special;
    //TODO: put in topicTracker
    var allwords = pub.getTopic(title, " ", stopwords, specials);
    //without any history tracking
    //TODO: only pick the words related to interest, not every non-stopword
    //TODO: search for allwords in history, get the direct children, get all words from them, and choose the link that have those words.
    var pidsWithWord=[];
    //if new tab or no title at all, no recommendation
    if(allwords.length==0){
      return [];
    }
    pub.tmp = (new Date()).getTime();
    /*for(var i=0;i<allwords.length;i++){
      var pids = pub.history.searchIdbyKeywords([allwords[i]], [], [], []);
      //if too many pids with one single word, may mean sth...
      pidsWithWord = pidsWithWord.concat(pids);
    }
    pidsWithWord = pub.utils.uniqueArray(pidsWithWord, false);*/
    pidsWithWord = pub.history.searchIdbyKeywords([], allwords,[],[],[]);
    
    pub.sqltime.searchid = (new Date()).getTime()-pub.tmp;
    pub.tmp = (new Date()).getTime();
    
    var children = [];
    //get their children in history
    for(var i=0;i<pidsWithWord.length;i++){
      var c = pub.history.getAllChildrenfromPlaceId(pidsWithWord[i], null);
      children = children.concat(c);
    }
    pidsWithWord = pidsWithWord.concat(children);
    pidsWithWord = pub.utils.uniqueArray(pidsWithWord, false);
    
    pub.sqltime.getchild = (new Date()).getTime()-pub.tmp;
    
    //stupid, somehow there's some code piece of unique in the array??!!WTF??
    for(var i=0;i<pidsWithWord.length;i++){
      if(!(pidsWithWord[i]>0)){
        pidsWithWord.splice(i,1);
        i--;
      }
    }
    var allRelated=[];
    pub.tmp = (new Date()).getTime();
    
    for(var i=0;i<pidsWithWord.length;i++){
      var t = pub.history.getTitlefromId(pidsWithWord[i]);
      var relatedWords=pub.getTopic(t, " ", stopwords, specials);
      allRelated=allRelated.concat(relatedWords);
    }
    pub.sqltime.gettitle = (new Date()).getTime() -pub.tmp;
    
    var origLen = allRelated.length;
    //sort the string array by string length, can speed up later processing
    allRelated.sort(function(a,b){return a.length-b.length});
    var a = pub.utils.uniqueArray(allRelated, true);
    //get frequency of word (number of titles that contains it/number of all titles)
    var len = a.arr.length;

    /*a = pub.utils.removeHaveSubstring(a);*/
    var removed = a.arr.length-len;
    allRelated = a.arr;
    if(pub.DEBUG){
      var allover = 0;
      for(var i=0;i<a.arr.length;i++){
        pub.DEBUGINFO+=a.arr[i]+ " " +a.freq[a.arr[i]]+"\n";
        allover+=a.freq[a.arr[i]];
      }
      pub.DEBUGINFO="sum of freq: "+allover+"\n"+pub.DEBUGINFO;
      pub.DEBUGINFO="searchid: "+ pub.sqltime.searchid + " getchild: "+pub.sqltime.getchild + " gettitle: "+pub.sqltime.gettitle+"\n"+pub.DEBUGINFO;
    }
    //alert(allRelated);
    var freq = a.freq;
    //LATER: getNumofPidWithWord might be more precise, but much more time consuming.
    //       for now just use the wf in "relatedWords"
    /*var relFreq = [];
    var allPids = pub.history.getNumOfPid();
    for(var i=0;i<allRelated.length;i++){
      relFreq[allRelated[i]]=(pub.history.getNumofPidWithWord(allRelated[i])+0.0)/allPids;
    }*/
    //first get all "context" word, can be anormous...let's see
    //recLinks have object which format is: {link:xx,overallFreq:0.xx,kw:somewords}
    var recLinks = [];
    var recTitles = [];
    for(var i=0;i<allLinks.length;i++){
      var trimed = pub.utils.trimString(allLinks[i].text);
      var t = trimed.toLowerCase();
      //remove the duplicate links (titles)
      if(recTitles.indexOf(t)>-1){
        continue;
      }else{
        recTitles.push(t);
      }
      //var text = t.split(" ");
      var text=pub.getTopic(t, " ", stopwords, specials);
      //remove dup word in the title, for freq mult
      text = pub.utils.uniqueArray(text, false);
      //if there's too few words (<3 for now), either catalog or tag, or very obvious already
      if(pub.tooSimple(text)){
        continue;
      }
      //get the mul of keyword freq in all titles to be sorted
      var oF = 1;
      var keywords = [];
      for(var j=0;j<allRelated.length;j++){
        if(text.indexOf(allRelated[j])>-1){
          //don't recommend those with only one word, like "msnbc.com"
          if(text.length==1 && text[0]==allRelated[j])
            break;
          keywords.push(allRelated[j]);
          oF=oF*freq[allRelated[j]];
        }
      }
      if(oF<1){
        recLinks.push({link:allLinks[i],overallFreq:oF,kw:keywords});
      }
    }
    //sort by overallFreq
    recLinks.sort(function(a,b){return a.overallFreq-b.overallFreq});
    //don't pop up if there's no related links
    if(recLinks.length>0){
      var o = pub.output(recLinks,allLinks);
      if(pub.DEBUG){
        o="removed "+removed+" from "+len+"\n"+o;
      }
      pub.popUp(o, recLinks);
    }else{
      if(pub.DEBUG){
        alert("alllinks:\n"+allLinks);
      }
    }
    return recLinks;
  };

  pub.setAttrDOMElement = function(ele, atts){
    for(var i in atts){
      ele.setAttribute(i, atts[i]);
    }
    return ele;
  };

  pub.testOpen = function(link){
    alert("opend "+link);
    //window.open(link);
    gBrowser.addTab(link);
  };
  
  pub.testFocus = function(idx){
    alert(idx);
    var amount = 4;
    //var range = document.createRange();
    var el = pub.rec[idx];
    /*var oRange = d.createTextRange();
    oRange.moveStart("character", 0);
    oRange.moveEnd("character", amount - d.value.length);
    oRange.select();
    d.focus();
    alert(focus);
    range.setStart(focus, 0);
    range.setEnd(focus, amount);*/
    //range.selectNode(focus);
    var body = document.body, range, sel;
    if (body && body.createTextRange) {
        range = body.createTextRange();
        range.moveToElementText(el);
        range.select();
    } else if (document.createRange && window.getSelection) {
        range = document.createRange();
        range.selectNodeContents(el);
        sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
    //el.focus();  --> is not a function
  };
  
  pub.rec = [];
  
  pub.output = function(recLinks, allLinks){
    var outputText = "";
    outputText += "Time: "+(0.0+((new Date()).getTime()-pub.starttime))/1000+"s      ";
    outputText += "Ratio(Num. of suggested/Num. of all links): "+(0.0+Math.round((recLinks.length+0.0)*1000/allLinks.length))/10+"%\n";
    /*for(var i=0;i<recLinks.length;i++){
      var title = pub.utils.trimString(recLinks[i].link.text)
      title = pub.utils.removeEmptyLine(title);
      //remove those titles > 3 lines, can be functions...
      //if(title.split("\n").length<=pub.MULTILINE_LIMIT){
        outputText+=title;
        if(pub.DEBUG)
          outputText+=" "+recLinks[i].kw+" "+ recLinks[i].overallFreq;
        outputText+="\n";
      //}else{
        //alert("multiline>3:\n"+title);
      //}
    }*/
    return outputText;
  };
  
  pub.addToPage = function(outputText, recLinks){
    //add the recLinks to top of body
    var body = gBrowser.selectedBrowser.contentDocument.body;//getElementsByTagName("body")[0];
    if(body){
      //alert(recLinks[0].link.localName);
      var div=document.createElement("div");
      var info = document.createElement("p");
      info.appendChild(document.createTextNode(outputText));
      div.appendChild(info);
      
      var p=document.createElement("p");
      p = pub.setAttrDOMElement(p,{"style":"height: 100px;overflow:auto"})
      //var a=document.createElement("a");
      //a=pub.setAttrDOMElement(a,{"text":recLinks[0].link});
      for(var i=0;i<recLinks.length;i++){
        recLinks[i].link.appendChild(document.createElement("br"));
        p.appendChild(recLinks[i].link);
      }
      div.appendChild(p);
      body.insertBefore(div,body.firstChild);//appendChild(div);//recLinks[0]);
    }else{
      alert("body is null: "+body.tagName);
    }
  };
  
  pub.popUp = function(outputText, recLinks){
    //pub.rec = recLinks;
    /*if(recLinks.length>0){
    //for(var i=0;i<recLinks.length;i++){
      //var testLink = pub.createElement(document, "label", {"value":recLinks[i].link.text.trim(),"onclick":"com.wuxuan.fromwheretowhere.recommendation.testOpen(\'"+recLinks[i].link.href+"\')"});
      var testLink = pub.createElement(document, "label", {"value":recLinks[0].link.text.trim(),"onclick":"com.wuxuan.fromwheretowhere.recommendation.testFocus("+0+")"});
      savePanel.appendChild(testLink);
    }*/
    //const nm = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var version = pub.utils.getFFVersion();
    var savePanel = document.getElementById("fwtwRelPanel");
    var vbox,desc,debugtext,linkBox;
    //only reuse the panel for ff 4
    if(version>=4 && savePanel!=null){
      //alert("there's panel!");
      vbox = savePanel.firstChild;
      //desc = vbox.firstChild;
      //if(pub.DEBUG)
      //  debugtext = desc.nextSibling;
    }else{
      //alert("creating new panel");
      var panelAttr = null;
      //close, label, titlebar only for ff 4
      if(version>=4)
        panelAttr = {"id":"fwtwRelPanel","label":"Seemingly Related or Interesting Link Titles","titlebar":"normal","noautohide":"true","close":"true","height":"100"};
      else{
        //alert("create panel for ff3");
        panelAttr = {"id":"fwtwRelPanel"};//"fade":"fast",
      }
      savePanel = document.createElement("panel");
      savePanel = pub.setAttrDOMElement(savePanel, panelAttr);

      vbox = document.createElement("vbox");
      vbox = pub.setAttrDOMElement(vbox, {"flex":"1","style":"overflow:auto","width":"500","height":"100"});
      //alert("vbox created");
      //<textbox id="property" readonly="true" multiline="true" clickSelectsAll="true" rows="20" flex="1"/>
      //TODO: put links instead of pure text, and point to the links in page, may need to add bookmark in the page??
      //add label instead
      
      //alert("all label added");
      //add textbox
      /*desc = document.createElement("textbox");
      desc = pub.setAttrDOMElement(desc, {"readonly":"true", "multiline":"true", "rows":"8", "cols":"70"})
      desc.setAttribute("value",outputText);
      vbox.appendChild(desc);*/
      //create another textbox for just debug info
      //linkBox = document.createElement("vbox");
      //linkBox = pub.setAttrDOMElement(linkBox, {"flex":"1", "style":"overflow:auto", "height":"40"});
      //savePanel.appendChild(linkBox);
      savePanel.appendChild(vbox);
      if(version>=4){
        var resizer = document.createElement("resizer");
        resizer = pub.setAttrDOMElement(resizer, {"dir":"bottomright", "element":"fwtwRelPanel"});//, "right":"0", "bottom":"0", "width":"0", "height":"0"});
        savePanel.appendChild(resizer);
      }
      //alert("vbox added");
      //this put the panel on the menu bar
      //menus.parentNode.appendChild(savePanel);
      //menus.parentNode.parentNode.appendChild(savePanel);
      document.documentElement.appendChild(savePanel);
    }
    while(vbox.hasChildNodes()){
      vbox.removeChild(vbox.firstChild);
    }
    var l = document.createElement("textbox");
    l = pub.setAttrDOMElement(l, {"class":"plain", "readonly":"true", "multiline":"true", "rows":1, "value":outputText, "style":"background-color:#FFFFFF"});
    vbox.appendChild(l);
    for(var i=0;i<recLinks.length;i++){
        var l = document.createElement("textbox");
        var title = pub.utils.trimString(recLinks[i].link.text);
        title = pub.utils.removeEmptyLine(title);
        var numLine = pub.utils.countChar("\n",title);
        if(pub.DEBUG)
          title+=" "+recLinks[i].kw+" "+ recLinks[i].overallFreq;
        
        if(numLine>0){
          l=pub.setAttrDOMElement(l, {"multiline":"true", "rows":new Number(numLine).toString()});
        }
        if(i%2==0)
          l = pub.setAttrDOMElement(l, {"class":"plain", "readonly":"true", "value":title, "style":"background-color:#EEEEEE"});
        else
          l = pub.setAttrDOMElement(l, {"class":"plain", "readonly":"true", "value":title, "style":"background-color:#FFFFFF"});
        vbox.appendChild(l);
      }
    if(pub.DEBUG){
      debugtext = document.createElement("textbox");
      debugtext = pub.setAttrDOMElement(debugtext, {"readonly":"true", "multiline":"true", "rows":"10", "cols":"70"})
      vbox.appendChild(debugtext);
      debugtext.setAttribute("value",pub.DEBUGINFO);
    }
    if(pub.INPAGE)
      pub.addToPage(outputText, recLinks);
    /*document.documentElement.appendChild(recLinks[0].link);
    var testLink = document.createElement("a");
    alert("text:"+recLinks[0].link.text+" link:"+recLinks[0].link.href);
    testLink = pub.setAttrDOMElement(testLink, {"value":recLinks[0].link.text,"href":recLinks[0].link.href});
    document.documentElement.appendChild(testLink);*/
    //document.parentNode.appendChild(savePanel); ->document.parentNode is null
    //document.appendChild(savePanel); -> node can't be inserted
    //pub.mainWindow.document.appendChild(savePanel);
    
    if(version<4){
      //can't anchor as in 4. WHY?
      savePanel.openPopup(null, "start_end", 60, 80, false, false);
    }else{
      savePanel.openPopup(document.documentElement, "start_end", 60, 80, false, false);
    }
    //get all the links on current page, and their texts shown on page
    //can't get from overlay, still wondering
  };
  
  pub.init = function(){
    pub.utils = com.wuxuan.fromwheretowhere.utils;
    pub.mapOrigVerb = com.wuxuan.fromwheretowhere.corpus.mapOrigVerb();
    pub.history = com.wuxuan.fromwheretowhere.historyQuery;
    pub.history.init();
  };
    
  return pub;
}();