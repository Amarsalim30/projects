export function initializeAddProductToOrder(productBaseUrl, debounce) {
    //when add product button is clicked, create a product entry and append it to the product selection
    const addProductButton = document.getElementById("add-product");
    const productSelection = document.querySelector("#product-selection");
  
    addProductButton.addEventListener("click", debounce(() => {
      const productDiv = createProductEntry();
      productSelection.appendChild(productDiv);
      initializeSelect2(productDiv, productBaseUrl);
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
    quantityInput.addEventListener('change', () => {
        updateOrderTotal();
    });

    return productDiv;
  }
  
  function initializeSelect2(container, productBaseUrl) {
    const select = container.querySelector(".product-select");
    
    $(select).select2({
        placeholder: "Select a product",
        allowClear: true,
        minimumInputLength: 1,
        dropdownParent: $('#add-order-sidebar'),
        ajax: {
            url: productBaseUrl,
            dataType: 'json',
            delay: 250,
            data: (params) => ({ searchTerm: params.term }),
            processResults: (data) => ({
                results: data.map(product => ({
                    id: product.id,
                    text: product.name || `Product ${product.id}`
                }))
            }),
            cache: true
        }
    }).on('select2:open', function() {
        document.querySelector('.select2-search__field').focus();
    }).on('select2:select', async (e) => {
        e.stopPropagation();
        const productId = e.params.data.id;
        const entry = e.target.closest('.product-entry');
        if (!entry) return;

        try {
            const response = await fetch(`${productBaseUrl}/${productId}`);
            const product = await response.json();
            if (product.price) {
                entry.querySelector('.product-price').value = product.price;
                updateProductSubtotal(entry);
                updateOrderTotal();
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            alert("Failed to fetch product details");
        }
    });

    // Add loading indicator
    select.insertAdjacentHTML('afterend', '<div class="select-loading" style="display:none">Loading...</div>');
    
    // Prevent event bubbling for the entire product entry
    $(container).on('click', function(e) {
        e.stopPropagation();
    });
  }

function initializeRemoveProduct(productDiv) {
    const removeButton = productDiv.querySelector('.remove-product');
    removeButton.addEventListener('click', () => {
        productDiv.remove();
        updateOrderTotal();
    });
}

export function initializeSelectCustomer(customerBaseUrl) {
    const select = $("#select-customer");
    
    select.select2({
        placeholder: "Select a customer",
        allowClear: true,
        dropdownParent: $('#add-order-sidebar'),
        ajax: {
            url: customerBaseUrl,
            dataType: "json",
            delay: 250,
            data: function (params) {
                return { search: params.term };
            },
            processResults: function (data) {
                return {
                    results: data.map(customer => ({
                        id: customer.id,
                        text: customer.name + ' (' + customer.number + ')'
                    }))
                };
            },
            cache: true
        },
        minimumInputLength: 1
    });

    // Prevent sidebar from closing when interacting with Select2
    $(document).on('click', '.select2-container, .select2-dropdown, .select2-search__field', function(e) {
        e.stopPropagation();
    });
}