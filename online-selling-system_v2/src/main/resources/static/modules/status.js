// Order status constants matching backend OrderStatus enum
export const ORDER_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    PRODUCTION_STARTED: 'PRODUCTION_STARTED',
    PRODUCTION_COMPLETE: 'PRODUCTION_COMPLETE'
};

// Payment status constants matching backend PaymentStatus enum
export const PAYMENT_STATUS = {
    UNPAID: 'UNPAID',
    PARTIAL: 'PARTIAL',
    PAID: 'PAID'
};

// Color mapping for status visualization
export function getStatusColor(status) {
    if (!status) return '#95a5a6'; // Default gray
    
    const colors = {
        // Order status colors
        PENDING: '#27ae60', // green
        IN_PROGRESS: '#27ae60', // green
        COMPLETED: '#95a5a6', // grey
        DELIVERED: '#95a5a6', // grey
        CANCELLED: '#e74c3c', // red
        PRODUCTION_STARTED: '#27ae60', // green
        PRODUCTION_COMPLETE: '#95a5a6', // grey
        // Payment status colors
        UNPAID: '#e74c3c', // red
        PARTIAL: '#f1c40f', // yellow
        PAID: '#27ae60' // green
    };
    
    // Normalize status by removing spaces and converting to uppercase
    const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');
    const color = colors[normalizedStatus] || '#95a5a6';
    console.log(`Original Status: ${status}, Normalized: ${normalizedStatus}, Color: ${color}`);
    return color;
}
