export function validateOrderForm() {
    const form = document.getElementById('add-order-form');
    if (!form) return false;

    const customer = form.querySelector('#select-customer').value;
    if (!customer) return false;

    const dateOfEvent = form.querySelector('input[name="date-of-event"]').value;
    if (!dateOfEvent || new Date(dateOfEvent) < new Date()) return false;

    const products = document.querySelectorAll('.product-entry');
    if (!products.length) return false;

    let hasValidProduct = false;
    products.forEach(entry => {
        const productId = entry.querySelector('.product-select').value;
        const quantity = parseInt(entry.querySelector('.product-quantity').value);
        const price = parseFloat(entry.querySelector('.product-price').value);

        if (productId && quantity > 0 && price >= 0) {
            hasValidProduct = true;
        }
    });

    return hasValidProduct;
}
