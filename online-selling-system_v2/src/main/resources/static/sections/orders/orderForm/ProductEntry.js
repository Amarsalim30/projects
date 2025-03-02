import { updateOrderTotal, updateProductSubtotal } from './orderPrice.js';
import { debounce } from '../../../modules/utility.js';
import fetchController from '../../../modules/fetchController.js';
import { productBaseUrl } from '../../../modules/apiConstants.js'

export function initializeAddProductToOrder() {
    const addProductButton = document.getElementById("add-product");
    const productSelection = document.querySelector("#product-selection");
  
    addProductButton.addEventListener("click", debounce(() => {
        const productDiv = createProductEntry();
        productSelection.appendChild(productDiv);
        initializeSelectProduct(productDiv);
        initializeRemoveProduct(productDiv);
    }, 300));
}

export function createProductEntry() {
    const productDiv = document.createElement("div");
    productDiv.classList.add("product-entry");
    
    // Add data validation attributes
    const html = `
        <div class="form-group">
            <label for="product-select">Product *</label>
            <select class="product-select" required data-error="Please select a product">
                <option value="">Search for a product</option>
            </select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="product-quantity">Quantity *</label>
                <input type="number" 
                       class="product-quantity" 
                       min="1" 
                       max="1000"
                       placeholder="1" 
                       required 
                       data-error="Quantity must be between 1 and 1000">
            </div>
            <div class="form-group">
                <label for="product-price">Unit Price (KES)</label>
                <input type="number" class="product-price" min="0" placeholder="0">
            </div>
            <div class="form-group">
                <label>Subtotal</label>
                <input type="text" class="product-subtotal" readonly value="KES 0.00">
            </div>
        </div>
        <button type="button" class="remove-product" title="Remove Product">
            <i class="fa fa-times"></i>
        </button>
    `;
    productDiv.innerHTML = html;

    // Add fade-in animation
    productDiv.style.opacity = '0';
    requestAnimationFrame(() => {
        productDiv.style.opacity = '1';
    });

    // Add event listener for quantity changes
    const quantityInput = productDiv.querySelector('.product-quantity');
    quantityInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) {
            e.target.value = 1;
            value = 1;
        }
        updateProductSubtotal(productDiv);
        updateOrderTotal();
    });

    return productDiv;
}

export function initializeSelectProduct(container) {
    const select = container.querySelector(".product-select");
    if (!select) return;

    const cleanup = cleanupSelect2Instance(select);
    const controller = new AbortController();

    try {
        const instance = initializeSelect2WithErrorHandling(select, controller);
        setupEventListeners(container, controller);
        
        return () => {
            cleanup();
            controller.abort();
            if (instance?.destroy) instance.destroy();
        };
    } catch (error) {
        console.error('Error initializing product select:', error);
        showErrorMessage(container, 'Failed to initialize product selector');
        return () => {
            cleanup();
            controller.abort();
        };
    }
}

function cleanupSelect2Instance(select) {
    const instance = $(select).data('select2');
    if (instance) {
        $(select).off().select2('destroy');
    }
    return () => {
        const newInstance = $(select).data('select2');
        if (newInstance) $(select).off().select2('destroy');
    };
}

function initializeSelect2WithErrorHandling(select, controller) {
    const options = {
        placeholder: "Select a product",
        allowClear: true,
        minimumInputLength: 1,
        dropdownParent: $('#add-order-sidebar'),
        ajax: createAjaxConfig(controller)
    };

    $(select)
        .select2(options)
        .on('select2:open', () => {
            requestAnimationFrame(() => {
                const searchField = document.querySelector('.select2-search__field');
                if (searchField) searchField.focus();
            });
        });
}

function createAjaxConfig(controller) {
    return {
        transport: (params, success, failure) => {
            const searchTerm = params.data.searchTerm;
            if (controller.signal.aborted) return;
            fetchController.fetch(
                'productSearch',
                `${productBaseUrl}/search?searchTerm=${searchTerm}`,
                { signal: controller.signal }
            ).then(success).catch(failure);
        },
        delay: 0,
        data: params => ({ searchTerm: params.term }),
        processResults: data => ({
            results: data.map(product => ({
                id: product.id,
                text: product.name || `Product ${product.id}`
            }))
        }),
        cache: true
    };
}

function setupEventListeners(container, controller) {
    const select = container.querySelector(".product-select");
    const priceInput = container.querySelector('.product-price');
    const quantityInput = container.querySelector('.product-quantity');

    $(select).on('select2:select', async (e) => {
        try {
            const productId = e.params.data.id;
            const product = await fetchController.fetch(
                'productDetails',
                `${productBaseUrl}/${productId}`,
                { signal: controller.signal }
            );
            if (product?.price) {
                priceInput.value = product.price;
                updateProductSubtotal(container);
                updateOrderTotal();
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
            alert("Failed to fetch product details");
        }
    });

    priceInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (isNaN(value) || value < 0) {
            e.target.value = 0;
        } else if (value > 1000000) { // Reasonable maximum price
            e.target.value = 1000000;
        }
        updateProductSubtotal(container);
        updateOrderTotal();
    });

    quantityInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) {
            e.target.value = 1;
        } else if (value > 10000) { // Reasonable maximum quantity
            e.target.value = 10000;
        }
        updateProductSubtotal(container);
        updateOrderTotal();
    });
}

export function initializeRemoveProduct(productDiv) {
    const removeButton = productDiv.querySelector('.remove-product');
    removeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (document.querySelectorAll('.product-entry').length === 1) {
            alert('At least one product is required');
            return;
        }

        // Animate and remove
        productDiv.style.opacity = '0';
        productDiv.style.transform = 'translateX(20px)';

        setTimeout(() => {
            const select = productDiv.querySelector('.product-select');
            if ($(select).data('select2')) {
                $(select).select2('destroy');
            }
            productDiv.remove();
            updateOrderTotal();
        }, 300);
    });
}

export function cleanup() {
    document.querySelectorAll('.product-select').forEach(select => {
        const instance = $(select).data('select2');
        if (instance) {
            try {
                $(select).off().select2('destroy');
            } catch (error) {
                console.error('Error cleaning up Select2:', error);
            }
        }
    });
    // Clear any pending requests
    if (window.currentProductRequest) {
        window.currentProductRequest.abort();
    }
}

export function initializeStaticProductSelect(select, products) {
    if (!select) return;

    // Safely destroy existing Select2 instance if it exists
    if ($(select).data('select2')) {
        $(select).select2('destroy');
    }

    $(select).select2({
        data: products.map(product => ({
            id: product.id,
            text: `${product.name} (${product.stock} available)`,
            product: product
        })),
        placeholder: 'Select a product',
        width: '100%',
        dropdownParent: $('#add-order-sidebar')
    });
}


