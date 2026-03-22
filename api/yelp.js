// api/yelp.js — Vercel serverless function
// Wraps the existing Netlify function handler for Vercel compatibility
const { handler } = require('../netlify/functions/yelp');

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Convert Vercel req → Netlify event format
  const event = {
    httpMethod: req.method,
    queryStringParameters: req.query || {},
    body: req.body ? JSON.stringify(req.body) : null,
    headers: req.headers,
  };

  try {
    const result = await handler(event, {});
    if (result.headers) {
      Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(result.statusCode).send(result.body);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};