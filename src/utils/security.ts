// Security utilities for input validation, XSS prevention, and data sanitization

// HTML entity encoding for XSS prevention
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// Sanitize HTML content to prevent XSS
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[&<>"'`=\/]/g, (char) => htmlEntities[char] || char);
};

// Validate and sanitize product title
export const sanitizeProductTitle = (title: string): string => {
  if (typeof title !== 'string') {
    return 'Unknown Product';
  }
  
  // Remove any HTML tags and sanitize
  const cleanTitle = title.replace(/<[^>]*>/g, '');
  const sanitized = sanitizeHtml(cleanTitle);
  
  // Limit length to prevent overflow attacks
  return sanitized.length > 100 ? sanitized.substring(0, 100) + '...' : sanitized;
};

// Validate and sanitize product description
export const sanitizeProductDescription = (description: string): string => {
  if (typeof description !== 'string') {
    return '';
  }
  
  // Remove any HTML tags and sanitize
  const cleanDescription = description.replace(/<[^>]*>/g, '');
  const sanitized = sanitizeHtml(cleanDescription);
  
  // Limit length
  return sanitized.length > 500 ? sanitized.substring(0, 500) + '...' : sanitized;
};

// Validate product ID (must be positive integer)
export const validateProductId = (id: any): number | null => {
  const numId = Number(id);
  if (Number.isInteger(numId) && numId > 0 && numId <= Number.MAX_SAFE_INTEGER) {
    return numId;
  }
  return null;
};

// Validate product SKU (must be positive integer)
export const validateProductSku = (sku: any): number | null => {
  const numSku = Number(sku);
  if (Number.isInteger(numSku) && numSku > 0 && numSku <= Number.MAX_SAFE_INTEGER) {
    return numSku;
  }
  return null;
};

// Validate product price (must be positive number with reasonable limits)
export const validateProductPrice = (price: any): number | null => {
  const numPrice = Number(price);
  if (Number.isFinite(numPrice) && numPrice >= 0 && numPrice <= 1000000) {
    return Math.round(numPrice * 100) / 100; // Round to 2 decimal places
  }
  return null;
};

// Validate product quantity (must be positive integer with reasonable limits)
export const validateProductQuantity = (quantity: any): number | null => {
  const numQuantity = Number(quantity);
  if (Number.isInteger(numQuantity) && numQuantity > 0 && numQuantity <= 1000) {
    return numQuantity;
  }
  return null;
};

// Validate currency ID (must be valid 3-letter currency code)
export const validateCurrencyId = (currencyId: any): string | null => {
  if (typeof currencyId !== 'string') {
    return null;
  }
  
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'];
  const sanitized = currencyId.toUpperCase().trim();
  
  if (validCurrencies.includes(sanitized)) {
    return sanitized;
  }
  return null;
};

// Validate currency format (must be safe string)
export const validateCurrencyFormat = (format: any): string | null => {
  if (typeof format !== 'string') {
    return null;
  }
  
  const sanitized = sanitizeHtml(format.trim());
  if (sanitized.length > 0 && sanitized.length <= 10) {
    return sanitized;
  }
  return null;
};

// Validate available sizes (must be array of safe strings)
export const validateAvailableSizes = (sizes: any): string[] => {
  if (!Array.isArray(sizes)) {
    return [];
  }
  
  const validSizes = ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL'];
  return sizes
    .filter(size => typeof size === 'string' && validSizes.includes(size.toUpperCase()))
    .map(size => size.toUpperCase())
    .slice(0, 10); // Limit to prevent abuse
};

// Validate product style (must be safe string)
export const validateProductStyle = (style: any): string | null => {
  if (typeof style !== 'string') {
    return null;
  }
  
  const sanitized = sanitizeHtml(style.trim());
  if (sanitized.length > 0 && sanitized.length <= 50) {
    return sanitized;
  }
  return null;
};

// Validate boolean values
export const validateBoolean = (value: any): boolean => {
  return Boolean(value);
};

// Validate image source URL
export const validateImageSource = (src: any): string | null => {
  if (typeof src !== 'string') {
    return null;
  }
  
  // Only allow local static images or HTTPS URLs
  if (src.startsWith('static/') || src.startsWith('https://')) {
    // Additional validation for external URLs
    if (src.startsWith('https://')) {
      try {
        const url = new URL(src);
        // Only allow specific domains or localhost for development
        const allowedDomains = ['localhost', '127.0.0.1', 'firebaseio.com'];
        const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));
        
        if (!isAllowed) {
          return null;
        }
      } catch {
        return null; // Invalid URL
      }
    }
    
    return src;
  }
  
  return null;
};

// Comprehensive product validation
export const validateProduct = (product: any): {
  isValid: boolean;
  sanitizedProduct?: any;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!product || typeof product !== 'object') {
    return { isValid: false, errors: ['Invalid product data'] };
  }
  
  const validatedProduct: any = {};
  
  // Validate ID
  const id = validateProductId(product.id);
  if (id === null) {
    errors.push('Invalid product ID');
  } else {
    validatedProduct.id = id;
  }
  
  // Validate SKU
  const sku = validateProductSku(product.sku);
  if (sku === null) {
    errors.push('Invalid product SKU');
  } else {
    validatedProduct.sku = sku;
  }
  
  // Validate title
  const title = sanitizeProductTitle(product.title);
  if (!title || title === 'Unknown Product') {
    errors.push('Invalid product title');
  } else {
    validatedProduct.title = title;
  }
  
  // Validate description
  validatedProduct.description = sanitizeProductDescription(product.description);
  
  // Validate price
  const price = validateProductPrice(product.price);
  if (price === null) {
    errors.push('Invalid product price');
  } else {
    validatedProduct.price = price;
  }
  
  // Validate installments
  const installments = validateProductQuantity(product.installments);
  if (installments === null) {
    validatedProduct.installments = 0;
  } else {
    validatedProduct.installments = installments;
  }
  
  // Validate currency ID
  const currencyId = validateCurrencyId(product.currencyId);
  if (currencyId === null) {
    errors.push('Invalid currency ID');
    validatedProduct.currencyId = 'USD'; // Default fallback
  } else {
    validatedProduct.currencyId = currencyId;
  }
  
  // Validate currency format
  const currencyFormat = validateCurrencyFormat(product.currencyFormat);
  if (currencyFormat === null) {
    errors.push('Invalid currency format');
    validatedProduct.currencyFormat = '$'; // Default fallback
  } else {
    validatedProduct.currencyFormat = currencyFormat;
  }
  
  // Validate available sizes
  validatedProduct.availableSizes = validateAvailableSizes(product.availableSizes);
  
  // Validate style
  const style = validateProductStyle(product.style);
  if (style === null) {
    errors.push('Invalid product style');
    validatedProduct.style = 'Unknown';
  } else {
    validatedProduct.style = style;
  }
  
  // Validate free shipping flag
  validatedProduct.isFreeShipping = validateBoolean(product.isFreeShipping);
  
  return {
    isValid: errors.length === 0,
    sanitizedProduct: validatedProduct,
    errors
  };
};

// Validate cart product (extends product validation)
export const validateCartProduct = (cartProduct: any): {
  isValid: boolean;
  sanitizedProduct?: any;
  errors: string[];
} => {
  const productValidation = validateProduct(cartProduct);
  
  if (!productValidation.isValid) {
    return productValidation;
  }
  
  const errors = [...productValidation.errors];
  const validatedCartProduct = { ...productValidation.sanitizedProduct };
  
  // Validate quantity
  const quantity = validateProductQuantity(cartProduct.quantity);
  if (quantity === null) {
    errors.push('Invalid product quantity');
  } else {
    validatedCartProduct.quantity = quantity;
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedProduct: validatedCartProduct,
    errors
  };
};

// Safe JSON parsing with validation
export const safeJsonParse = (jsonString: string): any => {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch {
    return null;
  }
};

// Content Security Policy helper
export const getCSPDirectives = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://react-shopping-cart-67954.firebaseio.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}; 