const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs'); // built-in Node.js module — no install needed

const app = express();
const PORT = 3000;
const DB_FILE = 'users.json'; // Our "database" is just a JSON file

// ─── SIMPLE JSON DATABASE ─────────────────────────────────────────────────────
// Reads users from users.json file
function readUsers() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Saves users array back to users.json file
function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: false
}));

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.redirect('/login'));

// ── REGISTER ──
app.get('/register', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Register</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 360px; }
        h2 { text-align: center; color: #2d3748; margin-bottom: 24px; }
        label { display: block; color: #4a5568; font-size: 0.9rem; margin-bottom: 4px; }
        input { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 16px; font-size: 1rem; }
        button { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #5a67d8; }
        .link { text-align: center; margin-top: 16px; font-size: 0.9rem; color: #718096; }
        .link a { color: #667eea; text-decoration: none; }
        .error { background: #fed7d7; color: #c53030; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 0.9rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Create Account</h2>
        ${req.query.error ? `<div class="error">${req.query.error}</div>` : ''}
        <form method="POST" action="/register">
          <label>Username</label>
          <input type="text" name="username" placeholder="Enter username" required />
          <label>Email</label>
          <input type="email" name="email" placeholder="Enter email" required />
          <label>Password</label>
          <input type="password" name="password" placeholder="Enter password" required />
          <button type="submit">Register</button>
        </form>
        <div class="link">Already have an account? <a href="/login">Login</a></div>
      </div>
    </body>
    </html>
  `);
});

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const users = readUsers();

  // Check if username or email already exists
  const exists = users.find(u => u.username === username || u.email === email);
  if (exists) {
    return res.redirect('/register?error=Username or email already exists.');
  }

  // Hash the password before saving
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Add new user and save
  users.push({ id: Date.now(), username, email, password: hashedPassword });
  saveUsers(users);

  res.redirect('/login?success=Account created! Please login.');
});

// ── LOGIN ──
app.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 360px; }
        h2 { text-align: center; color: #2d3748; margin-bottom: 24px; }
        label { display: block; color: #4a5568; font-size: 0.9rem; margin-bottom: 4px; }
        input { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 16px; font-size: 1rem; }
        button { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #5a67d8; }
        .link { text-align: center; margin-top: 16px; font-size: 0.9rem; color: #718096; }
        .link a { color: #667eea; text-decoration: none; }
        .error   { background: #fed7d7; color: #c53030; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 0.9rem; }
        .success { background: #c6f6d5; color: #276749; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 0.9rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Welcome Back</h2>
        ${req.query.error   ? `<div class="error">${req.query.error}</div>`     : ''}
        ${req.query.success ? `<div class="success">${req.query.success}</div>` : ''}
        <form method="POST" action="/login">
          <label>Username</label>
          <input type="text" name="username" placeholder="Enter username" required />
          <label>Password</label>
          <input type="password" name="password" placeholder="Enter password" required />
          <button type="submit">Login</button>
        </form>
        <div class="link">No account? <a href="/register">Register</a></div>
      </div>
    </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.redirect('/login?error=User not found.');
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.redirect('/login?error=Incorrect password.');
  }

  req.session.user = { id: user.id, username: user.username, email: user.email };
  res.redirect('/dashboard');
});

// ── DASHBOARD ──
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login?error=Please login first.');
  }

  const { username, email } = req.session.user;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dashboard</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .card { background: white; padding: 40px 60px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 10px; }
        p  { color: #718096; margin-bottom: 6px; }
        .badge { display: inline-block; background: #48bb78; color: white; padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; margin-top: 16px; }
        .logout { display: inline-block; margin-top: 24px; padding: 10px 24px; background: #e53e3e; color: white; border-radius: 6px; text-decoration: none; }
        .logout:hover { background: #c53030; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Welcome, ${username}!</h1>
        <p>Email: ${email}</p>
        <div class="badge">Logged In</div><br/>
        <a class="logout" href="/logout">Logout</a>
      </div>
    </body>
    </html>
  `);
});

// ── LOGOUT ──
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login?success=Logged out successfully.');
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`App running at http://localhost:${PORT}`);
  console.log('Routes: /register  /login  /dashboard');
});
