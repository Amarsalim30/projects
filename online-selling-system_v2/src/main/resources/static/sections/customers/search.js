import { customerBaseUrl } from '../../modules/apiConstants.js';
import { debounce, showLoadingSpinner, hideLoadingSpinner } from '../../modules/utility.js';
import { updateCustomerList } from './customers.js';

export function initializeCustomerSearch() {
  let searchCustomerController;
  const searchCache = new Map();
  const MAX_CACHE_SIZE = 100;
  
  function cleanupCache() {
    if (searchCache.size > MAX_CACHE_SIZE) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }
  }

  const searchCustomerInput = document.querySelector("#search-customer");
  if (!searchCustomerInput) return;

  searchCustomerInput.addEventListener("input", debounce(async (event) => {
    const searchValue = event.target.value.trim();
    if (searchValue.length < 3) return;

    if (searchCustomerController) {
      searchCustomerController.abort();
    }
    searchCustomerController = new AbortController();

    if (searchCache.has(searchValue)) {
      updateCustomerList(searchCache.get(searchValue));
      return;
    }

    const params = new URLSearchParams();
    !isNaN(Number(searchValue)) ? params.append("number", searchValue) : params.append("name", searchValue);

    try {
      showLoadingSpinner();
      const response = await fetch(`${customerBaseUrl}/search?${params}`, { 
        signal: searchCustomerController.signal 
      });
      if (!response.ok) throw new Error("Failed to fetch customers");

      const data = await response.json();
      searchCache.set(searchValue, data);
      cleanupCache(); // Clean up cache if it exceeds size limit
      updateCustomerList(data);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
        alert("Error fetching customers");
      }
    } finally {
      hideLoadingSpinner();
    }
  }, 300));
}
