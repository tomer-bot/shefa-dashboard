const https = require('https');

const USER = process.env.YELP_USER;
const PASS = process.env.YELP_PASS;
const FUSION_KEY = process.env.YELP_FUSION_KEY;

function basicAuth() {
  return 'Basic ' + Buffer.from(USER + ':' + PASS).toString('base64');
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data }); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  const path = event.queryStringParameters && event.queryStringParameters.path || '';
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    let result;

    if (path === 'health') {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ status: 'ok', user: USER ? 'set' : 'missing' }) };
    } else if (path === 'programs') {
      result = await httpsRequest({ hostname: 'partner-api.yelp.com', path: '/v1/account/programs', method: 'GET', headers: { Authorization: basicAuth() } });
    } else if (path.startsWith('pause/')) {
      const id = path.split('/')[1];
      result = await httpsRequest({ hostname: 'partner-api.yelp.com', path: '/program/' + id + '/pause/v1', method: 'POST', headers: { Authorization: basicAuth() } });
    } else if (path.startsWith('resume/')) {
      const id = path.split('/')[1];
      result = await httpsRequest({ hostname: 'partner-api.yelp.com', path: '/program/' + id + '/resume/v1', method: 'POST', headers: { Authorization: basicAuth() } });
    } else if (path.startsWith('budget/')) {
      const id = path.split('/')[1];
      result = await httpsRequest({ hostname: 'partner-api.yelp.com', path: '/v1/reseller/program/' + id + '/edit?budget=' + body.budget, method: 'POST', headers: { Authorization: basicAuth() } });
    } else if (path === 'report/create') {
      const payload = JSON.stringify({ ...body, metrics: ['impressions','ad_clicks','user_views','leads','biz_page_calls','biz_page_messages','total_spend','cpc'], granularity: 'MONTH' });
      result = await httpsRequest({ hostname: 'api.yelp.com', path: '/v3/reporting/reports', method: 'POST', headers: { Authorization: 'Bearer ' + FUSION_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, payload);
    } else if (path.startsWith('report/')) {
      const id = path.split('/')[1];
      result = await httpsRequest({ hostname: 'api.yelp.com', path: '/v3/reporting/reports/' + id, method: 'GET', headers: { Authorization: 'Bearer ' + FUSION_KEY } });
    } else {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Unknown path: ' + path }) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify(result) };
  } catch(e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};