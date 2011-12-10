jQuery.extend({

	/**
	 * manages an <li> element for a note
	 * @param note the Note to manage
	 * @clickFunc a function that should
	 * be called when the user clicks
	 * on the note
	 */
	NoteLI : function(note, clickFunc){
		var dom = $("<li><a href='javascript:;'></a></li>");
		
		dom.find('a').click(function(){ clickFunc(note) });
		
		this.getNote = function(){
			return note;
		}
		
		this.refresh = function(){
			dom.find('a').text(note.getSubject());
		}
		
		this.getDOM = function(){
			return dom;
		}
		this.refresh();
	},

	View: function(threadPart){
        
		var DEBUG=false;
        
        function dAlert(msg){
            if(DEBUG)
                alert(msg);
        }
        
		var FWTWUtils = new $.FWTWUtils();
		
		// this will hold the dom nodes that
		// we use to display notes in the
		// list
		var doms = new $.HashTable();
		
		//var parseJSON = $.parseJSON;
		
		// keep a reference to ourselves
		var that = this;
		
		// a list of who is listening to us
		var listeners = new Array();
	
		// get the console
		$console = $("#ui #console");
		
		// get the list of notes
        $notes = threadPart;
		//var $notes = $("#ui #notes").dynatree("getRoot");
        //$notesbak = $('#ui #notes').dynatree("getRoot");
            
		// get the add form
		$addform = $("#ui #addform").hide();
		
		// get the edit form (hide it by default)
		$editform = $("#ui #editform").hide();
		
		// the about box
		$about = $("#ui #instr");
		$about.find("input").click(function(){
			$about.hide();
		});
		
		// search part
		$searchform = $("#searchPart #searchform");
		
		// a box to put our incoming messages
		var $messages = $("<div style='height:130px; overflow: auto;'></div>");

		/**
		 * set up the buttons to load data
		 */
		$console.append($("<input type='button' value='Clear Console'></input><br><br>").click(function(){
			$messages.empty();
		}));
		$console.append($messages);
		
		
		// the user wants to update the event
		// so validate the form, and then
		// edit the Note
		function submitEditForm(){
			var note_id = $editform.find("#noteId").val();
			var dom = doms.get(parseInt(note_id));
			var subj = $editform.find(".subject").val();
			var body = $editform.find(".body").val();
			if(subj.length == 0){
				alert("Please enter a subject for your note");
				return false;
			}
			dom.getNote().setSubject(subj);
			dom.getNote().setBody(body);
			dom.getNote().confirm();
			return false;
		}
		
		// set up events for the edit form
		$editform.submit(submitEditForm);
		$editform.find("#update").click(submitEditForm);
		$editform.find("#cancel").click( function(){ that.showAddForm() } );
		$editform.find("#delete").click(function(){
			var noteId = $editform.find("#noteId").val();
			that.notifyDeleteNote(noteId);
		});
		
		// the user wants to add a new Note
		// so validate the form, and then
		// add a new Note
		function submitAddForm(){
			var subj = $addform.find(".subject").val();
			var body = $addform.find(".body").val();
			//validate content as an array of json object
			if(body.length == 0){
				alert("no record shared");
			}else{
				var records = JSON.parse(body);
				if(records==null || records[0]==null){
					that.alertInvalidRecords();
				}
				if(subj.length == 0){
					//TODO: get the first note's first non-empty label as subject
					subj = records[0].label;
					if(subj.length==0){
						alert("label still is empty");
					}
				}
				//TODO: preview the records in html format
				that.notifyNewNote(subj, body);
			}
			return false;
		}
		$addform.submit(submitAddForm);
		$addform.find("#add").click(submitAddForm);
	
		this.alertInvalidRecords = function(){
			alert("wrong format records");
		}
		
    this.processEach=function(func){
		  return function(element, index, array){array[index]=func(array[index]);}
	  }
    
		//search for a term in the notes
		//TODO: if any exception happens, still make the page searchable (input enable!) at least after refreshing page
		function submitSearchForm(){
			var terms = $searchform.find(".terms").val();
			dAlert(terms);
			var keywords = FWTWUtils.getIncludeExcluded(terms);
      keywords.words.forEach(that.processEach(escape));
		  keywords.optional.forEach(that.processEach(escape));
		  keywords.excluded.forEach(that.processEach(escape));
		  keywords.site.forEach(that.processEach(escape));
			dAlert(keywords.origkeywords+"\nwords:"+keywords.words+"\noptional:"+keywords.optional+"\nexcluded:"+keywords.excluded+"\nsite:"+keywords.site+"\ntime:"+ keywords.time);
			if(terms==""){
				alert("Please enter some search terms (\"\" for all)");
			}else{
                dAlert("notify search notes");
				that.notifySearchNote(keywords);
			}
			return false;
		}
		$searchform.submit(submitSearchForm);
		$searchform.find("#searchButton").click(submitSearchForm);
		
		/**************************************
		 *  The view is now set up,          *
		 *  so let's flesh out functionality *
		 *************************************/
	
		// show the edit form
		// pre-populated w/ the given note
		this.showEditForm = function(note){
			$addform.hide();
			$editform.show();
			$editform.find("#noteId").val(note.getId());
			$editform.find(".subject").val(note.getSubject());
			$editform.find("#editPart").hide();//val(note.getBody());
			//update HTML view
			$htmlView = $editform.find("#htmlView");
			$htmlView.empty();
			$htmlView.append(FWTWUtils.exportHTML(JSON.parse(note.getBody())));
			$editform.find(".subject").focus();
		}
		
		// hide the edit form
		// and show the add form
		this.showAddForm = function(){
			$editform.hide();
			$addform.show();
			$addform.find(".subject").focus();
		}
		
		/**
		 * enable or disable all inputs in a form
		 */
		function enabledForm($form, en){
			if(!en){
				$form.find(".input").attr("DISABLED","1");
			}else{
				$form.find(".input").removeAttr("DISABLED");
			}
		}
	
		/**
		 * set the add form's enabled state
		 */
		this.setAddFormEnabled = function(en){
			enabledForm($addform, en);
		}
		
		/**
		 * set the search form's enabled state
		 */
		this.setSearchFormEnabled = function(en){
			enabledForm($searchform, en);
		}
		
		/**
		 * set the edit form's enabled state
		 */
		this.setEditFormEnabled = function(en){
			enabledForm($editform, en);
		}
		
		/**
		 * clear the inputs of the add form
		 */
		this.clearAddForm = function(){
			$addform.find(".input").val("");
			$addform.find(".subject").focus();
		}
		
		/**
		 * set the edit form's enabled state
		 */
		this.setEditFormEnabled = function(en){
			if(!en){
				$editform.find(".input").attr("DISABLED","1");
			}else{
				$editform.find(".input").removeAttr("DISABLED");
			}
		}
		
		this.cleanNotes = function(){
			this.log("in clean notes")
			$notes.removeChildren() ;
		}
		
		/**
		 * a note was loaded/updated from the
		 * cache, so let's build / update
		 * the DOM
		 */
		this.loadNote = function(note,forceAdd){
			var dom = doms.get(note.getId());
			if(dom && !forceAdd){
				dom.refresh();
				
			}else{
				//TODO: may put >1 times the same dom into map?
				if(forceAdd)
					this.log("force add note "+note.getId());
				// build a new note item
				// and put it in the list
				dom = new $.NoteLI(note, that.showEditForm);
				doms.put(note.getId(), dom);
				//$notes.append(dom.getDOM());
                
                var treeNodes = [];
                //alert(note.getBody());
                var fwtwNodes = JSON.parse(note.getBody());
                for(var i in fwtwNodes){
                    var fwtwNode = that.toTreeNode(fwtwNodes[i], true);
                    if(fwtwNode.more){
                        fwtwNode.minId=note.getId();
                        //alert("add more node");
                    }
                    treeNodes.push(fwtwNode);
                }
                //alert($notes);
                //alert("add:"+note.getBody());
                //alert($notesbak);
                
                $notes.addChild(treeNodes);
                /*{
                    title: "My new node",
                    tooltip: "This folder and all child nodes were added programmatically."
                });*/
			}
		}
		
        this.toTreeNode = function(fwtw, isTop){
            var obj=new Object();
            //if it's 'more' node, set .more to true
            obj.more=fwtw.more
            obj.title = unescape(fwtw.label);
            obj.href = fwtw.url;
            obj.isFolder = fwtw.isContainer;
            obj.children = [];
            for(var i in fwtw.children){
                obj.children.push(that.toTreeNode(fwtw.children[i], false));
            }
            return obj;
        }
  
		/**
		 * remove the note from view, but
		 * don't remove from cache
		 */
		this.showNote = function(note_id, show){
			var dom = doms.get(note_id);
			if(dom){
				if(show){
					$(dom.getDOM()).show();
				}else{
					$(dom.getDOM()).hide();
				}
			}
		}
		
		/**
		 * remove the note completely from
		 * the view, including the cache
		 */
		this.flushNote = function(note_id){
			var dom = doms.get(note_id);
			if(dom){
				$(dom.getDOM()).remove();
			}
			doms.clear(note_id);
		}
		
		/**
		 * show a simple text-only message in the console
		 */
		this.log = function(str){
			$messages.append(str + "<br>");
		}
		
		/**
		 * add a listener to this view
		 */
		this.addListener = function(list){
			listeners.push(list);
		}
		
		/**
		 * notify that we're trying to add a new note
		 */
		this.notifyNewNote = function(subj, body){
			$.each(listeners, function(i){
				listeners[i].newNoteClicked(subj, body);
			});
		}
		
		this.notifySearchNote = function(keywords){
			$.each(listeners, function(i){
                dAlert(keywords.words);
				listeners[i].searchNoteClicked(keywords);
			});
		}
		
		/**
		 * notify that we're trying to delete a note
		 */
		this.notifyDeleteNote = function(note_id){
			$.each(listeners, function(i){
				listeners[i].deleteNoteClicked(note_id);
			});
		}
		
	},
	
	/**
	 * let people create listeners easily
	 */
	ViewListener: function(list) {
		if(!list) list = {};
		return $.extend({
			newNoteClicked : function() { },
			searchNoteClicked : function(keywords) { },
			deleteNoteClicked : function() { }
		}, list);
	}
	
});
