import { debounce } from '../../../modules/utility.js';
import fetchController from '../../../modules/fetchController.js';
import { customerBaseUrl } from '../../../modules/apiConstants.js';

export function initializeSelectCustomer() {
    const select = $("#select-customer");
    if (!select.length) return null;

    const controller = new AbortController();
    const cleanupFn = setupCustomerSelectWithErrorHandling(select, controller);

    return () => {
        controller.abort();
        if (cleanupFn) cleanupFn();
        cleanupCustomerSelect(select);
    };
}

function setupCustomerSelectWithErrorHandling(select, controller) {
    try {
        const loadingIndicator = createLoadingIndicator(select);
        const instance = setupSelect2Instance(select, controller, loadingIndicator);
        
        const removeEventListeners = setupEventListeners(select);
        
        return () => {
            loadingIndicator.remove();
            if (instance?.destroy) instance.destroy();
            removeEventListeners();
        };
    } catch (error) {
        console.error('Error setting up customer select:', error);
        showError(select, 'Failed to initialize customer selection');
        return null;
    }
}

function setupSelect2Instance(select, controller, loadingIndicator) {
    return select.select2({
        placeholder: "Select a customer",
        allowClear: true,
        dropdownParent: $('#add-order-sidebar'),
        ajax: createCustomerAjaxConfig(loadingIndicator, controller)
    });
}

function setupCustomerSelect(select, controller) {
    const loadingIndicator = createLoadingIndicator(select);
    
    select.select2({
        placeholder: "Select a customer",
        allowClear: true,
        dropdownParent: $('#add-order-sidebar'),
        ajax: createCustomerAjaxConfig(loadingIndicator, controller)
    }).on('select2:open', focusSearchField);

    preventEventBubbling();
}

function createCustomerAjaxConfig(loadingIndicator, controller) {
    return {
        transport: createTransportFunction(loadingIndicator, controller),
        delay: 0,
        data: params => ({ name: params.term }),
        processResults: processCustomerResults,
        cache: true
    };
}

function createTransportFunction(loadingIndicator, controller) {
    let currentRequest = null;
    
    return async (params, success, failure) => {
        if (currentRequest) {
            currentRequest.abort();
        }
        
        loadingIndicator.show();
        currentRequest = new AbortController();
        
        try {
            const data = await fetchController.fetch(
                'customerSearch',
                `${customerBaseUrl}/search?name=${params.data.name}`,
                { 
                    signal: currentRequest.signal,
                    timeout: 5000
                }
            );
            success(data);
        } catch (error) {
            if (error.name !== 'AbortError') {
                failure('Failed to fetch customers');
            }
        } finally {
            loadingIndicator.hide();
            currentRequest = null;
        }
    };
}

function processCustomerResults(data) {
    return {
        results: data.map(customer => ({
            id: customer.id,
            text: formatCustomerName(customer),
        }))
    };
}

function focusSearchField() {
    document.querySelector('.select2-search__field').focus();
}

function preventEventBubbling() {
    $(document).on('click', '.select2-container, .select2-dropdown, .select2-search__field', 
        (e) => e.stopPropagation()
    );
}

function createLoadingIndicator(select) {
    const loadingIndicator = $('<div class="select-loading">Loading...</div>').hide();
    select.after(loadingIndicator);
    return loadingIndicator;
}

function cleanupCustomerSelect(select) {
    try {
        if (select.data('select2')) {
            select.off().select2('destroy');
        }
    } catch (error) {
        console.error('Error cleaning up customer select:', error);
    }
}

function setupEventListeners(select) {
    const handleOpen = () => {
        requestAnimationFrame(() => {
            const searchField = document.querySelector('.select2-search__field');
            if (searchField) searchField.focus();
        });
    };

    select.on('select2:open', handleOpen);

    return () => {
        select.off('select2:open', handleOpen);
    };
}

function showError(select, message) {
    const errorDiv = $('<div class="select-error"></div>')
        .text(message)
        .insertAfter(select);
    
    setTimeout(() => {
        errorDiv.fadeOut(300, function() {
            $(this).remove();
        });
    }, 5000);
}

function formatCustomerName(customer) {
    const name = customer.name || 'Unknown';
    const number = customer.number || 'No number';
    return `${name} (${number})`;
}
