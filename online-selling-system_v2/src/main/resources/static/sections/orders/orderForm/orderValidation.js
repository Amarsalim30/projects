export function validateOrderForm() {
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
