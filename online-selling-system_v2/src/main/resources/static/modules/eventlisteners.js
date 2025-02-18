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
import { initializeProductFormListener,initializeProductDeletionListener } from '../sections/products/products.js';

const initializeCustomerSectionEventListeners=()=>{
    initializeCustomerSearch();
    initializeCustomerFormListener();
    initializeCustomerDeletionListener();
}
const initializeProductSectionEventListeners=()=>{
    initializeProductFormListener();
    initializeProductDeletionListener();
}
const initializeOrderSectionListeners=()=>{
    initializeOrderFormListener();
    initializeOrderDeletionListener();
    initializeOrderFormValidation
    initializeOrderStatusUpdateListener
}


/*---------------Event Listener Initialization------------------------------*/
export const initializeEventListeners = () => {
    initializeCustomerSectionEventListeners();
    initializeProductSectionEventListeners();

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
