import { customerBaseUrl } from "../../modules/apiConstants.js";
import { customerListBody } from "../../modules/domCaching.js";
import { hideSidebars } from "../../modules/navigation.js";
import fetchController from "../../modules/fetchController.js";
import { PHONE_CONFIG } from './phone-input.js';

/* --------------- Customer Section ----------------- */

async function checkExistingNumber(phoneNumber) {
  try {
    const response = await fetchController.fetch(
      'checkNumber', 
      `${customerBaseUrl}/check-number?number=${encodeURIComponent(phoneNumber)}`
    );
    return response.exists;
  } catch (error) {
    console.error("Check number error:", error);
    throw new Error("Failed to check phone number");
  }
}

async function createCustomer(event) {
    event.preventDefault();
    const form = document.querySelector("#add-customer-form");
    const phoneInput = document.getElementById('phone-number');
    const nameInput = form.querySelector("[name='name']");
    
    // Validate name
    if (!nameInput.value.trim()) {
      nameInput.setCustomValidity('Name is required');
      nameInput.reportValidity();
      return;
    }

    // Validate and clean phone number
    const cleanedNumber = PHONE_CONFIG.cleanNumber(phoneInput.value);
    const fullNumber = `+254${cleanedNumber}`; // Don't add space after country code
    
    if (!PHONE_CONFIG.isValidNumber(cleanedNumber)) {
        phoneInput.setCustomValidity(PHONE_CONFIG.ERROR_MESSAGE);
        phoneInput.reportValidity();
        return;
    }

    try {
      // Check for duplicate number
      const exists = await checkExistingNumber(fullNumber);
      if (exists) {
        phoneInput.setCustomValidity('This phone number is already registered');
        phoneInput.reportValidity();
        return;
      }

      const response = await fetchController.fetch('createCustomer', `${customerBaseUrl}/new`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",      
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          number: fullNumber
        }),
      });
      
      if (response) {
        form.reset();
        hideSidebars();
        await fetchCustomers();
      }
    } catch (error) {
      console.error("Create customer error:", error);
      alert(`Failed to create customer: ${error.message}`);
    }
}

async function fetchCustomers(url = customerBaseUrl) {
  try {
    const customers = await fetchController.fetch('customers', url);
    if (customers) {
      updateCustomerList(customers);
    }
  } catch (error) {
    console.error("Fetch customers error:", error);
    alert("Error fetching customers: " + error.message);
  }
}

async function deleteCustomer(customerId) {
  try {
    const deleted = await fetchController.fetch(
      'deleteCustomer',
      `${customerBaseUrl}/${encodeURIComponent(customerId)}`,
      { method: "DELETE" }
    );
    if (deleted !== null) {
      await fetchCustomers();
    }
  } catch (error) {
    console.error("Delete customer error:", error);
    alert("Error deleting customer: " + error.message);
  }
}

// Update customer list UI
async function updateCustomerList(customers) {
  if (!Array.isArray(customers)) {
    console.error('Invalid customers data');
    return;
  }

  customerListBody.innerHTML = ""; // Clear current list

  // Render customer rows
  customers.forEach((customer) => {
    if (!customer?.number) return;
    
    // Remove any extra country code before formatting
    const number = customer.number.replace(/^\+?254/, '');
    const displayNumber = PHONE_CONFIG.formatFullNumber(number);
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${customer.name || ''}</td>
      <td>${displayNumber}</td>
      <td>${customer.orderCount || 0}</td>
      <td><button class="delete-btn" data-id="${customer.id}">Delete</button></td>
    `;
    customerListBody.appendChild(row);
  });
}

export { createCustomer, fetchCustomers, deleteCustomer, updateCustomerList };