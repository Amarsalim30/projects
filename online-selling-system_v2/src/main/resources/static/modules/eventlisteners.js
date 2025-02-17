import { customerListBody, orderListBody, productListBody } from './domCaching.js';
import { deleteCustomer, createCustomer } from '../sections/customers.js';
import { deleteOrder, updateOrderStatus, createOrder } from '../sections/orders.js';
import { deleteProduct, fetchAndRenderProducts } from '../sections/products.js';
import { hideSidebars } from './navigation.js';
import { productBaseUrl } from './constants.js';

const initializeProductFormListener = (fetchAndRenderProducts) => {  
const form = document.getElementById("add-product-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
                const formData = new FormData(event.target);
        const newProduct = {
          name: formData.get("name"),
          stock: formData.get("availability"),
          price: formData.get("price")
        };
    
        try {
          const response = await fetch(`${productBaseUrl}/new`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProduct),
          });
    
          if (!response.ok) throw new Error("Failed to add product");
    
          event.target.reset();
          hideSidebars();
          await fetchAndRenderProducts();
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
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-product') || 
            event.target.closest('.remove-product')) {
            event.preventDefault();
            event.stopPropagation();
            
            const productEntry = event.target.closest('.product-entry');
            if (productEntry) {
                if (document.querySelectorAll('.product-entry').length === 1) {
                    alert('At least one product is required');
                    return;
                }
                
                // Smooth removal animation
                productEntry.style.opacity = '0';
                productEntry.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    // Cleanup Select2 instance before removing element
                    const select = productEntry.querySelector('.product-select');
                    if ($(select).data('select2')) {
                        $(select).select2('destroy');
                    }
                    productEntry.remove();
                    updateOrderTotal();
                }, 300);
            }
        }
    });

    // Listen for quantity changes
    document.addEventListener('input', (event) => {
        if (event.target.classList.contains('product-quantity')) {
            const quantity = parseInt(event.target.value) || 0;
            if (quantity < 1) {
                event.target.value = 1;
            }
            updateProductSubtotal(event.target.closest('.product-entry'));
            updateOrderTotal();
        }
    });
}

function updateProductSubtotal(productEntry) {
    const quantity = parseInt(productEntry.querySelector('.product-quantity').value) || 0;
    const price = parseFloat(productEntry.querySelector('.product-price').value) || 0;
    const subtotal = quantity * price;
    
    const subtotalElement = productEntry.querySelector('.product-subtotal');
    if (subtotalElement) {
        subtotalElement.value = `KES ${subtotal.toFixed(2)}`;
        subtotalElement.classList.toggle('highlight', subtotal > 0);
    }
}

function updateOrderTotal() {
    const subtotals = Array.from(document.querySelectorAll('.product-entry')).map(entry => {
        const quantity = parseInt(entry.querySelector('.product-quantity')?.value) || 0;
        const price = parseFloat(entry.querySelector('.product-price')?.value) || 0;
        return quantity * price;
    });
    
    const subtotal = subtotals.reduce((sum, value) => sum + value, 0);
    const totalElement = document.getElementById('order-total-amount');
    const subtotalElement = document.getElementById('order-subtotal');
    
    if (subtotalElement) {
        subtotalElement.textContent = `KES ${subtotal.toFixed(2)}`;
    }
    
    if (totalElement) {
        totalElement.style.transform = 'scale(1.1)';
        totalElement.textContent = `KES ${subtotal.toFixed(2)}`;
        
        setTimeout(() => {
            totalElement.style.transform = 'scale(1)';
        }, 200);
    }

    validateOrderForm();
}

function validateOrderForm() {
    const form = document.getElementById('add-order-form');
    const customer = document.getElementById('select-customer').value;
    const dateOfEvent = document.getElementById('date-of-event').value;
    const status = document.getElementById('order-status').value;
    const products = document.querySelectorAll('.product-entry');
    const total = parseFloat(document.getElementById('order-total-amount').textContent.replace('KES ', '')) || 0;

    const isValid = customer && dateOfEvent && status && 
                    products.length > 0 && total > 0;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = !isValid;
    
    return isValid;
}

function initializeOrderFormValidation() {
    const form = document.getElementById('add-order-form');
    const inputs = form.querySelectorAll('input, select');

    inputs.forEach(input => {
        input.addEventListener('change', validateOrderForm);
        input.addEventListener('input', validateOrderForm);
    });

    // Prevent submitting if validation fails
    form.addEventListener('submit', (e) => {
        if (!validateOrderForm()) {
            e.preventDefault();
            alert('Please fill in all required fields and add at least one product.');
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

const initializeOrderFormListeners = (createOrder) => {
    const form = document.querySelector("#add-order-form");
    const addProductBtn = document.querySelector("#add-product");
    
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            createOrder(e);
        });
    }
    
    if (addProductBtn) {
        addProductBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productSelection = document.querySelector("#product-selection");
            if (productSelection) {
                const productDiv = createProductEntry();
                productSelection.appendChild(productDiv);
                initializeSelect2(productDiv);
            }
        });
    }
}

export const initializeEventListeners = () => {
  // ...existing code...
  // Remove sidebar toggle initializations
  initializeProductDeletionListener(deleteProduct);
  initializeCustomerDeletionListener(deleteCustomer);
  initializeOrderDeletionListener(deleteOrder);
  initializeOrderStatusUpdateListener(updateOrderStatus);
  initializeProductSelectDeleteListener();
  initializeProductFormListener(fetchAndRenderProducts);
  initializeCustomerFormListener(createCustomer);
  initializeOrderFormListeners(createOrder);
  initializeOrderFormValidation();
  
  // Prevent sidebar closing when interacting with form elements
  document.querySelectorAll('.sidebar form').forEach(form => {
      form.addEventListener('click', (e) => {
          e.stopPropagation();
      });
  });
}
