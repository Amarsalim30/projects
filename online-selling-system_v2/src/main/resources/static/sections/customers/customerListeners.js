export const initializeCustomerFormListener = () => {
    document.querySelector("#add-customer-form").addEventListener("submit", createCustomer);
}
//Delete in list listeners
export const initializeCustomerDeletionListener = () => {
    customerListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const customerId = event.target.dataset.id;
            await deleteCustomer(customerId);
        }
    });
}