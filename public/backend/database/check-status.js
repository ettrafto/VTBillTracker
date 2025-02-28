(async () => {
  const sqlite3 = require('sqlite3').verbose();
  // If you need `node-fetch` in Node 18+, you can remove the await import line below,
  // since fetch is built-in. If you're using older Node versions, keep it:
  const fetch = (await import('node-fetch')).default;

  // --- CONFIG ---
  const API_BASE_URL = "https://legislature.vermont.gov/api/v1";
  const API_KEY = "21dd2a54151e46e484dd2694a0778e99"; 

  // --- OPEN DB ---
  const db = new sqlite3.Database('./legislature_data.db');

  // --- HELPER: Fetch single bill details by ID ---
  function fetchSingleBill(billId) {
    // This version reflects the URL-building style from your newer snippet
    const url = `${API_BASE_URL}/bill/id?Biennium=2026&billId=${billId}`;

    // Define headers with Bearer authentication
    const headers = {
      "Authorization": `Bearer ${API_KEY}`,
    };

    // Log request details for debugging
    console.log("Request URL:", url);
    console.log("Request Headers:", headers);

    return fetch(url, { headers })
      .then(response => {
        console.log("Response Status:", response.status, response.statusText);
        if (!response.ok) {
          // Attempt to parse the error body for debugging
          return response.json().then(err => {
            console.error("Response Error:", err);
            return null;
          });
        }
        return response.json();
      })
      .then(data => {
        console.log("Raw Response Data:", data);
        // We expect data.bills to be an array with a single bill object
        return data && data.bills ? data.bills[0] : null;
      })
      .catch(error => {
        console.error(`Error fetching bill with ID ${billId}:`, error);
        return null;
      });
  }

  // --- MAIN LOGIC ---
  async function main() {
    try {
        // 1. Get all bills from the local DB
        const billsInDB = await getAllBillsFromDB();

        // 2. For each bill, fetch all statuses from the API
        for (const billRow of billsInDB) {
            const { bill_number } = billRow;
            console.log(`\nChecking statuses for Bill: ${bill_number}`);

            // 2a. Fetch the full Bill data from the API
            const fullBillData = await fetchSingleBill(bill_number);
            if (!fullBillData) {
                console.log(`No data returned from API for Bill ${bill_number}. Skipping...`);
                continue;
            }

            const statuses = fullBillData.StatusHistory || [];
            if (statuses.length === 0) {
                console.log(`No statuses found from API for Bill ${bill_number}.`);
                continue;
            }

            // 2b. Insert only the new/missing statuses
            await insertMissingStatuses(db, bill_number, statuses);

            // 2c. Update the Bill table’s last_recorded_action_id if we got new statuses
            await updateLastRecordedAction(db, bill_number);

            // ** Add a delay of 5 seconds before the next API request **
            console.log(`Waiting 5 seconds before the next request...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log("\nStatus update script complete.");
    } catch (err) {
        console.error("Error in main() function:", err);
    } finally {
        db.close();
    }
}


  // --- UTILITY FUNCTIONS ---

  // Fetch the list of all existing bills in the local DB
  function getAllBillsFromDB() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT bill_number FROM BILL`, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows || []);
      });
    });
  }

  /**
   * Compare the statuses from the API to what's already in your STATUS table.
   * Insert any that don't exist.
   */
  function insertMissingStatuses(db, billNumber, statuses) {
    return new Promise((resolve, reject) => {
      // 1. Get all existing statuses for this bill from DB
      db.all(
        `SELECT chamber, status_date, location, full_status
         FROM STATUS
         WHERE bill_id = ?`,
        [billNumber],
        (err, rows) => {
          if (err) {
            return reject(err);
          }

          // 2. Build a set of existing statuses for quick lookup
          const existingStatusSet = new Set(
            rows.map(row => JSON.stringify({
              chamber:      row.chamber,
              status_date:  row.status_date,
              location:     row.location,
              full_status:  row.full_status
            }))
          );

          // 3. Loop through each API status and insert if it's not in the DB
          let pendingCount = statuses.length;
          if (pendingCount === 0) return resolve();

          statuses.forEach((status) => {
            const statusKey = JSON.stringify({
              chamber:     status.Chamber || null,
              status_date: status.StatusDate || null,
              location:    status.Location || null,
              full_status: status.FullStatus || null
            });

            if (!existingStatusSet.has(statusKey)) {
              // Insert new status
              db.run(
                `INSERT INTO STATUS (bill_id, chamber, status_date, location, full_status)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  billNumber,
                  status.Chamber || null,
                  status.StatusDate || null,
                  status.Location || null,
                  status.FullStatus || null
                ],
                (err2) => {
                  if (err2) {
                    console.error(`Error inserting status: ${err2.message}`);
                  } else {
                    console.log(`Inserted new status for bill ${billNumber}: ${status.FullStatus}`);
                  }
                  decrementCount();
                }
              );
            } else {
              // Already exists
              console.log(`Status already exists for bill ${billNumber}: ${status.FullStatus}`);
              decrementCount();
            }
          });

          function decrementCount() {
            pendingCount -= 1;
            if (pendingCount === 0) {
              resolve();
            }
          }
        }
      );
    });
  }

  // Updates Bill’s last_recorded_action_id to reflect the most recent status
  function updateLastRecordedAction(db, billNumber) {
    return new Promise((resolve, reject) => {
      // Query for the newest status by date
      db.get(
        `
        SELECT id, status_date, full_status
        FROM STATUS
        WHERE bill_id = ?
        ORDER BY status_date DESC
        LIMIT 1
        `,
        [billNumber],
        (err, row) => {
          if (err) {
            console.error(`Error fetching latest status for ${billNumber}: ${err.message}`);
            return reject(err);
          }
          if (!row) {
            // No statuses
            console.warn(`No statuses found for ${billNumber}. Cannot update last_recorded_action_id.`);
            return resolve();
          }

          const { id, full_status } = row;
          const newUpdated = new Date().toISOString();

          // Update the Bill row
          db.run(
            `UPDATE BILL
             SET last_recorded_action_id = ?,
                 last_updated = ?
             WHERE bill_number = ?`,
            [id, newUpdated, billNumber],
            (err2) => {
              if (err2) {
                console.error(`Error updating Bill table for ${billNumber}: ${err2.message}`);
                return reject(err2);
              }
              console.log(`Updated last_recorded_action_id for Bill ${billNumber} to status: ${full_status}`);
              resolve();
            }
          );
        }
      );
    });
  }

  // --- RUN MAIN ---
  main();
})();
