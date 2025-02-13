/* --------------- Constants ----------------- */
const customerBaseUrl = "/api/customers";
const productBaseUrl = "/api/products";
const orderBaseUrl = "/api/orders";

/* --------------- DOM Caching ----------------- */
const customerListBody = document.querySelector("#customer-list tbody");
const productSelection = document.getElementById("product-selection");
const orderListBody = document.querySelector("#order-list tbody");
const productListBody = document.querySelector("#product-list tbody");

/* --------------- Utility Functions ----------------- */

// Debounce utility to limit rapid function calls
function debounce(func, delay) {
  let debounceTimer;
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Throttle function to limit the rate of function calls
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function (...args) {
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// UI Helper: Hide all sidebars
function hideSidebars() {
  document.querySelectorAll(".sidebar").forEach((sidebar) => {
    sidebar.classList.remove("active");
  });
}

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

/* --------------- Order Section ----------------- */

async function createOrder(event) {
  event.preventDefault();
  const form = document.querySelector("#add-order-form");
  const formData = new FormData(form);
  const newOrder = {
    customerId: formData.get("select-customer"),
    dateOfEvent: formData.get("date-of-event"),
    status: formData.get("status"),
    products: [], // Populate with product details
  };

  // Collect product details
  document.querySelectorAll(".product-entry").forEach((entry) => {
    newOrder.products.push({
      productId: entry.querySelector(".product-select").value,
      quantity: entry.querySelector(".product-quantity").value,
      price: entry.querySelector(".product-price").value,
    });
  });

  try {
    const response = await fetch(`${orderBaseUrl}/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrder),
    });

    if (!response.ok) throw new Error("Failed to create order");

    // Reset form and update UI
    form.reset();
    productSelection.innerHTML = ''; // Removes all product entries
    hideSidebars();
    await fetchOrders();
  } catch (error) {
    console.error("Create order error:", error);
    alert("Error creating order: " + error.message);
  }
}

async function fetchOrders(url = orderBaseUrl) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch orders");
    const orders = await response.json();
    const orderListBody = document.querySelector("#order-list tbody");
    orderListBody.innerHTML = ""; // Clear current list

    orders.forEach((order) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.customerName}</td>
        <td>${order.customerNumber}</td>
        <td>${order.status}</td>
        <td>${order.date}</td>
        <td>${order.products.map(p => p.name).join(", ")}</td>
        <td>${order.totalAmount}</td>
        <td>${order.paidAmount}</td>
        <td>${order.remainingAmount}</td>
        <td><button class="delete-btn" data-id="${order.id}">Delete</button></td>
      `;
      orderListBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    alert("Error fetching orders");
  }
}

async function deleteOrder(orderId) {
  try {
    const response = await fetch(
      `${orderBaseUrl}/${encodeURIComponent(orderId)}`,
      { method: "DELETE" }
    );
    if (!response.ok) throw new Error("Failed to delete order");
    fetchOrders();
  } catch (error) {
    console.error(error);
    alert("Error deleting order");
  }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`${orderBaseUrl}/${encodeURIComponent(orderId)}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!response.ok) throw new Error("Failed to update order status");
    fetchOrders();
  } catch (error) {
    console.error(error);
    alert("Error updating order status");
  }
}

// Fetch products and populate the product selection dropdown with error handling
async function fetchProducts() {
  try {
    const response = await fetch(productBaseUrl);
    if (!response.ok) throw new Error("Failed to fetch products");
    const products = await response.json();
    const productSelectElements = document.querySelectorAll(".product-select");

    productSelectElements.forEach(select => {
      select.innerHTML = ""; // Clear existing options
      products.forEach(product => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = product.name;
        select.appendChild(option);
      });
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    alert("Error fetching products");
  }
}

// Fetch orders and render them on the calendar
async function fetchAndRenderOrders() {
  try {
    const response = await fetch(orderBaseUrl);
    if (!response.ok) throw new Error("Failed to fetch orders");
    const orders = await response.json();

    const events = orders.map(order => ({
      title: `${order.customerName} - ${order.status}`,
      start: order.date,
      extendedProps: {
        customerNumber: order.customerNumber,
        products: order.products.map(p => p.name).join(", "),
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        remainingAmount: order.remainingAmount
      }
    }));

    $('#calendar').fullCalendar('removeEvents');
    $('#calendar').fullCalendar('addEventSource', events);
  } catch (error) {
    console.error("Error fetching orders:", error);
    alert("Error fetching orders");
  }
}

// Fetch products and update the product list UI
async function fetchAndRenderProducts() {
  try {
    const response = await fetch(productBaseUrl);
    if (!response.ok) throw new Error("Failed to fetch products");
    const products = await response.json();

    productListBody.innerHTML = ""; // Clear current list

    // Render product rows
    products.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.stock}</td>
        <td>${product.price}</td>
        <td><button class="delete-btn" data-id="${product.id}">Delete</button></td>
      `;
      productListBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    alert("Error fetching products");
  }
}

// Delete product
async function deleteProduct(productId) {
  try {
    const response = await fetch(
      `${productBaseUrl}/${encodeURIComponent(productId)}`,
      { method: "DELETE" }
    );
    if (!response.ok) throw new Error("Failed to delete product");
    fetchAndRenderProducts();
  } catch (error) {
    console.error(error);
    alert("Error deleting product");
  }
}

// Event delegation for delete buttons in the product list
productListBody.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-btn")) {
    const productId = event.target.getAttribute("data-id");
    deleteProduct(productId);
  }
});

/* --------------- Event Listeners ----------------- */

// Event delegation for delete buttons in the customer list
customerListBody.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-btn")) {
    const customerId = event.target.getAttribute("data-id");
    deleteCustomer(customerId);
  }
});

// Event delegation for delete buttons in the order list
document.querySelector("#order-list tbody").addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-btn")) {
    const orderId = event.target.getAttribute("data-id");
    deleteOrder(orderId);
  }
});

// Event delegation for status update buttons in the order list
document.querySelector("#order-list tbody").addEventListener("click", (event) => {
  if (event.target.classList.contains("status-btn")) {
    const orderId = event.target.getAttribute("data-id");
    const newStatus = event.target.getAttribute("data-status");
    updateOrderStatus(orderId, newStatus);
  }
});

// Fetch orders by customer name
async function fetchOrdersByCustomerName(name) {
  try {
    const response = await fetch(`${orderBaseUrl}/name/${encodeURIComponent(name)}`);
    if (!response.ok) throw new Error("Failed to fetch orders by customer name");
    const orders = await response.json();
    updateOrderList(orders);
  } catch (error) {
    console.error("Error fetching orders by customer name:", error);
    alert("Error fetching orders by customer name");
  }
}

// Fetch orders by date
async function fetchOrdersByDate(date) {
  try {
    const response = await fetch(`${orderBaseUrl}/date/${encodeURIComponent(date)}`);
    if (!response.ok) throw new Error("Failed to fetch orders by date");
    const orders = await response.json();
    updateOrderList(orders);
  } catch (error) {
    console.error("Error fetching orders by date:", error);
    alert("Error fetching orders by date");
  }
}

// Update order list UI
function updateOrderList(orders) {
  orderListBody.innerHTML = ""; // Clear current list

  orders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.customerName}</td>
      <td>${order.customerNumber}</td>
      <td>${order.status}</td>
      <td>${order.date}</td>
      <td>${order.products.map(p => p.name).join(", ")}</td>
      <td>${order.totalAmount}</td>
      <td>${order.paidAmount}</td>
      <td>${order.remainingAmount}</td>
      <td><button class="delete-btn" data-id="${order.id}">Delete</button></td>
    `;
    orderListBody.appendChild(row);
  });
}

// Initialize plugins and event listeners after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  const phoneInput = document.getElementById('phone-number');
  
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      let formatted = '';
      
      // Auto-add country code if missing
      if (!value.startsWith('254') && value.length > 0) {
        value = value.startsWith('0') ? '254' + value.substring(1) : '254' + value;
      }
      
      // Limit to 12 digits (254 + 9 digits)
      value = value.substring(0, 12);
      
      // Format the number
      if (value.length > 3) {
        formatted += value.substring(0, 3) + ' ';
        value = value.substring(3);
      }
      
      if (value.length > 0) {
        formatted += value.match(/.{1,3}/g)?.join(' ') || '';
      }
      
      // Update input value
      e.target.value = formatted;
    });
  }

  // Responsive navigation toggle
  const navToggle = document.querySelector(".navbar .icon");
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      const nav = document.getElementById("myTopnav");
      nav.classList.toggle("responsive");
    });
  }

  // Collapsible sections
  document.querySelectorAll(".collapsible").forEach((collapsible) => {
    collapsible.addEventListener("click", function () {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      content.style.display = content.style.display === "block" ? "none" : "block";
    });
  });

  $("#select-customer").select2({
    placeholder: "Select a customer",
    allowClear: true,
    ajax: {
      url: customerBaseUrl,
      dataType: "json",
      delay: 250,
      data: function (params) {
        return { search: params.term };
      },
      processResults: function (data) {
        return {
          results: data.map(customer => ({
            id: customer.id,
            text: customer.name + ' (' + customer.number+')' // Display name and number
          }))
        };
      },
      cache: true
    },
    minimumInputLength: 1,
  });

  // Add product selection fields dynamically
  document.getElementById("add-product").addEventListener("click", debounce(() => {
    const productDiv = document.createElement("div");
    productDiv.classList.add("product-entry");
    productDiv.innerHTML = `
      <select class="product-select" required>
        <!-- Product options will be populated here -->
      </select>
      <input type="number" class="product-quantity" placeholder="Quantity" required>
      <input type="number" class="product-price" placeholder="Price" required>
      <button type="button" class="remove-product">Remove</button>
    `;
    productSelection.appendChild(productDiv);
    $(productDiv)
      .find(".product-select")
      .select2({
        placeholder: "Select a product",
        allowClear: true,
        minimumInputLength: 1,
        ajax: {
          url: `${productBaseUrl}`,
          dataType: 'json',
          delay: 250,
          data: function (params) {
            return {
              searchTerm: params.term
            };
          },
          processResults: function (data) {
            return {

              results: data.map(product => ({
                id: product.id,
                text: product.name || `Product ${product.id}` // Fallback to generic name
              }))
            };
          },
          cache: true
        }
      }).on('select2:select', async function (e) {
        const productId = e.params.data.id;
        try {
          const response = await fetch(`${productBaseUrl}/${productId}`);
          const product = await response.json();
          const entry = e.target.closest('.product-entry');
          if (entry && product.price) {
            entry.querySelector('.product-price').value = product.price;
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        }
      });
  }, 300));

  // Use event delegation for dynamically added "Remove" buttons
  productSelection.addEventListener("click", function (event) {
    if (event.target.matches(".remove-product")) {
      event.target.closest(".product-entry").remove();
    }
  });

  // Initialize FullCalendar
  $("#calendar").fullCalendar({
    header: {
      left: "prev,next today",
      center: "title",
      right: "month,agendaWeek,agendaDay",
    },
    editable: true,
    events: [], // Initially empty, will be populated by fetchAndRenderOrders
    eventRender: function (event, element) {
      if (event.extendedProps.status) {
        element.css(
          "background-color",
          event.extendedProps.status === "pending"
            ? "#f39c12"
            : event.extendedProps.status === "completed"
            ? "#00a65a"
            : "#d9534f"
        );
      }
      element.qtip({
        content: `
          <strong>Customer Number:</strong> ${event.extendedProps.customerNumber}<br>
          <strong>Products:</strong> ${event.extendedProps.products}<br>
          <strong>Total Amount:</strong> ${event.extendedProps.totalAmount}<br>
          <strong>Paid Amount:</strong> ${event.extendedProps.paidAmount}<br>
          <strong>Remaining Amount:</strong> ${event.extendedProps.remainingAmount}
        `,
        style: {
          classes: 'qtip-bootstrap'
        }
      });
    }
  });

  // Initialize FullCalendar with new options
  $("#calendar").fullCalendar({
    header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
    },
    editable: true,
    eventLimit: true,
    events: [],
    dayRender: function(date, cell) {
        // Add modern styling to day cells
        cell.css('min-height', '80px');
        
        // Add event indicators
        const dateStr = date.format('YYYY-MM-DD');
        const events = $('#calendar').fullCalendar('clientEvents', function(event) {
            return event.start.format('YYYY-MM-DD') === dateStr;
        });
        
        if (events.length > 0) {
            const indicator = $('<span class="event-indicator"></span>');
            cell.append(indicator);
        }
    },
    eventRender: function(event, element) {
        // Add modern event styling
        element.css({
            'border-radius': '4px',
            'border': 'none',
            'padding': '4px 8px',
            'margin': '1px 2px'
        });

        // Add event actions
        const actions = $(`
            <div class="event-actions">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
            </div>
        `);
        
        element.append(actions);

        // Event action handlers
        actions.find('.edit').click(function(e) {
            e.stopPropagation();
            // Implement edit functionality
            console.log('Edit event:', event);
        });

        actions.find('.delete').click(function(e) {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this event?')) {
                $('#calendar').fullCalendar('removeEvents', event._id);
                // Add API call to delete event from backend
            }
        });
    },
    eventClick: function(event) {
        // Show event details
        alert(`
            ${event.title}
            Time: ${event.start.format('HH:mm')}
            ${event.description || ''}
        `);
    }
});

// Re-render on window resize
window.addEventListener("resize", debounce(function() {
    $('#calendar').fullCalendar('render');
}, 250));

  // Fetch and render orders on the calendar
  fetchAndRenderOrders();

  // Sidebar toggle for "Add Customer" and "Add Order"
  document.getElementById("open-add-customer-sidebar").addEventListener("click", function () {
    document.getElementById("add-customer-sidebar").classList.add("active");
  });
  document.getElementById("close-add-customer-sidebar").addEventListener("click", function () {
    document.getElementById("add-customer-sidebar").classList.remove("active");
  });
  document.getElementById("open-add-order-sidebar").addEventListener("click", function () {
    document.getElementById("add-order-sidebar").classList.add("active");
  });
  document.getElementById("close-add-order-sidebar").addEventListener("click", function () {
    document.getElementById("add-order-sidebar").classList.remove("active");
  });

  // Sidebar toggle for "Add Product"
  document.getElementById("open-add-product-sidebar").addEventListener("click", function () {
    document.getElementById("add-product-sidebar").classList.add("active");
  });
  document.getElementById("close-add-product-sidebar").addEventListener("click", function () {
    document.getElementById("add-product-sidebar").classList.remove("active");
  });

  // Form submission for adding a product
  document.getElementById("add-product-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const newProduct = {
      name: formData.get("name"),
      stock: formData.get("availability"),
      price: formData.get("price") // Add price field
    };

    try {
      const response = await fetch(`${productBaseUrl}/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) throw new Error("Failed to add product");

      // Reset form and update UI
      form.reset();
      hideSidebars();
      await fetchProducts();
    } catch (error) {
      console.error("Add product error:", error);
      alert("Error adding product: " + error.message);
    }
  });

  // Form submissions
  document.querySelector("#add-customer-form").addEventListener("submit", createCustomer);
  document.getElementById("add-order-form").addEventListener("submit", createOrder);

  let searchCustomerController; // Declare a controller for customer search requests
  const searchCache = new Map(); // Cache for previous search results

  // Show loading spinner
  function showLoadingSpinner() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
      spinner.style.display = "block";
    }
  }

  // Hide loading spinner
  function hideLoadingSpinner() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
      spinner.style.display = "none";
    }
  }

  // Debounced and throttled search for customers
  const searchCustomerInput = document.querySelector("#search-customer");
  if (searchCustomerInput) {
    searchCustomerInput.addEventListener(
      "input",
      debounce(async function (event) {
        const searchValue = event.target.value.trim();
        if (searchValue.length < 3) {
          return; // Minimum character limit before searching
        }

        let url = `${customerBaseUrl}/search?`;

        if (searchCustomerController) {
          searchCustomerController.abort(); // Abort previous request
        }
        searchCustomerController = new AbortController();
        const signal = searchCustomerController.signal;

        if (searchCache.has(searchValue)) {
          updateCustomerList(searchCache.get(searchValue));
          return;
        }

        // Determine if the input is a number or text
        const params = new URLSearchParams();
        if (!isNaN(Number(searchValue))) {
          params.append("number", searchValue);
        } else {
          params.append("name", searchValue);
        }
        url += params.toString();

        try {
          showLoadingSpinner();
          const response = await fetch(url, { signal });
          if (!response.ok) throw new Error("Failed to fetch customers{702}");

          const data = await response.json();
          searchCache.set(searchValue, data);
          updateCustomerList(data);
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error(error);
            alert("Error fetching customers{710}");
          }
        } finally {
          hideLoadingSpinner();
        }
      }, 300)
    );
  }

  // Update customer list UI
  function updateCustomerList(customers) {
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
  }

  // Initial fetch of customers, orders, and products
  fetchCustomers();
  fetchOrders();
  fetchProducts();
  fetchAndRenderOrders();
  fetchAndRenderProducts();
});

