<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

$correct_password = "1234";

if (!isset($_POST['file'])) {
    die("No file selected");
}

$file = $_POST['file'];

// STEP 1: show password form
if (!isset($_POST['password'])) {
?>
<!DOCTYPE html>
<html>
<head>
    <title>VIP Download</title>
</head>
<body style="background:#000;color:#fff;text-align:center;margin-top:100px;">

<h2>🔒 Enter Password</h2>

<form method="POST" action="">
    <input type="hidden" name="file" value="<?php echo $file; ?>">

    <input type="password" name="password" placeholder="Password"
           style="padding:10px;">

    <br><br>

    <button type="submit">Unlock</button>
</form>

</body>
</html>

<?php
exit;
}

// STEP 2: check password
if ($_POST['password'] !== $correct_password) {
    die("❌ Wrong Password");
}

// STEP 3: download
if (!file_exists($file)) {
    die("File not found: " . $file);
}

header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="'.basename($file).'"');
header('Content-Length: ' . filesize($file));

readfile($file);
exit;

?>