const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database'); // Import database connection

const app = express();

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Define a simple route for testing
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Define the /identify endpoint
app.post('/identify', (req, res) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: "Email or phoneNumber is required" });
    }

    const query = `
        SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?
    `;

    db.all(query, [email, phoneNumber], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        if (rows.length === 0) {
            // Create new primary contact
            const insertQuery = `
                INSERT INTO Contact (email, phoneNumber, linkPrecedence) VALUES (?, ?, 'primary')
            `;
            db.run(insertQuery, [email, phoneNumber], function (err) {
                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }
                return res.json({
                    primaryContactId: this.lastID,
                    emails: [email],
                    phoneNumbers: [phoneNumber],
                    secondaryContactIds: []
                });
            });
        } else {
            // Handle existing contacts logic
            let primaryContact = rows.find(row => row.linkPrecedence === 'primary');
            let secondaryContacts = rows.filter(row => row.linkPrecedence === 'secondary');

            if (!primaryContact) {
                primaryContact = rows[0];
                db.run(
                    `UPDATE Contact SET linkPrecedence = 'primary' WHERE id = ?`,
                    [primaryContact.id]
                );
            }

            const emails = new Set(rows.map(row => row.email).filter(Boolean));
            const phoneNumbers = new Set(rows.map(row => row.phoneNumber).filter(Boolean));
            const secondaryIds = secondaryContacts.map(row => row.id);

            return res.json({
                primaryContactId: primaryContact.id,
                emails: Array.from(emails),
                phoneNumbers: Array.from(phoneNumbers),
                secondaryContactIds: secondaryIds
            });
        }
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
