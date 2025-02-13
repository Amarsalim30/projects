
// Fetch products and update the product list UI
async function fetchAndRenderProducts() {
    try {
      const response = await fetch(productBaseUrl);
      if (!response.ok) throw new Error("Failed to fetch products");
      const products = await response.json();
  
      productListBody.innerHTML = ""; // Clear current list
  
      // Render product rows
      products.forEach((product) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${product.name}</td>
          <td>${product.stock}</td>
          <td>${product.price}</td>
          <td><button class="delete-btn" data-id="${product.id}">Delete</button></td>
        `;
        productListBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Error fetching products");
    }
  }
  
  // Delete product
  async function deleteProduct(productId) {
    try {
      const response = await fetch(
        `${productBaseUrl}/${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete product");
      fetchAndRenderProducts();
    } catch (error) {
      console.error(error);
      alert("Error deleting product");
    }
  }
export { fetchAndRenderProducts, deleteProduct };  