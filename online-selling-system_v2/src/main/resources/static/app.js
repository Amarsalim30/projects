import{customerListBody,productSelection,orderListBody,productListBody} from './modules/domCaching.js';
import{customerBaseUrl,productBaseUrl,orderBaseUrl} from './modules/constants.js';
import{hideSidebars,throttle,debounce} from './modules/utility.js';
import{createCustomer,fetchCustomers,deleteCustomer} from './sections/customers.js'
import{createOrder,fetchOrders,deleteOrder,updateOrderStatus,fetchProducts
  ,updateOrderList,fetchOrdersByCustomerName,fetchOrdersByDate} from './sections/orders.js'
import{fetchAndRenderProducts,deleteProduct} from './sections/products.js';

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

  const monthYearElement = document.getElementById('month-year');
  const calendarDaysElement = document.getElementById('calendar-days');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const selectedDateElement = document.getElementById('selected-date');
  const eventItemsElement = document.getElementById('event-items');

  let currentDate = new Date();
  let selectedDate = null;

  const events = {
    "2024-01-15": [{ time: "10:00", title: "Meeting with John", description: "Discuss project updates" },
                  { time: "14:00", title: "Project Deadline", description: "Submit final report" }],
    "2024-01-22": [{ time: "12:30", title: "Team Lunch", description: "Celebrate project milestone" }],
    "2024-02-10": [{ time: "19:00", title: "Client Dinner", description: "Formal dinner with key client" }]
  };

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDay = firstDayOfMonth.getDay();

    monthYearElement.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
    calendarDaysElement.innerHTML = '';

    for (let i = 0; i < startingDay; i++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day', 'inactive');
      calendarDaysElement.appendChild(dayElement);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day');
      dayElement.textContent = day;

      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (year === new Date().getFullYear() && month === new Date().getMonth() && day === new Date().getDate()) {
        dayElement.classList.add('today');
      }

      if (selectedDate && fullDate === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`) {
        dayElement.classList.add('selected');
      }

      if (events[fullDate]) {
        const eventIndicator = document.createElement('span');
        eventIndicator.classList.add('event-indicator');
        dayElement.appendChild(eventIndicator);
      }

      dayElement.addEventListener('click', () => {
        selectedDate = new Date(year, month, day);
        renderCalendar();
        displayEvents(fullDate);
      });

      calendarDaysElement.appendChild(dayElement);
    }
  }

  function displayEvents(dateString) {
    selectedDateElement.textContent = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));

    eventItemsElement.innerHTML = '';

    if (events[dateString]) {
      events[dateString].forEach(event => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <span class="event-time">${event.time}</span>
          <span class="event-title">${event.title}</span>
          <div class="event-actions">
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
          </div>
        `;
        eventItemsElement.appendChild(listItem);

        const deleteButton = listItem.querySelector('.delete');
        deleteButton.addEventListener('click', () => {
          const index = events[dateString].indexOf(event);
          if (index > -1) {
            events[dateString].splice(index, 1);
          }
          displayEvents(dateString);
        });

        const editButton = listItem.querySelector('.edit');
        editButton.addEventListener('click', () => {
          console.log('Edit event:', event);
        });
      });
    } else {
      const listItem = document.createElement('li');
      listItem.textContent = "No events for this day.";
      eventItemsElement.appendChild(listItem);
    }
  }

  prevMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();

  const todayString = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  displayEvents(todayString);

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

