jQuery.extend({

	Controller: function(model, view){
		var FWTWUtils = $.FWTWUtils();
		/**
		 * listen to the view
		 */
		var vlist = $.ViewListener({
			deleteNoteClicked : function(note_id){
				model.deleteNote(note_id);
			},
			newNoteClicked : function(subj, body){
				model.addNote(subj, body);
			},
			searchNoteClicked : function(keywords){
				model.searchNote(keywords);
			}
		});
		view.addListener(vlist);

		/**
		 * listen to the model
		 */
		var mlist = $.ModelListener({
			loadBegin : function() {
				view.log("Fetching Data...");
			},
			loadFail : function(data) {
				var msg = "ajax error";
				if(data!=null){
					msg+=" "+data+"!";
				}else{
					msg+=".";
				}
				view.log(msg);
			},
			loadFinish : function(notes) {
				var ids = "";
				view.log("in loadFinish");
				$.each(notes, function(i){
					ids += (ids.length ? ", " : "") + notes[i].getId();
				});
				view.log("just loaded via ajax: " + ids);
				view.log("done.");
			},
			loadNote : function(note){
				view.log("loading single: " + note.getId());
				view.loadNote(note);
			},
			addingNote : function() {
				view.log("adding new note...");
				view.setAddFormEnabled(false);
			},
			searchingNote : function(keywords) {
				view.log("searching ...");// + FWTWUtils.buildFeedback(0, keywords.words, keywords.optional, keywords.excluded, keywords.site, keywords.time));
				view.setSearchFormEnabled(false);
			},
			searchNoteFailed : function(keywords) {
				view.log("search failed");//FWTWUtils.buildFeedback(-1, keywords.words, keywords.optional, keywords.excluded, keywords.site, keywords.time));
				view.setSearchFormEnabled(true);
			},
			searchNoteFinished : function(notes) {
				var ids = "";
				view.log("in search finished");
				view.log("empty notes first");
				view.cleanNotes();
				$.each(notes, function(i){
					ids += (ids.length ? ", " : "") + notes[i].getId();
					//view.log("force loading single: " + notes[i].getId());
					view.loadNote(notes[i], true);
				});
				view.log("just got search result via ajax: " + ids);
				view.log("done.");
				view.setSearchFormEnabled(true);
			},
			addingFailed : function() {
				view.log("adding new note failed");
				view.setAddFormEnabled(true);
			},
			addingFinished : function(newNotes) {
				$.each(newNotes, function(i){
					view.log("just added via ajax: " + newNotes[i].getId());
				});
				view.setAddFormEnabled(true);
				view.clearAddForm();
			},
			deletingNote : function(note_id) {
				view.log("deleting note " + note_id + "...");
				view.showNote(note_id, false);
				view.setEditFormEnabled(false);
			},
			deletingFailed : function(note_id) {
				view.log("deleting note " + note_id + " failed");
				view.showNote(note_id, true);
				view.setEditFormEnabled(true);
			},
			deletingFinished : function(note_id) {
				view.flushNote(note_id);
				view.setEditFormEnabled(true);
				view.showAddForm();
				view.log("note " + note_id + " deleted.");
			},
			savingNote : function(note){
				view.log("saving note " + note.getId() );
				view.setEditFormEnabled(false);
				view.loadNote(note);
			},
			savingFailed : function(note){
				view.log("saving note " + note.getId() + " failed.");
				note.revert();
				view.loadNote(note);
				view.setEditFormEnabled(true);
			},
			savingFinished : function(note){
				view.log("saving note " + note.getId() + " complete.");
				view.setEditFormEnabled(true);
			}
		});
		model.addListener(mlist);
		
		// let's get the data
		model.getAll();
	}
});
