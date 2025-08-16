require('dotenv').config({path: require('path').join(__dirname, '.env')});

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const jwks = jwksClient({
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    cache: true, cacheMaxEntries: 5, cacheMaxAge: 10 * 60 * 1000
});

const app = express();

app.use(cors(
    {
        origin: 'http://localhost:5500',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
));

app.use(express.json())
app.use(express.urlencoded({extended: false}));

app.get('/', (_req, res) =>{
    res.send('Student API Running');
});

app.post('/oauth/exchange', async (req, res) => {
    try {
            const { code, code_verifier } = req.body;
                if (!code || !code_verifier) {
                    return res.status(400).json({ error: 'Missing code or code_verifier' });
            }
            const body = new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.REDIRECT_URI,
                code_verifier
            });
            const r = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
            });
            const data = await r.json();
            if (!r.ok) return res.status(400).json(data);
            res.json(data);

        } catch (e) {
            res.status(500).json({ error: 'server_error' });
        }
});





const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, ()=> console.log(`API listening at http://localhost:${PORT}`));



function getSigningKey(header, callback) {
    jwks.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        callback(null, key.getPublicKey());
    });
}

function verifyGoogleIdToken(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

    jwt.verify(token, getSigningKey, {
        algorithms: ['RS256'],
        issuer: ['https://accounts.google.com', 'accounts.google.com']
    }, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        if (decoded.aud !== process.env.GOOGLE_CLIENT_ID) {
            return res.status(401).json({ error: 'Invalid audience' });
        }
        req.user = decoded;
        next();
    });

}

const students = []

app.get('/students', verifyGoogleIdToken, (_req, res) => {
    res.json(students);
})

app.post('/students', verifyGoogleIdToken, (req, res) => {
    const { id, name, age } = req.body;
    if (!id || !name || typeof age === 'undefined') {
        return res.status(400).json({ error: 'id, name, and age are required' });
    }
    if (students.some(s => s.id === String(id))) {
        return res.status(409).json({ error: 'Student with this id already exists' });
    }
    const n = Number(age);
    if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ error: 'age must be a non-negative number' });
    }
    const student = { id: String(id), name: String(name), age: n };
    students.push(student);
    res.status(201).json(student);
 });