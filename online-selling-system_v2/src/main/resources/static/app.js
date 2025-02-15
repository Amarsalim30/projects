import{customerListBody,productSelection,orderListBody,productListBody} from './modules/domCaching.js';
import{customerBaseUrl,productBaseUrl,orderBaseUrl} from './modules/constants.js';
import{hideSidebars,throttle,debounce,showLoadingSpinner,hideLoadingSpinner} from './modules/utility.js';
import{createCustomer,fetchCustomers,deleteCustomer,updateCustomerList} from './sections/customers.js'
import{fetchOrders,fetchProducts} from './sections/orders.js'
import{fetchAndRenderProducts,deleteProduct} from './sections/products.js';
import { initializeEventListeners } from './modules/eventlisteners.js';
import {initializeAddProductToOrder,initializeSelectCustomer} from './modules/select.js';
import { initializeCustomerSearch } from './modules/search.js';
import{initializePhoneInput} from './modules/phone-input.js';   
import{initializeCollapsibleSections,initializeNavigation} from './modules/navigation.js';
import { CalendarModule} from './sections/calendar.js';
// Initialize plugins and event listeners after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners(); 
  initializeAddProductToOrder(productBaseUrl, debounce);
  initializeSelectCustomer(customerBaseUrl);
  initializeCustomerSearch();
  initializePhoneInput();
  initializeCollapsibleSections();
  initializeNavigation();
  CalendarModule.init();
  // Initial fetch of customers, orders, and products
  fetchCustomers();
  fetchOrders();
  fetchProducts();
  CalendarModule.fetchAndRenderOrders();
  fetchAndRenderProducts();
});

