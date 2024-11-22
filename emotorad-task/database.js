const sqlite3 = require('sqlite3').verbose();

try {
    // Create an in-memory database (or use a file-based DB for persistence)
    const db = new sqlite3.Database(':memory:', (err) => {
        if (err) {
            console.error('Failed to connect to SQLite database:', err.message);
            return;
        }
        console.log('Connected to the in-memory SQLite database.');
    });

    // Initialize the Contact table
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS Contact (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phoneNumber TEXT,
                email TEXT,
                linkedId INTEGER,
                linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')),
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                deletedAt DATETIME
            );
        `, (err) => {
            if (err) {
                console.error('Failed to create Contact table:', err.message);
            } else {
                console.log('Database initialized with Contact table.');
            }
        });
    });

    module.exports = db; // Export the database connection
} catch (error) {
    console.error('Error setting up the database:', error);
    process.exit(1); // Exit the process if the database setup fails
}
