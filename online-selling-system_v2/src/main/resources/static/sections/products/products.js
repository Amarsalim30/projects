import { productBaseUrl } from "../../modules/apiConstants.js";
import { productListBody } from "../../modules/domCaching.js";
import fetchController from "../../modules/fetchController.js";

async function fetchAndRenderProducts() {
    try {
        const products = await fetchController.fetch('productList', productBaseUrl, { method: "GET" });
        if (!products) return;

        productListBody.innerHTML = ""; // Clear current list

        products.forEach((product) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(product.name)}</td>
                <td>${product.stock}</td>
                <td>${formatPrice(product.price)}</td>
                <td>
                    <button class="delete-btn btn btn-danger" data-id="${product.id}">
                        Delete
                    </button>
                </td>
            `;
            productListBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        showError("Failed to load products. Please try again.");
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetchController.fetch('deleteProduct', `${productBaseUrl}/${encodeURIComponent(productId)}`, { method: "DELETE" });
        
        if (!response) throw new Error("Failed to delete product");
        await fetchAndRenderProducts();
    } catch (error) {
        console.error("Delete product error:", error);
        showError("Failed to delete product. Please try again.");
    }
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showError(message) {
    alert(message);
}

export { fetchAndRenderProducts, deleteProduct };