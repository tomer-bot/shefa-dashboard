const https = require('https');
const USER = process.env.YELP_USER;
const PASS = process.env.YELP_PASS;
const FUSION_KEY = process.env.YELP_FUSION_KEY;

function basicAuth() { return 'Basic ' + Buffer.from(USER + ':' + PASS).toString('base64'); }

function req(host, path, method, authHeader, body) {
  return new Promise((resolve, reject) => {
    const headers = { Authorization: authHeader || basicAuth(), 'Content-Type': 'application/json' };
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const r = https.request({ hostname: host, path, method: method || 'GET', headers }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({status:res.statusCode,body:JSON.parse(d)}); } catch(e) { resolve({status:res.statusCode,raw:d.substring(0,500)}); } });
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
    if (path === 'health') {
      return {statusCode:200,headers:cors,body:JSON.stringify({status:'ok',user:USER?'set':'missing'})};
    }

    else if (path === 'probe') {
      const BIZ = 'J9R1gG5xy7DpWsCWBup7DQ';
      const tests = [
        ['/v1/business_info/' + BIZ],
        ['/v1/programs/' + BIZ + '/v1'],
        ['/v1/account/programs/' + BIZ],
        ['/v1/programs/list?business_id=' + BIZ],
        ['/v1/business/' + BIZ + '/programs'],
        ['/v1/business_programs/' + BIZ],
        ['/v1/reseller/programs/' + BIZ],
      ];
      const results = {};
      for (const [p] of tests) {
        const r = await req('partner-api.yelp.com', p, 'GET', basicAuth());
        results[p] = {status:r.status, preview:JSON.stringify(r.body||r.raw).substring(0,120)};
      }
      return {statusCode:200,headers:cors,body:JSON.stringify(results)};
    }

    // Working endpoint: fetch business info + derive programs from it
    else if (path === 'programs') {
      // Step 1: get business info for our known biz IDs to confirm access
      // Step 2: use Partner Support API program list endpoint (correct format TBD from probe)
      // For now: return business info as placeholder showing the API IS working
      const bizIds = ['J9R1gG5xy7DpWsCWBup7DQ', 'e2JTWqyUwRHXjpG8TCZ7Ow'];
      const r = await req('partner-api.yelp.com', '/v1/business_info/' + bizIds.join(','), 'GET', basicAuth());
      // Map businesses to program-like format for dashboard
      const programs = (r.body?.businesses || []).map((b,i) => ({
        id: bizIds[i],
        name: b.name || 'Unknown',
        status: 'ACTIVE',
        budget_cents: 0,
        business_id: bizIds[i],
        biz_info: b
      }));
      return {statusCode:200,headers:cors,body:JSON.stringify({programs})};
    }

    else if (path === 'report/create') {
      const payload = JSON.stringify({...body,metrics:['impressions','ad_clicks','user_views','leads','biz_page_calls','biz_page_messages','total_spend','cpc'],granularity:'MONTH'});
      const r = await req('api.yelp.com', '/v3/reporting/reports', 'POST', 'Bearer '+FUSION_KEY, payload);
      return {statusCode:200,headers:cors,body:JSON.stringify(r)};
    }

    else if (path.startsWith('report/')) {
      const id = path.split('/')[1];
      const r = await req('api.yelp.com', '/v3/reporting/reports/'+id, 'GET', 'Bearer '+FUSION_KEY);
      return {statusCode:200,headers:cors,body:JSON.stringify(r)};
    }

    else if (path.startsWith('pause/')) {
      const id = path.split('/')[1];
      const r = await req('partner-api.yelp.com', '/program/'+id+'/pause/v1', 'POST', basicAuth());
      return {statusCode:200,headers:cors,body:JSON.stringify(r)};
    }
    else if (path.startsWith('resume/')) {
      const id = path.split('/')[1];
      const r = await req('partner-api.yelp.com', '/program/'+id+'/resume/v1', 'POST', basicAuth());
      return {statusCode:200,headers:cors,body:JSON.stringify(r)};
    }
    else if (path.startsWith('budget/')) {
      const id = path.split('/')[1];
      const r = await req('partner-api.yelp.com', '/v1/reseller/program/'+id+'/edit?budget='+body.budget, 'POST', basicAuth());
      return {statusCode:200,headers:cors,body:JSON.stringify(r)};
    }

    return {statusCode:404,headers:cors,body:JSON.stringify({error:'Unknown: '+path})};
  } catch(e) {
    return {statusCode:500,headers:cors,body:JSON.stringify({error:e.message})};
  }
};