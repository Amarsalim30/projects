import { orderBaseUrl, productBaseUrl } from '../../modules/apiConstants.js';
import { productSelection, orderListBody } from '../../modules/domCaching.js';
import { hideSidebars } from '../../modules/navigation.js';
import { validateOrderForm } from './orderForm/orderValidation.js';

/* --------------- Order Section ----------------- */
// Create order >Select Customer> Add product entry >Fill product details 
// >Date of event >Status >Submit

async function createOrder(event) {
    event.preventDefault();
    
    if (!validateOrderForm()) {
        alert("Please fill all required fields correctly");
        return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Creating...';

    const form = document.querySelector("#add-order-form");
    const formData = new FormData(form);
    const customerID = parseInt(formData.get("select-customer"));
    
    // Validate customer
    if (!customerID) {
        alert("Please select a customer");
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Order';
        return;
    }

    // Validate products
    const products = [];
    let hasValidProducts = false;
    document.querySelectorAll(".product-entry").forEach((entry) => {
        const productId = entry.querySelector(".product-select").value;
        const quantity = parseInt(entry.querySelector(".product-quantity").value);
        const price = parseFloat(entry.querySelector(".product-price").value);

        if (productId && quantity > 0 && price >= 0) {
            hasValidProducts = true;
            products.push({ productId, quantity, price });
        }
    });

    if (!hasValidProducts) {
        alert("Please add at least one valid product");
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Order';
        return;
    }

    // Validate date
    const dateOfEvent = formData.get("date-of-event");
    if (!dateOfEvent || new Date(dateOfEvent) < new Date()) {
        alert("Please select a valid future date");
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Order';
        return;
    }

    const newOrder = {
        customerId: customerID,
        dateOfEvent: dateOfEvent,
        status: formData.get("status"),
        products: products,
    };

    try {
        const response = await Promise.race([
            fetch(`${orderBaseUrl}/new`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOrder),
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            )
        ]);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create order");
        }

        // Reset form and update UI
        form.reset();
        productSelection.innerHTML = '';
        hideSidebars();
        await fetchOrders();
    } catch (error) {
        console.error("Create order error:", error);
        alert("Error creating order: " + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Order';
    }
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