CREATE TABLE BILL (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  bill_number TEXT UNIQUE, 
  date_introduced TEXT, 
  last_recorded_action_id INTEGER,  -- New foreign key reference to statuses
  passed TEXT, 
  title TEXT, 
  type TEXT, 
  vetoed TEXT,
  last_updated TEXT,
  FOREIGN KEY (last_recorded_action_id) REFERENCES STATUS(id)  -- Foreign key

);
CREATE TABLE STATUS (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER,
  chamber TEXT,
  status_date TEXT,
  location TEXT,
  full_status TEXT,
  FOREIGN KEY (bill_id) REFERENCES BILL(id)  -- Foreign key reference to bills
);

CREATE TABLE SPONSORED (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id TEXT,
  sponsor_id INTEGER,
  sponsor_type TEXT,
  FOREIGN KEY (bill_id) REFERENCES BILL(id),
  FOREIGN KEY (sponsor_id) REFERENCES SPONSOR(id)
);

CREATE TABLE SPONSOR (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  last_name TEXT,
  district TEXT,
  chamber TEXT,
  party TEXT
);

--INSERT INTO BILL (bill_number, body, date_introduced, passed, title, type, vetoed) 
--VALUES ('HB100', 'House', '2023-01-15', 'House', 'An Act Relating to Education', 'Bill', 'No');


--INSERT INTO STATUS (bill_id, chamber, status_date, location, full_status) 
--VALUES (1, 'House', '2023-01-16', 'House Floor', 'Introduced in House');
--INSERT INTO STATUS (bill_id, chamber, status_date, location, full_status) 
--VALUES (1, 'House', '2023-01-20', 'House Committee', 'Referred to Committee');

-- Let’s say the second status is the most recent and should be the LastRecordedAction. 
-- Get its id (in this case, it's 2) and update the bills table

--UPDATE bills 
--SET last_recorded_action_id = 2 
--WHERE id = 1;




-- You can now join the bills table with the statuses table to get the full details of the last recorded action for each bill.
/* SELECT 
  b.bill_number, 
  b.title, 
  s.full_status AS last_recorded_action
FROM 
  bills b
JOIN 
  statuses s ON b.last_recorded_action_id = s.id
WHERE 
  b.id = 1; */
