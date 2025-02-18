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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`Request ${key} aborted`);
                return null;
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