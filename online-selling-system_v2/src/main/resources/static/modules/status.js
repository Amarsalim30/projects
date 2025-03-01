// Order status constants matching backend OrderStatus enum
export const ORDER_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
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
        // Payment status colors
        UNPAID: '#e74c3c', // red
        PARTIAL: '#f1c40f', // yellow
        PAID: '#27ae60' // green
    };
    
    const normalizedStatus = status.toUpperCase().trim();
    return colors[normalizedStatus] || '#95a5a6';
}
