import { customerBaseUrl } from "../../modules/apiConstants.js";
import { customerListBody } from "../../modules/domCaching.js";
import { hideSidebars } from "../../modules/navigation.js";
import fetchController from "../../modules/fetchController.js";
import { PHONE_CONFIG } from './phone-input.js';

/* --------------- Customer Section ----------------- */

async function checkExistingNumber(phoneNumber) {
    try {
        // Encode the number properly for URL
        const encodedNumber = encodeURIComponent(phoneNumber);
        
        const response = await fetchController.fetch(
            'checkNumber',
            `${customerBaseUrl}/check-number?number=${encodedNumber}`,
            { method: 'GET' }
        );
        
        return response === true;
    } catch (error) {
        console.error('Error checking phone number:', error);
        return false;
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

        // User input: "712345678"
    // const cleanedNumber = PHONE_CONFIG.cleanNumber(phoneInput.value);
        // cleanedNumber = "712345678"
    // const fullNumber = `+254${cleanedNumber}`;
        // fullNumber = "+254712345678"
        
    // Validate and clean phone number
    const cleanedNumber = PHONE_CONFIG.cleanNumber(phoneInput.value);
    const fullNumber = `+254${cleanedNumber}`; // Don't add space after country code
    
    if (!PHONE_CONFIG.isValidNumber(cleanedNumber)) {
        phoneInput.setCustomValidity(PHONE_CONFIG.ERROR_MESSAGE);
        phoneInput.reportValidity();
        return;
    }

    try {
      // Add logging to debug the number being checked
      console.log('Checking number:', fullNumber);
      const exists = await checkExistingNumber(fullNumber);
      console.log('Number exists?', exists);
      
      if (exists) {
        phoneInput.setCustomValidity('This phone number is already registered');
        phoneInput.reportValidity();
        return alert("This phone number is already registered");
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
    // Check if customer exists and has orders
    const customer = await fetchController.fetch(
      'getCustomer',
      `${customerBaseUrl}/id/${customerId}`
    );
    
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Confirm deletion based on order count
    const confirmMessage = customer.orderCount > 0
      ? `This customer has ${customer.orderCount} orders. Are you sure you want to delete?`
      : 'Are you sure you want to delete this customer?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Attempt deletion
    const deleted = await fetchController.fetch(
      'deleteCustomer',
      `${customerBaseUrl}/${encodeURIComponent(customerId)}`,
      { method: "DELETE" }
    );

    if (deleted) {
      await fetchCustomers();
    }
  } catch (error) {
    console.error(`Error deleting customer ${customerId}:`, error);
    
    const errorMessages = {
      'foreign key constraint': "Unable to delete: Customer has associated orders that must be deleted first",
      'not found': "Customer not found. The list will be refreshed.",
      'default': "Failed to delete customer. Please try again or contact support if the problem persists."
    };

    const message = error.status === 404
      ? errorMessages['not found']
      : error.message?.toLowerCase().includes('foreign key')
        ? errorMessages['foreign key constraint']
        : errorMessages['default'];

    alert(message);
    
    if (error.status === 404) {
      await fetchCustomers();
    }
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