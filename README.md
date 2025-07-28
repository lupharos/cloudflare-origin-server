# 🌐 Lupharos Origin Server – Full Installation Guide

### By Kemal Artıkarslan

---

## 📌 1. Domain & DNS Setup

### 1.1 Purchase Domain
Buy `lupharos.com.tr` from a registrar like Namecheap, GoDaddy, or Google Domains.

### 1.2 Move DNS to Cloudflare
- Add the domain to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Replace registrar's nameservers with Cloudflare's
- Wait for propagation

---

## 🔐 2. Cloudflare API Token

### Scopes Required
- `Zone:Read`
- `DNS:Edit`
- `Tunnel:Edit`

Create token from [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)

Store in `.env`:

```
CF_API_TOKEN=your_token_here
CF_ZONE_ID=your_zone_id_here
```

---

## 🌩️ 3. Cloudflare Tunnel

```bash
sudo apt install cloudflared
cloudflared login
cloudflared tunnel create yourtunelname
cloudflared tunnel route dns yourtunnelname yourtunneldomainname
```

### Example config.yaml

```yaml
tunnel: <your-tunnel-id>
credentials-file: /home/ubuntu/.cloudflared/<your-tunnel-id>.json

ingress:
  - hostname: yourtunneldomainname
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## 🧠 4. Express.js Server Setup

```bash
npm install express path axios dotenv
```

### Directory structure:

```
cloudflare-origin-server/
├── index.js
├── .env
├── public/
│   └── style.css
```

---

## 🔒 5. TLS / SSL Certificate

### Option 1: Let's Encrypt (Initial)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomainname
```

### Option 2: Cloudflare Origin Cert (Final Setup)
Generate certificate in Cloudflare → SSL/TLS → Origin Certificates

Put files in:
```
/opt/lupharos/certs/origin.pem
/opt/lupharos/certs/origin-key.pem
```

NGINX config:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomainname;

    ssl_certificate     /opt/lupharos/certs/origin.pem;
    ssl_certificate_key /opt/lupharos/certs/origin-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomainname;
    return 301 https://$host$request_uri;
}
```

---

## ✅ 6. API Token Call – List DNS Records

### Scopes Used:
- `Zone:Read`
- `DNS:Edit`

### API Call:
```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json"
```

### Output / Samples:
```json
{
  "result": [
    {
      "type": "CNAME",
      "name": "yoursampledomaindns1",
      "content": "UUID.cfargotunnel.com"
    },
    {
      "type": "A",
      "name": "yoursampledomaindns2",
      "content": "1.2.3.4"
    }
  ],
  "success": true
}
```

---

## 🚀 Final Test

- Launch app via `node index.js` or `pm2`
- Navigate to `https://yourdomain`
- Page shows:
  - HTTP Headers
  - Cloudflare Proxy/Tunnel info
  - DNS Records via Cloudflare API

✅ Everything is working as expected.
