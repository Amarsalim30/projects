import { validateOrderForm } from "./orderValidation.js";
import { debounce } from '../../../modules/utility.js';

/*---------------Product Entry Helper Functions------------------------------*/

export function updateProductSubtotal(productEntry) {
    if (!productEntry) return;

const quantityInput = productEntry.querySelector('.product-quantity');
    const priceInput = productEntry.querySelector('.product-price');
    const subtotalElement = productEntry.querySelector('.product-subtotal');

    if (!quantityInput || !priceInput || !subtotalElement) return;

    const quantity = Math.max(1, parseInt(quantityInput.value) || 0);
    const price = parseFloat(priceInput.value) || 0;
    const subtotal = quantity * price;

    quantityInput.value = quantity; // Ensure minimum value of 1
        subtotalElement.value = `KES ${subtotal.toFixed(2)}`;
        subtotalElement.classList.toggle('highlight', subtotal > 0);
    }

export const updateOrderTotal = debounce(() => {
    try {
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
    } catch (error) {
        console.error('Error updating order total:', error);
    }
}, 300);
