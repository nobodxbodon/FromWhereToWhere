<?
include "config.php";

$mysql = mysql_connect(DB_HOST, DB_USER , DB_PASSWORD);
mysql_select_db(DB_NAME, $mysql);

// run a query on mysql,
// and throw an exception if there's
// a problem
function query($sql){
	global $mysql;
	$result = mysql_query($sql, $mysql);
	if(mysql_error($mysql)){
		throw new Exception("mysql error");
	}
	return $result;
}

try{
	/**
	 * randomly fail to show
	 * how the UI recovers when the
	 * server can't process a request
	 */
	if(!isset($_REQUEST["load"]) && rand(1, 100) < 10){
		throw new Exception("a fake error to show how the UI"
			." does error correction when the server dies.");
	}

	// get one note from the DB
	function sql_getNote($id){
		if(!is_int($id)) throw new Exception("argument to " . 
			__METHOD__ . " must be an int");
		return "SELECT * FROM `notes` WHERE `note_id`='" . $id . "'";
	}

	// add a note to the DB
	function sql_addNote($subj, $body, $dt){
		if(!is_string($subj)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		if(!is_string($body)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		if(!is_string($dt)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		return "INSERT INTO `notes` (`subject`, `body`,`dt_added`,`dt_modified`) "
			. "VALUES ('" . addslashes($subj) . "','" . addslashes($body) . "','"
			. addslashes($dt) . "','" . addslashes($dt) . "')";
	}

	// get all notes from the DB
	function sql_getAllNotes(){
		return "SELECT * FROM `notes` ORDER BY dt_added ASC";
	}
	
	// delete a note from the DB
	function sql_deleteNote($id){
		if(!is_int($id)) throw new Exception("argument to " . __METHOD__ . " must be an int");
		return "DELETE FROM `notes` WHERE `note_id`='" . $id . "'";
	}
	
	// save a note to the DB
	function sql_editNote($id, $subj, $body, $dt){
		if(!is_int($id)) throw new Exception("argument to " . __METHOD__ . " must be an int");
		if(!is_string($subj)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		if(!is_string($body)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		if(!is_string($dt)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		return "UPDATE `notes` SET `subject` = '" . addslashes($subj) . "', `body` = '"
			. addslashes($body) . "', `dt_modified` = '" . addslashes($dt)
			. "' WHERE `note_id`='" . $id . "'";
	}
	
	
	if(isset($_REQUEST["delete"])){
		//request to delete a note
		$note_id = (int) $_REQUEST["note_id"];
		$result = query(sql_deleteNote($note_id));
		$ret = array();
		$ret["error"] = false;
		echo json_encode($ret);
	}else if(isset($_REQUEST["edit"])){
		// request to modify subj/body of a note
		$note_id = (int) $_REQUEST["note_id"];
		$subject = $_REQUEST["subject"];
		$body = $_REQUEST["body"];
		$dt = gmdate("Y-m-d H:i:s");
		$result = query(sql_editNote($note_id, $subject, $body, $dt));
		$ret = array();
		$ret["error"] = false;
		$ret["dt_modified"] = $dt;
		echo json_encode($ret);
	}else if(isset($_REQUEST["add"])){
		// request to add a new note
		$dt = gmdate("Y-m-d H:i:s");
		$subject = $_REQUEST["subject"];
		$body = $_REQUEST["body"];
		$result = query(sql_addNote($subject, $body, $dt));
		$note = array();
		$note["note_id"] = mysql_insert_id($mysql);
		$note["dt_added"] = $dt;
		$note["dt_modified"] = $dt;
		$note["subject"] = $subject;
		$note["body"] = $body;
		$ret = array();
		$ret["error"] = false;
		$ret["notes"] = array($note);
		echo json_encode($ret);
	}else if(isset($_REQUEST["load"])){
		// request to load all notes
		$ret = array();
		$ret["error"] = false;
		$ret["dt"] = gmdate("Y-m-d H:i:s");
		$ret["notes"] = array();
		$result = query(sql_getAllNotes());
		while($row = mysql_fetch_array($result)){
			$ret["notes"][] = $row;
		}
		echo json_encode($ret);
	}else{
		// the client asked for something we don't support
		throw new Exception("not supported operation");
	}

}catch(Exception $e){
	// something bad happened
	$ret = array();
	$ret["error"] = true;
	$ret["message"] = $e->getMessage();
	echo json_encode($ret);
}

// close DB connection to clean up
mysql_close($mysql);

?>