com.wuxuan.fromwheretowhere.recommendation = function(){
  var pub={};
 
  pub.DEBUG = false;
  pub.DEBUGINFO = "";
  pub.debuginfo = {};
  pub.TOOFEWWORDS = 4;
  pub.MINCHNKEYWORDS = 2;
  pub.MULTILINE_LIMIT = 3;
  pub.starttime = 0;
  pub.sqltime = {};
  pub.MINTITLES = 15;
  
  pub.getOrig = function(word){  
    var orig = pub.mapOrigVerb[word];
    //need to check type because array have function like "match, map"
    if((typeof orig)=="string" && orig){
      return orig;
    }else
      return word;
  };
  
  //also remove all numbers, as they don't seem to carry much "theme" info
  //remove word.length==1
  pub.filter = function(aw, stopwords, specials){
    var allwords = aw;
    var alloccurrence = [];
    var chnoccur = [];
    var jpnoccur = [];
    var engoccur = [];
    //TODO: for now can't handle mixed languages
    for(var i=0; i<allwords.length; i++){
      allwords[i] = allwords[i].toLowerCase();
      var orig = allwords[i];
      //judge if there's jpn
      //TODO: merge with chn, as only reg expr is different
      if(orig.match(/[\u3044-\u30ff]+/)!=null){
        //get all the parts separated by non-word, for now only consider Eng and Chn
        var parts = orig.split(/[^a-zA-Z\d\.\u4e00-\u9fa5\u3044-\u30ff]+/);
        allwords.splice(i,1);
        i--;
        //pre-filter those that's not suitable for segmentation, lang dependent?
        if(parts.length!=0){
          for(var j=0;j<parts.length;j++){
            //remove all numbers and 1 char word
            if(parts[j].length<=1 || parts[j].match(/[0-9]/)!=null){
              continue;
            }
            jpnoccur.push(parts[j]);
          }
        }
      }//if there's chn
      else if(orig.match(/[\u4e00-\u9fa5]+/)!=null){
        //get all the parts separated by non-word, for now only consider Eng and Chn
        var parts = orig.split(/[^a-zA-Z\d\.\u4e00-\u9fa5]+/);
        allwords.splice(i,1);
        i--;
        if(parts.length!=0){
          for(var j=0;j<parts.length;j++){
            //remove all numbers and 1 char word
            if(parts[j].length<=1 || parts[j].match(/[0-9]/)!=null){
              continue;
            }
            chnoccur.push(parts[j]);
          }
        }
      }else{
        //stopwords only for English
        //only get the first part here
        //TODO: should get more words out, split them with the recognized words, expensive though (keep those with special words, and then indexof the recog, split with those, then recurrent)
        allwords[i] = pub.utils.removeNonWord(orig);
        //only for English
        allwords[i] = pub.getOrig(allwords[i]);
        if(allwords[i]=="" || allwords[i].length<=1 || allwords[i].match(/[0-9]/)!=null || stopwords.indexOf(allwords[i])>-1 || specials.indexOf(allwords[i])>-1 ){
          allwords.splice(i, 1);
          i--;
        }else{
          engoccur.push(allwords[i]);
        }
      }
    }
    //seg chnoccur using chn dictionary
    pub.tmp = (new Date()).getTime();
    var segResult = pub.utils.segmentChn(chnoccur, pub.dictionary);
    alloccurrence = alloccurrence.concat(segResult.all);
    pub.utils.mergeToSortedArray(segResult.chnSmall, pub.dictionary);
    //seg jpnoccur using jpn dictionary
    var segResult = pub.utils.segmentChn(jpnoccur, pub.dictionary_jpn);
    alloccurrence = alloccurrence.concat(segResult.all);
    pub.utils.mergeToSortedArray(segResult.chnSmall, pub.dictionary_jpn);
    pub.sqltime.segmentChn += (new Date()).getTime() -pub.tmp;
    if(alloccurrence.length!=0){
      for(var j=0;j<alloccurrence.length;j++){
        //remove all numbers and 1 char word
        if(alloccurrence[j].length==1 || alloccurrence[j].match(/[0-9]/)!=null){
          continue;
        }
      }
    }
    alloccurrence = alloccurrence.concat(engoccur);
    return alloccurrence;
  };
  
  pub.getTopic = function(titles, sp, stopwords, specials){
    if(titles==null){
      return [];
    }
    var allwords = [];
    var splitedTitles = [];
    //if titles is array
    if((titles.constructor.name=="Array")){
      for(var i=0;i<titles.length;i++){
        if(titles[i])
          //TODO: should be special char?
          var splited = titles[i].split(sp);
          splitedTitles.push(splited)
          allwords = allwords.concat(splited);//(" ");/\W/
      }
    }else{
      allwords = titles.split(sp);
      splitedTitles.push(splited)
    }
    var ws = pub.filter(allwords, stopwords, specials);
    return {keywords:ws, splited:splitedTitles};
  };
  
  /*if the title has too few words (including stopwords), consider as non-informatic*/
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
    var titleset = [];
    for(var j in alltitles){
      var titleExist = pub.utils.divInsert(alltitles[j], titleset);
      if(titleExist.exist)
        continue;
      allRelated.push(alltitles[j]);
    }
    return allRelated;
  };
  
  //recommend based on current page
  pub.recommendCurrent = function(){
    pub.recommendInThread(null);
  };
  
  pub.recommendInThread = function(pageDoc){
    if(pageDoc==null){
      pageDoc = gBrowser.selectedBrowser.contentDocument;
    }
    var links = pageDoc.links;
    if(!links)
      return;
    var len = links.length;
    var alllinks = [];
    for(var i=0;i<len;i++){
      if(links[i]){
        alllinks.push(links[i]);
      }
    }
    pub.main.dispatch(new pub.recommendThread(1, pageDoc, alllinks), pub.main.DISPATCH_NORMAL);
  };
  
  pub.recommendThread = function(threadID, pageDoc, alllinks) {
    this.threadID = threadID;
    this.pageDoc = pageDoc;
    this.alllinks = alllinks;
  };
  
  pub.recommendThread.prototype = {
    run: function() {
      try {
        pub.recommend(this.pageDoc, this.alllinks);
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
  
  //all the links; all the keywords; word frequency of keywords
  pub.getRelated = function(allLinks, allRelated, freq){
    var recLinks=[];
    var recTitles = [];
    var linkNumber = allLinks.length;
    for(var i=0;i<linkNumber;i++){
      var currLink = allLinks[i];
      var trimed = "";
      if(currLink.text)
        trimed = pub.utils.trimString(currLink.text);
      else
        continue;
      var t = trimed.toLowerCase();
      //remove the duplicate links (titles)
      var processed = pub.utils.divInsert(t, recTitles);
      if(processed.exist)
        continue;
      var topicStart = (new Date()).getTime();
      var text=pub.getTopic(t, " ", pub.stopwords, pub.specials).keywords;
      pub.sqltime.gettopic += (new Date()).getTime() -topicStart;
      //remove dup word in the title, for freq mult
      //TODO: less syntax, and maybe shouldn't remove dup, as more repetition may mean sth...
      text = pub.utils.uniqueArray(text, false);
      //get the mul of keyword freq in all titles to be sorted
      var oF = 1;
      var keywords = [];
      //if there's chinese, go through every part, otherwise compare by word
      if(/.*[\u4e00-\u9fa5\u3044-\u30ff]+.*$/.test(t)){
        for(var j=0;j<allRelated.length;j++){
          if(t.indexOf(allRelated[j])>-1){
            if(text.length==1 && text[0]==allRelated[j])
              break;
            //only if allRelated[j] isn't substring of existing keywords, add to keywords (work around strict segmentation only)
            if(keywords.every(function(x){return x.indexOf(allRelated[j])==-1;})){
              keywords.push(allRelated[j]);
              oF=oF*freq[allRelated[j]];
            }
          }
        }
        //TBD: could be more than 2, but 2 is more likely, those with only those keywords are likely to be catagories
        if(keywords.length>0 && keywords.length<=pub.MINCHNKEYWORDS){
          var allKeyLen = 0;
          for(var i=0;i<keywords.length;i++){
            allKeyLen+=keywords[i].length;
          }
          //seg can be wrong, and < is possible
          if(t.length<=allKeyLen)
            continue;
        }
      }else{
        //if there's too few words (<3 for now), either catalog or tag, or very obvious already
        if(pub.tooSimple(text, pub.specials)){
          continue;
        }
        for(var j=0;j<allRelated.length;j++){
          if(text.indexOf(allRelated[j])>-1){
            //don't recommend those with only one word, like "msnbc.com"
            if(text.length==1 && text[0]==allRelated[j])
              break;
            keywords.push(allRelated[j]);
            oF=oF*freq[allRelated[j]];
          }
        }
      }
      if(oF<1){
        recLinks.push({link:currLink,overallFreq:oF,kw:keywords});
      }
    }
    //sort by overallFreq
    recLinks.sort(function(a,b){return a.overallFreq-b.overallFreq});
    //don't pop up if there's no related links
    return recLinks;
  };
  
  //get children (of children, etc) until qualified titles > MINTITLES
  pub.getAllTitlesFromChildrenOf = function(pids){
    var pidsWithWord = pids;
    var relTitles = [];
    var numTitles = 0;
    for(var i=0;pidsWithWord.length>0;i++){
      var children = pub.history.getAllChildrenfromAllPlaceId(pidsWithWord);
      if(i==0)
        pidsWithWord = pidsWithWord.concat(children);
      else{
        if(pub.DEBUG)
          alert("not enough titles:"+numTitles);
        pidsWithWord = children;
      }
      
      pub.sqltime.getchild += (new Date()).getTime()-pub.tmp;
  
      pub.tmp = (new Date()).getTime();
      relTitles = relTitles.concat(pub.history.getAllTitlefromIds(pidsWithWord));
      
      pub.sqltime.gettitle += (new Date()).getTime() -pub.tmp;
      pub.tmp = (new Date()).getTime();
      numTitles=relTitles.length;
      if(numTitles>pub.MINTITLES)
        break;
    }
    return relTitles;
  };
  
  pub.recommend = function(pageDoc, allLinks){
    if(pub.DEBUG){
      pub.utils.sqltime.seg0 = 0;
      pub.utils.sqltime.seg1 = 0;
      pub.utils.sqltime.seg2 = 0;
      pub.utils.sqltime.seg3 = 0;
      pub.utils.sqltime.seg4 = 0;
      pub.utils.sqltime.seg5 = 0;
      pub.utils.sqltime.coreTime = 0;
      pub.utils.sqltime.smallerTime = 0;
      pub.utils.sqltime.largerTime =0;
      pub.utils.sqltime.noIndexTime =0;
			pub.sqltime.gettitle = 0;
      pub.sqltime.gettopic = 0;
      pub.sqltime.segmentChn = 0;
			pub.sqltime.sortUnique =0;
			pub.sqltime.getrelated = 0;
    }
    var currLoc = pageDoc.location.href;
    var title = pageDoc.title;
    pub.DEBUGINFO = "";
    pub.starttime = (new Date()).getTime();
    //TODO: put in topicTracker
    var allwords = pub.getTopic(title, " ", pub.stopwords, pub.specials).keywords;
    //without any history tracking
    //TODO: only pick the words related to interest, not every non-stopword
    //search for allwords in history, get the direct children, get all words from them, and choose the link that have those words.
    var pidsWithWord=[];
    //if new tab or no title at all, no recommendation. TODO: extract from text body
    if(allwords==null || allwords.length==0){
      return [];
    }
    pub.tmp = (new Date()).getTime();
    
    var idAndTitlesByKeywords = pub.history.searchIdbyKeywords([], allwords,[],[],[]);
    pidsWithWord = idAndTitlesByKeywords.ids;
    pub.sqltime.searchid = (new Date()).getTime()-pub.tmp;
    pub.tmp = (new Date()).getTime();
    
    var allRelated=[];
    //remove dup titles for now
    var titles = [];
    
    allRelated = allRelated.concat(pub.getAllTitlesFromChildrenOf(pidsWithWord));
    pub.sqltime.historyTitles = allRelated;
    
    var relatedFromLocalNotes = pub.getLocal(allwords, pub.stopwords, pub.specials);
    allRelated=allRelated.concat(relatedFromLocalNotes);
    pub.sqltime.getlocal = (new Date()).getTime() -pub.tmp;
    
    //store the small words for future segmentation
    //TODO: add size limit to dictionary, use it for all seg, including for future allRelated titles
    pub.tmp = (new Date()).getTime();
    allRelated=pub.getTopic(allRelated, " ", pub.stopwords, pub.specials).keywords;
    pub.sqltime.segmentChn += (new Date()).getTime() -pub.tmp;
    
		pub.sqltime.sortUnique = (new Date()).getTime();
    var origLen = allRelated.length;
    //sort the string array by string length, can speed up later processing
    //allRelated is sorted before, but <, uniqueArray should still work
    allRelated.sort(function(a,b){return a<b});
    var len = allRelated.length;
    var a = pub.utils.uniqueArray(allRelated, true);
    //get frequency of word (number of titles that contains it/number of all titles)
    /*a = pub.utils.removeHaveSubstring(a);*/
    var removed = len-a.arr.length;
    allRelated = a.arr;
		pub.sqltime.sortUnique = (new Date()).getTime() -pub.sqltime.sortUnique;
		
    pub.sqltime.getrelated = (new Date()).getTime();
    var freq = a.freq;
    //LATER: getNumofPidWithWord might be more precise, but much more time consuming.
    //       for now just use the wf in "relatedWords"
    /*var relFreq = [];
    var allPids = pub.history.getNumOfPid();
    for(var i=0;i<allRelated.length;i++){
      relFreq[allRelated[i]]=(pub.history.getNumofPidWithWord(allRelated[i])+0.0)/allPids;
    }*/
    //recLinks have object which format is: {link:xx,overallFreq:0.xx,kw:somewords}
    var recLinks = pub.getRelated(allLinks, allRelated, freq);
    
    if(recLinks.length==0){
      if(pub.DEBUG)
        alert("just from current title:"+allwords);
      recLinks = pub.getRelated(allLinks, allwords, freq);
    }
		pub.sqltime.getrelated = (new Date()).getTime() -pub.sqltime.getrelated;
    
    var recUri = [currLoc];
    //get rid of duplicate links
    for(var i=0;i<recLinks.length;i++){
      var uri = recLinks[i].link.href;
      var linkExist = pub.utils.divInsert(uri, recUri);
      if(linkExist.exist){
        recLinks.splice(i,1);
        i--;
      }
    }
		
    if(pub.DEBUG){
      var allover = 0;
      for(var i=0;i<a.arr.length;i++){
        if(!a.freq[a.arr[i]])
          alert("NO FREQ!: "+a.arr[i]);
        pub.DEBUGINFO+=a.arr[i]+ " " +a.freq[a.arr[i]]+"\n";
        allover+=a.freq[a.arr[i]];
      }
      pub.DEBUGINFO="sum of freq: "+allover+"\n"+pub.DEBUGINFO;
      pub.DEBUGINFO="dictionary size: "+pub.dictionary.length+" jp: "+pub.dictionary_jpn.length+"\n"+
                  "No. of titles: "+pub.sqltime.historyTitles.length+"\n"+
                  "searchid: "+ pub.sqltime.searchid +
                  " getchild: "+pub.sqltime.getchild +" from " + pub.numberRefTitles +"\n"+
                  " gettitle: "+pub.sqltime.gettitle + " gettopic: "+pub.sqltime.gettopic +
									" sortUnique: "+pub.sqltime.sortUnique + " getrelated: "+pub.sqltime.getrelated+"\n"+
                  " segment: " + "all - "+pub.sqltime.segmentChn+" in " +pub.utils.sqltime.coreTime +
                  ", smaller: " +pub.utils.sqltime.smallerTime+ " larger: "+pub.utils.sqltime.largerTime+ " index: "+pub.utils.sqltime.noIndexTime+"\n"+
          pub.utils.sqltime.seg0+" "+pub.utils.sqltime.seg1+
                  " "+pub.utils.sqltime.seg2+" "+pub.utils.sqltime.seg3+
          " "+pub.utils.sqltime.seg4+" "+pub.utils.sqltime.seg5 +"\n"+
          pub.DEBUGINFO;//+" segment: "+pub.sqltime.segment+"\n found new chn words: "+pub.debuginfo.newwords.length+"\n"+pub.debuginfo.newwords+
      pub.DEBUGINFO="local notes: "+relatedFromLocalNotes +"\nlocal time: "+pub.sqltime.getlocal+"\n"+pub.DEBUGINFO;
    }
    if(recLinks.length>0){ 
      var o="";
      if(pub.DEBUG){
        if(/.*[\u4e00-\u9fa5]+.*$/.title)
          o=pub.dictionary.length + " " +allwords+" ";//"removed "+removed+" from "+len+"\r\n";
      }
      //ONLY refresh current page when the panel is changed
      pub.currLoc = currLoc;
      pub.pageDoc = pageDoc;
      pub.popUp(title, o, recLinks, allLinks);
    }else if(pub.DEBUG){
        alert("alllinks:\n"+allLinks);
    }
    return recLinks;
  };

  /*-----------------UI below---------------------*/
  pub.setAttrDOMElement = function(ele, atts){
    for(var i in atts){
      ele.setAttribute(i, atts[i]);
    }
    return ele;
  };
  
  pub.testOpen = function(){
    //get the tab that's the suggestions derive from
    var currDoc = getBrowser().selectedBrowser.contentDocument;
    // switch tab when doc or url is the same, which is reused in switchToTab
    if(pub.pageDoc!= currDoc && pub.currLoc!=currDoc.location.href){
      var found = pub.UIutils.switchToTab(pub.pageDoc, pub.currLoc);
      if(!found){
        return;
      }
    }
    var link = this.getAttribute("fwtw-title");
    //search for any line found first, can be inprecise
    var lines = link.split("\n");
    //get the first non-empty line of the link and search for it, but can mis-locate
    var found = false;
    
    var curWin = getBrowser().selectedBrowser.contentWindow;
    for(var i in lines){
      found = curWin.find(lines[i], false, false);
      if(!found)
        found = curWin.find(lines[i], false, true);
      if(found)
        break;
    }
    //some links can not be found...invisble, then just open it
    if(!found){
      if(link!=pub.lastSearchTitle){
        gBrowser.addTab(this.getAttribute("href"));
      }
    }else{
      pub.lastSearchTitle=link;
    }
  };
  
  pub.output = function(recLinks, allLinks){
    var outputText = "";
    var spendtime = 0;
    var ratio = 0;
    if(allLinks.length!=0){
      spendtime = (0.0+((new Date()).getTime()-pub.starttime))/1000;
      ratio = (0.0+Math.round((recLinks.length+0.0)*1000/allLinks.length))/10;
    }
    outputText += "Time: "+spendtime+"s    ";
    outputText += "Ratio(No. of suggested/all links): "+ratio+"%\n";
    return outputText;
  };
  
  pub.popUp = function(origTitle, outputText, recLinks, allLinks){
    //call it from outside to create panel
    if(pub.utils==null)
      pub.utils = com.wuxuan.fromwheretowhere.utils;
    if(pub.UIutils==null)
      pub.UIutils = com.wuxuan.fromwheretowhere.UIutils;
    var version = pub.utils.getFFVersion();
    var savePanel = document.getElementById("fwtwRelPanel");
    var topbar, statsInfoLabel, vbox,debugtext,linkBox, testLink, divEle;
    
    //only reuse the panel for ff 4
    if(version>=4 && savePanel!=null){
      //if there's 0 recLinks && panel is open, return
      if(recLinks.length==0 && savePanel.state=="open")
        return;
      topbar = savePanel.firstChild;
      statsInfoLabel = topbar.firstChild.nextSibling;
      vbox = savePanel.firstChild.nextSibling;
    }else{
      var panelAttr = null;
      //close, label, titlebar only for ff 4
      if(version>=4)
        panelAttr = {"id":"fwtwRelPanel","titlebar":"normal","noautofocus":"true","noautohide":"true","close":"true","height":"200"};
      else{
        panelAttr = {"id":"fwtwRelPanel"};//"fade":"fast",
      }
      savePanel = document.createElement("panel");
      savePanel = pub.setAttrDOMElement(savePanel, panelAttr);
      //add the topbar
      topbar = document.createElement("hbox");
      //refresh button add on top
      var refreshButn = document.createElement("button");
      refreshButn.textContent="Refresh";
      refreshButn.onclick = pub.recommendCurrent;
      topbar.appendChild(refreshButn);
      //stats info
      statsInfoLabel = document.createElement("label");
      topbar.appendChild(statsInfoLabel);
      savePanel.appendChild(topbar);
      
      /*divEle = document.createElement("div");
      savePanel.appendChild(divEle);
      */
      vbox = document.createElement("vbox");
      vbox = pub.setAttrDOMElement(vbox, {"flex":"1","style":"overflow:auto","width":"500","height":"100"});
      //TODO: put links instead of pure text, and point to the links in page, may need to add bookmark in the page??

      savePanel.appendChild(vbox);
      if(version>=4){
        var resizer = document.createElement("resizer");
        resizer = pub.setAttrDOMElement(resizer, {"dir":"bottomright", "element":"fwtwRelPanel"});
        savePanel.appendChild(resizer);
      }
      //this put the panel on the menu bar
      //menus.parentNode.appendChild(savePanel);
      //menus.parentNode.parentNode.appendChild(savePanel);
      document.documentElement.appendChild(savePanel);
    }
    
    statsInfoLabel.setAttribute("value", outputText+pub.output(recLinks,allLinks));//"It\r\nWorks!\r\n\r\nThanks for the point\r\nin the right direction.";
    while(vbox.hasChildNodes()){
      vbox.removeChild(vbox.firstChild);
    }
    
    for(var i=0;i<recLinks.length;i++){
        var t = recLinks[i].link.text;
        var uri = recLinks[i].link.href;
        if(!t)
          continue;
        var title = pub.utils.trimString(t);
        title = pub.utils.removeEmptyLine(title);
        var numLine = pub.utils.countChar("\n",title);
        var titleForSearch = title;
        if(pub.DEBUG)
          title+=" "+recLinks[i].kw+" "+ recLinks[i].overallFreq;

        var butn = document.createElement("button");
        butn.setAttribute("align", "start");
        butn.setAttribute("tooltiptext", recLinks[i].kw)
        //butn.setAttribute("style", "border: 0px; padding:0px;");//; text-align: center;");
        butn.setAttribute("class", "borderless");
        butn.onclick = pub.testOpen;
        butn.setAttribute("href", uri);
        butn.setAttribute("fwtw-title",titleForSearch);
        //butn.textContent=title;//"It\r\nWorks!\r\n\r\nThanks for the point\r\nin the right direction.";
        /*var predesc = document.createElement("description");
        predesc.textContent = "this is black ";
        predesc.setAttribute("style", "color:gray;");
        butn.appendChild(predesc);
        var middesc = document.createElement("description");
        middesc.textContent = "this is red ";
        middesc.setAttribute("style", "color:red;");
        butn.appendChild(middesc);*/
        var desc = document.createElement("description");
        desc.setAttribute("style", "white-space: pre-wrap");
        desc.setAttribute("flex", "1");
        desc.textContent=title;
        //TODO: more precise detection of visited page, some have different url but very "close" titles...
        if(pub.history.getIdfromUrl(uri)!=null)
          desc.setAttribute("style", "color:gray;");
        butn.appendChild(desc);
        /*var descs = pub.highlightKeywords(title, recLinks[i].kw);
        for(var j=0;j<descs.length;j++){
          butn.appendChild(descs[j]);
        }*/
        vbox.appendChild(butn);
        /*var link = document.createElement("a");
        link=pub.setAttrDOMElement(link, {"value":title,"href":"com.wuxuan.fromwheretowhere.recommendation.testOpen()"});
        divEle.appendChild(link);*/
      }
    //reset scroll vbox to top
    vbox.scrollTop = 0;
    
    if(pub.DEBUG){
      debugtext = document.createElement("textbox");
      debugtext = pub.setAttrDOMElement(debugtext, {"readonly":"true", "multiline":"true", "rows":"10", "cols":"70"})
      vbox.appendChild(debugtext);
      debugtext.setAttribute("value",pub.DEBUGINFO);
    }
    //document.parentNode.appendChild(savePanel); ->document.parentNode is null
    //document.appendChild(savePanel); -> node can't be inserted
    
    if(version<4){
      //can't anchor as in 4. WHY?
      savePanel.openPopup(null, "start_end", 60, 80, false, false);
    }else{
      savePanel.setAttribute("label","Seemingly Related or Interesting Link Titles"+" - "+origTitle);
      savePanel.openPopup(null, "start_end", 60, 80, false, false);
    }
  };
  
  pub.highlightKeywords = function(origtitle, keywords){
    var indice = [];
    var title = origtitle.toLowerCase();
    for(var i=0;i<keywords.length;i++){
      var idx = title.indexOf(keywords[i]);
      indice.push(idx);
      indice.push(idx+keywords[i].length);
    }
    indice.sort(function smaller(a,b){return a>b;});
    var descs = [];
    var starter = 0;
    var ender = 0;
    for(var i=0;i<indice.length;i++){
      var desc = document.createElement("description");
      if(starter!=indice[i]){
        desc.textContent = origtitle.substring(starter,indice[i]);
        if(i%2==0){
          //desc.setAttribute("style", "color:black;");
        }else{
          desc.setAttribute("style", "font-weight: bolder");//"color:red;");
        }
        descs.push(desc);
        starter = indice[i];
      }
    }
    return descs;
  };
  
  pub.init = function(){
    pub.main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
    pub.initCorp();
    pub.initHistory();
  };
  
  pub.initCorp = function(){
    pub.utils = com.wuxuan.fromwheretowhere.utils;
    pub.mapOrigVerb = com.wuxuan.fromwheretowhere.corpus.mapOrigVerb();
    pub.stopwords = com.wuxuan.fromwheretowhere.corpus.stopwords_en_NLTK;
    pub.specials = com.wuxuan.fromwheretowhere.corpus.special;
    pub.dictionary = [];
    pub.dictionary_jpn = [];
  };
  
  pub.initHistory = function(){
    pub.history = com.wuxuan.fromwheretowhere.historyQuery;
    pub.history.init();
    pub.localmanager = com.wuxuan.fromwheretowhere.localmanager;
    pub.localmanager.init();
  };
  return pub;
}();