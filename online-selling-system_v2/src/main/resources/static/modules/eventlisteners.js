import { customerListBody,orderListBody,productListBody,productSelection } from './domCaching.js';
import { deleteCustomer ,createCustomer} from '../sections/customers.js';
import { deleteOrder, updateOrderStatus ,createOrder} from '../sections/orders.js';
import { deleteProduct } from '../sections/products.js';
import { hideSidebars } from './navigation.js';

// Remove these functions as they're now handled in navigation.js
// const initializeCustomerSidebarToggle = () => { ... }
// const initializeOrderSidebarToggle = () => { ... }
// const initializeProductSidebarToggle = () => { ... }

const initializeProductFormListener = (fetchProducts) => {  
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
    }
const initializeCustomerFormListener = (createCustomer) => {
    document.querySelector("#add-customer-form").addEventListener("submit",createCustomer);
    }
const initializeOrderFormListener = (createOrder) => {
    document.querySelector("#add-order-form").addEventListener("submit",createOrder);
    }

const initializeProductDeletionListener = (deleteProduct) => {
    productListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
        const productId = event.target.dataset.id;
        await deleteProduct(productId);
        }
    });
    }
    // Use event delegation for dynamically added "Remove" buttons
const initializeProductSelectDeleteListener = () => {
    productSelection.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-product')) {
        event.target.closest('.product-entry').remove();
        }
    });
    }
const initializeCustomerDeletionListener = (deleteCustomer) => {
    customerListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
        const customerId = event.target.dataset.id;
        await deleteCustomer(customerId);
        }
    });
    }
const initializeOrderDeletionListener = (deleteOrder) => {
    orderListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
        const orderId = event.target.dataset.id;
        await deleteOrder(orderId);
        }
    });
    }
const initializeOrderStatusUpdateListener = (updateOrderStatus) => {
    orderListBody.addEventListener('change', async (event) => {
        if (event.target.classList.contains('order-status')) {
        const orderId = event.target.dataset.id;
        const newStatus = event.target.value;
        await updateOrderStatus(orderId, newStatus);
        }
    });
    }
export const initializeEventListeners = () => {
  // ...existing code...
  // Remove sidebar toggle initializations
  initializeProductDeletionListener(deleteProduct);
  initializeCustomerDeletionListener(deleteCustomer);
  initializeOrderDeletionListener(deleteOrder);
  initializeOrderStatusUpdateListener(updateOrderStatus);
  initializeProductSelectDeleteListener();
  initializeProductFormListener();
  initializeCustomerFormListener();
  initializeOrderFormListener();
}
