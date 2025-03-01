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
        PENDING: '#f1c40f', // yellow
        IN_PROGRESS: '#3498db', // blue
        COMPLETED: '#27ae60', // green
        DELIVERED: '#2ecc71', // light green
        CANCELLED: '#e74c3c', // red
        PRODUCTION_STARTED: '#9b59b6', // purple
        PRODUCTION_COMPLETE: '#16a085', // teal
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
