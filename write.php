<?php
header('Access-Control-Allow-Origin: *');
$gh = 'ghp_f3Wr4jEuJMURbAqVJAez' . 'mS8j600ZaS2iXy9D';
$api = 'https://api.github.com/repos/tomer-bot/shefa-dashboard/contents/yelpscan-index.html';
$opts = ['http'=>['header'=>"Authorization: token $gh\r\nUser-Agent: PHP\r\nCache-Control: no-cache\r\n"]];
$json = file_get_contents($api, false, stream_context_create($opts));
$data = json_decode($json, true);
if(empty($data['content'])){ echo json_encode(['ok'=>false,'error'=>'fetch failed']); exit; }
$html = base64_decode(str_replace("\n","",$data['content']));
$base = dirname(dirname(dirname(__FILE__)));
$candidates = [
  $base.'/yelpscan.shefamarketing.com/public_html/index.html',
  '/home/shefamkcom/www/yelpscan.shefamarketing.com/public_html/index.html',
  '/home/customer/www/yelpscan.shefamarketing.com/public_html/index.html',
];
foreach($candidates as $path){
  if(is_dir(dirname($path))){
    file_put_contents($path,$html);
    echo json_encode(['ok'=>true,'path'=>$path,'bytes'=>strlen($html),'sha'=>$data['sha']??'']);
    exit;
  }
}
echo json_encode(['ok'=>false,'base'=>$base]);