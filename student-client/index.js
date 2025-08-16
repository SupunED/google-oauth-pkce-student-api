// ===== CONFIG =====
const clientId = "41734392268-rli3lk4nlfcdp6gptqvd9ndm5neahl6s.apps.googleusercontent.com"; // <-- replace with your Client ID
const redirectUri = "http://localhost:5500/callback";
const authEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
const API_BASE = "http://localhost:43123"; 
// change if your API runs on a different port (e.g., 4000)
// ===== ELEMENTS =====
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const userSpan = document.getElementById('user');
const actionsEl = document.getElementById('actions');
const outEl = document.getElementById('out');
const sidEl = document.getElementById('sid');
const snameEl = document.getElementById('sname');
const sageEl = document.getElementById('sage');
const addBtn = document.getElementById('add');
const listBtn = document.getElementById('list');
let idToken = null;
// ===== HELPERS =====
function parseJwt(token) {
try {
    // Base64URL decode payload
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
} catch (e) {
    console.error('Invalid JWT payload', e);
    return null;
}
}
function setLoggedInUI(name) {
    userSpan.textContent = name ? `Hello ${name}` : 'Logged in';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    actionsEl.style.display = 'block';
}

function setLoggedOutUI() {
    userSpan.textContent = '';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    actionsEl.style.display = 'none';
}
// ===== LOGIN (PKCE + redirect to Google) =====
loginBtn.addEventListener('click', async () => {
    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem('code_verifier', verifier);
    const nonce = (crypto.randomUUID && crypto.randomUUID()) ||
    String(Date.now());
    sessionStorage.setItem('nonce', nonce);
    const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    nonce,
    prompt: 'consent'
    });
    window.location = `${authEndpoint}?${params.toString()}`;
});
// ===== CALLBACK: exchange code on YOUR server (returns id_token) =====
async function handleCallbackIfNeeded() {
if (location.pathname !== '/callback') return;
    const qs = new URLSearchParams(location.search);
    const code = qs.get('code');
    const verifier = sessionStorage.getItem('code_verifier');
    if (!code || !verifier) {
        document.body.textContent = 'Missing authorization code or PKCE verifier.';
        return;
    }
    let resp, data;
    try {
        resp = await fetch(`${API_BASE}/oauth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, code_verifier: verifier })
        });
    } catch (e) {document.body.textContent = 'Cannot reach API for token exchange.';
        console.error(e);
        return;
    }
    try {
        data = await resp.json();
    } catch {
        const text = await resp.text();
        console.error('Non-JSON from /oauth/exchange:', resp.status, text);
        document.body.textContent = `Exchange failed (${resp.status}). See 
        console.`;
        return;
    }
    if (!resp.ok || !data.id_token) {
    console.error('Exchange error:', data);
    document.body.textContent = 'Token exchange failed. Check API logs and Google OAuth settings.';
    return;
    }
    // Optional nonce check
    try {
    const payload = parseJwt(data.id_token);
    const expected = sessionStorage.getItem('nonce');
    if (payload && expected && payload.nonce && payload.nonce !== expected) {
    document.body.textContent = 'Security check failed (nonce mismatch).';
    return;
    }
    } catch { /* ignore */ }
    // Persist token for page reloads
    localStorage.setItem('id_token', data.id_token);
    // Clean URL and show main UI
    history.replaceState({}, document.title, '/');
    location.reload();
}
// ===== RESTORE SESSION ON LOAD =====
function restoreSession() {
    const stored = localStorage.getItem('id_token');
    if (stored) {
        idToken = stored;
        const payload = parseJwt(stored);
        const name = payload && (payload.name || payload.given_name ||
        payload.email || 'User');
        setLoggedInUI(name);
    } else {
        setLoggedOutUI();
    }
}
// ===== LOGOUT =====
logoutBtn.addEventListener('click', () => {
localStorage.removeItem('id_token');
sessionStorage.removeItem('code_verifier');
sessionStorage.removeItem('nonce');
idToken = null;
setLoggedOutUI();
});
// ===== API CALLS =====
addBtn.addEventListener('click', async () => {
    if (!idToken) return alert('Please log in first.');
    const payload = {
        id:
        sidEl.value.trim(),
        name: snameEl.value.trim(),
        age: Number(sageEl.value)
    };
    const r = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    outEl.textContent = await r.text();
});

listBtn.addEventListener('click', async () => {
    if (!idToken) return alert('Please log in first.');
    const r = await fetch(`${API_BASE}/students`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
    });
    outEl.textContent = await r.text();
});

// ===== BOOTSTRAP =====
handleCallbackIfNeeded().then(restoreSession);