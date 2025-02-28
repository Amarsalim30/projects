export const PHONE_CONFIG = {
    CODE: '+254',
    LENGTH: 9,
    PATTERN: /^[17][0-9]{8}$/,
    ERROR_MESSAGE: 'Please enter a valid Kenyan phone number (must start with 7 or 1, e.g., 7XX XXX XXX or 1XX XXX XXX)',
    formatDisplay: (number) => {
        const digits = number?.replace(/\D/g, '') || '';
        return digits ? digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3').trim() : '';
    },
    formatFullNumber: (number) => {
        // Clean the number and remove any existing country code
        let digits = number?.replace(/\D/g, '') || '';
        if (digits.startsWith('254')) digits = digits.substring(3);
        return digits ? `+254 ${digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`.trim() : '';
    },
    cleanNumber: (number) => {
        let cleaned = number.replace(/\D/g, '');
        // Remove country code if present
        if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
        return cleaned;
    },
    isValidNumber: (number) => {
        const cleaned = number.replace(/\D/g, '');
        return cleaned.length === 9 && /^[17][0-9]{8}$/.test(cleaned);
    },
    validateInput: (value) => {
        const cleaned = (value || '').replace(/\D/g, '');
        if (!cleaned) return { isValid: false, message: 'Phone number is required' };
        if (cleaned.length !== 9) return { isValid: false, message: 'Phone number must be 9 digits' };
        if (!/^[17]/.test(cleaned)) return { isValid: false, message: 'Phone number must start with 7 or 1' };
        if (!/^[17][0-9]{8}$/.test(cleaned)) return { isValid: false, message: PHONE_CONFIG.ERROR_MESSAGE };
        return { isValid: true, message: '' };
    }
};

export function initializePhoneInput() {
    const phoneInput = document.getElementById('phone-number');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', formatPhoneNumber);
    phoneInput.addEventListener('blur', validatePhoneNumber);
}

/*
Example Flow:
1. User types: "0712345678"
   - Strips leading 0
   - Result: "712 345 678"

2. User types: "254712345678"
   - Strips "254"
   - Result: "712 345 678"

3. User pastes: "+254712345678"
   - Strips "+254"
   - Result: "712 345 678"

4. User types: "123456789"
   - Invalid (doesn't start with 7 or 1)
   - Shows error: "Phone number must start with 7 or 1"

5. User types gradually:
   7     -> valid, no spaces
   71    -> valid, no spaces
   712   -> valid, becomes "712"
   7123  -> valid, becomes "712 3"
   71234 -> valid, becomes "712 34"
   ...and so on
*/

function formatPhoneNumber(e) {
    if (!e.target) return;
    
    // Store cursor position before formatting
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    
    let value = e.target.value;
    const previousValue = value;
    
    // Remove non-digits and format
    value = value.replace(/[^\d]/g, '');
    if (value.startsWith('254')) value = value.substring(3);
    if (value.startsWith('0')) value = value.substring(1);
    value = value.substring(0, 9);
    
    // Format with spaces
    const formatted = value.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
    
    // Only update if value changed
    if (formatted !== previousValue) {
        e.target.value = formatted;
        
        // Restore cursor position
        if (start && end) {
            const offset = formatted.length - previousValue.length;
            e.target.setSelectionRange(start + offset, end + offset);
        }
    }
    
    // Validate
    const validation = PHONE_CONFIG.validateInput(value);
    e.target.setCustomValidity(validation.message);
    e.target.classList.toggle('invalid', !validation.isValid);
}

/*
Validation States:
1. Empty: "Phone number is required"
2. Too Short: "Phone number must be 9 digits"
3. Invalid Start: "Phone number must start with 7 or 1"
4. Invalid Format: "Please enter a valid Kenyan phone number..."
5. Valid: No error message

Storage Format: "+254712345678"
Display Format: "+254 712 345 678"
Input Format: "712 345 678"
*/

function validatePhoneNumber(e) {
    const value = e.target.value.replace(/\s/g, '');
    const validation = PHONE_CONFIG.validateInput(value);
    
    e.target.setCustomValidity(validation.message);
    e.target.reportValidity();
    
    if (validation.isValid) {
        e.target.classList.remove('invalid');
    } else {
        e.target.classList.add('invalid');
    }
}
