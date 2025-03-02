import { orderBaseUrl } from '../../modules/apiConstants.js';
import { productSelection, orderListBody } from '../../modules/domCaching.js';
import { hideSidebars } from '../../modules/navigation.js';
import { validateOrderForm } from './orderForm/orderValidation.js';
import { calculateTotalAmount } from './orderForm/orderPrice.js';
import { productBaseUrl } from '../../modules/apiConstants.js';
import { debounce, showNotification } from '../../modules/utility.js';
/* --------------- Order Section ----------------- */
// Create order >Select Customer> Add product entry >Fill product details 
// >Date of event >Status >Submit

function formatMoney(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

async function createOrder(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    try {
        if (!submitButton) throw new Error("Submit button not found");
        disableSubmitButton(submitButton);
        
        const formData = await validateAndGetFormData(event.target);
        await submitOrderData(formData);
        
        event.target.reset();
        productSelection.innerHTML = '';
        hideSidebars();
        await fetchOrders();
        showNotification('Order created successfully!', 'success');
    } catch (error) {
        showError(error.message || "Failed to create order");
        console.error("Create order error:", error);
        showNotification(`Failed to create order: ${error.message}`, 'error');
    } finally {
        enableSubmitButton(submitButton);
    }
}

function disableSubmitButton(button) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Creating...';
}

function enableSubmitButton(button) {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || 'Create Order';
}

function constructOrderData(formData, customerSelect) {
    if (!customerSelect) {
        throw new Error("Customer selection element not found");
    }

    const selectedOption = customerSelect.selectedOptions[0];
    if (!selectedOption) {
        throw new Error("No customer selected");
    }

    const dateOfEvent = formData.get("dateOfEvent");
    if (!dateOfEvent) {
        throw new Error("Event date is required");
    }

    const orderItems = Array.from(document.querySelectorAll(".product-entry"))
        .map(entry => {
            const productSelect = entry.querySelector(".product-select");
            const quantityInput = entry.querySelector(".product-quantity");
            const priceInput = entry.querySelector(".product-price");

            if (!productSelect || !quantityInput || !priceInput) {
                throw new Error("Missing required product entry fields");
            }

            return {
                productId: parseInt(productSelect.value),
                quantity: parseInt(quantityInput.value),
                itemPrice: parseFloat(priceInput.value),
                productName: productSelect.options[productSelect.selectedIndex]?.text || ''
            };
        })
        .filter(item => 
            item.productId && 
            !isNaN(item.quantity) && 
            item.quantity > 0 && 
            !isNaN(item.itemPrice) && 
            item.itemPrice >= 0
        );

    if (orderItems.length === 0) {
        throw new Error("At least one valid product entry is required");
    }

    const total = calculateTotalAmount();
    if (!total || isNaN(total)) {
        throw new Error("Invalid total amount calculated");
    }

    return {
        customerId: parseInt(customerSelect.value),
        dateOfEvent: dateOfEvent, // Using the correct field name from the form
        status: "PENDING",
        orderItems: orderItems,
        totalAmount: total,
        paidAmount: "0.00",
        remainingAmount: total
    };
}

async function validateAndGetFormData(form) {
    if (!form) {
        throw new Error("Form element not found");
    }

    const customerSelect = form.querySelector("#select-customer");
    if (!customerSelect) {
        throw new Error("Customer selection element not found");
    }

    if (!customerSelect.value) {
        throw new Error("Please select a customer");
    }

    const validationResult = validateOrderForm();
    if (!validationResult.isValid) {
        throw new Error(Array.isArray(validationResult.errors) ? 
            validationResult.errors.join('\n') : 
            'Please check your input');
    }

    const dateInput = form.querySelector("#date-of-event");
    if (!dateInput || !dateInput.value) {
        throw new Error("Event date is required");
    }

    const formData = new FormData(form);
    try {
        return constructOrderData(formData, customerSelect);
    } catch (error) {
        throw new Error(`Failed to construct order data: ${error.message}`);
    }
}

async function submitOrderData(formData) {
    try {
        const response = await fetch(`${orderBaseUrl}/new`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (!response.ok) {
            const errorMessage = data.errors ? 
                data.errors.join('\n') : 
                data.message || 'Failed to create order';
            throw new Error(errorMessage);
        }
        return data;
    } catch (error) {
        console.error('Order submission error:', error);
        throw new Error(`Failed to submit order: ${error.message}`);
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.getElementById('add-order-form');
    const existingError = form.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    form.insertBefore(errorDiv, form.firstChild);
    setTimeout(() => errorDiv?.remove(), 5000);
}

async function fetchOrders(url = orderBaseUrl) {
    const loader = document.createElement('div');
    loader.className = 'loader';
    orderListBody.appendChild(loader);

    try {
        const response = await Promise.race([
            fetch(url),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            )
        ]);

        if (!response.ok) throw new Error("Failed to fetch orders");
        const orders = await response.json();
        
        updateOrderList(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        orderListBody.innerHTML = `
            <tr><td colspan="9" class="error-message">
                Failed to load orders: ${error.message}
            </td></tr>`;
    } finally {
        loader?.remove();
    }
}

// Update order list UI
function updateOrderList(orders) {
    if (!Array.isArray(orders)) {
        console.error("Invalid orders data received");
        orderListBody.innerHTML = '<tr><td colspan="9">Error: Invalid data received</td></tr>';
        return;
    }

    try {
        // Clear existing content
        orderListBody.innerHTML = '';
        
        if (orders.length === 0) {
            orderListBody.innerHTML = '<tr><td colspan="9">No orders found</td></tr>';
            return;
        }

        // Append each row to the tbody
        orders.forEach(order => {
            const row = createOrderRow(order);
            orderListBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error updating order list:", error);
        orderListBody.innerHTML = '<tr><td colspan="9">Error displaying orders</td></tr>';
    }
}

function createOrderRow(order) {
    const row = document.createElement("tr");
    
    // Create the HTML content
    const rowContent = `
        <td>${escapeHtml(order.customerName || '')}</td>
        <td>${escapeHtml(order.customerNumber || '')}</td>
        <td>${escapeHtml(order.status || '')}</td>
        <td>${escapeHtml(order.dateOfEvent || '')}</td>
        <td>${order.orderItems ? escapeHtml(order.orderItems.map(item => item.productName).join(", ")) : ''}</td>
        <td>${formatMoney(order.totalAmount || 0)}</td>
        <td>${formatMoney(order.paidAmount || 0)}</td>
        <td>${formatMoney(order.remainingAmount || 0)}</td>
        <td>
            <button class="delete-btn" data-id="${escapeHtml(order.id)}">
                Delete
            </button>
        </td>
    `;
    
    row.innerHTML = rowContent;
    return row;
}

function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

  
async function deleteOrder(orderId) {
    try {
        const response = await fetch(
            `${orderBaseUrl}/${encodeURIComponent(orderId)}`,
            { method: "DELETE" }
        );
        if (!response.ok) throw new Error("Failed to delete order");
        await fetchOrders();
    } catch (error) {
        console.error(error);
        alert("Error deleting order");
    }
}
  
// Update order status
async function updateOrderStatus(orderId, newStatus) {
    const validStatuses = ["PENDING", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(newStatus)) {
        alert("Invalid status");
        return;
    }

    try {
        const response = await fetch(`${orderBaseUrl}/${encodeURIComponent(orderId)}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error("Failed to update order status");
        await fetchOrders();
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

// Add search functionality
const searchInput = document.getElementById('search-order');
if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e) => {
        const searchTerm = e.target.value.trim();
        
        if (searchTerm.length === 0) {
            await fetchOrders(orderBaseUrl);
            return;
        }

        try {
            let searchUrl;
            // Determine if search term is a date
            const isDate = /^\d{4}-\d{2}-\d{2}$/.test(searchTerm) && !isNaN(Date.parse(searchTerm));
            
            // Construct the search URL with query parameters
            if (isDate) {
                searchUrl = `${orderBaseUrl}/search?date=${encodeURIComponent(searchTerm)}`;
            } else {
                searchUrl = `${orderBaseUrl}/search?customerName=${encodeURIComponent(searchTerm)}`;
            }
            
            await fetchOrders(searchUrl);
        } catch (error) {
            console.error('Search failed:', error);
            orderListBody.innerHTML = `
                <tr><td colspan="9" class="error-message">
                    Search failed: ${error.message}
                </td></tr>`;
        }
    }, 300));
}

export { createOrder, fetchOrders, deleteOrder, updateOrderStatus, fetchProducts, updateOrderList, fetchOrdersByCustomerName, fetchOrdersByDate };