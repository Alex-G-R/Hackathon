const express = require('express');
const session = require('express-session');
const path = require('path');
const axios = require('axios');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the directory for views
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Set up session management
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

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
    connection.query('SELECT * FROM account WHERE login = ? AND password = ?', [username, password], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('Internal server error.');
        }

        // Check if any rows are returned
        if (results.length > 0) {


            req.session.login = results[0].login;
            req.session.full_name = results[0].full_name;
            req.session.date_of_birth = results[0].date_of_birth;
            req.session.email = results[0].email;
            req.session.descr = results[0].descr;
            res.redirect('/profile');
        } else {
            res.status(401).send('Invalid username or password.');
        }
    });
});

// Route to serve the login.html file
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', (req, res) => {
    const { username, password, full_name, email, date_of_birth, descr } = req.body; // Extract username and password from request body

    let sql = `INSERT INTO account (login, password, full_name, email, date_of_birth, descr, xp) VALUES ('${username}', '${password}', '${full_name}', '${email}', '${date_of_birth}', '${descr}', '${0}')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
    res.redirect('/login');
});

// Route to serve other HTML files
// Example: http://localhost:3000/other-page.html
// Route to serve the profile page
app.get('/profile', (req, res) => {
    // Check if the user is authenticated
    if (!req.session.login) {
        return res.status(401).send('Unauthorized');
    }

    // Fetch user information from the database using the login stored in session
    connection.query('SELECT * FROM account WHERE login = ?', [req.session.login], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('Internal server error.');
        }

        // Check if user data is found
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        // Render the profile view with user data
        res.render('profile', { user: results[0] });
    });
});

app.get('/level', (req, res) => {
    // Check if the user is authenticated
    if (!req.session.login) {
        return res.status(401).send('Unauthorized');
    }

    // Fetch user information from the database using the login stored in session
    connection.query('SELECT * FROM account WHERE login = ?', [req.session.login], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('Internal server error.');
        }

        // Check if user data is found
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        // Render the profile view with user data
        res.render('level', { user: results[0] });
    });
});

// Route to serve the posts.html file
app.get('/addpost', (req, res) => {
    connection.query('SELECT * FROM account WHERE login = ?', [req.session.login], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('Internal server error.');
        }

        // Check if user data is found
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        // Render the profile view with user data
        res.render('addpost', { user: results[0] });
    });
});

app.post('/addpost', (req, res) => {
    const { author, content } = req.body; // Extract author and content from request body

    async function makePostRequest(path, queryObj) {
        axios.post(path, queryObj).then(
            (response) => {
                let sql = `INSERT INTO posts (author, content) VALUES ('${author}', '${content}')`;
                connection.query(sql, function (err, result) {
                    if (err) throw err;
                    console.log("post added");
                });
                let result = response.data;
                console.log(result);
                let sql2 = `UPDATE account SET xp = xp + 15 WHERE login = '${req.session.login}';`;
                connection.query(sql2, (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return;
                    }
                    console.log('XP incremented successfully');
                });
                res.redirect('/posts');
            },
            (error) => {
                console.log(error);
            }
        );
    }

    queryObj = { name: content };
    try {
        makePostRequest('http://127.0.0.1:5000/test', queryObj);
    } catch (err) {
        console.log(err);
    }
},
);



// Route to serve the posts.html file
app.get('/addcomment', (req, res) => {
    connection.query('SELECT * FROM account WHERE login = ?', [req.session.login], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('Internal server error.');
        }

        // Check if user data is found
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        let sql2 = `UPDATE account SET xp = xp + 15 WHERE login = '${req.session.login}';`;
        connection.query(sql2, (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                return;
            }
            console.log('XP incremented successfully');
        });

        // Render the profile view with user data
        res.render('addcomment', { user: results[0] });
    });
});

app.post('/addcomment', (req, res) => {
    const postId = req.query.postId;
    const { author, content } = req.body; // Extract author and content from request body

    let sql = `INSERT INTO comments (post_id, author, content) VALUES ('${postId}', '${author}', '${content}')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("comment added");
    });
    res.redirect('/posts');
});

// Define the route for liking a post
app.post('/like-post/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        let sql = `UPDATE posts SET reactions = reactions + 1 WHERE id = ${postId};`

        connection.query(sql, function (err, result) {
            if (err) throw err;
            console.log("post liked");
        });
        // Respond with a success message
        res.status(200).json({ message: 'Post liked successfully' });
        const sql2 = `UPDATE account SET xp = xp + 15 WHERE login = (SELECT author FROM posts WHERE id = "${postId}" LIMIT 1);`;
        connection.query(sql2, (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                return;
            }
            console.log('XP incremented successfully');
        });
    } catch (error) {
        console.error('Failed to like the post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route to serve the posts.html file
app.get('/posts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'posts.html'));
});

// API Endpoints
// API Endpoints
app.get('/posts-data', (req, res) => {
    let { page, limit } = req.query;

    // Convert page and limit to integers
    page = parseInt(page);
    limit = parseInt(limit);

    // Check if page and limit are valid numbers
    if (isNaN(page) || isNaN(limit)) {
        res.status(400).json({ error: 'Invalid page or limit' });
        return;
    }

    const offset = (page - 1) * limit;
    connection.query('SELECT * FROM posts ORDER BY id DESC LIMIT ?, ?', [offset, limit], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

app.get('/comments/:postId', (req, res) => {
    const { postId } = req.params;
    connection.query('SELECT * FROM comments WHERE post_id = ?', postId, (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});

// Catch-all route for handling 404 errors
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
