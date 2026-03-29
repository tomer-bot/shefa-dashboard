<?php
$f = '/home/customer/www/yelpscan.shefamarketing.com/public_html/index.html';
$html = file_get_contents($f);
if (!$html) { echo json_encode(['ok'=>false,'err'=>'read failed']); exit; }

$original_size = strlen($html);

// Check what version is on server
$tasWindowSubmit = strpos($html, 'window.submitScan') !== false;
$hasAsyncFn = strpos($html, 'async function submitScan') !== false;

if ($hasAsyncFn && !$tasWindowSubmit) {
  echo json_encode(['ok'=>true,'msg'=>'Already correct!','size'=>$original_size]);
  exit;
}

// Find and replace the broken window.submitScan
$ws_pos = strpos($html, 'window.submitScan');
if ($ws_pos === false) {
  echo json_encode(['ok'=>false,'err'=>'window.submitScan not found']);
  exit;
}

// Find the end: just before window.submitCta or </script>
$wc_pos = strpos($html, 'window.submitCta', $ws_pos);
if ($wc_pos === false) {
  echo json_encode(['ok'=>false,'err'=>'end not found']);
  exit;
}

// The correct replacement - the real async function
$correct = "async function submitScan(e) {\n  e.preventDefault();\n  const form = document.getElementById('heroForm');\n  const btn  = document.getElementById('heroScanBtn');\n  const fd   = new FormData(form);\n  const lead = {\n    name:     fd.get('name') || '',\n    biz:      fd.get('biz')  || '',\n    phone:    fd.get('phone') || '',\n    category: fd.get('category') || '',\n    budget:   fd.get('budget') || ''\n  };\n\n  btn.textContent = 'Scanning…'; btn.disabled = true;\n  form.style.display = 'none';\n  const ty = document.getElementById('heroThankYou');\n  ty.style.display = 'block';\n\n  // Step animations\n  const steps = ['step1','step2','step3','step4'];\n  const msgs  = ['✅ Found your business on Yelp','✅ Profile data loaded','✅ Performance scored','✅ Recommendations ready'];\n  let stepIdx = 0;\n  const stepTimer = setInterval(() => {\n    if (stepIdx < 4) {\n      document.getElementById(steps[stepIdx]).style.color = '#1A7A3C';\n      document.getElementById(steps[stepIdx]).textContent = msgs[stepIdx];\n      stepIdx++;\n    } else clearInterval(stepTimer);\n  }, 900);\n\n  try {\n    const resp = await fetch('api/yelp-scan.php', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ bizName: lead.biz, location: '', category: lead.category })\n    });\n    const data = await resp.json();\n    clearInterval(stepTimer);\n    steps.forEach((s,i) => {\n      document.getElementById(s).style.color = '#1A7A3C';\n      document.getElementById(s).textContent = msgs[i];\n    });\n    await new Promise(r => setTimeout(r, 500));\n\n    if (!data.ok || !data.found) {\n      document.getElementById('scanningState').style.display = 'none';\n      document.getElementById('scanError').style.display = 'block';\n      BOT.greet({...lead, scanFailed: true});\n      return;\n    }\n\n    document.getElementById('scanningState').style.display = 'none';\n    const res = document.getElementById('scanResults');\n    res.style.display = 'block';\n\n    document.getElementById('resBusinessName').textContent = data.bizName || lead.biz;\n    document.getElementById('resLocation').textContent = [lead.category, data.reviews + ' reviews', data.rating + '★'].filter(Boolean).join(' · ');\n\n    const ring = document.getElementById('scoreRing');\n    const sc   = Math.round(data.overallScore || 0);\n    const col  = sc >= 80 ? '#1A7A3C' : sc >= 60 ? '#2BBFAA' : sc >= 40 ? '#E8A200' : '#D32323';\n    ring.style.stroke = col;\n    setTimeout(() => { ring.style.strokeDashoffset = 213 - (sc/100)*213; }, 200);\n    const lbl = sc >= 80 ? 'Strong' : sc >= 60 ? 'Moderate' : sc >= 40 ? 'Weak' : 'Poor';\n    document.getElementById('overallLabel').textContent = lbl;\n    document.getElementById('overallLabel').style.color = col;\n    animateNum(document.getElementById('overallScoreNum'), sc);\n\n    const bars = document.getElementById('metricBars');\n    bars.innerHTML = [\n      metricBar('Response Time', data.responseTime, '⚡'),\n      metricBar('Profile Completeness', data.profileCompleteness, '📋'),\n      metricBar('Review Health', data.reviewHealth, '⭐'),\n      metricBar('Ads Readiness', data.adsReadiness, '🌯'),\n    ].join('');\n    setTimeout(() => {\n      bars.querySelectorAll('[data-w]').forEach(b => b.style.width = b.dataset.w + '%');\n    }, 300);\n\n    document.getElementById('topFinding').textContent = '🐍 ' + (data.findings?.[0] || 'Scan complete — book a call to review your full report.');\n\n    BOT.greet({\n      ...lead,\n      scanData: data,\n      botGreeting: data.botGreeting\n    });\n\n  } catch(err) {\n    clearInterval(stepTimer);\n    document.getElementById('scanningState').style.display = 'none';\n    document.getElementById('scanError').style.display = 'block';\n    BOT.greet({...lead, scanFailed: true});\n  }\n}\n\n\n";

// Replace: remove broken stub, insert correct function
$before = substr($html, 0, $ws_pos);
$after = substr($html, $wc_pos);
$fixed = $before . $correct . "\n\n" . $after;

file_put_contents($f, $fixed);
$new_size = strlen($fixed);

echo json_encode([
  'ok' => true, 
  'original_size' => $original_size,\n  'new_size' => $new_size,\n  'ws_pos' => $ws_pos,\n  'wc_pos' => $wc_pos,\n  'replaced_chars' => $wc_pos - $ws_pos,\n  'fn_len' => strlen($correct)\n]);\n?>