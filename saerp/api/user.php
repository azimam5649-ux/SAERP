session_start();
if (!isset($_SESSION['user'])) { exit("Not authenticated"); }
