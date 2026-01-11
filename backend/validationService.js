// Luhn algorithm for card number validation
function isValidCardNumber(cardNumber) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Expiry validation (MM/YY)
function isValidExpiry(expiry) {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

  const [mm, yy] = expiry.split("/").map(Number);
  if (mm < 1 || mm > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (yy < currentYear) return false;
  if (yy === currentYear && mm < currentMonth) return false;

  return true;
}

// CVV validation
function isValidCvv(cvv) {
  return /^\d{3,4}$/.test(cvv);
}
function detectCardNetwork(cardNumber) {
  if (/^4/.test(cardNumber)) return "VISA";
  if (/^5[1-5]/.test(cardNumber)) return "MASTERCARD";
  if (/^3[47]/.test(cardNumber)) return "AMEX";
  return "UNKNOWN";
}

module.exports = {
  isValidCardNumber,
  isValidExpiry,
  isValidCvv,
  detectCardNetwork
};
