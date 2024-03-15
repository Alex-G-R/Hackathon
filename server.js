const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "users"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

// Route to serve the login.html file
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if both username and password are provided
    if (!username || !password) {
        return res.status(400).send('Both username and password are required.');
    }

    // Query the database to check if the user exists
    pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('Internal server error.');
        }

        // Check if any rows are returned
        if (results.length > 0) {
            res.send('Login successful!');
        } else {
            res.status(401).send('Invalid username or password.');
        }
    });

    res.redirect('/profile');
});

// Route to serve the login.html file
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', (req, res) => {
    let sql = `INSERT INTO users (username, password, xp) VALUES ('${username}', '${password}','${0}')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        res.redirect('/login');
    });
});

// Route to serve other HTML files
// Example: http://localhost:3000/other-page.html
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `profile.html`));
});

// Catch-all route for handling 404 errors
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
