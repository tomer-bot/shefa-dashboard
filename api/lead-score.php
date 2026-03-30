<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$yelpUrl = $_POST['url'] ?? $_GET['url'] ?? '';
$category = strtolower($_POST['category'] ?? $_GET['category'] ?? '');
$profileCompleteness = (int)($_POST['profileCompleteness'] ?? $_GET['profileCompleteness'] ?? 70);
$claimed = filter_var($_POST['claimed'] ?? $_GET['claimed'] ?? 'true', FILTER_VALIDATE_BOOLEAN);

if (!$yelpUrl || strpos($yelpUrl, 'yelp.com') === false) {
  echo json_encode(['ok'=>false,'error'=>'Invalid URL']); exit;
}

// Fetch Yelp page
$ctx = stream_context_create(['http'=>['header'=>
  "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36\r\n".
  "Accept: text/html,application/xhtml+xml\r\n".
  "Accept-Language: en-US,en;q=0.9\r\n",
  'timeout'=>12
]]);
$html = @file_get_contents($yelpUrl, false, $ctx);

if (!$html) {
  echo json_encode(['ok'=>true,'keywordScore'=>50,'profileScore'=>50,'leadOptimized'=>50,'scraped'=>false]); exit;
}

// --- EXTRACT ---
// Description
$desc = '';
if (preg_match('/"description"\s*:\s*"([^"]{10,})"/', $html, $m)) $desc = html_entity_decode($m[1]);
if (preg_match('/class="[^"]*from-the-biz[^"]*"[^>]*>.*?<p[^>]*>([^<]+)/is', $html, $m)) $desc .= ' '.strip_tags($m[1]);
$fullText = strtolower($desc);

// Photo count (actual from page)
$photoCount = 0;
if (preg_match('/([0-9,]+)\s+photos?/i', $html, $m)) $photoCount = (int)str_replace(',','',$m[1]);
elseif (preg_match('/"photo_count"\s*:\s*(\d+)/', $html, $m)) $photoCount = (int)$m[1];

// Photo alt tags with real content (exclude icons/logos)
$photoKeywords = 0;
preg_match_all('/alt="([^"]{15,})"/i', $html, $alts);
foreach (($alts[1]??[]) as $alt) {
  if (!preg_match('/yelp|logo|icon|star|map|avatar|profile/i', $alt)) $photoKeywords++;
}

// Has business hours on page
$hasHours = (bool)preg_match('/hours-table|isOpen|openingHours|lemon--table/i', $html);

// Has website listed
$hasWebsite = (bool)preg_match('/business-website|biz-website|\bwebsite\b/i', $html);

// Has services/portfolio section
$hasServices = (bool)preg_match('/services-offered|service-list|portfolio/i', $html);

// Category match
$cats = [];
preg_match_all('/"title"\s*:\s*"([^"]+)"[^}]*"alias"\s*:\s*"([^"]+)"/', $html, $cm, PREG_SET_ORDER);
foreach ($cm as $c) $cats[] = strtolower($c[1]);
$catAligned = false;
foreach ($cats as $c) {
  if (strpos($c,$category)!==false || strpos($category,$c)!==false) { $catAligned=true; break; }
}

// --- KEYWORD SCORE ---
$kwMap = [
  'plumbing'     => ['plumb','drain','pipe','water heater','leak','sewer','faucet','toilet'],
  'hvac'         => ['hvac','air condition','heating','cooling','furnace','duct','heat pump'],
  'electrical'   => ['electric','wiring','panel','outlet','circuit','lighting'],
  'roofing'      => ['roof','shingle','gutter','skylight','tile','flashing'],
  'moving'       => ['moving','relocation','packing','storage','truck'],
  'cleaning'     => ['clean','maid','janitorial','sanitiz','disinfect'],
  'construction' => ['construct','remodel','renovation','contractor'],
];
$kws = ['service','repair','install','professional','licensed'];
foreach ($kwMap as $k=>$v) { if (strpos($category,$k)!==false) { $kws=$v; break; } }

$hits = 0;
foreach ($kws as $kw) { if (strpos($fullText,$kw)!==false) $hits++; }
$descScore = count($kws)>0 ? min(100,round(($hits/count($kws))*100)) : 50;
$photoKwScore = min(100, $photoKeywords * 8);
$catScore = $catAligned ? 100 : 45;

$keywordScore = (int)round($descScore*0.40 + $photoKwScore*0.35 + $catScore*0.25);

// --- PROFILE SCORE ---
$photoOptScore = $photoCount>=100?100:($photoCount>=50?82:($photoCount>=20?62:($photoCount>=10?42:($photoCount>=5?22:5))));
$hoursScore   = $hasHours ? 100 : 10;
$webScore     = $hasWebsite ? 100 : 20;
$claimedScore = $claimed ? 100 : 0;

$profileScore = (int)round(
  $profileCompleteness * 0.35 +
  $photoOptScore       * 0.30 +
  $claimedScore        * 0.15 +
  $hoursScore          * 0.12 +
  $webScore            * 0.08
);

$leadOptimized = (int)round(($keywordScore + $profileScore) / 2);

echo json_encode([
  'ok'            => true,
  'scraped'       => true,
  'keywordScore'  => $keywordScore,
  'profileScore'  => $profileScore,
  'leadOptimized' => $leadOptimized,
  'photoCount'    => $photoCount,
  'hasHours'      => $hasHours,
  'hasWebsite'    => $hasWebsite,
  'hasServices'   => $hasServices,
  'kwHits'        => $hits,
  'catAligned'    => $catAligned,
]);