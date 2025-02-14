/* --------------- Utility Functions ----------------- */

// Debounce utility to limit rapid function calls
function debounce(func, delay) {
    let debounceTimer;
    return function (...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
  // Throttle function to limit the rate of function calls
  function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function (...args) {
      const context = this;
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function () {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }

  // UI Helper: Hide all sidebars
function hideSidebars() {
    document.querySelectorAll(".sidebar").forEach((sidebar) => {
      sidebar.classList.remove("active");
    });
  }
  
    // Show loading spinner
    function showLoadingSpinner() {
      const spinner = document.getElementById("loading-spinner");
      if (spinner) {
        spinner.style.display = "block";
      }
    }
  
    // Hide loading spinner
    function hideLoadingSpinner() {
      const spinner = document.getElementById("loading-spinner");
      if (spinner) {
        spinner.style.display = "none";
      }
    }
export{hideSidebars,throttle,debounce,showLoadingSpinner,hideLoadingSpinner};
