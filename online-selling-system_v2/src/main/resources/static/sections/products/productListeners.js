import { hideSidebars } from "../../modules/navigation.js";
import { productBaseUrl } from "../../modules/apiConstants.js";
import { deleteProduct, fetchAndRenderProducts } from "./products.js";
import { productListBody } from "../../modules/domCaching.js";
import fetchController from "../../modules/fetchController.js";

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
            const response = await fetchController.fetch('addProduct', `${productBaseUrl}/new`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProduct),
            });

            if (!response) throw new Error("Failed to add product");

            event.target.reset();
            hideSidebars();
            await fetchAndRenderProducts();
        } catch (error) {
            console.error("Add product error:", error);
            alert("Error adding product: " + error.message);
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
