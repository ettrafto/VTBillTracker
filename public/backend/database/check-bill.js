import API_KEY from './SECRET.js'; // Import the API key from the SECRET.js file


(async () => {
    //const fetch = (await import('node-fetch')).default;
    const sqlite3 = require('sqlite3').verbose();

// API Details
const API_BASE_URL = "https://legislature.vermont.gov/api/v1";

// Open SQLite database
const db = new sqlite3.Database('./legislature_data.db');

function fetchBillList() {
    const url = "https://legislature.vermont.gov/api/v1/bill/list?Biennium=2026&Body=All&Status=All";

    // Define headers with Bearer authentication
    const headers = {
      "Authorization": "Bearer 21dd2a54151e46e484dd2694a0778e99"
    };

  //console.log("Request URL and Headers:", url, headers); // Debugging request

  return fetch(url, { headers })
    .then(response => {
      //console.log("Response Status:", response.status, response.statusText); // Debugging response
      if (!response.ok) {
        return response.json().then(err => {
          //console.error("Response Error:", err);
          return [];
        });
      }
      return response.json();
    })
    .then(data => {
      //console.log("Raw Response Data:", data);
      const billsArray = data.bills || [];
      //console.log("Fetched Bills Array:", billsArray);
      return billsArray;
    })
    .catch(error => {
      //console.error("Error fetching bill list:", error);
      return [];
    });

}  

// Fetch single bill details by ID
function fetchSingleBill(billId) {
  const url = `${API_BASE_URL}/bill/id?Biennium=2026&billId=${billId}`;
  const headers = {
    "Authorization": `Bearer ${API_KEY}`,
  };

  return fetch(url, { headers })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse JSON response
    })
    .then(data => {
      return data.bills[0];
    })
    .catch(error => {
      //console.error(`Error fetching bill with ID ${billId}:`, error);
      return null; // Return null in case of an error
    });
}

// Check if the bill exists in the database
function isBillUpToDate(billNumber, lastUpdated) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT last_updated FROM BILL WHERE bill_number = ?`,
      [billNumber],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(false); // Bill does not exist in DB
        resolve(row.last_updated >= lastUpdated); // Compare timestamps
      }
    );
  });
}

// Insert or update a bill and its related data
async function insertOrUpdateBill(billData) {
    return new Promise((resolve, reject) => {
      const lastUpdated = new Date().toISOString();
      //console.log("Bill Data:", JSON.stringify(billData, null, 2)); // Debug bill data
  
      db.run(
        `INSERT INTO BILL (bill_number, date_introduced, passed, title, type, vetoed, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(bill_number) DO UPDATE SET
         date_introduced = excluded.date_introduced,
         passed = excluded.passed,
         title = excluded.title,
         type = excluded.type,
         vetoed = excluded.vetoed,
         last_updated = excluded.last_updated`,
        [
          billData.BillNumber,
          billData.StatusHistory[0]?.StatusDate || null,
          billData.Passed || null,
          billData.Title || null,
          billData.BillType || null,
          billData.Vetoed || null,
          lastUpdated,
        ],
        function (err) {
          if (err) {
            //console.error("Error inserting/updating bill:", err.message);
            return reject(err);
          }
  
          const billId =  billData.BillNumber;
  
        // Insert statuses into the STATUS table
        const statuses = billData.StatusHistory || [];
        statuses.forEach((status) => {
        // Query to check if the status already exists
        db.get(
            `SELECT 1 FROM STATUS 
            WHERE bill_id = ? AND chamber = ? AND status_date = ? AND location = ? AND full_status = ?`,
            [
            billId,
            status.Chamber || null,
            status.StatusDate || null,
            status.Location || null,
            status.FullStatus || null,
            ],
            (err, row) => {
            if (err) {
                //console.error(`Error checking existing status: ${err.message}`);
                return;
            }

            if (!row) {
                // If the status does not exist, insert it
                db.run(
                `INSERT INTO STATUS (bill_id, chamber, status_date, location, full_status)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    billId,
                    status.Chamber || null,
                    status.StatusDate || null,
                    status.Location || null,
                    status.FullStatus || null,
                ],
                (err) => {
                    if (err) {
                    //console.error(`Error inserting status: ${err.message}`);
                    } else {
                    //console.log(`Inserted new status for bill ${billId}: ${status.FullStatus}`);
                    }
                }
                );
            } else {
                //console.log(`Status already exists for bill ${billId}: ${status.FullStatus}`);
            }
            }
        );
        });

  
// Insert records into the SPONSORED table
const sponsors = billData.Sponsors || [];
sponsors.forEach((sponsor) => {
  db.get(
              `SELECT id FROM SPONSOR WHERE last_name = ? AND first_name = ?`,
              [
                sponsor.LastName || null,
                sponsor.FirstName || null,
              ],
    (err, row) => {
      if (err) {
        //console.error(`Error finding sponsor: ${err.message}`);
        return;
      }
      if (row) {
        db.run(
          `INSERT INTO SPONSORED (bill_id, sponsor_id, sponsor_type)
           VALUES (?, ?, ?)`,
          [billId, row.id, sponsor.SponsorType || null],
          (err) => {
              if (err);
              /*console.error(
                `Error inserting into SPONSORED table: ${err.message}`
              );*/
            }
        );
      }
    }
  );
});

          // Update the BILL table with the most recent status
        db.get(
            `SELECT id, status_date, full_status FROM STATUS WHERE bill_id = ? ORDER BY status_date DESC LIMIT 1`,
            [billId],
            (err, row) => {
            if (err) {
                /*console.error(
                `Error fetching most recent status for bill ${billId}: ${err.message}`
                );*/
                return reject(err);
            }
        
            if (row) {
                    db.run(
                    `UPDATE BILL SET last_recorded_action_id = ?, last_updated = ? WHERE bill_number = ?`,
                    [row.id, lastUpdated, billData.BillNumber],
                    (err) => {
                        if (err) {
                        /*console.error(
                            `Error updating last recorded action for bill ${billId}: ${err.message}`
                        );*/
                        return reject(err);
                        }
                        /* console.log(
                        `Updated last recorded action for bill ${billId} with status: ${row.full_status}`
                        ); */
                        resolve();
                }
                );
            } else {
                /* console.warn(
                `No statuses found for bill ${billId}, skipping last recorded action update.`
                ); */
                resolve();
            }
            }
        );
  
          resolve(); // Resolve the promise after all operations are complete      
        }
      );
    });
  }
  

// Main function to check for updates and insert new data
async function main() {
  try {
    //console.log("Fetching bill list...");
    const billList = await fetchBillList();

    //console.log('billList', billList);

    for (const bill of billList.flat()) {
      //console.log(`Checking bill: ${bill.BillNumber}`);
      //console.log({ bill });

      const upToDate = await isBillUpToDate(bill.BillNumber, new Date().toISOString());
      if (!upToDate) {
        //console.log(`Bill ${bill.BillNumber} is out of date or missing. Fetching details...`);
        const fullBillData = await fetchSingleBill(bill.BillNumber);
        if (fullBillData) {
          await insertOrUpdateBill(fullBillData);
          //console.log(`Bill ${bill.BillNumber} updated.`);
        }
      } else {
        //console.log(`Bill ${bill.BillNumber} is up to date.`);
      }

      // **Add a 5-second delay before making the next API request**
      //console.log(`Waiting 5 seconds before the next request...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log("Database update complete.");
  } catch (err) {
    //console.error("Error during update:", err);
  } finally {
  }
}


// Run the main function
main();

main().then(() => {
  db.run(
    `
    UPDATE BILL
    SET last_recorded_action_id = (
      SELECT id
      FROM STATUS
      WHERE STATUS.bill_id = BILL.bill_number
      ORDER BY status_date DESC
      LIMIT 1
    ),
    last_updated = ?
    WHERE EXISTS (
      SELECT 1
      FROM STATUS
      WHERE STATUS.bill_id = BILL.bill_number
    )
    `,
    [new Date().toISOString()],
    (err) => {
      if (err) {
        //console.error("Error updating last recorded action for all bills:", err.message);
      } else {
        //console.log("Successfully updated last recorded actions for all bills.");
      }
    }
  );

  db.close(); // Close the database after all updates are done
});


})();

