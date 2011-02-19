com.wuxuan.fromwheretowhere.corpus = function(){
  var pub={};
  
  pub.special = ["-","&",":",",","&","\'","\"","\/"]; //"\\" lead to exception in reg exp
  
  pub.stopwords_en_NLTK = ["i",
"me",
"my",
"myself",
"we",
"our",
"ours",
"ourselves",
"you",
"your",
"yours",
"yourself",
"yourselves",
"he",
"him",
"his",
"himself",
"she",
"her",
"hers",
"herself",
"it",
"its",
"itself",
"they",
"them",
"their",
"theirs",
"themselves",
"what",
"which",
"who",
"whom",
"this",
"that",
"these",
"those",
"am",
"is",
"are",
"was",
"were",
"be",
"been",
"being",
"have",
"has",
"had",
"having",
"do",
"does",
"did",
"doing",
"a",
"an",
"the",
"and",
"but",
"if",
"or",
"because",
"as",
"until",
"while",
"of",
"at",
"by",
"for",
"with",
"about",
"against",
"between",
"into",
"through",
"during",
"before",
"after",
"above",
"below",
"to",
"from",
"up",
"down",
"in",
"out",
"on",
"off",
"over",
"under",
"again",
"further",
"then",
"once",
"here",
"there",
"when",
"where",
"why",
"how",
"all",
"any",
"both",
"each",
"few",
"more",
"most",
"other",
"some",
"such",
"no",
"nor",
"not",
"only",
"own",
"same",
"so",
"than",
"too",
"very",
"s",
"t",
"can",
"will",
"just",
"don",
"should",
"now"];
  
  pub.infinitive=[
    "arise","awake","be","bear","beat","become","befall","begin","behold","bend","beseech","beset","bet","bid","bind","bite","bleed","blow","break","breed","bring","build","burn","burst","buy","can","cast","catch","choose","cling","come","cost","creep","cut","deal","dig","do","draw","dream","drink","drive","dwell","eat","fall","feed","feel","fight","find","flee","fling","fly","forbid","forecast","forego","foresee","foretell","forget","forgive","forsake","freeze","get","give","go","grind","grow","hang","have","hear","hide","hit","hold","hurt","keep","kneel","know","lay","lead","lean","leap","leave","lend","let","lie","light","lose","make","may","mean","meet","mow","pay","put","quit","read","rend","rid","ride","ring","rise","run","saw","say","see","seek","sell","send","set","shake","shall","shear","shed","shine","shoot","show","shrink","shut","sing","sink","sit","slay","sleep","slide","sling","smell","sow","speak","speed","spell","spend","spill","spin","spit","split","spoil","spread","spring","stand","steal","stick","sting","stink","stride","strike","swear","sweep","swell","swim","swing","take","teach","tear","tell","think","throw","thrust","tread","wake","waylay","wear","weave","wed","weep","will","win","wind","withdraw","withhold","withstand","wring","write"
  ];
  
  pub.pastTense=[
    "arose","awoke,awaked","was,were","bore","beat","became","befell","began","beheld","bent","besought,beseeched","beset","bet,betted","bade,bid","bound","bit","bled","blew","broke","bred","brought","built","burned,burnt","burst,bursted","bought","could","cast","caught","chose","clung","came","cost","crept","cut","dealt","dug","did","drew","dreamed,dreamt","drank","drove","dwelt,dwelled","ate","fell","fed","felt","fought","found","fled","flung","flew","forbade,forbad","forecast,forecasted","forewent","foresaw","foretold","forgot","forgave","forsook","froze","got","gave","went","ground","grew","hung,hanged","had","heard","hid","hit","held","hurt","kept","knelt,kneeled","knew","laid","led","leaned,leant","leapt,leaped","left","lent","let","lay","lit,lighted","lost","made","might","meant","met","mowed","paid","put","quit,quitted","read","rent","rid,ridded","rode","rang","rose","ran","sawed","said","saw","sought","sold","sent","set","shook","should","sheared","shed","shone,shined","shot","showed","shrank,shrunk","shut","sang,sung","sank,sunk","sat","slew","slept","slid","slung","smelled,smelt","sowed","spoke","sped,speeded","spelled","spent","spilled,spilt","spun","spit,spat","split","spoiled,spoilt","spread","sprang,sprung","stood","stole","stuck","stung","stank,stunk","strode","struck","swore","swept","swelled","swam","swung","took","taught","tore","told","thought","threw","thrust","trod","woke,waked","waylaid","wore","wove,weaved","wedded,wed","wept","would","won","wound,winded","withdrew","withheld","withstood","wrung","wrote"
  ];
  
  pub.pastParticiple=[
    "arisen","awoken,awaked,awoke","been","borne,born","beaten,beat","become","befallen","begun","beheld","bent","besought,beseeched","beset","bet,betted","bidden,bid,bade","bound","bitten,bit","bled","blown","broken","bred","brought","built","burned,burnt","burst,bursted","bought","","cast","caught","chosen","clung","come","cost","crept","cut","dealt","dug","done","drawn","dreamed,dreamt","drunk,drank","driven","dwelt,dwelled","eaten","fallen","fed","felt","fought","found","fled","flung","flown","forbidden","forecast,forecasted","foregone","freseen","foretold","forgotten,forgot","forgiven","forsaken","frozen","got,gotten","given","gone","ground","grown","hung,hanged","had","heard","hidden,hid","hit","held","hurt","kept","knelt,kneeled","known","laid","led","leaned","leapt,leaped","left","lent","let","lain","lit,lighted","lost","made","","meant","met","mowed,mown","paid","put","quit,quitted","read","rent","rid,ridded","ridden","rung","risen","run","sawed,sawn","said","seen","sought","sold","sent","set","shaken","","sheared,shorn","shed","shone,shined","shot","shown,showed","shrunk,shrunken","shut","sung","sunk","sat","slain","slept","slid","slung","smelled,smelt","sown,sowed","spoken","sped,speeded","spelled","spend","spilled,split","spun","spit,spat","split","spoiled,spoilt","spread","sprung","stood","stolen","stuck","stung","stunk","stridden","struck,stricken","sworn","swept","swelled,swollen","swum","swung","taken","taught","torn","told","thought","thrown","thrust","trodden,trod","woken,waked,woke","waylaid","worn","woven,weaved","wedded,wed","wept","","won","wound,winded","withdrawn","withheld","withstood","wrung","written,writ"
  ];
  
  pub.mapOrigVerb = function(){
    var l1 = pub.infinitive.length;
    var l2 = pub.pastTense.length;
    var l3 = pub.pastParticiple.length;
    
    var words = [];
    for(var i=0;i<l2;i++){
      var allforms = pub.pastTense[i].split(",");
      for(var j=0;j<allforms.length;j++){
        if(allforms[j]!=pub.infinitive[i])
          words[allforms[j]]=pub.infinitive[i];
      }
    }
    for(var i=0;i<l3;i++){
      var allforms = pub.pastParticiple[i].split(",");
      for(var j=0;j<allforms.length;j++){
        if(allforms[j]!=pub.infinitive[i])
          words[allforms[j]]=pub.infinitive[i];
      }
    }
    //alert(l1 + " "+l2+" "+l3+" ");
    return words;
  };
  
  return pub;
}();

