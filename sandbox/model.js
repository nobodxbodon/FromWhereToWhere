jQuery.extend({
	
	Note : function(json, model){
	
		// keep a reference to ourself
		var that = this;
		
		// the data of the Note
		var data = json;
		
		// manage undo history
		var revert_actions = new Array();
		
		// be able to create undo actions
		function createRevertAction(func, value){
			return function(){ func(value); }
		}

		/**
		 * return the Id of this Note
		 */
		this.getId = function(){
			return data.note_id;
		}
		
		/**
		 * returns the subject of this Note
		 */
		this.getSubject = function(){
			return data.subject;
		}
		
		/**
		 * returns the body of this Note
		 */
		this.getBody = function(){
			return data.body;
		}
		
		/**
		 * set the subject of this Note
		 * and keep an undo history
		 */
		this.setSubject = function(subj){
			revert_actions.push(createRevertAction(function(val){ data.subject = val; }, data.subject));
			data.subject = subj;
		}
		
		/**
		 * set the body of this Note
		 * and keep an undo history
		 */
		this.setBody = function(body){
			revert_actions.push(createRevertAction(function(val){ data.body = val; }, data.body));
			data.body = body;
		}
		
		/**
		 * update this Note with new data
		 * loaded from a json object
		 */
		this.update = function(newJson){
			data = $.extend(data, newJson);
		}
		
		/**
		 * confirm all changes, so notify
		 * the Model that we need to save
		 * to the server
		 */
		this.confirm = function(){
			model.updateNote(that);
		}
		
		/** 
		 * we don't need to save our undo history anymore
		 * probably b/c a save to server went ok
		 */
		this.clearRevertActions = function(){
			revert_actions = new Array();
		}
		
		/**
		 * undo all changes since the last
		 * successful save
		 */
		this.revert = function(){
			while(revert_actions.length > 0){
				var action = revert_actions.pop();
				action();
			}
		}
		
	},

	Model: function(){
		// our local cache of $.Note objects
		var cache = new $.HashTable();

		// a reference to ourselves
		var that = this;
		
		// the datetime that we last
		// loaded everything
		var lastLoad = null;

		// a list of who is listening to us
		var listeners = new Array();
		
		// load a json response from an ajax call
		function loadResponse(data){
			lastLoad = data.dt;
			var out = new Array();
			$.each(data.notes, function(item){
				var newNote = data.notes[item];
				var cachedNote = cache.get(newNote.note_id);
				if(cachedNote){
					 // already cached, just update it
					cachedNote.update(newNote);
				}else{
					cachedNote = new $.Note(newNote, that);
					// not yet in cache, add it
					cache.put(newNote.note_id, cachedNote);
				}
				out.push(cachedNote);
				that.notifyNoteLoaded(cachedNote);
			});
			return out;
		}
		
		/**
		 * load lots of data from the server
		 * or return data from cache if it's already
		 * loaded
		 */
		this.getAll = function(){
			that.notifyLoadBegin();
			$.ajax({
				url: 'ajax.php',
				data : { load : true },
				type: 'GET',
				dataType: 'json',
				timeout: 1000,
				error: function(){
					that.notifyLoadFail();
				},
				success: function(data){
					if(data.error) return that.notifyLoadFail();
					that.notifyLoadFinish(loadResponse(data));
				}
			});
			return cache.toArray();
		}
		
		/**
		 * add a new Note with the input:
		 * @param subj the subject of the new note
		 * @param body the body of the new note
		 */
		this.addNote = function(subj, body){
			that.notifyAddingNote();
			$.ajax({
				url: 'ajax.php',
				data : { add : true, 
						 subject : subj,
						 body : body },
				type: 'POST',
				dataType: 'json',
				timeout: 1000,
				error: function(){
					that.notifyAddingFailed();
				},
				success: function(data){
					if(data.error) return that.notifyAddingFailed();
					that.notifyAddingFinished(loadResponse(data));
				}
			});
			return cache.toArray();
		}
		
		/**
		 * delete a note with the input:
		 * @param note_id the id of the note to delete
		 */
		this.deleteNote = function(note_id){
			that.notifyDeletingNote(note_id);
			$.ajax({
				url: 'ajax.php',
				data : { 'delete' : true,
						 note_id : note_id },
				type: 'POST',
				dataType: 'json',
				timeout: 1000,
				error: function(){
					that.notifyDeletingFailed(note_id);
				},
				success: function(data){
					if(data.error) return that.notifyDeletingFailed(note_id);
					that.notifyDeletingFinished(note_id);
				}
			});
		}
		
		/**
		 * save a note
		 * @param a Note object
		 */
		this.updateNote = function(note){
			that.notifySavingNote(note);
			$.ajax({
				url: 'ajax.php',
				data : { edit : true, 
						 note_id : note.getId(),
						 subject : note.getSubject(),
						 body : note.getBody() },
				type: 'POST',
				dataType: 'json',
				timeout: 1000,
				error: function(){
					that.notifySavingFailed(note_id);
				},
				success: function(data){
					if(data.error) return that.notifySavingFailed(note);
					note.update(data);
					that.notifySavingFinished(note);
				}
			});
		}
		
		/**
		 * load lots of data from the server
		 */
		this.clearAll = function(){
			cache = new $.HashTable();
		}
		
		/**
		 * add a listener to this model
		 */
		this.addListener = function(list){
			listeners.push(list);
		}
		
		/**
		 * notify everone that we're starting 
		 * to load some data
		 */
		this.notifyLoadBegin = function(){
			$.each(listeners, function(i){
				listeners[i].loadBegin();
			});
		}
		
		/**
		 * we're done loading, tell everyone
		 */
		this.notifyLoadFinish = function(notes){
			$.each(listeners, function(i){
				listeners[i].loadFinish(notes);
			});
		}
		
		/**
		 * we're done loading, tell everyone
		 */
		this.notifyLoadFail = function(){
			$.each(listeners, function(i){
				listeners[i].loadFail();
			});
		}
		
		/**
		 * tell everyone the item we've loaded
		 */
		this.notifyNoteLoaded = function(note){
			$.each(listeners, function(i){
				listeners[i].loadNote(note);
			});
		}
		
		/**
		 * we're beginning to add a new note
		 */
		this.notifyAddingNote = function(){
			$.each(listeners, function(i){
				listeners[i].addingNote();
			});
		}
		
		/**
		 * notify everyone that we failed to
		 * add new notes
		 */
		this.notifyAddingFailed = function(){
			$.each(listeners, function(i){
				listeners[i].addingFailed();
			});
		}
		
		/**
		 * we're done adding new notes, tell
		 * listeners what they are
		 */
		this.notifyAddingFinished = function(newNotes){
			$.each(listeners, function(i){
				listeners[i].addingFinished(newNotes);
			});
		}
		
		/**
		 * notify everyone that we're starting
		 * to delete a note
		 */
		this.notifyDeletingNote = function(note_id){
			$.each(listeners, function(i){
				listeners[i].deletingNote(note_id);
			});
		}
		
		/**
		 * notify everyone that the delete
		 * didn't work
		 */
		this.notifyDeletingFailed = function(note_id){
			$.each(listeners, function(i){
				listeners[i].deletingFailed(note_id);
			});
		}
		
		/**
		 * notify everyone that the note deleted
		 */
		this.notifyDeletingFinished = function(note_id){
			$.each(listeners, function(i){
				listeners[i].deletingFinished(note_id);
			});
		}
		
		/**
		 * notify everyone that we're saving a note
		 */
		this.notifySavingNote = function(note){
			$.each(listeners, function(i){
				listeners[i].savingNote(note);
			});
		}
		
		/**
		 * notify everyone that we're saving a note
		 */
		this.notifySavingFailed = function(note){
			$.each(listeners, function(i){
				listeners[i].savingFailed(note);
			});
		}
		
		/**
		 * notify everyone that we're saving a note
		 */
		this.notifySavingFinished = function(note){
			$.each(listeners, function(i){
				listeners[i].savingFinished(note);
			});
		}
	},
	
	/**
	 * let people create listeners easily
	 */
	ModelListener: function(list) {
		if(!list) list = {};
		return $.extend({
			loadBegin : function() { },
			loadFinish : function() { },
			loadNote : function() { },
			loadFail : function() { },
			addingNote : function() { },
			addingFailed : function() { },
			addingFinished : function() { },
			deletingNote : function() { },
			deletingFailed : function() { },
			deletingFinished : function() { },
			savingNote : function() { },
			savingFailed : function() { },
			savingFinished : function() { }
		}, list);
	}
});
