import { createOrder, updateOrderStatus ,deleteOrder } from "../orders.js";
import { initializeSelectProduct, createProductEntry, cleanup as productEntryCleanup } from "./ProductEntry.js";
import { orderListBody } from "../../../modules/domCaching.js";
import { validateOrderForm } from "./orderValidation.js";

const initializeOrderFormListener = () => {
    const form = document.querySelector("#add-order-form");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            createOrder(e);
        });
    }
}
const initializeOrderDeletionListener = () => {
    orderListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const orderId = event.target.dataset.id;
            await deleteOrder(orderId);
        }
    });
}

/*---------------Order Form Validation------------------------------*/

function initializeOrderFormValidation() {
    const form = document.getElementById('add-order-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select');
    const handlers = new Set();

    const handleInput = (e) => validateOrderForm();
    inputs.forEach(input => {
        input.addEventListener('change', handleInput);
        input.addEventListener('input', handleInput);
        handlers.add({ element: input, handler: handleInput });
    });

    // Prevent submitting if validation fails
    const submitHandler = (e) => {
        if (!validateOrderForm()) {
            e.preventDefault();
            alert('Please fill in all required fields and add at least one product.');
        }
    };
    form.addEventListener('submit', submitHandler);
    handlers.add({ element: form, handler: submitHandler });

    // Return cleanup function
    return () => {
        handlers.forEach(({ element, handler }) => {
            element.removeEventListener('change', handler);
            element.removeEventListener('input', handler);
            element.removeEventListener('submit', handler);
        });
        productEntryCleanup();
    };
}

/*---------------Order Status listener------------------------------*/
const initializeOrderStatusUpdateListener = () => {
    orderListBody.addEventListener('change', async (event) => {
        if (event.target.classList.contains('order-status')) {
            const orderId = event.target.dataset.id;
            const newStatus = event.target.value;
            await updateOrderStatus(orderId, newStatus);
        }
    });
}

export {
    initializeOrderFormListener,
    initializeOrderDeletionListener,
    initializeOrderFormValidation,
    initializeOrderStatusUpdateListener
}