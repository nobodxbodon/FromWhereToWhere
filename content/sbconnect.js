const NS_SCRAPBOOK = "http://amb.vis.ne.jp/mozilla/scrapbook-rdf#";

com.wuxuan.fromwheretowhere.sb = function(){
  var pub={};
    
  pub.RDF = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(Components.interfaces.nsIRDFService);
  pub.PREF = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefBranch);
  pub.DIR = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
  pub.IO = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
  
  pub.convertPathToFile = function(aPath){
    var aFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
    aFile.initWithPath(aPath);
    return aFile;
  };
	
  pub.getScrapBookDir = function(){
    var dir;
    try {
      var isDefault = pub.PREF.getBoolPref("scrapbook.data.default");
      dir = pub.PREF.getComplexValue("scrapbook.data.path", Components.interfaces.nsIPrefLocalizedString).data;
      dir = pub.convertPathToFile(dir);
    } catch(ex) {
      isDefault = true;
    }
    if ( isDefault ){
      dir = pub.DIR.get("ProfD", Components.interfaces.nsIFile);
      dir.append("ScrapBook");
    }
    return dir;
    };
	
  pub.sbProfileRoot = pub.getScrapBookDir();
  // tell if SB exists
  //pub.sbExists = false;
  
  pub.init = function(){
    var filepath=pub.IO.newFileURI(pub.sbProfileRoot).spec+"scrapbook.rdf";
    var ds=pub.RDF.GetDataSourceBlocking(filepath);
    //alert(ds.URI);
    ds=ds.QueryInterface(Components.interfaces.nsIRDFDataSource);
    return ds;
  };
  
  pub.ds = pub.init();
  
  pub.urls = [];
  pub.ids = [];
  
  pub.getProperty = function(aRes, aProp)
  {
    if ( aRes.Value == "urn:scrapbook:root" ) return "";
    try {
      var retVal = pub.ds.GetTarget(aRes, pub.RDF.GetResource(NS_SCRAPBOOK + aProp), true);
      return retVal.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
    } catch(ex) {
      return "";
    }
  };
	
  pub.urlInit = function(){
    var allres = pub.ds.GetAllResources();
    while(allres.hasMoreElements()){
      var ele = allres.getNext();
      var src = pub.getProperty(ele, "source");
      var id = pub.getProperty(ele, "id");
      pub.urls.push(src);
      pub.ids.push(id);
    }
  };

  pub.getLocalURIfromId = function(id){
    return pub.IO.newFileURI(pub.sbProfileRoot).spec+"data/"+id+"/index.html"
  };
  
  return pub;
}();
