export function initializePhoneInput() {
  const phoneInput = document.getElementById('phone-number');
  if (!phoneInput) return;
  
  phoneInput.addEventListener('input', formatPhoneNumber);
}

function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    
    // Auto-add country code if missing
    if (!value.startsWith('254') && value.length > 0) {
      value = value.startsWith('0') ? '254' + value.substring(1) : '254' + value;
    }
    
    // Limit to 12 digits (254 + 9 digits)
    value = value.substring(0, 12);
    
    // Format the number
    if (value.length > 3) {
      formatted += value.substring(0, 3) + ' ';
      value = value.substring(3);
    }
    
    if (value.length > 0) {
      formatted += value.match(/.{1,3}/g)?.join(' ') || '';
    }
    
    // Update input value
    e.target.value = formatted;
}
