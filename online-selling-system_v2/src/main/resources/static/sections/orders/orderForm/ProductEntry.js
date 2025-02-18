import { updateOrderTotal, updateProductSubtotal } from './orderPrice.js';
import { debounce } from '../../../modules/utility.js';
import fetchController from '../../../modules/fetchController.js';
import { productBaseUrl } from '../../../modules/apiConstants.js'

export function initializeAddProductToOrder() {
    //when add product button is clicked, create a product entry and append it to the product selection
    const addProductButton = document.getElementById("add-product");
    const productSelection = document.querySelector("#product-selection");
  
    addProductButton.addEventListener("click", debounce(() => {
      const productDiv = createProductEntry();
      productSelection.appendChild(productDiv);
      initializeSelectProduct(productDiv);
      initializeRemoveProduct(productDiv);
    }, 300));
  }
  
  function createProductEntry() {
    const productDiv = document.createElement("div");
    productDiv.classList.add("product-entry");
    productDiv.innerHTML = `
        <div class="form-group">
            <label for="product-select">Product *</label>
            <select class="product-select" required>
                <option value="">Search for a product</option>
            </select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="product-quantity">Quantity *</label>
                <input type="number" class="product-quantity" min="1" placeholder="1" required>
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
  
  function initializeSelectProduct(container) {
    const select = container.querySelector(".product-select");
    if (!select) return;

    // Ensure proper cleanup of existing instances
    if ($(select).data('select2')) {
        $(select).select2('destroy');
    }

    let currentRequest = null;
    const debouncedSearch = debounce(async (searchTerm, success, failure) => {
        if (currentRequest) {
            currentRequest.abort();
        }
        currentRequest = new AbortController();
        
        try {
            const data = await fetchController.fetch(
                'productSearch',
                `${productBaseUrl}?searchTerm=${searchTerm}`,
                { signal: currentRequest.signal }
            );
            success(data);
        } catch (error) {
            if (error.name === 'AbortError') return;
            failure('Failed to fetch products');
        } finally {
            currentRequest = null;
        }
    }, 300);

    try {
        $(select).select2({
            placeholder: "Select a product",
            allowClear: true,
            minimumInputLength: 1,
            dropdownParent: $('#add-order-sidebar'),
            ajax: {
                transport: (params, success, failure) => 
                    debouncedSearch(params.data.searchTerm, success, failure),
                delay: 0,
                data: params => ({ searchTerm: params.term }),
                processResults: data => ({
                    results: data.map(product => ({
                        id: product.id,
                        text: product.name || `Product ${product.id}`
                    }))
                }),
                cache: true
            }
        }).on('select2:open', function() {
            requestAnimationFrame(() => {
                document.querySelector('.select2-search__field')?.focus();
            });
        }).on('select2:select', async (e) => {
            try {
                const productId = e.params.data.id;
                const product = await fetchController.fetch(
                    'productDetails',
                    `${productBaseUrl}/${productId}`
                );
                if (product?.price) {
                    container.querySelector('.product-price').value = product.price;
                    updateProductSubtotal(container);
                    updateOrderTotal();
                }
            } catch (error) {
                console.error("Error fetching product details:", error);
                alert("Failed to fetch product details");
            }
        });
    } catch (error) {
        console.error('Error initializing Select2:', error);
        alert('Error initializing product selector');
    }

    // Add loading indicator
    select.insertAdjacentHTML('afterend', '<div class="select-loading" style="display:none">Loading...</div>');
    
    // Prevent event bubbling for the entire product entry
    $(container).on('click', function(e) {
        e.stopPropagation();
    });

    // Add error handling for invalid price
    const priceInput = container.querySelector('.product-price');
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

    // Add validation for quantity input
    const quantityInput = container.querySelector('.product-quantity');
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

    // Fix potential race condition in animation
    const loadingIndicator = container.querySelector('.select-loading');
    $(select).on('select2:opening', () => {
        if (loadingIndicator) loadingIndicator.style.display = 'block';
    }).on('select2:close', () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    });
}

function initializeRemoveProduct(productDiv) {
    const removeButton = productDiv.querySelector('.remove-product');
    removeButton.addEventListener('click', () => {
        productDiv.remove();
        updateOrderTotal();
    });
}


/*---------------Product Entry Delete Listener------------------------------*/
// Use event delegation for dynamically added "Remove" buttons
const initializeProductSelectDeleteListener = () => {
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-product') ||
            event.target.closest('.remove-product')) {
            event.preventDefault();
            event.stopPropagation();

            const productEntry = event.target.closest('.product-entry');
            if (productEntry) {
                if (document.querySelectorAll('.product-entry').length === 1) {
                    alert('At least one product is required');
                    return;
                }

                // Smooth removal animation
                productEntry.style.opacity = '0';
                productEntry.style.transform = 'translateX(20px)';

                setTimeout(() => {
                    // Cleanup Select2 instance before removing element
                    const select = productEntry.querySelector('.product-select');
                    if ($(select).data('select2')) {
                        $(select).select2('destroy');
                    }
                    productEntry.remove();
                    updateOrderTotal();
      
                }, 300);
            }
        }
    });

    // Listen for quantity changes
    document.addEventListener('input', (event) => {
        if (event.target.classList.contains('product-quantity')) {
            const quantity = parseInt(event.target.value) || 0;
            if (quantity < 1) {
                event.target.value = 1;
            }
            updateProductSubtotal(event.target.closest('.product-entry'));
            updateOrderTotal();
        }
    });
}

// Export the initialization function
export { initializeProductSelectDeleteListener };

// Improved cleanup function
export function cleanup() {
    try {
        document.querySelectorAll('.product-select').forEach(select => {
            if ($(select).data('select2')) {
                $(select).select2('destroy');
            }
        });
        // Clear any pending requests
        if (window.currentProductRequest) {
            window.currentProductRequest.abort();
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

export const initializeProductSelect = (select, products) => {
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
        width: '100%'
    });
}


