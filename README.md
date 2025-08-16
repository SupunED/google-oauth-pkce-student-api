# Student API + Google OAuth 2.0 (Authorization Code + PKCE)

This project demonstrates how to **secure an Express API and an HTML+JS client using Google OAuth 2.0 with Authorization Code + PKCE**.  
It includes a backend (`student-api`) that protects API routes with Google ID tokens, and a frontend (`student-client`) that allows students to log in with Google and perform CRUD-like actions on a “students” resource.

---

## 🚀 Learning Outcomes
By completing this project, you will learn to:
- Configure **Google OAuth 2.0** for a web app and explain each setting.
- Implement **Authorization Code + PKCE** in a browser client.
- Securely **exchange authorization codes** for tokens on a Node.js server (using the client secret safely).
- **Verify Google ID tokens (RS256/JWKS)** and protect Express API routes.
- Perform authenticated **GET/POST** requests on a `/students` resource.

---

## 📂 Project Structure
```text
my-oauth-project/
├── student-api/         # Express backend (API + OAuth exchange)
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── student-client/      # HTML + JS client
    ├── index.html
    ├── index.js
    └── pkce.js

```
## Prerequisites
- Node.js **v18+** (for built-in `fetch` in Node).
- A Google account with access to **Google Cloud Console**.
- Terminal/PowerShell and a code editor (VS Code).
- Basic knowledge of **OAuth 2.0 flows**.

---

## Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create/select a project.
2. Navigate to **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: *Student OAuth App*
   - Scopes: `openid`, `profile`, `email`
   - Add your Google account as a **Test User**.
3. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins:  
     ```
     http://localhost:5500
     ```
   - Authorized redirect URIs:  
     ```
     http://localhost:5500/callback
     ```
4. Copy the **Client ID** and **Client Secret**.

⚠️ **Why must redirect URIs match exactly?**  
Google enforces exact matches to prevent malicious apps from intercepting the authorization response.

---

## Backend Setup
Inside `student-api/`, create a `.env` file:

```env
PORT=4000
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
REDIRECT_URI=http://localhost:5500/callback
```
Install dependencies:

```bash
cd student-api
npm init -y
npm i express cors dotenv jsonwebtoken jwks-rsa
```
## Run and Setup

Start backend API:
```bash
cd student-api
node server.js
```

Start frontend client (port 5500):
```bash
cd ../student-client
npx serve -s -l 5500
```

Open browser at:
```
http://localhost:5500
```


