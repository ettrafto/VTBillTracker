const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const path = require('path');

// Define the database and table
const dbPath = path.join('./', 'legislature_data.db');
const db = new sqlite3.Database(dbPath);

const excelFilePath = path.join('./', 'allReps.xlsx');
const tableName = 'SPONSOR';

// Step 1: Create the SQLite Table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT,
        last_name TEXT,
        district TEXT,
        party TEXT,
        chamber TEXT
    )`);
});

// Function to split names into first and last names
function splitName(fullName) {
    const nameParts = fullName.replace(/".*?"/g, "").trim().split(/\s+/); // Remove nicknames in quotes and split by whitespace
    const firstName = nameParts[0] || null;
    const lastName = nameParts[nameParts.length - 1] || null;
    return { firstName, lastName };
}

// Step 2: Read the Excel File
const workbook = xlsx.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0]; // Read the first sheet
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Step 3: Insert Data into SQLite Table
db.serialize(() => {
    const insertQuery = `INSERT INTO ${tableName} (first_name, last_name, district, party, chamber) VALUES (?, ?, ?, ?, ?)`;

    data.forEach((row) => {
        const { firstName, lastName } = splitName(row.name); // Split the name
        db.run(insertQuery, [firstName, lastName, row.district, row.party, row.chamber], (err) => {
            if (err) {
                console.error('Error inserting data:', err.message);
            } else {
                console.log('Data inserted:', { firstName, lastName, ...row });
            }
        });
    });
});

// Close the database connection
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});
