export function initializePhoneInput() {
  const phoneInput = document.getElementById('phone-number');
  if (!phoneInput) return;
  
  phoneInput.addEventListener('input', formatPhoneNumber);
  phoneInput.addEventListener('blur', validatePhoneNumber);
}

function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (!value.startsWith('254') && value.length > 0) {
      value = value.startsWith('0') ? '254' + value.substring(1) : '254' + value;
    }
    
    value = value.substring(0, 12);
    
    if (value.length > 0) {
      const prefix = '+254';
      const rest = value.substring(3);
      e.target.value = prefix + (rest ? ' ' + rest.match(/.{1,3}/g)?.join(' ') : '');
    }
    
    // Clear validation message while typing
    e.target.setCustomValidity('');
}

function validatePhoneNumber(e) {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length > 0 && (value.length !== 12 || !value.startsWith('254'))) {
        e.target.setCustomValidity('Please enter a valid Kenyan phone number (+254 XXX XXX XXX)');
        e.target.reportValidity();
    }
}
