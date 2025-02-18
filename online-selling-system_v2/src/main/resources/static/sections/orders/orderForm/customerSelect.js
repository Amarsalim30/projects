import { debounce } from '../modules/utility.js';
import fetchController from '../modules/fetchController.js';
import { customerBaseUrl } from '../modules/apiConstants.js';

export function initializeSelectCustomer() {
    const select = $("#select-customer");
    const loadingIndicator = $('<div class="select-loading">Loading...</div>').hide();
    select.after(loadingIndicator);

    const debouncedSearch = debounce(async (searchTerm, success, failure) => {
        loadingIndicator.show();
        try {
            const data = await fetchController.fetch(
                'customerSearch',
                `${customerBaseUrl}/search?name=${searchTerm}`
            );
            success(data);
        } catch (error) {
            failure('Failed to fetch customers');
        } finally {
            loadingIndicator.hide();
        }
    }, 300);

    select.select2({
        placeholder: "Select a customer",
        allowClear: true,
        dropdownParent: $('#add-order-sidebar'),
        ajax: {
            transport: (params, success, failure) => 
                debouncedSearch(params.data.name, success, failure),
            delay: 0, // We're handling delay with debounce
            data: (params) => ({ name: params.term }),
            processResults: (data) => ({
                results: data.map(customer => ({
                    id: customer.id,
                    text: formatCustomerName(customer),
                    customer: customer
                }))
            }),
            cache: true
        },
        minimumInputLength: 1
    }).on('select2:open', () => {
        document.querySelector('.select2-search__field').focus();
    });

    $(document).on('click', '.select2-container, .select2-dropdown, .select2-search__field', 
        (e) => e.stopPropagation()
    );
}

function formatCustomerName(customer) {
    const name = customer.name || 'Unknown';
    const number = customer.number || 'No number';
    return `${name} (${number})`;
}