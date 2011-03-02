com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
    
  pub.mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation)
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
        .rootTreeItem
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIDOMWindow);
 
  pub.DEBUG = false;
  pub.ANCHOR = false;
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
      //if there's \W in the end or start(hp,\ (the) get the first part; (doesn't) leave it as is
      /*if(allwords[i].match(/\w+\W$/)){
        allwords[i]=allwords[i].substring(0,allwords[i].length-1);
      } else if(allwords[i].match(/^\W\w+/)){
        var orig = allwords[i];
        allwords[i]=allwords[i].substring(1,allwords[i].length);
        alert(orig+"->"+allwords[i]);
      }*/
      var orig = allwords[i];
      //only get the first part here
      allwords[i] = orig.replace(/\W*(\w+)\W*/,"$1");
      /*if(pub.DEBUG){
        if(orig!=allwords[i])
          alert(orig+"->"+allwords[i]);
      }*/
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
  
  pub.tooSimple = function(allwords, specials){
    var rmSpecials = pub.filter(allwords, [], specials);
    if(rmSpecials.length<pub.TOOFEWWORDS){
      return true;
    }else{
      return false;
    }
  };
  
  /* get titles from all the nodes in the note */
  pub.getAllTitles = function(note, titles){
    if(!titles){
      alert(note.label);
    }
    titles.push(note.label);
    for(var i in note.children){
      titles=titles.concat(pub.getAllTitles(note.children[i],[]));
    }
    return titles;
  };
  
  /* get all the words from the notes that have the keywords, this is abused...need more topic discovery */
  pub.getLocal = function(allwords, stopwords, specials){
    var locals = pub.localmanager.searchNotesbyKeywords([], allwords, [],[]);
    var alltitles = [];
    var allRelated = [];
    for(var i in locals){
      alltitles=alltitles.concat(pub.getAllTitles(locals[i],[]));
    }
    //alert(alltitles);
    var titleset = [];
    for(var j in alltitles){
      //no repeat titles!
      if(titleset.indexOf(alltitles[j])>-1){
        continue;
      }else{
        titleset.push(alltitles[j]);
      }
      var relatedWords=pub.getTopic(alltitles[j], " ", stopwords, specials);
      allRelated=allRelated.concat(relatedWords);
    }
    if(pub.DEBUG){
      //alert("locals:\n"+allRelated);
    }
    return allRelated;
  };
  
  pub.recommend = function(pageDoc, title, allLinks){
    pub.pageDoc = pageDoc;
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
        if(pub.DEBUG)
          alert(pidsWithWord[i]);
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
    pub.tmp = (new Date()).getTime();
    var relatedFromLocalNotes = pub.getLocal(allwords, stopwords, specials);
    allRelated=allRelated.concat(relatedFromLocalNotes);
    
    pub.sqltime.getlocal = (new Date()).getTime() -pub.tmp;
    
    var origLen = allRelated.length;
    //sort the string array by string length, can speed up later processing
    allRelated.sort(function(a,b){return a>b});
    var len = allRelated.length;
    //alert(allRelated);
    var a = pub.utils.uniqueArray(allRelated, true);
    //alert(a.arr);
    //get frequency of word (number of titles that contains it/number of all titles)
    /*a = pub.utils.removeHaveSubstring(a);*/
    var removed = len-a.arr.length;
    allRelated = a.arr;
    if(pub.DEBUG){
      var allover = 0;
      for(var i=0;i<a.arr.length;i++){
        if(!a.freq[a.arr[i]])
          alert("NO FREQ!: "+a.arr[i]);
        pub.DEBUGINFO+=a.arr[i]+ " " +a.freq[a.arr[i]]+"\n";
        allover+=a.freq[a.arr[i]];
      }
      pub.DEBUGINFO="sum of freq: "+allover+"\n"+pub.DEBUGINFO;
      pub.DEBUGINFO="searchid: "+ pub.sqltime.searchid + " getchild: "+pub.sqltime.getchild + " gettitle: "+pub.sqltime.gettitle+"\n"+pub.DEBUGINFO;
      pub.DEBUGINFO="local notes: "+relatedFromLocalNotes +"\nlocal time: "+pub.sqltime.getlocal+"\n"+pub.DEBUGINFO;
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
    //alert("try on");
    var linkNumber = allLinks.length;
    for(var i=0;i<linkNumber;i++){
      var trimed = pub.utils.trimString(allLinks[i].text);
      var t = trimed.toLowerCase();
      //remove the duplicate links (titles)
      if(recTitles.indexOf(t)>-1){
        continue;
      }else{
        recTitles.push(t);
      }
      var text=pub.getTopic(t, " ", stopwords, specials);
      //remove dup word in the title, for freq mult
      //TODO: less syntax, and maybe shouldn't remove dup, as more repetition may mean sth...
      text = pub.utils.uniqueArray(text, false);
      //if there's too few words (<3 for now), either catalog or tag, or very obvious already
      if(pub.tooSimple(text, specials)){
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
    
    if(recLinks.length==0){
      if(pub.DEBUG)
        alert("just from current title");
      for(var i=0;i<allLinks.length;i++){
        var trimed = pub.utils.trimString(allLinks[i].text);
        var t = trimed.toLowerCase();
        //remove the duplicate links (titles)
        if(recTitles.indexOf(t)>-1){
          continue;
        }else{
          recTitles.push(t);
        }
        for(var w in allwords){
          if(t.indexOf(allwords[w])>-1){
            recLinks.push({link:allLinks[i],overallFreq:0,kw:allwords[w]});
          }
        }
      }
    }
    if(recLinks.length>0){
      var o = pub.output(recLinks,allLinks);
      if(pub.DEBUG){
        o="removed "+removed+" from "+len+"\n"+o;
      }
      pub.popUp(title, o, recLinks);
    }else if(pub.DEBUG){
        alert("alllinks:\n"+allLinks);
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
    //gBrowser.addTab(link);
    //window.location.hash="location";
    getBrowser().selectedBrowser.contentWindow.find(link, false, false, false);
    //window.location = window.location + link;
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
      
      for(var i=0;i<recLinks.length;i++){
        //if anchor is added
        if(pub.ANCHOR){
          if(i==0)
            recLinks[i].link.setAttribute('href', "#location");
        }
        recLinks[i].link.appendChild(document.createElement("br"));
        p.appendChild(recLinks[i].link);
      }
      div.appendChild(p);
      body.insertBefore(div,body.firstChild);//appendChild(div);//recLinks[0]);
    }else{
      alert("body is null: "+body.tagName);
    }
  };
  
  pub.popUp = function(origTitle, outputText, recLinks){
    //pub.rec = recLinks;
    //const nm = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var version = pub.utils.getFFVersion();
    var savePanel = document.getElementById("fwtwRelPanel");
    var vbox,debugtext,linkBox, testLink;
    if(pub.ANCHOR){
    if(recLinks.length>0){
    //for(var i=0;i<recLinks.length;i++){
      testLink = document.createElement("label");
      var anchURL = "#location";
      testLink = pub.setAttrDOMElement(testLink, {"value":recLinks[0].link.text.trim(),"onclick":"com.wuxuan.fromwheretowhere.recommendation.testOpen(\'"+anchURL+"\')"});//recLinks[i].link.href+"\')"});
      var anch = document.createElement("a");
      anch = pub.setAttrDOMElement(anch, {"name":"location"});
      //var currentDoc = document.commandDispatcher.focusedWindow.document;
      alert("try insert before: "+recLinks[0].link.text);
      alert(pub.pageDoc.links.length);
      recLinks[0].link.parentNode.insertBefore(anch, recLinks[0].link);
      alert("insert done");
      //var testLink = pub.createElement(document, "label", {"value":recLinks[0].link.text.trim(),"onclick":"com.wuxuan.fromwheretowhere.recommendation.testFocus("+0+")"});
    }
    }
    //only reuse the panel for ff 4
    if(version>=4 && savePanel!=null){
      //alert("there's panel!");
      vbox = savePanel.firstChild;
    }else{
      //alert("creating new panel");
      var panelAttr = null;
      //close, label, titlebar only for ff 4
      if(version>=4)
        panelAttr = {"id":"fwtwRelPanel","titlebar":"normal","noautohide":"true","close":"true","height":"100"};
      else{
        panelAttr = {"id":"fwtwRelPanel"};//"fade":"fast",
      }
      savePanel = document.createElement("panel");
      savePanel = pub.setAttrDOMElement(savePanel, panelAttr);

      vbox = document.createElement("vbox");
      vbox = pub.setAttrDOMElement(vbox, {"flex":"1","style":"overflow:auto","width":"500","height":"100"});
      //alert("vbox created");
      //<textbox id="property" readonly="true" multiline="true" clickSelectsAll="true" rows="20" flex="1"/>
      //TODO: put links instead of pure text, and point to the links in page, may need to add bookmark in the page??

      savePanel.appendChild(vbox);
      if(version>=4){
        var resizer = document.createElement("resizer");
        resizer = pub.setAttrDOMElement(resizer, {"dir":"bottomright", "element":"fwtwRelPanel"});//, "right":"0", "bottom":"0", "width":"0", "height":"0"});
        savePanel.appendChild(resizer);
      }
      //this put the panel on the menu bar
      //menus.parentNode.appendChild(savePanel);
      //menus.parentNode.parentNode.appendChild(savePanel);
      document.documentElement.appendChild(savePanel);
    }
    if(pub.ANCHOR){
      savePanel.insertBefore(testLink, vbox);
      alert("testlink append");
    }
    while(vbox.hasChildNodes()){
      vbox.removeChild(vbox.firstChild);
    }
    /*var l = document.createElement("textbox");
    l = pub.setAttrDOMElement(l, {"class":"plain", "readonly":"true", "multiline":"true", "rows":1, "value":outputText, "style":"background-color:#FFFFFF"});
    vbox.appendChild(l);*/
    var butn = document.createElement("button");
    butn.setAttribute("style", "white-space: pre-wrap");//; text-align: center;");
    butn.setAttribute("style", "border: 0px !important");
    //button.plain{ border: 0px !important; };
    butn.textContent=outputText;//"It\r\nWorks!\r\n\r\nThanks for the point\r\nin the right direction.";
    vbox.appendChild(butn);
    
    /*testLink = document.createElement("label");
    testLink = pub.setAttrDOMElement(testLink, {"value":recLinks[0].link.text.trim(),"onclick":"com.wuxuan.fromwheretowhere.recommendation.testOpen(\'"+recLinks[0].link.text.trim()+"\')"});
    vbox.appendChild(testLink);*/
    
    for(var i=0;i<recLinks.length;i++){
        var l = document.createElement("textbox");
        var t = recLinks[i].link.text;
        //only add if it's a string
        //if((typeof t)!="string")
        //  continue;
        var title = pub.utils.trimString(t);
        title = pub.utils.removeEmptyLine(title);
        var numLine = pub.utils.countChar("\n",title);
        if(pub.DEBUG)
          title+=" "+recLinks[i].kw+" "+ recLinks[i].overallFreq;
        
        /*if(numLine>0){
          l=pub.setAttrDOMElement(l, {"multiline":"true", "rows":new Number(numLine).toString()});
        }
        l = pub.setAttrDOMElement(l, {"class":"plain", "readonly":"true", "value":title});
        l.setAttribute("style", (i&1)?"background-color:#FFFFFF":"background-color:#EEEEEE");
        vbox.appendChild(l);*/
        
        var butn = document.createElement("button");
        butn.setAttribute("style", "white-space: pre-wrap");//; text-align: center;");
        butn.setAttribute("class", "borderless");
        butn.textContent=title;//"It\r\nWorks!\r\n\r\nThanks for the point\r\nin the right direction.";
        vbox.appendChild(butn);
      }
    if(pub.DEBUG){
      debugtext = document.createElement("textbox");
      debugtext = pub.setAttrDOMElement(debugtext, {"readonly":"true", "multiline":"true", "rows":"10", "cols":"70"})
      vbox.appendChild(debugtext);
      debugtext.setAttribute("value",pub.DEBUGINFO);
    }
    if(pub.INPAGE)
      pub.addToPage(outputText, recLinks);
    //document.parentNode.appendChild(savePanel); ->document.parentNode is null
    //document.appendChild(savePanel); -> node can't be inserted
    //pub.mainWindow.document.appendChild(savePanel);
    
    if(version<4){
      //can't anchor as in 4. WHY?
      savePanel.openPopup(null, "start_end", 60, 80, false, false);
    }else{
      savePanel.setAttribute("label","Seemingly Related or Interesting Link Titles"+" - "+origTitle);
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
    pub.localmanager = com.wuxuan.fromwheretowhere.localmanager;
    pub.localmanager.init();
  };
    
  return pub;
}();