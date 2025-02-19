// Fetch Controller Module
class FetchController {
    constructor() {
        this.controllers = new Map();
    }

    // Abort existing request for a given key
    abortRequest(key) {
        if (this.controllers.has(key)) {
            this.controllers.get(key).abort();
            this.controllers.delete(key);
        }
    }

    // Create new controller for a request
    createController(key) {
        this.abortRequest(key);
        const controller = new AbortController();
        this.controllers.set(key, controller);
        return controller.signal;
    }

    // Execute fetch with automatic controller management
    async fetch(key, url, options = {}) {
        const signal = this.createController(key);
        try {
            const response = await fetch(url, { ...options, signal });
            
            // Special handling for specific status codes
            switch (response.status) {
                case 204: // No Content
                    return true;
                case 404: // Not Found
                    const error404 = new Error('Resource not found');
                    error404.status = 404;
                    throw error404;
            }

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
                } catch {
                    errorMessage = `HTTP error! status: ${response.status}`;
                }

                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }

            // Check if response has content
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            }
            
            return true; // Return true for successful non-JSON responses

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`Request ${key} aborted`);
                return null;
            }
            // Ensure error always has a status property
            if (!error.status) {
                error.status = 500; // Internal Server Error as default
            }
            throw error;
        } finally {
            this.controllers.delete(key);
        }
    }

    // Cleanup all active controllers
    abortAll() {
        this.controllers.forEach(controller => controller.abort());
        this.controllers.clear();
    }
}

export default new FetchController();