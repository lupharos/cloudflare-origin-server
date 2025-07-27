const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Statik dosyaları sun (örneğin style.css)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  const headers = req.headers;

  const isCloudflare = headers['cf-ray'] || headers['cdn-loop'];
  const isTunnel = (
    headers['cf-warp-tag-id'] ||
    headers['cf-warp-request-id'] ||
    headers['cf-warp-route'] ||
    (headers['user-agent'] && headers['user-agent'].includes('Cloudflare-Tunnel'))
  );

  const tlsVersion = req.socket.getProtocol ? req.socket.getProtocol() : 'Unknown';

  let source = 'Unknown';
  if (isTunnel) source = '🌩️ Cloudflare Tunnel';
  else if (isCloudflare) source = '🛡️ Cloudflare Proxy (NGINX)';
  else source = '🔓 Direct / Internal';

  // Cloudflare DNS kayıtlarını çek
  let dnsHtml = '';
  try {
    const response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/dns_records`, {
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const dnsRecords = response.data.result;

    dnsHtml += `
      <h3>📄 Cloudflare DNS Records</h3>
      <table>
        <thead><tr><th>Type</th><th>Name</th><th>Content</th><th>TTL</th></tr></thead>
        <tbody>
    `;
    dnsRecords.forEach(record => {
      dnsHtml += `<tr>
        <td>${record.type}</td>
        <td>${record.name}</td>
        <td>${record.content}</td>
        <td>${record.ttl}</td>
      </tr>`;
    });
    dnsHtml += '</tbody></table>';
  } catch (err) {
    dnsHtml = `<p style="color:red;"><strong>⚠️ Could not load DNS records from Cloudflare API</strong></p>`;
  }

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cloudflare Origin Info</title>
      <link rel="stylesheet" href="/style.css">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px; color: #333; }
        .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
        .box { max-width: 900px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border-bottom: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #eee; }
        .badge { display: inline-block; padding: 6px 12px; border-radius: 6px; color: white; font-weight: bold; }
        .yes { background-color: green; }
        .no { background-color: red; }
        .tunnel { background-color: #0070f3; }
        .source { background-color: #444; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="header">🌐 Lupharos Origin Server - Tunnel & Proxy Aware</div>
        <h1>KA - CF Origin Server Info</h1>
        <h2>Created by Kemal ARTIKARSLAN</h2>
        <p><strong>Connection Source:</strong> <span class="badge source">${source}</span></p>
        <p><strong>Cloudflare Proxy:</strong> <span class="badge ${isCloudflare ? 'yes' : 'no'}">${isCloudflare ? 'Yes' : 'No'}</span></p>
        <p><strong>Cloudflare Tunnel:</strong> <span class="badge ${isTunnel ? 'tunnel' : 'no'}">${isTunnel ? 'Yes (Tunnel)' : 'No'}</span></p>
        <p><strong>Cloudflare SSL Mode:</strong> Full (Strict)</p>

        <h3>🔍 HTTP Request Headers</h3>
        <table>
          <thead><tr><th>Header</th><th>Value</th></tr></thead>
          <tbody>
  `;

  for (let key in headers) {
    html += `<tr><td>${key}</td><td>${headers[key]}</td></tr>`;
  }

  html += `</tbody></table>${dnsHtml}</div></body></html>`;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`✅ Express app running on port ${PORT}`);
});
