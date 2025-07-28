# 🌐 Lupharos Origin Server – Full Installation Guide

### By Kemal Artıkarslan

---

## 📌 1. Domain & DNS Setup

### 1.1 Purchase Domain
Buy `a domain` from a registrar like Namecheap, GoDaddy, or Google Domains.

### 1.2 Move DNS to Cloudflare
- Add the domain to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Replace registrar's nameservers with Cloudflare's
- Wait for propagation

### 1.3 Prepare your Endpoint Server

This guide explains how to set up a basic Ubuntu server on AWS using EC2, attach an Elastic IP (EIP), and configure necessary ports (80, 443, 3000) for web and Node.js applications.

-✅ Step 1: Launch an EC2 Ubuntu Server

1. Sign in to [AWS Console](https://console.aws.amazon.com/).
2. Go to **EC2** service.
3. Click **Launch Instance**.
4. Use the following configuration:

| Setting           | Value                         |
|------------------|-------------------------------|
| Name             | `MyUbuntuServer`              |
| Amazon Machine Image (AMI) | Ubuntu Server 22.04 LTS |
| Instance Type    | `t3.micro` (Free Tier)         |
| Key Pair         | Create new or use existing     |
| Network Settings | Create new Security Group      |

---

-✅ Step 2: Open Required Ports in Security Group

In the **Security Group** configuration:

| Type        | Protocol | Port Range | Source         |
|-------------|----------|------------|----------------|
| SSH         | TCP      | 22         | My IP          |
| HTTP        | TCP      | 80         | 0.0.0.0/0      |
| HTTPS       | TCP      | 443        | 0.0.0.0/0      |
| Custom TCP  | TCP      | 3000       | 0.0.0.0/0      |

> ✅ Tip: You can restrict port 3000 to your IP for security, e.g., `x.x.x.x/32`
> 🧩 **Note:**  
> If your Cloudflare Tunnel (Argo Tunnel) is configured successfully, you **won’t need to open ports 80, 443, or 3000** in your Security Group.  
> 
> The tunnel will establish an **outbound-only encrypted connection** to Cloudflare, allowing secure public access to your internal services **without exposing any ports to the internet**.
>
> This greatly improves your security posture by avoiding direct inbound traffic to your server.
---
-✅ Step 3: Essential Package Installation (English)

1.sudo apt update && sudo apt upgrade -y

2.Install Nginx (web server)
sudo apt install nginx -y

3.Install Certbot (optional, for HTTPS)
sudo apt install certbot python3-certbot-nginx -y

4.Install curl (required for Node.js setup)
sudo apt install curl -y

5.Install Node.js (LTS version) and npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

6.Install PM2 (to keep Node.js app running in background)
sudo npm install -g pm2

---

-✅ Step 4: Allocate and Attach an Elastic IP

1. Go to **EC2 > Elastic IPs**.
2. Click **Allocate Elastic IP**.
3. After allocation, select the EIP and click **Associate Elastic IP**.
4. Choose your EC2 instance.

---

-✅ Step 5: Connect to Your Server

From your terminal:

```bash
ssh -i "your-key.pem" ubuntu@<your-elastic-ip>
```

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
```
Please check the config file to use right yaml or yml file.
sudo nano /etc/systemd/system/cloudflared.service
[Service]
TimeoutStartSec=0
Type=notify
ExecStart=/usr/bin/cloudflared --no-autoupdate --config /etc/cloudflared/config.yml tunnel run
Restart=on-failure
RestartSec=5s
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
