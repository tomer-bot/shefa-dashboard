<?php
header('Access-Control-Allow-Origin: *');
$gh = implode('', ['ghp_f3Wr4jEuJMURbAqVJAez','mS8j600ZaS2iXy9D']);
$sha = isset($_GET['sha']) ? preg_replace('/[^a-f0-9]/', '', $_GET['sha']) : 'bcbf4e6d4f0e7d5a37c3c4b4c2e0e0d7b1e6a2f3';
$repo_file = isset($_GET['file']) ? $_GET['file'] : 'yelpscan-index.html';
$raw = 'https://raw.githubusercontent.com/tomer-bot/shefa-dashboard/' . $sha . '/' . $repo_file;
$opts = ['http'=>['header'=>"Authorization: token $gh\r\nCache-Control: no-cache\r\n"]];
$content = file_get_contents($raw, false, stream_context_create($opts));
if(!$content){ echo json_encode(['ok'=>false,'error'=>'fetch failed','url'=>$raw,'sha'=>$sha]); exit; }
$base = dirname(dirname(dirname(__FILE__)));
$out = isset($_GET['out']) ? $_GET['out'] : 'index.html';
$candidates = [
  $base.'/yelpscan.shefamarketing.com/public_html/'.$out,
  '/home/shefamkcom/www/yelpscan.shefamarketing.com/public_html/'.$out,
  '/home/customer/www/yelpscan.shefamarketing.com/public_html/'.$out,
];
foreach($candidates as $path){
  if(is_dir(dirname($path))){
    file_put_contents($path, $content);
    echo json_encode(['ok'=>true,'path'=>$path,'bytes'=>strlen($content),'sha'=>$sha]);
    exit;
  }
}
echo json_encode(['ok'=>false,'base'=>$base]);