const https = require('https');

const CLIENTS = [{"name":"Roof by Tom : 1990 N California Blvd","budget":200,"bizId":"_sZA3BJl7twy01kXTzjbwQ","statsUrl":"/ads_stats/_sZA3BJl7twy01kXTzjbwQ/recent_month_stats"},{"name":"Skybar Construction : None","budget":500,"bizId":"UVAoRCMIgEUuRWPBWQOhTg","statsUrl":"/ads_stats/UVAoRCMIgEUuRWPBWQOhTg/recent_month_stats"},{"name":"JMS Air Conditioning and Heating : 7640 Burnet Ave","budget":500,"bizId":"lM5K5vOIfgIrDEd_2hNKiQ","statsUrl":"/ads_stats/lM5K5vOIfgIrDEd_2hNKiQ/recent_month_stats"},{"name":"Prodigy Moving & Storage : 601 S Figueroa","budget":10500,"bizId":"tV1VR1QwPJTdHNn2kK6ABw","statsUrl":"/ads_stats/tV1VR1QwPJTdHNn2kK6ABw/recent_month_stats"},{"name":"Star Steel : 16131 Valerio St","budget":800,"bizId":"srmB3uxc2AkBRycy7md_5w","statsUrl":"/ads_stats/srmB3uxc2AkBRycy7md_5w/recent_month_stats"},{"name":"Prodigy Moving & Storage :","budget":3500,"bizId":"NEK7Y1Yg_Ari8lw7AOrgZQ","statsUrl":"/ads_stats/NEK7Y1Yg_Ari8lw7AOrgZQ/recent_month_stats"},{"name":"Prodigy Moving & Storage : 9349 Oso Ave","budget":840,"bizId":"a0D2QGetwHNw3dFOUxNMjQ","statsUrl":"/ads_stats/a0D2QGetwHNw3dFOUxNMjQ/recent_month_stats"},{"name":"Quality Home Remodeling - Room Addition Contractor :","budget":1695,"bizId":"2_7dBwMfEceDvMNKA7t_BA","statsUrl":"/ads_stats/2_7dBwMfEceDvMNKA7t_BA/recent_month_stats"},{"name":"Green Rodent Restoration : 9820 Owensmouth Ave","budget":4000,"bizId":"2uhrsdQTdbe9xi-M9PboFQ","statsUrl":"/ads_stats/2uhrsdQTdbe9xi-M9PboFQ/recent_month_stats"},{"name":"Green Rodent Layered Campaign\n                                        (strict)","budget":2500,"bizId":"vSnFEC7jCZ33-G9W1EAoDw","statsUrl":"/ads_stats/vSnFEC7jCZ33-G9W1EAoDw/recent_month_stats"},{"name":"Sequoia Flooring : 14701 Oxnard St","budget":4805,"bizId":"6AQ__Lm482ppQ759xhruCA","statsUrl":"/ads_stats/6AQ__Lm482ppQ759xhruCA/recent_month_stats"},{"name":"A1 Pro Clean Carpet & Upholstery Cleaning : 5224 Zelzah Ave","budget":2000,"bizId":"IEqquR3LRqMJNVo0Ajthaw","statsUrl":"/ads_stats/IEqquR3LRqMJNVo0Ajthaw/recent_month_stats"},{"name":"Alpha Pro Builders : 143 N Arnaz Dr","budget":150,"bizId":"VvEH6vIIZIHumtDPuCqo6w","statsUrl":"/ads_stats/VvEH6vIIZIHumtDPuCqo6w/recent_month_stats"},{"name":"Sequoia Flooring :","budget":2400,"bizId":"5orEWCAGeJCI3KC2c7Nn6w","statsUrl":"/ads_stats/5orEWCAGeJCI3KC2c7Nn6w/recent_month_stats"},{"name":"Sequoia Flooring :","budget":2400,"bizId":"EOspmIDzGsejW7yOzTZDMg","statsUrl":"/ads_stats/EOspmIDzGsejW7yOzTZDMg/recent_month_stats"},{"name":"My Cali Builders : 24021 Friar St","budget":3400,"bizId":"XzoOIBHJ4ae5fbzgeevwUQ","statsUrl":"/ads_stats/XzoOIBHJ4ae5fbzgeevwUQ/recent_month_stats"},{"name":"Prodigy Moving & Storage - Santa Monica : 100 Wilshire Blvd","budget":150,"bizId":"8djfCpUXTwOLOX8JaEHLvw","statsUrl":"/ads_stats/8djfCpUXTwOLOX8JaEHLvw/recent_month_stats"},{"name":"LYD Construction : 4055 Lake Washington Blvd NE","budget":11000,"bizId":"SJ_BBCVtm-96p8qz72Ub-g","statsUrl":"/ads_stats/SJ_BBCVtm-96p8qz72Ub-g/recent_month_stats"},{"name":"First Garage Door and Gates : 600 Anton Blvd","budget":2505,"bizId":"ybllwJ-CLRNg5BAE76Q5FA","statsUrl":"/ads_stats/ybllwJ-CLRNg5BAE76Q5FA/recent_month_stats"},{"name":"Aldan Construction & Remodeling : 8549 Wilshire Blvd","budget":7980,"bizId":"tGk50TzJPSpGzEY2lsPSLg","statsUrl":"/ads_stats/tGk50TzJPSpGzEY2lsPSLg/recent_month_stats"},{"name":"Excalibur Moving & Storage : 14600 Keswick St","budget":5010,"bizId":"hT3ssiBBja5ADp0FpjemhQ","statsUrl":"/ads_stats/hT3ssiBBja5ADp0FpjemhQ/recent_month_stats"},{"name":"Excalibur Moving Company : 529 South Broadway","budget":5010,"bizId":"egvDaoU-01vKvFjMOqK5xg","statsUrl":"/ads_stats/egvDaoU-01vKvFjMOqK5xg/recent_month_stats"},{"name":"J & I Home Design :","budget":5010,"bizId":"n60cotZPuu5Q6ZBhXqTdUg","statsUrl":"/ads_stats/n60cotZPuu5Q6ZBhXqTdUg/recent_month_stats"},{"name":"NearMe Roofing Company : 2727 152nd Ave NE","budget":150,"bizId":"dC23JimQ1IpVvmoM6HSMOQ","statsUrl":"/ads_stats/dC23JimQ1IpVvmoM6HSMOQ/recent_month_stats"},{"name":"Mission Home Remodeling : 405 Primrose Rd","budget":3000,"bizId":"GVMBlmZrhIYO9bYYsOlZ-Q","statsUrl":"/ads_stats/GVMBlmZrhIYO9bYYsOlZ-Q/recent_month_stats"},{"name":"Skybar Construction : None","budget":4480,"bizId":"zg-Tn4_mBR6CdCfyU9QtIw","statsUrl":"/ads_stats/zg-Tn4_mBR6CdCfyU9QtIw/recent_month_stats"},{"name":"JMS Air Conditioning and Heating : 7640 Burnet Ave","budget":2490,"bizId":"IVQ0WGXnjp-MNJfYP47XDA","statsUrl":"/ads_stats/IVQ0WGXnjp-MNJfYP47XDA/recent_month_stats"},{"name":"Marina Bay Roofing : 4411 Geary Blvd","budget":18000,"bizId":"5_rIOWR2WRAkKyRnd0Cl6w","statsUrl":"/ads_stats/5_rIOWR2WRAkKyRnd0Cl6w/recent_month_stats"},{"name":"Roof by Tom : 1990 N California Blvd","budget":2001,"bizId":"g0aGLbA5PnpQXA9vzUetsg","statsUrl":"/ads_stats/g0aGLbA5PnpQXA9vzUetsg/recent_month_stats"},{"name":"Mission Home Remodeling : 475 Gough St","budget":10000,"bizId":"7_5g6jLCRkY7BKNqC068NA","statsUrl":"/ads_stats/7_5g6jLCRkY7BKNqC068NA/recent_month_stats"}];
const YELP_SESSION = process.env.YELP_SESSION;
const FUSION_KEY = process.env.YELP_FUSION_KEY;
const YELP_USER = process.env.YELP_USER;
const YELP_PASS = process.env.YELP_PASS;

function basicAuth(){return 'Basic '+Buffer.from(YELP_USER+':'+YELP_PASS).toString('base64');}

function httpGet(host,path,cookieOrBearer){
  return new Promise((resolve,reject)=>{
    const headers={'Accept':'application/json','User-Agent':'Mozilla/5.0'};
    if(cookieOrBearer&&cookieOrBearer.startsWith('Bearer '))headers['Authorization']=cookieOrBearer;
    else if(cookieOrBearer)headers['Cookie']=cookieOrBearer;
    const req=https.request({hostname:host,path,method:'GET',headers},res=>{
      let d='';res.on('data',c=>d+=c);
      res.on('end',()=>{try{resolve({s:res.statusCode,b:JSON.parse(d)});}catch(e){resolve({s:res.statusCode,r:d.substring(0,200)});}});
    });
    req.on('error',e=>resolve({s:0,r:e.message}));req.end();
  });
}

function httpPost(host,path,body,authHeader){
  return new Promise((resolve,reject)=>{
    const b=body||'';
    const headers={'Authorization':authHeader||basicAuth(),'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)};
    const req=https.request({hostname:host,path,method:'POST',headers},res=>{
      let d='';res.on('data',c=>d+=c);
      res.on('end',()=>{try{resolve({s:res.statusCode,b:JSON.parse(d)});}catch(e){resolve({s:res.statusCode,r:d.substring(0,200)});}});
    });
    req.on('error',e=>resolve({s:0,r:e.message}));if(b)req.write(b);req.end();
  });
}

exports.handler=async(event)=>{
  const cors={'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers:cors,body:''};
  const path=(event.queryStringParameters||{}).path||'';
  const body=event.body?JSON.parse(event.body):{};

  try{
    if(path==='health'){
      return{statusCode:200,headers:cors,body:JSON.stringify({status:'ok',session:YELP_SESSION?'set':'missing',clients:CLIENTS.length})};
    }

    if(path==='programs'){
      if(!YELP_SESSION)return{statusCode:200,headers:cors,body:JSON.stringify({programs:[],error:'YELP_SESSION not set'})};
      
      // Fetch live stats for ALL active clients in parallel
      const results=await Promise.all(CLIENTS.map(async(client)=>{
        try{
          const r=await httpGet('biz.yelp.com',client.statsUrl,YELP_SESSION);
          const s=r.b&&r.b.monthly_cpc_stats;
          if(!s)return null;
          return{
            id:client.bizId,
            name:client.name,
            budget_cents:Math.round(parseFloat((s.budget&&s.budget.value)||client.budget||0)*100),
            spend_cents:Math.round(parseFloat((s.cost&&s.cost.value)||0)*100),
            impressions:s.impressions||0,
            clicks:s.clicks||0,
            leads:s.leads||0,
            calls:s.calls||0,
            ctr:parseFloat(s.ctr||0),
            avg_cpc:parseFloat((s.average_cpc&&s.average_cpc.value)||0),
            status:'ACTIVE',
            campaign_name:s.campaign_name||client.name,
            bizId:client.bizId
          };
        }catch(e){return null;}
      }));
      
      const programs=results.filter(Boolean);
      return{statusCode:200,headers:cors,body:JSON.stringify({programs})};
    }

    if(path==='report/create'){
      const payload=JSON.stringify({...body,metrics:['impressions','ad_clicks','user_views','leads','biz_page_calls','biz_page_messages','total_spend','cpc'],granularity:'MONTH'});
      const r=await httpPost('api.yelp.com','/v3/reporting/reports',payload,'Bearer '+FUSION_KEY);
      return{statusCode:200,headers:cors,body:JSON.stringify(r)};
    }

    if(path.startsWith('report/')){
      const id=path.split('/')[1];
      const r=await httpGet('api.yelp.com','/v3/reporting/reports/'+id,'Bearer '+FUSION_KEY);
      return{statusCode:200,headers:cors,body:JSON.stringify(r)};
    }

    if(path.startsWith('pause/')){
      const id=path.split('/')[1];
      const r=await httpPost('partner-api.yelp.com','/program/'+id+'/pause/v1','',basicAuth());
      return{statusCode:200,headers:cors,body:JSON.stringify(r)};
    }
    if(path.startsWith('resume/')){
      const id=path.split('/')[1];
      const r=await httpPost('partner-api.yelp.com','/program/'+id+'/resume/v1','',basicAuth());
      return{statusCode:200,headers:cors,body:JSON.stringify(r)};
    }
    if(path.startsWith('budget/')){
      const id=path.split('/')[1];
      const r=await httpPost('partner-api.yelp.com','/v1/reseller/program/'+id+'/edit?budget='+body.budget,'',basicAuth());
      return{statusCode:200,headers:cors,body:JSON.stringify(r)};
    }

    return{statusCode:404,headers:cors,body:JSON.stringify({error:'Unknown: '+path})};
  }catch(e){
    return{statusCode:500,headers:cors,body:JSON.stringify({error:e.message})};
  }
};
