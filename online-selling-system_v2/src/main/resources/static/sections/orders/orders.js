import { orderBaseUrl } from '../../modules/apiConstants.js';
import { productSelection, orderListBody } from '../../modules/domCaching.js';
import { hideSidebars } from '../../modules/navigation.js';
import { validateOrderForm } from './orderForm/orderValidation.js';
import { calculateTotalAmount } from './orderForm/orderPrice.js';
import { productBaseUrl } from '../../modules/apiConstants.js';
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
    } catch (error) {
        showError(error.message || "Failed to create order");
        console.error("Create order error:", error);
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
    const selectedOption = customerSelect.options[customerSelect.selectedIndex];
    if (!selectedOption) {
        throw new Error("Invalid customer selection");
    }

    const customerInfo = selectedOption.text.split('(');
    if (customerInfo.length !== 2) {
        throw new Error("Invalid customer data format");
    }

    return {
        customerId: parseInt(formData.get("select-customer")),
        customerName: customerInfo[0].trim(),
        customerNumber: customerInfo[1].replace(')', '').trim(),
        dateOfEvent: formData.get("date-of-event"),
        status: "PENDING",
        orderItems: Array.from(document.querySelectorAll(".product-entry"))
            .map(entry => ({
                productId: parseInt(entry.querySelector(".product-select").value),
                quantity: parseInt(entry.querySelector(".product-quantity").value),
                itemPrice: parseFloat(entry.querySelector(".product-price").value),
                productName: entry.querySelector(".product-select").text
            }))
            .filter(item => 
                item.productId && 
                item.quantity > 0 && 
                item.itemPrice >= 0
            ),
        totalAmount: calculateTotalAmount(),
        paidAmount: "0.00",
        remainingAmount: calculateTotalAmount()
    };
}

async function validateAndGetFormData(form) {
    const customerSelect = form.querySelector("#select-customer");
    if (!customerSelect?.value) {
        throw new Error("Please select a customer");
    }

    const validationResult = validateOrderForm();
    if (!validationResult.isValid) {
        throw new Error(Array.isArray(validationResult.errors) ? 
            validationResult.errors.join('\n') : 
            'Please check your input');
    }

    const formData = new FormData(form);
    try {
        return constructOrderData(formData, customerSelect);
    } catch (error) {
        throw new Error(`Failed to construct order data: ${error.message}`);
    }
}

async function submitOrderData(formData) {
    const response = await fetch(`${orderBaseUrl}/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.errors ? data.errors.join('\n') : data.message);
    }
    return data;
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

// Update order list UI
function updateOrderList(orders) {
    if (!Array.isArray(orders)) {
        console.error("Invalid orders data received");
        orderListBody.innerHTML = '<tr><td colspan="9">Error: Invalid data received</td></tr>';
        return;
    }

    try {
        orderListBody.innerHTML = orders.length ? 
            orders.map(order => createOrderRow(order)).join('') :
            '<tr><td colspan="9">No orders found</td></tr>';
    } catch (error) {
        console.error("Error updating order list:", error);
        orderListBody.innerHTML = '<tr><td colspan="9">Error displaying orders</td></tr>';
    }
}

function createOrderRow(order) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${escapeHtml(order.customerName || '')}</td>
        <td>${escapeHtml(order.customerNumber || '')}</td>
        <td>${escapeHtml(order.status || '')}</td>
        <td>${escapeHtml(order.date || '')}</td>
        <td>${escapeHtml(order.products?.map(p => p.name).join(", ") || '')}</td>
        <td>${formatMoney(order.totalAmount || 0)}</td>
        <td>${formatMoney(order.paidAmount || 0)}</td>
        <td>${formatMoney(order.remainingAmount || 0)}</td>
        <td>
            <button class="delete-btn" data-id="${escapeHtml(order.id)}">
                Delete
            </button>
        </td>
    `;
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

export { createOrder, fetchOrders, deleteOrder, updateOrderStatus, fetchProducts, updateOrderList, fetchOrdersByCustomerName, fetchOrdersByDate };