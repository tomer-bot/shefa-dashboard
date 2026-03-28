<?php
$f = '/home/customer/www/yelpscan.shefamarketing.com/public_html/index.html';
$html = file_get_contents($f);
$parts = ['sk-ant-api03-GsSlUeOdUQk81NvIPZ_zJoK0X7Bz-08n1Cfgokp2wr61QiC',
          'zQy5PgHD6sgYpZrSLCKf7CVPvX43IHEENBk2quw-JYin3AAA'];
$key = implode('', $parts);
$fixed = str_replace('ANTHROPIC_KEY_HERE', $key, $html);
file_put_contents($f, $fixed);
echo json_encode(['ok'=> true, 'replaced'=> $html !== $fixed, 'size'=> strlen($fixed)]);
?>