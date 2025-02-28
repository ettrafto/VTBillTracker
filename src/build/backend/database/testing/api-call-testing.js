//Pulling all bills

// Define the API URL
const url = "https://legislature.vermont.gov/api/v1/bill/list?Biennium=2026&Body=All&Status=All";

// Define headers with Bearer authentication
const headers = {
  "Authorization": "Bearer 21dd2a54151e46e484dd2694a0778e99"
};

// Make the request
fetch(url, { headers })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json(); // Parse JSON response
  })
  .then(data => {
    // Extract the bills array from the response
    const billsArray = data.bills;

    // Log the array
    console.log("Bills Array:", billsArray);

    // Example: Parse the array
    billsArray.forEach(bill => {
      console.log(`Bill Number: ${bill.billNumber}`);
      console.log(`Title: ${bill.title}`);
      console.log(`Status: ${bill.status}`);
      console.log("---");
    });
  })
  .catch(error => {
    console.error("Error fetching data:", error); // Handle errors
  });



/*
// Single Bill Request

// Define the API base URL
const baseUrl = "https://legislature.vermont.gov/api/v1/bill/id";

// Function to fetch a single bill by its ID
function fetchBillById(billId) {
  // Construct the full URL with query parameters
  const url = `${baseUrl}?Biennium=2026&billId=${billId}`;

  // Define headers with Bearer authentication
  const headers = {
    "Authorization": "Bearer 21dd2a54151e46e484dd2694a0778e99"
  };

  // Make the request
  fetch(url, { headers })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse JSON response
    })
    .then(data => {
      // Log the full bill details
      console.log("Bill Details:", JSON.stringify(data, null, 2));

      // Example: Access specific properties
      console.log(`Bill Number: ${data.billNumber}`);
      console.log(`Title: ${data.title}`);
      console.log(`Status: ${data.status}`);
    })
    .catch(error => {
      console.error("Error fetching bill details:", error); // Handle errors
    });
}

// Example usage: Replace 'H.1' with the desired bill ID
const dynamicBillId = "H1"; // Replace this value with the desired bill ID
fetchBillById(dynamicBillId);

*/
