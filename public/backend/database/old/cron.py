#!/usr/bin/env python3

import re
import os
import csv
import datetime
import json
from bs4 import BeautifulSoup
import threading
import time
from playwright.sync_api import sync_playwright, TimeoutError

# Variables
base_site = 'https://legislature.vermont.gov'
skip_file = 'bills_without_local_sponsors.txt'

# Get the current biennium
def get_current_biennium():
    current_year = datetime.date.today().year
    if current_year % 2 == 0:
        biennium_start_year = current_year
    else:
        biennium_start_year = current_year + 1
    print(f"Determined biennium start year: {biennium_start_year}")
    return biennium_start_year

# Save the updated data back to the JSON file
def save_json_data(data):
    print(f"Saving data to {output_file} with {len(data)} entries")
    with open(output_file, 'w') as json_file:
        json.dump(data, json_file, indent=4)
    print("Data saved successfully")

# Timeout handler function
def timeout_handler():
    print("Scraping timeout reached. Writing collected data to file...")
    save_json_data(bills_json)
    os._exit(0)

# Load skipped bill numbers from file
def load_skipped_bills(skip_file):
    if os.path.exists(skip_file):
        with open(skip_file, 'r') as f:
            skipped_bills = set(line.strip() for line in f)
        print(f"Loaded {len(skipped_bills)} bill numbers to skip.")
    else:
        skipped_bills = set()
    return skipped_bills

# Add a bill number to the skip file
def add_to_skip_file(skip_file, bill_num):
    with open(skip_file, 'a') as f:
        f.write(f"{bill_num}\n")
    print(f"Added bill {bill_num} to skip list.")

# Set the timeout duration in seconds
timeout_duration = 7200  # e.g., 3600 seconds = 60 minutes

# Start the timeout thread
print(f"Starting timeout thread with duration {timeout_duration} seconds")
timeout_thread = threading.Timer(timeout_duration, timeout_handler)
timeout_thread.start()

year = str(get_current_biennium())  # Defines the biennium year used in the URL
print(f"Using biennium year: {year}")

house_prefix = ['H', 'S', 'HCR', 'SR']
min_bills = 1
max_bills = 999
bill_base_site = base_site + '/bill/status/' + year + '/'
names_doc = 'names_reps'
title_pattern = 'Reps.'
bills_json = []  # List to store JSON objects

# Load existing data if available
output_file = 'bills_data.json'
if os.path.exists(output_file):
    with open(output_file, 'r') as json_file:
        existing_data = json.load(json_file)
    print(f"Loaded existing data with {len(existing_data)} bills")
else:
    existing_data = []
    print("No existing data found, starting fresh")

# Load skipped bills
skipped_bills = load_skipped_bills(skip_file)

# Function to check if a bill already exists and if new actions are present
def update_bill_data(bill_num, actions):
    print(f"Checking if bill {bill_num} exists in existing data")
    for bill in existing_data:
        if bill['bill_number'] == bill_num:
            print(f"Found existing bill {bill_num}")
            existing_actions = bill['actions']
            new_actions = [action for action in actions if action not in existing_actions]
            if new_actions:
                print(f"Found {len(new_actions)} new actions for bill {bill_num}")
                bill['actions'].extend(new_actions)
            else:
                print(f"No new actions found for bill {bill_num}")
            return True
    print(f"Bill {bill_num} not found in existing data")
    return False

def fetch_bill_page(page, bill_site, retries=3):
    """Fetch the bill page with retry logic"""
    for attempt in range(retries):
        try:
            print(f"Attempting to access bill page: {bill_site} (Attempt {attempt + 1}/{retries})")
            page.goto(bill_site, timeout=90000)  # Increased timeout to 90 seconds
            print("Page loaded, waiting for 5 seconds")
            page.wait_for_timeout(5000)  # Wait for 5 seconds for the page to fully load
            return page.content()  # Return the page content if successful
        except TimeoutError as e:
            print(f"Timeout error accessing bill page {bill_site}: {e}")
            if attempt < retries - 1:
                print("Retrying...")
                time.sleep(5)  # Wait before retrying
            else:
                print(f"Failed to load bill page {bill_site} after {retries} attempts. Skipping.")
                return None

print("Initializing Playwright")
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # First iterate through the House bills
    for page_prefix in list(house_prefix):
        print(f"Processing bills with prefix: {page_prefix}")
        if 'H' in page_prefix:
            names_doc = 'names_reps'
            title_pattern = 'Rep.'
        elif 'S' in page_prefix:
            names_doc = 'names_senators'
            title_pattern = 'Sen.'

        # Iterate through bill pages
        for page_number in range(min_bills, max_bills):
            bill_num = page_prefix + str(page_number)

            # Skip bill if it's already in the skip file
            if bill_num in skipped_bills:
                print(f"Skipping bill {bill_num} as it doesn't have local sponsors.")
                continue

            bill_site = bill_base_site + bill_num
            html_content = fetch_bill_page(page, bill_site)

            if html_content is None:
                continue  # Skip to the next bill if the page couldn't be loaded

            soup = BeautifulSoup(html_content, 'html.parser')
            print(f"Parsed HTML content for bill {bill_num}")

            # Create list of sponsors for each bill
            sponsors_tags = soup.find('dl', {'class': 'summary-table'}).find_all('li')
            topic = soup.find('h4', {'class': 'charge'})
            sponsors = []
            for sponsor in sponsors_tags:
                if title_pattern in sponsor.text:
                    sponsor = sponsor.text
                    sponsor = sponsor.replace(str(title_pattern), '')
                    sponsor = sponsor.strip()
                    sponsors.append(sponsor)
                elif "Committee" in sponsor.text:
                    sponsors.append(sponsor.text)
            print(f"Found {len(sponsors)} sponsors for bill {bill_num}")

            # Compare list of sponsors to list of area reps
            with open(names_doc + ".txt") as f:
                reps = [line.rstrip() for line in f]
            try:
                local = set(reps).intersection(sponsors)
            except Exception as e:
                print(f"Error while checking local sponsors: {e}")
            else:
                if local:
                    print(f"Local sponsors found for bill {bill_num}: {local}")
                    actions = []
                    rows = soup.select('#bill-detailed-status-table tbody tr')
                    for row in rows[:50]:  # Limit to the first 50 rows
                        body = row.find_all('td')[0].text.strip()
                        date = row.find_all('td')[1].text.strip()
                        status = row.find_all('td')[5].text.strip()
                        actions.append({'body': body, 'date': date, 'action': status})
                    print(f"Found {len(actions)} actions for bill {bill_num}")

                    # Update existing data or add new data
                    if not update_bill_data(bill_num, actions):
                        result = {
                            'bill_number': bill_num,
                            'bill_page': bill_site,
                            'local_sponsors': list(set(reps).intersection(sponsors)),
                            'description': topic.text if topic else "No description available",
                            'actions': actions
                        }
                        print(f"Adding new bill {bill_num} to data")
                        bills_json.append(result)
                else:
                    print(f"No local sponsors found for bill {bill_num}")
                    add_to_skip_file(skip_file, bill_num)  # Add bill to the skip file

    print("Closing browser")
    browser.close()

# Combine existing data with new data
updated_data = existing_data + [bill for bill in bills_json if not update_bill_data(bill['bill_number'], bill['actions'])]

print("Saving updated data to file")
save_json_data(updated_data)
print(f"JSON data has been written to {output_file}")

# Cancel the timeout if the script completes in time
print("Canceling timeout thread")
timeout_thread.cancel()
