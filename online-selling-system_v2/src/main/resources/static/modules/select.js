export function initializeAddProductToOrder(productBaseUrl, debounce) {
    //when add product button is clicked, create a product entry and append it to the product selection
    const addProductButton = document.getElementById("add-product");
    const productSelection = document.querySelector("#product-selection");
  
    addProductButton.addEventListener("click", debounce(() => {
      const productDiv = createProductEntry();
      productSelection.appendChild(productDiv);
      initializeSelect2(productDiv, productBaseUrl);
    }, 300));
  }
  
  function createProductEntry() {
    const productDiv = document.createElement("div");
    productDiv.classList.add("product-entry");
    productDiv.innerHTML = `
      <select class="product-select" required></select>
      <input type="number" class="product-quantity" placeholder="Quantity" required>
      <input type="number" class="product-price" placeholder="Price" required>
      <button type="button" class="remove-product">Remove</button>
    `;
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
            }
        } catch (error) {
            console.error("Error fetching product:", error);
        }
    });

    // Prevent event bubbling for the entire product entry
    $(container).on('click', function(e) {
        e.stopPropagation();
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