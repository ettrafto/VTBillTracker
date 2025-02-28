const sqlite3 = require('sqlite3').verbose();

// Open SQLite database
const db = new sqlite3.Database('./legislature_data.db');

// Example JSON response
const billResponse = {
  query: {
    offset: 0,
    count: 1,
    total: 1,
  },
  bills: [
    {
      ActNo: "",
      Biennium: "2026",
      BillNumber: "H.1",
      BillType: "",
      ChamberName: "House",
      Documents: [],
      LastRecordedAction: {
        Chamber: "House",
        StatusDate: "1/9/2025",
        Location: "In Committee",
        FullStatus: "Read first time and referred to the Committee on [Government Operations and Military Affairs]",
      },
      RollCallVotes: [],
      Sponsors: [
        {
          Honorific: "Rep.",
          FirstName: "Martin",
          LastName: "LaLonde",
          ChamberCode: "H",
          SponsorType: "Lead Sponsor",
        },
        {
          Honorific: "Rep.",
          FirstName: "Carol",
          LastName: "Ode",
          ChamberCode: "H",
          SponsorType: "CoSponsor",
        },
        {
          Honorific: "Rep.",
          FirstName: "Laura",
          LastName: "Sibilia",
          ChamberCode: "H",
          SponsorType: "CoSponsor",
        },
      ],
      StatusHistory: [
        {
          Chamber: "House",
          StatusDate: "1/9/2025",
          Location: "In Committee",
          FullStatus: "Read first time and referred to the Committee on [Government Operations and Military Affairs]",
        },
      ],
      Title: "An act relating to accepting and referring complaints by the State Ethics Commission",
    },
  ],
};

// Extract bill data
const bill = billResponse.bills[0];

// Insert data into BILL table
db.run(
  `INSERT INTO BILL (bill_number, body, date_introduced, passed, title, type, vetoed, last_updated) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    bill.BillNumber,
    bill.ChamberName,
    bill.StatusHistory[0]?.StatusDate || null,
    null, // Passed
    bill.Title,
    bill.BillType,
    null, // Vetoed
    new Date().toISOString(), // Last Updated
  ],
  function (err) {
    if (err) {
      console.error("Error inserting into BILL table:", err.message);
      return;
    }

    const billId = this.lastID; // Get the ID of the inserted bill

    // Insert last recorded action into STATUS table
    const lastAction = bill.LastRecordedAction;
    db.run(
      `INSERT INTO STATUS (bill_id, chamber, status_date, location, full_status) 
       VALUES (?, ?, ?, ?, ?)`,
      [billId, lastAction.Chamber, lastAction.StatusDate, lastAction.Location, lastAction.FullStatus],
      function (err) {
        if (err) {
          console.error("Error inserting into STATUS table:", err.message);
          return;
        }

        const statusId = this.lastID; // Get the ID of the inserted status

        // Update the BILL table with the foreign key reference to the last recorded action
        db.run(
          `UPDATE BILL SET last_recorded_action_id = ? WHERE id = ?`,
          [statusId, billId],
          function (err) {
            if (err) {
              console.error("Error updating BILL table with last action ID:", err.message);
              return;
            }
          }
        );
      }
    );

    // Insert sponsors into SPONSOR and SPONSORED tables
    bill.Sponsors.forEach((sponsor) => {
      db.run(
        `INSERT INTO SPONSOR (last_name, first_name, district, chamber_code) 
         VALUES (?, ?, ?, ?)`,
        [sponsor.LastName, sponsor.FirstName, null, sponsor.ChamberCode],
        function (err) {
          if (err) {
            console.error("Error inserting into SPONSOR table:", err.message);
            return;
          }

          const sponsorId = this.lastID; // Get the ID of the inserted sponsor

          // Insert into SPONSORED table
          db.run(
            `INSERT INTO SPONSORED (bill_id, sponsor_id, sponsor_type) 
             VALUES (?, ?, ?)`,
            [billId, sponsorId, sponsor.SponsorType],
            function (err) {
              if (err) {
                console.error("Error inserting into SPONSORED table:", err.message);
              }
            }
          );
        }
      );
    });
  }
);

// Close the database
db.close();
