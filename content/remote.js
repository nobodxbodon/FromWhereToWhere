
com.wuxuan.fromwheretowhere.remote = function(){
  var pub={};
  
  pub.getAll = function(){
    //var http = new XMLHttpRequest();
    var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
    
    xhr.open("POST", "http://127.0.0.1/fwtw-svr/ajax.php", true);
    var obj={load:true};
    
    /*var boundary = '---------------------------';
    boundary += Math.floor(Math.random()*32768);
    boundary += Math.floor(Math.random()*32768);
    boundary += Math.floor(Math.random()*32768);
    xhr.setRequestHeader("Content-Type", 'multipart/form-data; boundary=' + boundary);
    var body = '';
    body += '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="';
    body += "data";
    body += '"\r\n\r\n';
    body += JSON.stringify(obj);
    body += '\r\n'
    body += '--' + boundary + '--';
    xhr.setRequestHeader('Content-length', body.length);*/

    var jsonString = "load=true";//JSON.stringify(obj);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");//"application/json");//
    xhr.setRequestHeader("Content-Length",jsonString.length);
    xhr.onreadystatechange = function (oEvent) {  
        if (xhr.readyState === 4) {  
          if (xhr.status === 200) {  
            alert(xhr.responseText)  
          } else {  
            alert("Error", xhr.statusText);  
          }  
        }else{
            alert("not ready: "+xhr.readyState);
        }
    };
    xhr.send(jsonString);
    //http.send(JSON.stringify({"load":"true"}));
    /*alert(body);
    xhr.send(body);*/
  };
  
  pub.useHttpResponse = function(http){
    if(http.status == 200)  
        alert(http.responseText); 
    if(http.readyState == 4)
    {
        //alert(http.readystate);
        alert("OMG IT WORKS!!!");
    }else{
        alert("wth is readystate: "+http.readyState);
    }
  }
  
  return pub;
}();
  