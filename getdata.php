<?php
header("Content-Type: application/json");
header("Pragma: no-cache");
header("Expires: 0");

if ($_GET["map"] == 'state') {
  $spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmwphY6oZEgjhGbyNKyFWI_VqDPBIyvLoYxIasPA7ZbwKup195iTyTm1aw8Gwcb1eLl0oOLkGexKXl/pub?gid=1596782624&single=true&output=csv';
}

if ($_GET["map"] == 'county') {
  $spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmwphY6oZEgjhGbyNKyFWI_VqDPBIyvLoYxIasPA7ZbwKup195iTyTm1aw8Gwcb1eLl0oOLkGexKXl/pub?gid=449653435&single=true&output=csv';
}

$fileContents = file_get_contents($spreadsheetUrl);

$lines = explode(PHP_EOL, $fileContents);
$rows = array();
foreach ($lines as $line) {
  $rows[] = str_getcsv($line);
}

echo json_encode($rows);
?>
