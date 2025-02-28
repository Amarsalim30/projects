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
    const colors = {
        // Order status colors
        PENDING: '#f1c40f',
        IN_PROGRESS: '#3498db',
        COMPLETED: '#27ae60',
        DELIVERED: '#2ecc71',
        CANCELLED: '#e74c3c',
        // Payment status colors
        UNPAID: '#e74c3c',
        PARTIAL: '#f1c40f',
        PAID: '#27ae60'
    };
    return colors[status] || '#95a5a6';
}
