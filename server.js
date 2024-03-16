const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');


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

    // Query the database to retrieve XP values
    connection.query('SELECT id, xp FROM account', (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return;
        }

        // Loop through the results
        results.forEach((row) => {
            const { id, xp } = row;

            // Determine the rank based on XP
            let rank;
            if (xp < 50) {
                rank = 'Świeżak';
            } else if (xp < 100) {
                rank = 'Młody entuzjasta';
            } else if (xp < 200) {
                rank = 'Zaangażowany';
            } else if (xp < 350) {
                rank = 'Stały bywalec';
            } else if (xp < 500) {
                rank = 'Wschodząca gwiazda';
            } else {
                rank = 'Wielki mistrz';
            }

            // Update the rank in the database
            connection.query('UPDATE account SET rank = ? WHERE id = ?', [rank, id], (updateError, updateResults) => {
                if (updateError) {
                    console.error('Error updating rank in database:', updateError);
                    return;
                }
                console.log(`Updated rank for record with ID ${id}`);
            });
        });
    });
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


function startPython() {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['app.py']);
        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Python process exited with code ${code}`));
            }
        });
    });
}

app.post('/addpost', async (req, res) => {
    const { author, content } = req.body;

    const filePath = `./comments/plik.txt`;

    // Write content into the file
    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return;
        }
        console.log(`Content has been written to the file "${filePath}" successfully.`);
    });

    try {
        await startPython(); // Wait for the Python script to finish

        //Read the file after the Python script finishes
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            output: process.stdout,
            terminal: false
        });

        let bot_status;
        rl.once('line', (line) => {
            bot_status = line;
            rl.close(); // Close the readline interface after reading the first line

            // Continue with further logic based on bot_status
            if (bot_status === 'false') {
                // Insert post into the database
                let sql = `INSERT INTO posts (author, content) VALUES ('${author}', '${content}')`;
                connection.query(sql, function (err, result) {
                    if (err) throw err;
                    console.log("post added");
                });

                // Update XP for the user
                let sql2 = `UPDATE account SET xp = xp + 15 WHERE login = '${req.session.login}';`;
                connection.query(sql2, (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return;
                    }
                    console.log('XP incremented successfully');
                });

                // Clear the file (remove its contents)
                fs.writeFile(filePath, '', (err) => {
                    if (err) {
                        console.error('Error clearing file:', err);
                        return;
                    }
                    console.log(`The file "${filePath}" has been successfully cleared.`);
                });

                res.redirect('/posts');
            }
            else if (bot_status === 'true') {
                sql = `INSERT INTO posts (author, content) VALUES ('${author}', '${content}')`;
                connection.query(sql, (err, result) => {
                    if (err) {
                        console.error('Error inserting post:', err);
                        return;
                    }

                    // Update XP for the user
                    let sql2 = `UPDATE account SET xp = xp + 15 WHERE login = '${req.session.login}'`;
                    connection.query(sql2, (err, result) => {
                        if (err) {
                            console.error('Error updating XP:', err);
                            return;
                        }

                        let sql3 = "SELECT * FROM posts ORDER BY id DESC LIMIT 1";
                        connection.query(sql3, (err, postid_comm) => {
                            if (err) {
                                console.error('Error selecting post:', err);
                                return;
                            }
                            const postId_comm = postid_comm[0].id;

                            // Insert a comment related to the last post into the comments table
                            let sql4 = `INSERT INTO comments (post_id, author, content) VALUES ('${postId_comm}', 'Bot kozak', 'Twój komentarz jest obraźliwy! Tracisz XP')`;
                            connection.query(sql4, (err, result) => {
                                if (err) {
                                    console.error('Error inserting comment:', err);
                                    return;
                                }

                                // Clear the file (remove its contents)
                                fs.writeFile(filePath, '', (err) => {
                                    if (err) {
                                        console.error('Error clearing file:', err);
                                        return;
                                    }
                                    console.log(`The file "${filePath}" has been successfully cleared.`);
                                    res.redirect('/posts');
                                });
                            });
                        });
                    });
                });
            }
        });

        //Listen for errors
        rl.on('error', (err) => {
            console.error('Error reading file:', err);
            // Handle error as needed
        });
    } catch (error) {
        console.log(error);
        // Handle error as needed
    }
});



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
        res.render('posts', { user: results[0] });
    });
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
