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
		//echo 'Caught exception when querying sql ',"\n";;
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
	/*if(!isset($_REQUEST["load"]) && rand(1, 100) < 10){
		throw new Exception("a fake error to show how the UI"
			." does error correction when the server dies.");
	}*/

	// get one note from the DB
	function sql_getNote($id){
		if(!is_int($id)) throw new Exception("argument to " . 
			__METHOD__ . " must be an int");
		return "SELECT * FROM `" . TABLE_NAME . "` WHERE `" . COL_ID . "`='" . $id . "'";
	}

	// add a note to the DB
	function sql_addNote($subj, $body, $dt){
		if(!is_string($subj)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		if(!is_string($body)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		if(!is_string($dt)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		return "INSERT INTO `threads` (`subject`, `content`,`savedate`) "
			. "VALUES ('" . addslashes($subj) . "','" . addslashes($body) . "','"
			. addslashes($dt) . "')";
	}

	function sql_searchNote($word){
		//if(!is_array($words)) throw new Exception("argument to " . __METHOD__ . " must be an array");
		if(!is_string($word)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		return "SELECT * FROM `" . TABLE_NAME . "` WHERE " . COL_BODY . " LIKE '%" . $word . "%'" . " ORDER BY " . COL_DT . " DESC";
	}
	
    function getRightQuote($word){
		//if it has \', replace sql term with \"
		if(preg_match("/\'/", $word)){
			return "\"%" . $word . "%\"";
		}else{
			return "'%" . $word . "%'";
		}
	}
    
    function sql_searchNoteByKeywords($keywords){
        //add site filter
		$term = "`" . TABLE_NAME . "`";
        $site = $keywords->{'site'};
        $words = $keywords->{'words'};
        $optional = $keywords->{'optional'};
        $count = count($site);
		if($site && $count!=0){
        for($i = $count-1; $i>=0; $i--){
          $term = "(SELECT * FROM " . $term . " WHERE " . COL_BODY . " LIKE '%" . $site[$i] . "%')";
        }
      }
      $count = count($words);
      if($words && $count!=0){
        for($i = $count-1; $i>=0; $i--){
          $partTerm = getRightQuote($words[$i]);
          if($i==$count-1){
            $term = "SELECT * FROM " . $term . " WHERE " . COL_BODY . " LIKE " . $partTerm;//'%" + words[i] + "%'";
          } else if($i!=0){
            $term = "SELECT * FROM (" . $term . ") WHERE " . COL_BODY . " LIKE " . $partTerm;//'%" + words[i] + "%'";
          }
        }
      }
      $optionalTerm = "";
      $count = count($optional);
      if($optional){
          for($i=0;$i<$count;$i++){
          $partTerm = getRightQuote($optional[$i]);
                if($i==0){
                    $optionalTerm=$optionalTerm . " " . COL_BODY . " LIKE " . $partTerm;//'%" + optional[i] + "%'"
                }else{
                    $optionalTerm=$optionalTerm . " OR " . COL_BODY . " LIKE " . $partTerm;//'%" + optional[i] + "%'"
                }
            }
        if($count>0){
            $term = "SELECT * FROM (" . $term . ") WHERE" . $optionalTerm;
        }
      }
      
      return $term;
      
		//if(!is_array($words)) throw new Exception("argument to " . __METHOD__ . " must be an array");
		//if(!is_string($word)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		//return "SELECT * FROM `" . TABLE_NAME . "` WHERE " . COL_BODY . " LIKE '%" . $word . "%'" . " ORDER BY " . COL_DT . " DESC";
	}
    
	// get all notes from the DB
	function sql_getAllNotes(){
		return "SELECT * FROM `" . TABLE_NAME . "` ORDER BY " . COL_DT . " DESC";
	}
	
	// delete a note from the DB
	function sql_deleteNote($id){
		if(!is_int($id)) throw new Exception("argument to " . __METHOD__ . " must be an int");
		return "DELETE FROM `threads` WHERE `thread_id`='" . $id . "'";
	}
	
	// save a note to the DB
	function sql_editNote($id, $subj, $body, $dt){
		if(!is_int($id)) throw new Exception("argument to " . __METHOD__ . " must be an int");
		if(!is_string($subj)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		if(!is_string($body)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		if(!is_string($dt)) throw new Exception("argument to " . __METHOD__ . " must be a string");
		return "UPDATE `threads` SET `subject` = '" . addslashes($subj) . "', `content` = '"
			. addslashes($body) . "', `dt_modified` = '" . addslashes($dt)
			. "' WHERE `thread_id`='" . $id . "'";
	}
	
	
	if(isset($_REQUEST["delete"])){
		//request to delete a note
		$note_id = (int) $_REQUEST["thread_id"];
		$result = query(sql_deleteNote($note_id));
		$ret = array();
		$ret["error"] = false;
		echo json_encode($ret);
	}else if(isset($_REQUEST["edit"])){
		// request to modify subj/body of a note
		$note_id = (int) $_REQUEST["thread_id"];
		$subject = $_REQUEST["subject"];
		$body = $_REQUEST["content"];
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
		$note["thread_id"] = mysql_insert_id($mysql);
		$note["savedate"] = $dt;
		//$note["dt_modified"] = $dt;
		$note["subject"] = $subject;
		$note["content"] = $body;
		$ret = array();
		$ret["error"] = false;
		$ret["threads"] = array($note);
		echo json_encode($ret);
	}else if(isset($_REQUEST["load"])){
		// request to load all notes
		$ret = array();
		$ret["error"] = false;
		$ret["dt"] = gmdate("Y-m-d H:i:s");
		$ret["threads"] = array();
		$result = query(sql_getAllNotes());
		while($row = mysql_fetch_array($result)){
			$ret["threads"][] = $row;
		}
		echo json_encode($ret);
	}else if(isset($_REQUEST["search"])){
		// request to add search notes
		$dt = gmdate("Y-m-d H:i:s");
		$keywords = $_REQUEST["keywords"];
		//$word = $_REQUEST["word"];
		//$words = $subject["words"];
        //$left = $_REQUEST["left"];
        //$right = $_REQUEST["right"];
        //$sqlQuery = $left ." `". TABLE_NAME ."` ". $right . " ORDER BY " . COL_DT . " DESC";
		$result = query(sql_searchNoteByKeywords(json_decode($keywords)));
		while($row = mysql_fetch_array($result)){
			$ret["threads"][] = $row;
		}
		echo json_encode($ret);
        //echo sql_searchNoteByKeywords(json_decode($keywords));
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