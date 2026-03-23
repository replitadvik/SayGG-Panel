<?php

$servername = "localhost";
$username = "apitechs_panel";
$password = "apitechs_panel";
$dbname = "apitechs_panel";

$conn = mysqli_connect($servername,$username,$password,$dbname);

if(!$conn) {

die(" PROBLEM WITH CONNECTION : " . mysqli_connect_error());

}
  
?>