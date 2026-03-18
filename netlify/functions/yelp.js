const https = require('https');
const USER = process.env.YELP_USER;
const PASS = process.env.YELP_PASS;
const FUSION_KEY = process.env.YELP_FUSION_KEY;

function basicAuth() { return 'Basic ' + Buffer.from(USER + ':' + PASS).toString('base64'); }

function req(host, path, method, auth, body) {
  return new Promise((resolve, reject) => {
    const headers = { Authorization: auth || basicAuth(), 'Content-Type': 'application/json' };
    const opts = { hostname: host, path, method: method||'GET', headers };
    const r = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({status:res.statusCode,body:JSON.parse(d)}); } catch(e) { resolve({status:res.statusCode,raw:d.substring(0,300)}); } });
    });
    r.on('error', e => resolve({error:e.message}));
    if (body) r.write(body); r.end();
  });
}

exports.handler = async (event) => {
  const cors = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  const path = (event.queryStringParameters||{}).path || '';
  const body = event.body ? JSON.parse(event.body) : {};

  if (path === 'health') return {statusCode:200,headers:cors,body:JSON.stringify({status:'ok',user:USER,pass:PASS?'set':'missing'})};

  if (path === 'probe') {
    // Try username as account ID in path, and also try OAuth-style bearer token
    const passAsBearer = 'Bearer ' + PASS;
    const tests = [
      ['partner-api.yelp.com', '/v1/account/' + USER + '/programs', 'GET', basicAuth()],
      ['partner-api.yelp.com', '/v1/accounts/' + USER + '/programs', 'GET', basicAuth()],
      ['partner-api.yelp.com', '/v1/account/programs', 'GET', passAsBearer],
      ['partner-api.yelp.com', '/v1/programs', 'GET', passAsBearer],
      ['partner-api.yelp.com', '/v3/oauth/token', 'GET', basicAuth()],
      ['api.yelp.com', '/v3/businesses/search?term=test&location=LA', 'GET', 'Bearer ' + FUSION_KEY],
    ];
    const results = {};
    for (const [host, p, method, auth] of tests) {
      try {
        const r = await req(host, p, method, auth);
        results[p] = {status:r.status, preview:JSON.stringify(r.body||r.raw).substring(0,150)};
      } catch(e) { results[p] = {error:e.message}; }
    }
    return {statusCode:200,headers:cors,body:JSON.stringify(results)};
  }

  if (path === 'programs') {
    const r = await req('partner-api.yelp.com', '/v1/account/' + USER + '/programs');
    const data = r.body || {};
    const programs = data.programs || data.data || data || [];
    return {statusCode:200,headers:cors,body:JSON.stringify({programs:Array.isArray(programs)?programs:[], raw:r})};
  }

  if (path === 'report/create') {
    const payload = JSON.stringify({...body,metrics:['impressions','ad_clicks','user_views','leads','biz_page_calls','biz_page_messages','total_spend','cpc'],granularity:'MONTH'});
    const r = await req('api.yelp.com', '/v3/reporting/reports', 'POST', 'Bearer '+FUSION_KEY, payload);
    return {statusCode:200,headers:cors,body:JSON.stringify(r)};
  }

  if (path.startsWith('report/')) {
    const id = path.split('/')[1];
    const r = await req('api.yelp.com', '/v3/reporting/reports/'+id, 'GET', 'Bearer '+FUSION_KEY);
    return {statusCode:200,headers:cors,body:JSON.stringify(r)};
  }

  if (path.startsWith('pause/')) { const id=path.split('/')[1]; const r=await req('partner-api.yelp.com','/program/'+id+'/pause/v1','POST'); return {statusCode:200,headers:cors,body:JSON.stringify(r)}; }
  if (path.startsWith('resume/')) { const id=path.split('/')[1]; const r=await req('partner-api.yelp.com','/program/'+id+'/resume/v1','POST'); return {statusCode:200,headers:cors,body:JSON.stringify(r)}; }
  if (path.startsWith('budget/')) { const id=path.split('/')[1]; const r=await req('partner-api.yelp.com','/v1/reseller/program/'+id+'/edit?budget='+body.budget,'POST'); return {statusCode:200,headers:cors,body:JSON.stringify(r)}; }

  return {statusCode:404,headers:cors,body:JSON.stringify({error:'Unknown: '+path})};
};