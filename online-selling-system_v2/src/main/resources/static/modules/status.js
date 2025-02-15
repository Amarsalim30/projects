export function getStatusColor(status) {
  const colors = {
    'PENDING': '#ffa500',
    'COMPLETED': '#4CAF50',
    'CANCELLED': '#f44336',
    'IN_PROGRESS': '#2196F3'
  };
  return colors[status] || '#757575';
}
