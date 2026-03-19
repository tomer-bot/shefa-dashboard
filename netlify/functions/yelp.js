const https = require('https');
const USER = process.env.YELP_USER;
const PASS = process.env.YELP_PASS;
const FUSION_KEY = process.env.YELP_FUSION_KEY;

// Per Yelp official docs:
// Ads API: POST partner-api.yelp.com/v1/reseller/program/create|edit|<id>/pause|resume
// Partner Support API: GET partner-api.yelp.com/v1/business_info/<ids> and program list per business
// Both use Data Ingestion API credentials = Basic Auth with username:password
// There is NO global program list — must query per business_id

function basicAuth() { return 'Basic ' + Buffer.from(USER + ':' + PASS).toString('base64'); }

function req(host, path, method, authHeader, body) {
  return new Promise((resolve, reject) => {
    const headers = { Authorization: authHeader || basicAuth(), 'Content-Type': 'application/json' };
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const r = https.request({ hostname: host, path, method: method || 'GET', headers }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({status:res.statusCode,body:JSON.parse(d)}); } catch(e) { resolve({status:res.statusCode,raw:d.substring(0,400)}); } });
    });
    r.on('error', e => resolve({error:e.message}));
    if (body) r.write(body); r.end();
  });
}

exports.handler = async (event) => {
  const cors = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  if (event.httpMethod === 'OPTIONS') return {statusCode:200,headers:cors,body:''};
  const path = (event.queryStringParameters||{}).path || '';
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    let result;

    if (path === 'health') {
      return {statusCode:200,headers:cors,body:JSON.stringify({status:'ok',user:USER?'set':'missing'})};
    }

    // Probe: test actual documented endpoints
    else if (path === 'probe') {
      const tests = [
        // Partner Support API - business info (documented endpoint)
        ['partner-api.yelp.com', '/v1/business_info/J9R1gG5xy7DpWsCWBup7DQ', 'GET', basicAuth()],
        // Partner Support API - program list per business (documented endpoint)  
        ['partner-api.yelp.com', '/v1/programs/J9R1gG5xy7DpWsCWBup7DQ', 'GET', basicAuth()],
        // Ads API - check status of a known program
        ['partner-api.yelp.com', '/v1/reseller/status/J9R1gG5xy7DpWsCWBup7DQ', 'GET', basicAuth()],
        // Try with second test biz ID
        ['partner-api.yelp.com', '/v1/business_info/e2JTWqyUwRHXjpG8TCZ7Ow', 'GET', basicAuth()],
        // Reporting v3 with Fusion key
        ['api.yelp.com', '/v3/reporting/reports', 'GET', 'Bearer '+FUSION_KEY],
      ];
      const results = {};
      for (const [host, p, method, auth] of tests) {
        try {
          const r = await req(host, p, method, auth);
          results[p] = {status:r.status, preview:JSON.stringify(r.body||r.raw).substring(0,200)};
        } catch(e) { results[p] = {error:e.message}; }
      }
      return {statusCode:200,headers:cors,body:JSON.stringify(results)};
    }

    // Main programs endpoint: fetch program list for each business we manage
    // Business IDs should be stored/provided - for now use the two known test IDs
    else if (path === 'programs') {
      const bizIds = body.business_ids || ['J9R1gG5xy7DpWsCWBup7DQ', 'e2JTWqyUwRHXjpG8TCZ7Ow'];
      const programs = [];
      for (const bizId of bizIds) {
        try {
          // Partner Support API: GET /v1/programs/<business_id>
          const r = await req('partner-api.yelp.com', '/v1/programs/' + bizId, 'GET', basicAuth());
          if (r.body && r.body.programs) {
            r.body.programs.forEach(p => programs.push({...p, business_id: bizId}));
          } else {
            programs.push({business_id: bizId, raw: r});
          }
        } catch(e) {
          programs.push({business_id: bizId, error: e.message});
        }
      }
      return {statusCode:200,headers:cors,body:JSON.stringify({programs})};
    }

    else if (path === 'report/create') {
      const payload = JSON.stringify({...body,metrics:['impressions','ad_clicks','user_views','leads','biz_page_calls','biz_page_messages','total_spend','cpc'],granularity:'MONTH'});
      const r = await req('api.yelp.com', '/v3/reporting/reports', 'POST', 'Bearer '+FUSION_KEY, payload);
      result = r;
    }

    else if (path.startsWith('report/')) {
      const id = path.split('/')[1];
      const r = await req('api.yelp.com', '/v3/reporting/reports/'+id, 'GET', 'Bearer '+FUSION_KEY);
      result = r;
    }

    // Ads API pause: POST /v1/reseller/program/<id>/pause/v1
    else if (path.startsWith('pause/')) {
      const id = path.split('/')[1];
      const r = await req('partner-api.yelp.com', '/program/'+id+'/pause/v1', 'POST', basicAuth());
      result = r;
    }

    // Ads API resume: POST /v1/reseller/program/<id>/resume/v1  
    else if (path.startsWith('resume/')) {
      const id = path.split('/')[1];
      const r = await req('partner-api.yelp.com', '/program/'+id+'/resume/v1', 'POST', basicAuth());
      result = r;
    }

    // Ads API edit budget: POST /v1/reseller/program/<id>/edit
    else if (path.startsWith('budget/')) {
      const id = path.split('/')[1];
      const r = await req('partner-api.yelp.com', '/v1/reseller/program/'+id+'/edit?budget='+body.budget, 'POST', basicAuth());
      result = r;
    }

    else { return {statusCode:404,headers:cors,body:JSON.stringify({error:'Unknown: '+path})}; }

    return {statusCode:200,headers:cors,body:JSON.stringify(result)};
  } catch(e) {
    return {statusCode:500,headers:cors,body:JSON.stringify({error:e.message})};
  }
};