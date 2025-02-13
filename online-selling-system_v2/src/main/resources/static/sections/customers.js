import { hideSidebars } from "../modules/utility.js";
import { customerBaseUrl } from "../modules/constants.js";
import { customerListBody } from "../modules/domCaching.js";

/* --------------- Customer Section ----------------- */

// Modified createCustomer function with proper validation and error handling
async function createCustomer(event) {
    event.preventDefault();
    const form = document.querySelector("#add-customer-form");
    const phoneInput = document.getElementById('phone-number');
    
    // Validate phone number before submission
    const cleanedNumber = phoneInput.value.replace(/\D/g, '');
    if (cleanedNumber.length !== 12 || !cleanedNumber.startsWith('254')) {
      phoneInput.setCustomValidity('Please enter a valid Kenyan number (254XXXXXXXXX)');
      phoneInput.reportValidity();
      return;
    }
  
    const formData = new FormData(form);
    const newCustomer = {
      name: formData.get("name"),
      number: cleanedNumber, // Store the cleaned number
      // Include other fields as needed
    };
  
    try {
      const response = await fetch(`${customerBaseUrl}/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create customer");
      }
      
      // Reset form and update UI
      form.reset();
      hideSidebars();
      await fetchCustomers();
      
    } catch (error) {
      if (error.name === 'TypeError') {
        console.error("Network error:", error);
        alert("Network error: Please check your internet connection.");
      } else {
        console.error("Create customer error:", error);
        alert("Error creating customer: " + error.message);
      }
    }
  }


  let customerFetchController; // Declare a controller for customer fetch requests
  
  // Fetch customers without pagination
  async function fetchCustomers(url = customerBaseUrl) {
    if (customerFetchController && !customerFetchController.signal.aborted) {
      customerFetchController.abort(); // Abort the previous request if it exists and not already aborted
    }
    customerFetchController = new AbortController(); // Create a new controller
    const signal = customerFetchController.signal;
  
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error("Failed to fetch customers");
      const customers = await response.json();
  
      customerListBody.innerHTML = ""; // Clear current list
  
      // Render customer rows
      customers.forEach((customer) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${customer.name}</td>
          <td>${customer.number}</td>
          <td>${customer.orderCount || 0}</td>
          <td><button class="delete-btn" data-id="${customer.id}">Delete</button></td>
        `;
        customerListBody.appendChild(row);
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
        alert("Error fetching customersUI",error);
      }
    }
  }
  
  // Delete customer
async function deleteCustomer(customerId) {
    try {
      const response = await fetch(
        `${customerBaseUrl}/${encodeURIComponent(customerId)}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete customer");
      fetchCustomers();
    } catch (error) {
      console.error(error);
      alert("Error deleting customer");
    }
  }
  
  export{createCustomer,fetchCustomers,deleteCustomer};