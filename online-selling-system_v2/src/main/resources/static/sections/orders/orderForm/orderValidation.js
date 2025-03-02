const ValidationRules = {
    customer: {
        validate: (value) => {
            const customerId = parseInt(value);
            return !isNaN(customerId) && customerId > 0;
        },
        message: 'Please select a valid customer from the list',  // More specific message
        selector: '#select-customer'
    },
    date: {
        validate: (value) => {
            if (!value) return false;
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return selectedDate instanceof Date && !isNaN(selectedDate) && selectedDate >= today;
        },
        message: 'Please select a valid future date',
        selector: '#date-of-event'
    },
    products: {
        validate: (entries) => entries.length > 0 && entries.some(validateProductEntry),
        message: 'At least one valid product is required',
        selector: '#product-selection'
    }
};

function validateProductEntry(entry) {
    const productId = entry.querySelector('.product-select')?.value;
    const quantity = parseInt(entry.querySelector('.product-quantity')?.value);
    const price = parseFloat(entry.querySelector('.product-price')?.value);

    return productId && quantity > 0 && !isNaN(price) && price >= 0;
}

export function validateOrderForm() {
    const form = document.getElementById('add-order-form');
    if (!form) return { 
        isValid: false, 
        errors: ['Order form not found. Please refresh the page.']  // More helpful message
    };

    const errors = new Set();
    let hasValidProduct = false;
    
    // Validate required fields
    Object.entries(ValidationRules).forEach(([key, rule]) => {
        const element = form.querySelector(rule.selector);
        if (key === 'products') {
            const productEntries = Array.from(document.querySelectorAll('.product-entry'));
            hasValidProduct = productEntries.some(validateProductEntry);
            if (!hasValidProduct) {
                errors.add(rule.message);
                element?.classList.add('invalid');
            } else {
                element?.classList.remove('invalid');
            }
        } else {
            const value = element?.value;
            if (!rule.validate(value)) {
                errors.add(rule.message);
                highlightError(element);
            } else {
                clearError(element);
            }
        }
    });

    // Update submit button state
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = errors.size > 0 || !hasValidProduct;
    }

    return {
        isValid: errors.size === 0 && hasValidProduct,
        errors: Array.from(errors)
    };
}

function highlightError(element) {
    if (element) {
        element.classList.add('invalid');
        let errorSpan = element.parentElement.querySelector('.error-message');
        if (!errorSpan) {
            errorSpan = createErrorSpan();
            element.parentElement.appendChild(errorSpan);
        }
    }
}

function clearError(element) {
    if (element) {
        element.classList.remove('invalid');
        const errorSpan = element.parentElement.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.remove();
        }
    }
}

function createErrorSpan() {
    const span = document.createElement('span');
    span.className = 'error-message';
    return span;
}
