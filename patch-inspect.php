<?php
$f = '/home/customer/www/yelpscan.shefamarketing.com/public_html/index.html';
$html = file_get_contents($f);
if (!$html) { echo json_encode(['ok'=>false,'err'=>'read failed']); exit; }

// Remove the broken window.submitScan stub and replace with the real async function
// The broken stub starts with: window.submitScan=async function(e){
// Find and replace it with the correct submitScan that calls the Yelp API

// Check what's currently in the file  
$hasWindowSubmit = strpos($html, 'window.submitScan=async') !== false || strpos($html, 'window.submitScan = async') !== false;
$hasAsyncFn = strpos($html, 'async function submitScan') !== false;

echo json_encode([
  'ok' => true,
  'size' => strlen($html),
  'hasWindowSubmit' => $hasWindowSubmit,
  'hasAsyncFn' => $hasAsyncFn,
  'snippet' => substr($html, strpos($html, 'submitScan') ?: 0, 200)
]);
?>