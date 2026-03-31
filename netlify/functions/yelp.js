const https = require('https');

// Group metadata  maps bizId to group_id and campaign_type (main vs layered)
// Rule: higher budget = main, lower budget = layered (for same-client campaigns)
const GROUPS = {
  '_sZA3BJl7twy01kXTzjbwQ': { group_id: 'g_roof_tom',     campaign_type: 'layered' }, // $200
  'g0aGLbA5PnpQXA9vzUetsg': { group_id: 'g_roof_tom',     campaign_type: 'main'    }, // $2001
  'UVAoRCMIgEUuRWPBWQOhTg': { group_id: 'g_skybar',       campaign_type: 'layered' }, // $500
  'zg-Tn4_mBR6CdCfyU9QtIw': { group_id: 'g_skybar',       campaign_type: 'main'    }, // $4480
  'lM5K5vOIfgIrDEd_2hNKiQ': { group_id: 'g_jms',          campaign_type: 'layered' }, // $500
  'IVQ0WGXnjp-MNJfYP47XDA': { group_id: 'g_jms',          campaign_type: 'main'    }, // $2490
  '2uhrsdQTdbe9xi-M9PboFQ': { group_id: 'g_green_rodent', campaign_type: 'main'    }, // $4000
  'vSnFEC7jCZ33-G9W1EAoDw': { group_id: 'g_green_rodent', campaign_type: 'layered' }, // $2500
};

// Clean display names  strip ": None", trailing ": ", newlines, etc.
function cleanName(name) {
  return name
    .replace(/\n/g, ' ')
    .replace(/\s*:\s*None\s*$/i, '')
    .replace(/\s*:\s*$/, '')
    .replace(/Green Rodent Layered Campaign.*/, 'Green Rodent Restoration')
    .replace(/Quality Home Remodeling - Room Addition Contractor/, 'Quality Home Remodeling')
    .trim();
}

// LIVE DATA - updated via sync
// Last synced: 2026-03-20T07:52:46.256Z
const SNAPSHOT = [{"id":"_sZA3BJl7twy01kXTzjbwQ","name":"Roof by Tom : 1990 N California Blvd","budget_cents":20000,"spend_cents":10221,"impressions":164,"clicks":1,"leads":0,"calls":0,"ctr":0.61,"avg_cpc":102.21,"status":"ACTIVE","statsUrl":"/ads_stats/_sZA3BJl7twy01kXTzjbwQ/recent_month_stats"},{"id":"UVAoRCMIgEUuRWPBWQOhTg","name":"Skybar Construction : None","budget_cents":50000,"spend_cents":23308,"impressions":267,"clicks":6,"leads":0,"calls":0,"ctr":2.25,"avg_cpc":38.85,"status":"ACTIVE","statsUrl":"/ads_stats/UVAoRCMIgEUuRWPBWQOhTg/recent_month_stats"},{"id":"lM5K5vOIfgIrDEd_2hNKiQ","name":"JMS Air Conditioning and Heating : 7640 Burnet Ave","budget_cents":50000,"spend_cents":16129,"impressions":418,"clicks":3,"leads":0,"calls":0,"ctr":0.72,"avg_cpc":53.76,"status":"ACTIVE","statsUrl":"/ads_stats/lM5K5vOIfgIrDEd_2hNKiQ/recent_month_stats"},{"id":"tV1VR1QwPJTdHNn2kK6ABw","name":"Prodigy Moving & Storage : 601 S Figueroa","budget_cents":1050000,"spend_cents":648951,"impressions":26884,"clicks":291,"leads":0,"calls":0,"ctr":1.08,"avg_cpc":22.3,"status":"ACTIVE","statsUrl":"/ads_stats/tV1VR1QwPJTdHNn2kK6ABw/recent_month_stats"},{"id":"srmB3uxc2AkBRycy7md_5w","name":"Star Steel : 16131 Valerio St","budget_cents":80000,"spend_cents":53782,"impressions":776,"clicks":22,"leads":0,"calls":0,"ctr":2.84,"avg_cpc":24.45,"status":"ACTIVE","statsUrl":"/ads_stats/srmB3uxc2AkBRycy7md_5w/recent_month_stats"},{"id":"NEK7Y1Yg_Ari8lw7AOrgZQ","name":"Prodigy Moving & Storage :","budget_cents":350000,"spend_cents":228215,"impressions":2467,"clicks":60,"leads":0,"calls":0,"ctr":2.43,"avg_cpc":38.04,"status":"ACTIVE","statsUrl":"/ads_stats/NEK7Y1Yg_Ari8lw7AOrgZQ/recent_month_stats"},{"id":"a0D2QGetwHNw3dFOUxNMjQ","name":"Prodigy Moving & Storage : 9349 Oso Ave","budget_cents":84000,"spend_cents":54028,"impressions":3286,"clicks":19,"leads":0,"calls":0,"ctr":0.58,"avg_cpc":28.44,"status":"ACTIVE","statsUrl":"/ads_stats/a0D2QGetwHNw3dFOUxNMjQ/recent_month_stats"},{"id":"2_7dBwMfEceDvMNKA7t_BA","name":"Quality Home Remodeling - Room Addition Contractor :","budget_cents":169500,"spend_cents":110811,"impressions":12990,"clicks":24,"leads":0,"calls":0,"ctr":0.18,"avg_cpc":46.17,"status":"ACTIVE","statsUrl":"/ads_stats/2_7dBwMfEceDvMNKA7t_BA/recent_month_stats"},{"id":"2uhrsdQTdbe9xi-M9PboFQ","name":"Green Rodent Restoration : 9820 Owensmouth Ave","budget_cents":399990,"spend_cents":223945,"impressions":705,"clicks":62,"leads":0,"calls":0,"ctr":8.79,"avg_cpc":36.12,"status":"ACTIVE","statsUrl":"/ads_stats/2uhrsdQTdbe9xi-M9PboFQ/recent_month_stats"},{"id":"vSnFEC7jCZ33-G9W1EAoDw","name":"Green Rodent Layered Campaign\n                                        (strict)","budget_cents":250000,"spend_cents":164765,"impressions":20743,"clicks":47,"leads":0,"calls":0,"ctr":0.23,"avg_cpc":35.06,"status":"ACTIVE","statsUrl":"/ads_stats/vSnFEC7jCZ33-G9W1EAoDw/recent_month_stats"},{"id":"6AQ__Lm482ppQ759xhruCA","name":"Sequoia Flooring : 14701 Oxnard St","budget_cents":480480,"spend_cents":277972,"impressions":6279,"clicks":175,"leads":0,"calls":0,"ctr":2.79,"avg_cpc":15.88,"status":"ACTIVE","statsUrl":"/ads_stats/6AQ__Lm482ppQ759xhruCA/recent_month_stats"},{"id":"IEqquR3LRqMJNVo0Ajthaw","name":"A1 Pro Clean Carpet & Upholstery Cleaning : 5224 Zelzah Ave","budget_cents":199980,"spend_cents":109064,"impressions":1564,"clicks":81,"leads":0,"calls":0,"ctr":5.18,"avg_cpc":13.46,"status":"ACTIVE","statsUrl":"/ads_stats/IEqquR3LRqMJNVo0Ajthaw/recent_month_stats"},{"id":"VvEH6vIIZIHumtDPuCqo6w","name":"Alpha Pro Builders : 143 N Arnaz Dr","budget_cents":15000,"spend_cents":13621,"impressions":70,"clicks":3,"leads":0,"calls":0,"ctr":4.29,"avg_cpc":45.4,"status":"ACTIVE","statsUrl":"/ads_stats/VvEH6vIIZIHumtDPuCqo6w/recent_month_stats"},{"id":"5orEWCAGeJCI3KC2c7Nn6w","name":"Sequoia Flooring :","budget_cents":240000,"spend_cents":149203,"impressions":7399,"clicks":64,"leads":0,"calls":0,"ctr":0.86,"avg_cpc":23.31,"status":"ACTIVE","statsUrl":"/ads_stats/5orEWCAGeJCI3KC2c7Nn6w/recent_month_stats"},{"id":"EOspmIDzGsejW7yOzTZDMg","name":"Sequoia Flooring :","budget_cents":240000,"spend_cents":148922,"impressions":7742,"clicks":68,"leads":0,"calls":0,"ctr":0.88,"avg_cpc":21.9,"status":"ACTIVE","statsUrl":"/ads_stats/EOspmIDzGsejW7yOzTZDMg/recent_month_stats"},{"id":"XzoOIBHJ4ae5fbzgeevwUQ","name":"My Cali Builders : 24021 Friar St","budget_cents":340000,"spend_cents":216482,"impressions":6247,"clicks":40,"leads":0,"calls":0,"ctr":0.64,"avg_cpc":54.12,"status":"ACTIVE","statsUrl":"/ads_stats/XzoOIBHJ4ae5fbzgeevwUQ/recent_month_stats"},{"id":"8djfCpUXTwOLOX8JaEHLvw","name":"Prodigy Moving & Storage - Santa Monica : 100 Wilshire Blvd","budget_cents":15000,"spend_cents":10691,"impressions":940,"clicks":6,"leads":0,"calls":0,"ctr":0.64,"avg_cpc":17.82,"status":"ACTIVE","statsUrl":"/ads_stats/8djfCpUXTwOLOX8JaEHLvw/recent_month_stats"},{"id":"SJ_BBCVtm-96p8qz72Ub-g","name":"LYD Construction : 4055 Lake Washington Blvd NE","budget_cents":1100000,"spend_cents":687731,"impressions":46142,"clicks":140,"leads":0,"calls":0,"ctr":0.3,"avg_cpc":49.12,"status":"ACTIVE","statsUrl":"/ads_stats/SJ_BBCVtm-96p8qz72Ub-g/recent_month_stats"},{"id":"ybllwJ-CLRNg5BAE76Q5FA","name":"First Garage Door and Gates : 600 Anton Blvd","budget_cents":250500,"spend_cents":160906,"impressions":1291,"clicks":61,"leads":0,"calls":0,"ctr":4.73,"avg_cpc":26.38,"status":"ACTIVE","statsUrl":"/ads_stats/ybllwJ-CLRNg5BAE76Q5FA/recent_month_stats"},{"id":"tGk50TzJPSpGzEY2lsPSLg","name":"Aldan Construction & Remodeling : 8549 Wilshire Blvd","budget_cents":798000,"spend_cents":498318,"impressions":22931,"clicks":152,"leads":0,"calls":0,"ctr":0.66,"avg_cpc":32.78,"status":"ACTIVE","statsUrl":"/ads_stats/tGk50TzJPSpGzEY2lsPSLg/recent_month_stats"},{"id":"hT3ssiBBja5ADp0FpjemhQ","name":"Excalibur Moving & Storage : 14600 Keswick St","budget_cents":501000,"spend_cents":309260,"impressions":10300,"clicks":99,"leads":0,"calls":0,"ctr":0.96,"avg_cpc":31.24,"status":"ACTIVE","statsUrl":"/ads_stats/hT3ssiBBja5ADp0FpjemhQ/recent_month_stats"},{"id":"egvDaoU-01vKvFjMOqK5xg","name":"Excalibur Moving Company : 529 South Broadway","budget_cents":501000,"spend_cents":304580,"impressions":5246,"clicks":105,"leads":0,"calls":0,"ctr":2,"avg_cpc":29.01,"status":"ACTIVE","statsUrl":"/ads_stats/egvDaoU-01vKvFjMOqK5xg/recent_month_stats"},{"id":"n60cotZPuu5Q6ZBhXqTdUg","name":"J & I Home Design :","budget_cents":501000,"spend_cents":320542,"impressions":13872,"clicks":45,"leads":0,"calls":0,"ctr":0.32,"avg_cpc":71.23,"status":"ACTIVE","statsUrl":"/ads_stats/n60cotZPuu5Q6ZBhXqTdUg/recent_month_stats"},{"id":"dC23JimQ1IpVvmoM6HSMOQ","name":"NearMe Roofing Company : 2727 152nd Ave NE","budget_cents":15000,"spend_cents":8785,"impressions":572,"clicks":12,"leads":0,"calls":0,"ctr":2.1,"avg_cpc":7.32,"status":"ACTIVE","statsUrl":"/ads_stats/dC23JimQ1IpVvmoM6HSMOQ/recent_month_stats"},{"id":"GVMBlmZrhIYO9bYYsOlZ-Q","name":"Mission Home Remodeling : 405 Primrose Rd","budget_cents":300000,"spend_cents":184313,"impressions":96511,"clicks":37,"leads":0,"calls":0,"ctr":0.04,"avg_cpc":49.81,"status":"ACTIVE","statsUrl":"/ads_stats/GVMBlmZrhIYO9bYYsOlZ-Q/recent_month_stats"},{"id":"zg-Tn4_mBR6CdCfyU9QtIw","name":"Skybar Construction : None","budget_cents":448000,"spend_cents":227783,"impressions":56570,"clicks":57,"leads":0,"calls":0,"ctr":0.1,"avg_cpc":39.96,"status":"ACTIVE","statsUrl":"/ads_stats/zg-Tn4_mBR6CdCfyU9QtIw/recent_month_stats"},{"id":"IVQ0WGXnjp-MNJfYP47XDA","name":"JMS Air Conditioning and Heating : 7640 Burnet Ave","budget_cents":249000,"spend_cents":90619,"impressions":16358,"clicks":35,"leads":0,"calls":0,"ctr":0.21,"avg_cpc":25.89,"status":"ACTIVE","statsUrl":"/ads_stats/IVQ0WGXnjp-MNJfYP47XDA/recent_month_stats"},{"id":"5_rIOWR2WRAkKyRnd0Cl6w","name":"Marina Bay Roofing : 4411 Geary Blvd","budget_cents":1800000,"spend_cents":497063,"impressions":50901,"clicks":65,"leads":0,"calls":0,"ctr":0.13,"avg_cpc":76.47,"status":"ACTIVE","statsUrl":"/ads_stats/5_rIOWR2WRAkKyRnd0Cl6w/recent_month_stats"},{"id":"g0aGLbA5PnpQXA9vzUetsg","name":"Roof by Tom : 1990 N California Blvd","budget_cents":200100,"spend_cents":54010,"impressions":22397,"clicks":18,"leads":0,"calls":0,"ctr":0.08,"avg_cpc":30.01,"status":"ACTIVE","statsUrl":"/ads_stats/g0aGLbA5PnpQXA9vzUetsg/recent_month_stats"},{"id":"7_5g6jLCRkY7BKNqC068NA","name":"Mission Home Remodeling : 475 Gough St","budget_cents":999990,"spend_cents":263379,"impressions":52678,"clicks":48,"leads":0,"calls":0,"ctr":0.09,"avg_cpc":54.87,"status":"ACTIVE","statsUrl":"/ads_stats/7_5g6jLCRkY7BKNqC068NA/recent_month_stats"}];

const YELP_USER = process.env.YELP_USER;
const YELP_PASS = process.env.YELP_PASS;
const FUSION_KEY = process.env.YELP_FUSION_KEY;
const NETLIFY_TOKEN = 'nfp_oAtW6X26BQu1dZQGwgBn2mJfNfedD2Sacab4';
const SITE_ID = 'a1b974bc-7bcd-4965-97ce-b2a471ef6fb0';

function basicAuth(){return 'Basic '+Buffer.from(YELP_USER+':'+YELP_PASS).toString('base64');}

function httpPost(host,path,body,auth){
  return new Promise((resolve,reject)=>{
    const b=body||'';
    const headers={'Authorization':auth||basicAuth(),'Content-Type':'application/json','Accept':'application/json','User-Agent':'ShefaDashboard/1.0','Content-Length':Buffer.byteLength(b)};
    const req=https.request({hostname:host,path,method:'POST',headers},res=>{
      let d='';res.on('data',c=>d+=c);
      res.on('end',()=>{try{resolve({s:res.statusCode,b:JSON.parse(d)});}catch(e){resolve({s:res.statusCode,r:d.substring(0,200)});}});
    });
    req.on('error',e=>resolve({s:0,r:e.message}));if(b)req.write(b);req.end();
  });
}
function httpGet(host, path, auth) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: host, path, method: 'GET', headers: { Authorization: auth || basicAuth(), Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'ShefaDashboard/1.0' } },
      res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
          catch(e) { resolve({ s: res.statusCode, r: d.substring(0, 500) }); }
        });
      }
    );
    req.on('error', e => resolve({ s: 0, r: e.message }));
    req.end();
  });
}


exports.handler = async(event)=>{
  const cors={'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers:cors,body:''};
  const path=(event.queryStringParameters||{}).path||'';
  const body=event.body?JSON.parse(event.body):{};

  if(path==='health'){
    return{statusCode:200,headers:cors,body:JSON.stringify({status:'ok',clients:SNAPSHOT.length,synced:'2026-03-20T07:52:46.256Z'})};
  }

  // Main data endpoint - returns snapshot
  if(path==='programs'){
    const programs = SNAPSHOT.map(p => ({
      ...p,
      name: cleanName(p.name),
      campaign_type: (GROUPS[p.id] || {}).campaign_type || 'main',
      group_id:      (GROUPS[p.id] || {}).group_id      || null,
    }));
    return{statusCode:200,headers:cors,body:JSON.stringify({programs})};
  }

  // Sync endpoint: dashboard calls this from biz.yelp.com context with fresh data
  // Then triggers a Netlify redeploy with updated snapshot
  if(path==='store-data'){
    const programs = body.programs;
    if(!programs||!programs.length)return{statusCode:400,headers:cors,body:JSON.stringify({error:'no programs'})};
    
    // Trigger a new deploy via Netlify API with updated env var
    // Store the live data as YELP_CACHE env var
    const cacheData = JSON.stringify(programs);
    try {
      const r = await httpPost('api.netlify.com',
        '/api/v1/sites/'+SITE_ID+'/env',
        JSON.stringify([{key:'YELP_CACHE',values:[{value:cacheData,context:'all'}]}]),
        'Bearer '+NETLIFY_TOKEN
      );
      return{statusCode:200,headers:cors,body:JSON.stringify({ok:true,count:programs.length,netlify:r.s})};
    } catch(e) {
      return{statusCode:500,headers:cors,body:JSON.stringify({error:e.message})};
    }
  }

  // Ads API actions
        if(path.startsWith('pause/') || path.startsWith('resume/')) {
    const action = path.startsWith('pause/') ? 'pause' : 'resume';
    const bizId = path.split('/')[1];

    // Build bizId->programId map from programs/list/all (uses biz.yelp.com IDs that match SNAPSHOT)
    let programId = null;
    let offset = 0;
    outerLoop: while(offset < 200) {
      const page = await httpGet('partner-api.yelp.com', '/programs/v1?limit=40&offset='+offset, basicAuth());
      const progs = (page.b && page.b.payment_programs) || [];
      if(!progs.length) break;
      for(const p of progs) {
        for(const b of (p.businesses||[])) {
          if(b.yelp_business_id === bizId) { programId = p.program_id; break outerLoop; }
        }
      }
      const total = (page.b && page.b.total) || 0;
      offset += 40;
      if(offset >= total) break;
    }

    // If not found via programs/v1, try programs/list/all (biz.yelp.com route)
    if(!programId) {
      const listPage = await httpGet('partner-api.yelp.com', '/programs/v1?limit=100', basicAuth());
      // programs/list/all returns different bizId format - try direct match on group_id from SNAPSHOT
      // Fallback: just try the bizId directly as program_id (sometimes they match)
      programId = bizId;
    }

    const r = await httpPost('partner-api.yelp.com', '/program/'+programId+'/'+action+'/v1', '', basicAuth());
    const success = r.s === 202 || r.s === 200;
    return { statusCode:200, headers:cors, body: JSON.stringify({ success, action, programId, s: r.s, body: r.b||r.r }) };
  }
if(path.startsWith('budget/')){
    const id=path.split('/')[1];
    const r=await httpPost('partner-api.yelp.com','/v1/reseller/program/'+id+'/edit?budget='+(body.budget*100),'',basicAuth());
    return{statusCode:200,headers:cors,body:JSON.stringify(r)};
  }

  if(path==='report/create'){
    const payload=JSON.stringify({...body,metrics:['impressions','ad_clicks','user_views','leads','biz_page_calls','biz_page_messages','total_spend','cpc'],granularity:'MONTH'});
    const r=await httpPost('api.yelp.com','/v3/reporting/reports',payload,'Bearer '+FUSION_KEY);
    return{statusCode:200,headers:cors,body:JSON.stringify(r)};
  }

  if(path.startsWith('report/')){
    const id=path.split('/')[1];
    return new Promise((resolve)=>{
      const req=https.request({hostname:'api.yelp.com',path:'/v3/reporting/reports/'+id,method:'GET',headers:{'Authorization':'Bearer '+FUSION_KEY}},res=>{
        let d='';res.on('data',c=>d+=c);
        res.on('end',()=>{resolve({statusCode:200,headers:cors,body:d});});
      });
      req.on('error',e=>resolve({statusCode:500,headers:cors,body:JSON.stringify({error:e.message})}));
      req.end();
    });
  }
  
  // --- ads_stats: single campaign stats from partner-api.yelp.com ---
  // statsUrl in programs = /ads_stats/{id}/recent_month_stats
  if (path.startsWith('ads_stats/')) {
    const subpath = path; // already full path like "ads_stats/{id}/recent_month_stats"
    const r = await httpGet('partner-api.yelp.com', '/' + subpath, basicAuth());
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }

  // --- ads_stats/batch: fetch stats for all programs in parallel ---
  if (path === 'stats/batch') {
    const ids = (body.ids || []);
    if (!ids.length) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'no ids' }) };
    const results = await Promise.all(
      ids.map(id => httpGet('partner-api.yelp.com', '/ads_stats/' + id + '/recent_month_stats', basicAuth())
        .then(r => ({ id, data: r.b || r.r, status: r.s }))
        .catch(e => ({ id, error: e.message }))
      )
    );
    return { statusCode: 200, headers: cors, body: JSON.stringify({ results }) };
  }


  // Diagnostic probe: ?path=probe&host=X&ppath=Y&auth=basic|fusion|none
  if (path === 'probe') {
    const host  = body.host  || 'partner-api.yelp.com';
    const ppath = body.path  || '/';
    const authType = body.auth || 'basic';
    let authHeader;
    if (authType === 'basic')  authHeader = basicAuth();
    if (authType === 'fusion') authHeader = 'Bearer ' + FUSION_KEY;
    if (authType === 'none')   authHeader = '';
    const r = await httpGet(host, ppath, authHeader);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ host, ppath, authType, result: r }) };
  }


  // --- Program Feature API: GET /program/{id}/features/v1 ---
  // Returns keywords, targeting, scheduling, and all program features
  if (path.startsWith('features/')) {
    const id = path.split('/')[1]; // features/{program_id}
    const r = await httpGet('partner-api.yelp.com', '/program/' + id + '/features/v1', basicAuth());
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }

  // --- Batch fetch features for all programs ---
  if (path === 'features/batch') {
    const ids = body.ids || [];
    if (!ids.length) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'no ids' }) };
    const results = await Promise.all(
      ids.map(id =>
        httpGet('partner-api.yelp.com', '/program/' + id + '/features/v1', basicAuth())
          .then(r => ({ id, features: r.b, status: r.s }))
          .catch(e => ({ id, error: e.message }))
      )
    );
    return { statusCode: 200, headers: cors, body: JSON.stringify({ results }) };
  }

  // --- Reporting API v3 (correct endpoints) ---
  // POST reporting/daily   create daily report
  // POST reporting/monthly  create monthly report  
  if (path === 'reporting/daily' || path === 'reporting/monthly') {
    const endpoint = path === 'reporting/daily'
      ? '/v3/reporting/businesses/daily'
      : '/v3/reporting/businesses/monthly';
    const payload = JSON.stringify({
      ...body,
      metrics: body.metrics || [
        'billed_impressions','billed_clicks','ad_cost','ad_driven_calls','ad_driven_messages_to_business',
        'num_calls','total_leads'
      ]
    });
    const r = await httpPost('api.yelp.com', endpoint, payload, 'Bearer ' + FUSION_KEY);
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }

  // GET reporting/daily/{id} or reporting/monthly/{id}
  if (path.startsWith('reporting/daily/') || path.startsWith('reporting/monthly/')) {
    const parts = path.split('/');
    const type = parts[1]; // daily or monthly
    const reportId = parts[2];
    return new Promise((resolve) => {
      const req = https.request(
        { hostname: 'api.yelp.com', path: '/v3/reporting/businesses/' + type + '/' + reportId,
          method: 'GET', headers: { Authorization: 'Bearer ' + FUSION_KEY, Accept: 'application/json' } },
        res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ statusCode: 200, headers: cors, body: d })); }
      );
      req.on('error', e => resolve({ statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) }));
      req.end();
    });
  }


  // --- Set CPC bid cap via Program Feature API ---
  // POST features/{id}/update  body: { features: {...} }
  if (path.startsWith('features/') && path.endsWith('/update')) {
    const id = path.split('/')[1];
    const payload = JSON.stringify(body.features || {});
    const r = await httpPost('partner-api.yelp.com', '/program/' + id + '/features/v1', payload, basicAuth());
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }

  // --- Set CPC max bid: POST max_bid/{id}  body: { max_bid: dollars } ---
  if (path.startsWith('max_bid/')) {
    const id = path.split('/')[1];
    const bidCents = Math.round((body.max_bid || 0) * 100);
    if (bidCents < 50) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Min bid is $0.50' }) };
    const r = await httpPost('partner-api.yelp.com', '/v1/reseller/program/' + id + '/edit?max_bid=' + bidCents, '', basicAuth());
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }

  // --- Job status: GET job_status/{job_id} ---
  if (path.startsWith('job_status/')) {
    const jobId = path.split('/')[1];
    const r = await httpGet('partner-api.yelp.com', '/v1/reseller/status/' + jobId, basicAuth());
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }


  //  Reporting API: POST reporting/monthly  body:{month:'2026-03', ids:[...], fusion_key} 
  if (path === 'reporting/monthly/create') {
    const { month, ids, fusion_key } = body;
    if (!fusion_key || !ids?.length) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing fusion_key or ids' }) };
    const start = month || new Date().toISOString().slice(0,7);
    const end = start;
    const r = await httpPostJson('api.yelp.com', '/v3/reporting/businesses/monthly', {
      start, end, ids,
      metrics: ['billed_impressions','billed_clicks','ad_cost','ad_driven_calls',
                'ad_driven_messages_to_business']
    }, 'Bearer ' + fusion_key);
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }

  //  Reporting API: GET reporting/monthly/poll/{report_id}  
  if (path.startsWith('reporting/monthly/poll/')) {
    const reportId = path.split('/')[3];
    const fusion_key = body?.fusion_key || req.headers?.['x-fusion-key'] || '';
    // fusion_key passed as query param
    const fk = event.queryStringParameters?.fusion_key || fusion_key;
    if (!fk) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing fusion_key' }) };
    const r = await httpGetAuth('api.yelp.com', '/v3/reporting/businesses/monthly/' + reportId, 'Bearer ' + fk);
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }

  //  Programs list all (for biz encid mapping) 
  if (path === 'programs/list/all') {
    const r = await httpGet('partner-api.yelp.com', '/programs/v1?limit=40&program_status=CURRENT', basicAuth());
    return { statusCode: 200, headers: cors, body: JSON.stringify(r) };
  }


  //  Program Feature API routes 
  if (path.startsWith('features/')) {
    const parts = path.split('/');
    const action = parts[1];
    const bizId  = parts[2];
    if (!bizId) return {statusCode:400,headers:cors,body:JSON.stringify({error:'Missing bizId'})};

    // Find programId from CLIENTS list
    const client = CLIENTS.find(c => c.bizId === bizId);
    if (!client) return {statusCode:404,headers:cors,body:JSON.stringify({error:'Client not found'})};
    const programId = client.programId || bizId;
    const base = 'https://partner-api.yelp.com/v1/reseller/program/' + programId;
    const auth = basicAuth();
    const fHeaders = { 'Authorization': auth, 'Content-Type': 'application/json', 'Accept': 'application/json' };

    // GET current features
    if (action === 'get') {
      const r = await fetch(base, { headers: fHeaders });
      const d = await r.json();
      return {statusCode:200,headers:cors,body:JSON.stringify(d)};
    }

    // POST: Category targeting
    if (action === 'category') {
      const body = JSON.parse(event.body || '{}');
      const r = await fetch(base + '/feature/STRICT_CATEGORY_TARGETING', {
        method: 'POST', headers: fHeaders,
        body: JSON.stringify({ categories: body.categories })
      });
      const d = await r.json();
      return {statusCode:200,headers:cors,body:JSON.stringify(d)};
    }

    // POST: Negative keywords
    if (action === 'keywords') {
      const body = JSON.parse(event.body || '{}');
      const r = await fetch(base + '/feature/NEGATIVE_KEYWORD_TARGETING', {
        method: 'POST', headers: fHeaders,
        body: JSON.stringify({ negative_keywords: body.keywords })
      });
      const d = await r.json();
      return {statusCode:200,headers:cors,body:JSON.stringify(d)};
    }

    // POST: Location targeting
    if (action === 'location') {
      const body = JSON.parse(event.body || '{}');
      const r = await fetch(base + '/feature/CUSTOM_LOCATION_TARGETING', {
        method: 'POST', headers: fHeaders,
        body: JSON.stringify({ locations: body.locations })
      });
      const d = await r.json();
      return {statusCode:200,headers:cors,body:JSON.stringify(d)};
    }

    // POST: Ad scheduling
    if (action === 'schedule') {
      const body = JSON.parse(event.body || '{}');
      const r = await fetch(base + '/feature/AD_SCHEDULING', {
        method: 'POST', headers: fHeaders,
        body: JSON.stringify({ schedule: body.schedule })
      });
      const d = await r.json();
      return {statusCode:200,headers:cors,body:JSON.stringify(d)};
    }

    // POST: Call tracking
    if (action === 'calltracking') {
      const body = JSON.parse(event.body || '{}');
      const r = await fetch(base + '/feature/CALL_TRACKING', {
        method: 'POST', headers: fHeaders,
        body: JSON.stringify({ enabled: body.enabled })
      });
      const d = await r.json();
      return {statusCode:200,headers:cors,body:JSON.stringify(d)};
    }
  }


  //  Create Program (CPC / EP / BP / Layered) 
  if (path === 'create' && method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const { bizId, programType, budget, maxBid, isAutobid, start, end } = body;
    if (!bizId || !programType) return {statusCode:400,headers:cors,body:JSON.stringify({error:'bizId and programType required'})};

    const auth = basicAuth();
    const baseUrl = 'https://partner-api.yelp.com/v1/reseller/program/create';
    const results = [];

    // Helper: build query string for a single program
    async function createProgram(pType, bgt, mbid, autobid) {
      let url = baseUrl + '?business_id=' + encodeURIComponent(bizId) + '&program_name=' + pType;
      if (start) url += '&start=' + start;
      if (end)   url += '&end='   + end;
      if (pType === 'CPC') {
        url += '&budget=' + Math.round((bgt||0)*100);
        url += '&is_autobid=' + (autobid ? 'true' : 'false');
        if (!autobid && mbid) url += '&max_bid=' + Math.round((mbid||0)*100);
      }
      const r = await fetch(url, { method:'POST', headers:{ Authorization: auth, Accept:'application/json' } });
      return await r.json();
    }

    if (programType === 'LAYERED') {
      // Layered = CPC + EP together
      const cpcRes = await createProgram('CPC', budget, maxBid, isAutobid);
      const epRes  = await createProgram('EP');
      results.push({ type:'CPC', result: cpcRes });
      results.push({ type:'EP',  result: epRes });
    } else {
      const res = await createProgram(programType, budget, maxBid, isAutobid);
      results.push({ type: programType, result: res });
    }

    return {statusCode:200, headers:cors, body:JSON.stringify({success:true, results})};
  }


  //  All partner locations (for Launch modal) 



  // -- All partner locations (for Launch modal) --


  // -- All partner locations: paginate all programs, dedupe by bizId --



  // -- All locations: paginate all programs, dedupe all businesses
  if (path === 'all-locations') {
    // Try biz.yelp.com/all_locations_ads first - this is the live partner hub data
    let locations = [];
    try {
      const raw = await httpGet('biz.yelp.com', '/all_locations_ads', basicAuth());
      const data = raw.b;
      // Response may be: {locations:[...]}, {businesses:[...]}, or array
      const list = Array.isArray(data) ? data : (data.locations || data.businesses || data.all_locations || []);
      if (list.length > 0) {
        // Get active bizIds from SNAPSHOT for status comparison
        const activeIds = new Set(SNAPSHOT.map(s => s.id));
        locations = list.map(loc => {
          const bid = loc.id || loc.yelp_business_id || loc.bizId || loc.business_id;
          return {
            bizId: bid,
            name: loc.name || loc.business_name || bid,
            address: loc.address || [loc.address1, loc.city, loc.state].filter(Boolean).join(', ') || '',
            hasActive: activeIds.has(bid) || loc.has_advertising === true || loc.status === 'ACTIVE',
            programType: loc.program_type || null
          };
        });
      }
    } catch(e) {}

    // Fall back: combine SNAPSHOT (30 active with names) + any extra from /programs/v1
    if (locations.length === 0) {
      // Use SNAPSHOT as base - all known clients with names
      SNAPSHOT.forEach(s => {
        locations.push({
          bizId: s.id,
          name: s.name || s.campaign_name || s.id,
          address: '',
          hasActive: true,
          programType: 'CPC'
        });
      });
    }

    locations.sort((a, b) => {
      if (a.hasActive !== b.hasActive) return a.hasActive ? 1 : -1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return { statusCode: 200, headers: cors, body: JSON.stringify({ locations, total: locations.length }) };
  }


  // -- bizId to programId mapping (for Advanced Controls) --
  if (path === 'biz-program-map') {
    const page = await httpGet('partner-api.yelp.com', '/programs/v1?limit=100&program_status=CURRENT', basicAuth());
    const programs = (page.b && page.b.payment_programs) || [];
    const map = {};
    programs.forEach(p => {
      if (p.program_status === 'ACTIVE' || p.program_status === 'CURRENT') {
        (p.businesses || []).forEach(b => {
          if (!map[b.yelp_business_id]) map[b.yelp_business_id] = {
            programId: p.program_id,
            programType: p.program_type,
            activeFeatures: p.active_features || [],
            availableFeatures: p.available_features || []
          };
        });
      }
    });
    return { statusCode: 200, headers: cors, body: JSON.stringify({ map }) };
  }




  
  //  Reporting API: live leads/calls/impressions/clicks per campaign 
  if (path === 'reporting') {
    const now = new Date();
    const yr  = now.getUTCFullYear();
    const mo  = String(now.getUTCMonth()+1).padStart(2,'0');
    const dd  = String(now.getUTCDate()).padStart(2,'0');
    const startDate = yr+'-'+mo+'-01';
    const endDate   = yr+'-'+mo+'-'+dd;

    // Get bizIds via same endpoint as programs/list/all (proven working)
    const page = await httpGet('partner-api.yelp.com', '/programs/v1?limit=100&program_status=CURRENT', basicAuth());
    const programs = (page.b && page.b.payment_programs) || [];
    const bizIds = [];
    programs.forEach(p => (p.businesses||[]).forEach(b => {
      if(b.yelp_business_id && !bizIds.includes(b.yelp_business_id)) bizIds.push(b.yelp_business_id);
    }));

    if(!bizIds.length) return {statusCode:200, headers:cors, body:JSON.stringify({metrics:{}, error:'programs/v1 returned '+programs.length+' programs, 0 bizIds', debug:{s:page.s, keys:Object.keys(page.b||{})}})};

    // Call Fusion Reporting API via https.request (server-side, no CORS)
    const metrics = {};
    const fusionAuth = 'Bearer ' + FUSION_KEY;
    const batchSize = 10;
    for(let i=0; i<bizIds.length; i+=batchSize) {
      const batch = bizIds.slice(i, i+batchSize);
      const body = JSON.stringify({ids:batch, start_date:startDate, end_date:endDate});
      try {
        const res = await new Promise((resolve)=>{
          const req = https.request({
            hostname:'api.yelp.com', path:'/v3/reporting/businesses/daily', method:'POST',
            headers:{Authorization:fusionAuth, 'Content-Type':'application/json', 'Content-Length':Buffer.byteLength(body)}
          }, res=>{
            let data=''; res.on('data',c=>data+=c);
            res.on('end',()=>{ try{resolve({s:res.statusCode,b:JSON.parse(data)});}catch(e){resolve({s:res.statusCode,r:data.substring(0,200)});} });
          });
          req.on('error',e=>resolve({s:500,r:e.message}));
          req.write(body); req.end();
        });
        ((res.b && res.b.data)||[]).forEach(biz=>{
          let leads=0,calls=0,impressions=0,clicks=0;
          (biz.metrics||[]).forEach(m=>{
            leads+=(m.num_leads||0); calls+=(m.num_calls||0);
            impressions+=(m.num_mobile_search_appearances||0);
            clicks+=(m.num_mobile_cta_clicks||0)+(m.num_desktop_cta_clicks||0);
          });
          metrics[biz.business_id]={leads,calls,impressions,clicks,days:(biz.metrics||[]).length};
        });
      } catch(e){}
    }
    return {statusCode:200,headers:cors,body:JSON.stringify({metrics,startDate,endDate,bizCount:bizIds.length,metricCount:Object.keys(metrics).length})};
  }


  //  Reporting API: fetch leads/calls/impressions/clicks for all campaigns 
          if (path === 'reporting/monthly') {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth()+1).padStart(2,'0');
    const startDate = year+'-'+month+'-01';
    const lastDay = new Date(year, now.getUTCMonth()+1, 0).getUTCDate();
    const endDate = year+'-'+month+'-'+String(lastDay).padStart(2,'0');

    const progPage = await httpGet('partner-api.yelp.com','/programs/v1?limit=100',basicAuth());
    const programs = (progPage.b&&progPage.b.payment_programs)||[];
    const bizIds = programs.map(p=>p.businesses&&p.businesses[0]&&p.businesses[0].yelp_business_id).filter(Boolean);

    if(!bizIds.length) return {statusCode:200,headers:cors,body:JSON.stringify({metrics:{},startDate,endDate,bizCount:0})};

    const allMetrics = {};
    const batchSize = 20;

    for(let i=0;i<bizIds.length;i+=batchSize) {
      const batch = bizIds.slice(i,i+batchSize);
      try {
        const payload = JSON.stringify({ids:batch, start:startDate, end:endDate});
        const res = await httpPost('api.yelp.com','/v3/reporting/businesses/daily',payload,'Bearer '+FUSION_KEY);
        const data = (res.b&&res.b.data)||[];
        data.forEach(biz => {
          const metrics = biz.metrics||[];
          const totals = {calls:0,leads:0,impressions:0,clicks:0,messages:0,url_clicks:0};
          metrics.forEach(day=>{
            totals.calls       += (day.num_calls||0);
            totals.clicks      += (day.num_mobile_cta_clicks||0)+(day.num_desktop_cta_clicks||0);
            totals.impressions += (day.num_mobile_search_appearances||0)+(day.num_desktop_search_appearances||0);
            totals.messages    += (day.num_messages_to_business||0);
            totals.url_clicks  += (day.url_clicks||0);
            totals.leads       += (day.num_calls||0)+(day.num_messages_to_business||0)+(day.url_clicks||0);
          });
          allMetrics[biz.business_id] = totals;
        });
      } catch(e) {}
    }

    return {statusCode:200,headers:cors,body:JSON.stringify({metrics:allMetrics,startDate,endDate,bizCount:bizIds.length})};
  }

return{statusCode:404,headers:cors,body:JSON.stringify({error:'Unknown: '+path})};
}
async function httpPostJson(host, path, bodyObj, authHeader) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(bodyObj);
    const opts = { hostname: host, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload),
                 'Accept': 'application/json', 'Authorization': authHeader, 'User-Agent': 'ShefaDashboard/1.0' } };
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch(e) { resolve({ s: res.statusCode, r: d }); }
      });
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}

async function httpGetAuth(host, path, authHeader) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const opts = { hostname: host, path, method: 'GET',
      headers: { 'Accept': 'application/json', 'Authorization': authHeader, 'User-Agent': 'ShefaDashboard/1.0' } };
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch(e) { resolve({ s: res.statusCode, r: d }); }
      });
    });
    req.on('error', reject); req.end();
  });
}

;