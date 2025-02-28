import { showLoadingSpinner, hideLoadingSpinner } from './modules/utility.js';
import { initializeCollapsibleSections, initializeNavigation } from './modules/navigation.js';
import { CalendarModule } from './sections/calendar.js';
import { initializePhoneInput} from './sections/customers/phone-input.js';
import { initializeEventListeners } from './modules/eventlisteners.js';
import { fetchCustomers} from './sections/customers/customers.js';
import { fetchOrders } from './sections/orders/orders.js';
import { fetchAndRenderProducts } from './sections/products/products.js';

// Initialize plugins and event listeners after DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
    try {
        showLoadingSpinner();
        initializeEventListeners();
        initializePhoneInput();
        initializeCollapsibleSections();
        initializeNavigation();
        CalendarModule.init();

        await Promise.all([
            fetchCustomers(),
            fetchAndRenderProducts(),
            fetchOrders(),
            CalendarModule.fetchAndRenderOrders()
        ]);
        hideLoadingSpinner();
    } catch (error) {
        console.error('Error during initialization:', error);
        hideLoadingSpinner();
        alert('Failed to initialize the application. Please refresh the page.');
    }
});

