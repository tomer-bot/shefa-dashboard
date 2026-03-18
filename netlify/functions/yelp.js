const https = require('https');

const USER = process.env.YELP_USER;
const PASS = process.env.YELP_PASS;
const FUSION_KEY = process.env.YELP_FUSION_KEY;

function basicAuth() {
  return 'Basic ' + Buffer.from(USER + ':' + PASS).toString('base64');
}

function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({status: res.statusCode, body: JSON.parse(d)}); }
        catch(e) { resolve({status: res.statusCode, body: d.substring(0,200)}); }
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

exports.handler = async (event) => {
  const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json'};
  if (event.httpMethod === 'OPTIONS') return {statusCode:200,headers:cors,body:''};

  const path = (event.queryStringParameters && event.queryStringParameters.path) || '';
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    let result;

    if (path === 'health') {
      return {statusCode:200,headers:cors,body:JSON.stringify({status:'ok',user:USER?'set':'missing',pass:PASS?'set':'missing'})};
    }

    // Probe all possible endpoint variants
    else if (path === 'probe') {
      const endpoints = [
        {host:'partner-api.yelp.com', path:'/v1/account/programs'},
        {host:'partner-api.yelp.com', path:'/v2/account/programs'},
        {host:'ads-api.yelp.com', path:'/v1/programs'},
        {host:'ads-api.yelp.com', path:'/v1/account/programs'},
        {host:'api.yelp.com', path:'/v3/ads/programs'},
      ];
      const results = {};
      for (const ep of endpoints) {
        try {
          const r = await req({hostname:ep.host, path:ep.path, method:'GET', headers:{Authorization:basicAuth()}});
          results[ep.host+ep.path] = {status:r.status, preview:JSON.stringify(r.body).substring(0,100)};
        } catch(e) {
          results[ep.host+ep.path] = {error:e.message};
        }
      }
      return {statusCode:200,headers:cors,body:JSON.stringify(results)};
    }

    else if (path === 'programs') {
      // Try the most likely correct endpoint based on Yelp Ads API docs
      const r = await req({hostname:'partner-api.yelp.com', path:'/v1/account/programs', method:'GET', headers:{Authorization:basicAuth()}});
      result = r;
    }

    else if (path === 'report/create') {
      const payload = JSON.stringify({...body, metrics:['impressions','ad_clicks','user_views','leads','biz_page_calls','biz_page_messages','total_spend','cpc'],granularity:'MONTH'});
      const r = await req({hostname:'api.yelp.com',path:'/v3/reporting/reports',method:'POST',headers:{Authorization:'Bearer '+FUSION_KEY,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}},payload);
      result = r;
    }

    else if (path.startsWith('report/')) {
      const id = path.split('/')[1];
      const r = await req({hostname:'api.yelp.com',path:'/v3/reporting/reports/'+id,method:'GET',headers:{Authorization:'Bearer '+FUSION_KEY}});
      result = r;
    }

    else if (path.startsWith('pause/')) {
      const id = path.split('/')[1];
      const r = await req({hostname:'partner-api.yelp.com',path:'/program/'+id+'/pause/v1',method:'POST',headers:{Authorization:basicAuth()}});
      result = r;
    }

    else if (path.startsWith('resume/')) {
      const id = path.split('/')[1];
      const r = await req({hostname:'partner-api.yelp.com',path:'/program/'+id+'/resume/v1',method:'POST',headers:{Authorization:basicAuth()}});
      result = r;
    }

    else if (path.startsWith('budget/')) {
      const id = path.split('/')[1];
      const r = await req({hostname:'partner-api.yelp.com',path:'/v1/reseller/program/'+id+'/edit?budget='+body.budget,method:'POST',headers:{Authorization:basicAuth()}});
      result = r;
    }

    else {
      return {statusCode:404,headers:cors,body:JSON.stringify({error:'Unknown path: '+path})};
    }

    return {statusCode:200,headers:cors,body:JSON.stringify(result)};
  } catch(e) {
    return {statusCode:500,headers:cors,body:JSON.stringify({error:e.message,stack:e.stack})};
  }
};