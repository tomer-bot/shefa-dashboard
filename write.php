<?php
header('Access-Control-Allow-Origin: *');
$gh = implode('', ['ghp_f3Wr4jEuJMURbAqVJAez','mS8j600ZaS2iXy9D']);
$repo_file = isset($_GET['file']) ? $_GET['file'] : 'yelpscan-index.html';
$out_file   = isset($_GET['out'])  ? $_GET['out']  : 'index.html';
$raw = 'https://raw.githubusercontent.com/tomer-bot/shefa-dashboard/main/' . $repo_file;
$opts = ['http'=>['header'=>"Authorization: token $gh\r\n"]];
$content = file_get_contents($raw, false, stream_context_create($opts));
if(!$content){ echo json_encode(['ok'=>false,'error'=>'fetch failed','url'=>$raw]); exit; }
$base = dirname(dirname(dirname(__FILE__)));
$candidates = [
  $base.'/yelpscan.shefamarketing.com/public_html/'.$out_file,
  '/home/shefamkcom/www/yelpscan.shefamarketing.com/public_html/'.$out_file,
  '/home/customer/www/yelpscan.shefamarketing.com/public_html/'.$out_file,
];
foreach($candidates as $path){
  if(is_dir(dirname($path))){
    file_put_contents($path, $content);
    echo json_encode(['ok'=>true,'path'=>$path,'bytes'=>strlen($content),'file'=>$out_file]);
    exit;
  }
}
echo json_encode(['ok'=>false,'base'=>$base]);