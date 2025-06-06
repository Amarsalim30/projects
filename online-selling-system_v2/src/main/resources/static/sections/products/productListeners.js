import { hideSidebars } from "../../modules/navigation.js";
import { productBaseUrl } from "../../modules/apiConstants.js";
import { deleteProduct, fetchAndRenderProducts } from "./products.js";
import { productListBody } from "../../modules/domCaching.js";
import fetchController from "../../modules/fetchController.js";
import { showNotification } from '../../modules/utility.js';

export const initializeProductFormListener = () => {
    const form = document.getElementById("add-product-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const name = formData.get("name").trim();
        const stock = parseInt(formData.get("availability"));
        const price = parseFloat(formData.get("price"));

        // Validation
        if (!name) {
            alert("Product name is required");
            return;
        }
        if (isNaN(stock) || stock < 0) {
            alert("Valid stock number is required");
            return;
        }
        if (isNaN(price) || price <= 0) {
            alert("Valid price is required");
            return;
        }

        const newProduct = { name, stock, price };
        form.querySelector('button[type="submit"]').disabled = true;

        try {
            const response = await fetchController.fetch('createProduct', `${productBaseUrl}/new`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(newProduct),
            });

            if (response) {
                form.reset();
                hideSidebars();
                await fetchAndRenderProducts();
                showNotification('Product created successfully!', 'success');
            }
        } catch (error) {
            console.error("Create product error:", error);
            showNotification(`Failed to create product: ${error.message}`, 'error');
        } finally {
            form.querySelector('button[type="submit"]').disabled = false;
        }
    });
}

export const initializeProductDeletionListener = () => {
    productListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const productId = event.target.dataset.id;
            await deleteProduct(productId);
        }
    });
}
