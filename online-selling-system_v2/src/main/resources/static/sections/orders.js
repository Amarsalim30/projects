
import { orderBaseUrl, productBaseUrl } from '../modules/constants.js';
import { productSelection } from '../modules/domCaching.js';
import { hideSidebars } from '../modules/navigation.js';
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



  export{createOrder,fetchOrders,deleteOrder,updateOrderStatus,fetchProducts,updateOrderList,fetchOrdersByCustomerName,fetchOrdersByDate};