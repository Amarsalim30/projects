import { validateOrderForm } from "./orderValidation.js";
import { debounce } from '../../../modules/utility.js';

/*---------------Product Entry Helper Functions------------------------------*/

export function updateProductSubtotal(productEntry) {
    if (!productEntry) return;

    try {
        const inputs = getValidatedInputs(productEntry);
        if (!inputs) return;

        const subtotal = calculateValidatedSubtotal(inputs.quantity, inputs.price);
        if (subtotal === null) return;

        updateSubtotalDisplaySafely(inputs.subtotalElement, subtotal);
    } catch (error) {
        console.error('Error updating product subtotal:', error);
        setDefaultSubtotal(productEntry);
    }
}

function getValidatedInputs(productEntry) {
    const inputs = {
        quantity: productEntry.querySelector('.product-quantity'),
        price: productEntry.querySelector('.product-price'),
        subtotalElement: productEntry.querySelector('.product-subtotal')
    };

    if (!inputs.quantity || !inputs.price || !inputs.subtotalElement) {
        return null;
    }

    return {
        quantity: Math.max(1, parseInt(inputs.quantity.value) || 0),
        price: Math.max(0, parseFloat(inputs.price.value) || 0),
        subtotalElement: inputs.subtotalElement
    };
}

function calculateValidatedSubtotal(quantity, price) {
    if (quantity > 1000 || price > 1000000) return null;
    
    try {
        return Math.round((quantity * price) * 100) / 100;
    } catch (error) {
        console.error('Error calculating subtotal:', error);
        return null;
    }
}

function updateSubtotalDisplaySafely(element, amount) {
    element.value = formatMoney(amount);
    element.classList.toggle('highlight', amount > 0);
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

export function calculateTotalAmount() {
    try {
        const entries = document.querySelectorAll('.product-entry');
        if (!entries || entries.length === 0) {
            throw new Error('No product entries found');
        }

        return Array.from(entries)
            .reduce((total, entry) => {
                const quantity = parseInt(entry.querySelector('.product-quantity')?.value) || 0;
                const price = parseFloat(entry.querySelector('.product-price')?.value) || 0;
                
                // Add validation
                if (quantity > 1000) throw new Error('Quantity exceeds maximum limit of 1000');
                if (price > 1000000) throw new Error('Price exceeds maximum limit');
                
                return total + (Math.round((quantity * price) * 100) / 100);
            }, 0)
            .toFixed(2);
    } catch (error) {
        console.error('Error calculating total:', error);
        throw new Error(`Failed to calculate total: ${error.message}`);
    }
}

export function formatMoney(amount) {
    try {
        const number = parseFloat(amount);
        if (isNaN(number)) throw new Error('Invalid amount');
        
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    } catch (error) {
        console.error('Error formatting money:', error);
        return 'KES 0.00';
    }
}

