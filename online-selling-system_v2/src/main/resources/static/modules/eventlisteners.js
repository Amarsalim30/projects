import { customerListBody, orderListBody, productListBody } from './domCaching.js';
import { deleteCustomer, createCustomer } from '../sections/customers.js';
import { deleteOrder, updateOrderStatus } from '../sections/orders.js';
import { deleteProduct, fetchAndRenderProducts } from '../sections/products/products.js';
import { hideSidebars } from './navigation.js';
import { productBaseUrl} from './apiConstants.js';
import { updateOrderTotal,updateProductSubtotal } from '../orderForm/orderPrice.js';
import {initializeOrderFormListener,initializeOrderFormValidation,initializeOrderStatusUpdateListener} from '../orderForm/orderFormListeners.js'
import {initializeProductSelectDeleteListener} from '../orderForm/ProductEntry.js'
import {initializeCustomerFormListener} from '../sections/customers.js'
import { initializeCustomerSearch } from '../sections/customers/search.js';
/*---------------Form Listerners----------------------------------*/

const initializeProductFormListener = () => {
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
const initializeCustomerSectionEventListeners=()=>{
    initializeCustomerSearch();
    initializeCustomerFormListener();
    initializeCustomerDeletionListener();
}
/*---------------Delete in List Listerners------------------------------*/

const initializeProductDeletionListener = () => {
    productListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const productId = event.target.dataset.id;
            await deleteProduct(productId);
        }
    });
}

const initializeOrderDeletionListener = () => {
    orderListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const orderId = event.target.dataset.id;
            await deleteOrder(orderId);
        }
    });
}

/*---------------Event Listener Initialization------------------------------*/
export const initializeEventListeners = () => {
    initializeCustomerSectionEventListeners();

    //Form Listeners
    initializeProductFormListener();
    initializeOrderFormListener
    //Delete From List Listeners
    initializeProductDeletionListener();
    initializeOrderDeletionListener();

    //Update Order Status Listener
    initializeOrderStatusUpdateListener();

    //Product Select Delete Listener
    initializeProductSelectDeleteListener();

    //Order Form Validation
    initializeOrderFormValidation();

    // Prevent sidebar closing when interacting with form elements
    document.querySelectorAll('.sidebar form').forEach(form => {
        form.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}
