const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();

const PORT = 443;

const options = {
  key: fs.readFileSync('/opt/lupharos/certs/privkey.pem'),
  cert: fs.readFileSync('/opt/lupharos/certs/fullchain.pem')
};

app.get('/', (req, res) => {
  const headers = req.headers;
  const isCloudflare = headers['cf-ray'] || headers['cdn-loop'];
  const tlsVersion = req.socket.getProtocol ? req.socket.getProtocol() : 'Unknown';
  const cert = options.cert;
  const certValidTo = cert.valid_to || 'Unavailable';

  let html = `
    <html>
      <head>
        <title>Cloudflare Origin Info</title>
        <style>
          body { font-family: Arial; background: #f4f4f4; padding: 30px; color: #333; }
          h1, h2 { text-align: center; }
          .box { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border-bottom: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #eee; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>🌐 Cloudflare Origin Server Info</h1>
          <h2>Created by Kemal ARTIKARSLAN</h2>
          <p><strong>Cloudflare Proxy:</strong> ${isCloudflare ? '✅ Yes' : '❌ No'}</p>
          <p><strong>TLS Version:</strong> ${tlsVersion}</p>
          <p><strong>Certificate Valid To:</strong> ${certValidTo}</p>
          <p><strong>Cloudflare SSL Mode:</strong> Full (Strict)</p>

          <h3>🔎 HTTP Request Headers</h3>
          <table>
            <tr><th>Header</th><th>Value</th></tr>`;
  
  for (let key in headers) {
    html += `<tr><td>${key}</td><td>${headers[key]}</td></tr>`;
  }

  html += `
          </table>
        </div>
      </body>
    </html>
  `;

  res.send(html);
});

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS Server running on port ${PORT}`);
});
