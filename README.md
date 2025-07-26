# KA - Cloudflare Origin Server

This is a simple Node.js-based origin web server used for the Cloudflare technical assignment.

## Features

- Returns **all HTTP request headers** at the root endpoint `/`
- Built with **Express.js**
- Ready to be proxied via **Cloudflare CDN**
- Supports **TLS 1.2+** and **Full-Strict SSL mode**
- Deployed using **Render.com**

---

## Header Details of API Endpoint

### `GET /`

Returns all incoming request headers as JSON.

**Example Response:**

```json
{
  "host": "lupharos.com",
  "user-agent": "curl/7.88.1",
  "accept": "*/*"
}
```

---

## 🛠️ Deployment (Local)

To run the server locally:

```bash
npm install
npm start
```

To run the server on AWS:
Use Ubuntu 22.04
sudo apt update
sudo apt install nodejs npm -y
git clone https://github.com/senin-user/cloudflare-origin-server.git
cd cloudflare-origin-server
npm install
Then visit: [http://localhost:3000]

---

## 🚀 Deployment (Live)

The application is deployed and publicly accessible via Render.com:

🌐 **Live URL:** [https://cloudflare-origin-server.onrender.com](https://cloudflare-origin-server.onrender.com)  
*(Replace with your actual deployed URL if different)*

---

## 📌 Used in Cloudflare Technical Assignment For:

✅ Origin Web Server Setup  
✅ Cloudflare Proxy Integration  
✅ TLS Configuration (Full-Strict + TLS 1.2+)  
✅ Argo Tunnel Setup (`tunnel.example.com`)  
✅ Cloudflare Worker Redirect Logic (User-Agent based redirect)  
✅ Secure Access Control for protected path (`/secure`) without Workers

---

## 📄 License

MIT
