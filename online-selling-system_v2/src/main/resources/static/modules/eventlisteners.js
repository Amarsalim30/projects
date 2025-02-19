import { 
    initializeOrderFormListener, 
    initializeOrderDeletionListener,
    initializeOrderFormValidation, 
    initializeOrderStatusUpdateListener 
} from '../sections/orders/orderForm/orderListeners.js';
import { 
    initializeAddProductToOrder
} from '../sections/orders/orderForm/ProductEntry.js';
import {
    initializeSelectCustomer
} from '../sections/orders/orderForm/customerSelect.js';
import { 
    initializeCustomerFormListener,
    initializeCustomerDeletionListener 
} from '../sections/customers/customerListeners.js';
import { initializeCustomerSearch } from '../sections/customers/search.js';
import { 
    initializeProductFormListener, 
    initializeProductDeletionListener 
} from '../sections/products/productListeners.js';  // Updated import path

const initializeCustomerSectionEventListeners=()=>{
    initializeCustomerSearch();
    initializeCustomerFormListener();
    initializeCustomerDeletionListener();
}
const initializeProductSectionEventListeners=()=>{
    initializeProductFormListener();
    initializeProductDeletionListener();
}
const initializeOrderSectionEventListeners=()=>{
    initializeSelectCustomer();
    initializeOrderFormListener();
    initializeOrderDeletionListener();
    initializeOrderFormValidation();  // Added parentheses
    initializeOrderStatusUpdateListener();  // Added parentheses
    initializeAddProductToOrder();
}


/*---------------Event Listener Initialization------------------------------*/
export const initializeEventListeners = () => {
    initializeCustomerSectionEventListeners();
    initializeProductSectionEventListeners();
    initializeOrderSectionEventListeners();
 
    // Prevent sidebar closing when interacting with form elements
    document.querySelectorAll('.sidebar form').forEach(form => {
        form.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}
