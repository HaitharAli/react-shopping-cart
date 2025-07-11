import { useCartContext } from './CartContextProvider';
import useCartTotal from './useCartTotal';
import { ICartProduct } from 'models';
import { validateCartProduct, validateProduct } from 'utils/security';

const useCartProducts = () => {
  const { products, setProducts } = useCartContext();
  const { updateCartTotal } = useCartTotal();

  const updateQuantitySafely = (
    currentProduct: ICartProduct,
    targetProduct: ICartProduct,
    quantity: number
  ): ICartProduct => {
    // Security: Validate both products before processing
    const currentValidation = validateCartProduct(currentProduct);
    const targetValidation = validateCartProduct(targetProduct);
    
    if (!currentValidation.isValid || !targetValidation.isValid) {
      console.error('Invalid product data detected:', {
        currentErrors: currentValidation.errors,
        targetErrors: targetValidation.errors
      });
      return currentProduct; // Return unchanged if validation fails
    }
    
    if (currentProduct.id === targetProduct.id) {
      // Security: Validate quantity before arithmetic operation
      const newQuantity = currentProduct.quantity + quantity;
      if (newQuantity <= 0 || newQuantity > 1000) {
        console.error('Invalid quantity calculation detected');
        return currentProduct; // Return unchanged if quantity is invalid
      }
      
      return {
        ...currentProduct,
        quantity: newQuantity,
      };
    }
    return currentProduct;
  };

  const addProduct = (newProduct: ICartProduct) => {
    // Security: Validate input product before processing
    const validation = validateCartProduct(newProduct);
    if (!validation.isValid) {
      console.error('Invalid product data rejected:', validation.errors);
      throw new Error(`Invalid product data: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedProduct = validation.sanitizedProduct;
    
    // Security: Validate existing products array
    if (!Array.isArray(products)) {
      console.error('Invalid products array detected');
      return;
    }
    
    // Performance optimization: Use findIndex instead of some + map
    const existingProductIndex = products.findIndex(
      (product: ICartProduct) => {
        // Security: Validate each product in the array
        const productValidation = validateCartProduct(product);
        if (!productValidation.isValid) {
          console.error('Invalid product in cart detected:', productValidation.errors);
          return false; // Skip invalid products
        }
        return sanitizedProduct.id === product.id;
      }
    );

    let updatedProducts: ICartProduct[];

    if (existingProductIndex !== -1) {
      // Update existing product quantity
      updatedProducts = products.map((product: ICartProduct, index: number) => {
        // Security: Validate each product before processing
        const productValidation = validateCartProduct(product);
        if (!productValidation.isValid) {
          console.error('Invalid product in cart detected:', productValidation.errors);
          return product; // Return unchanged if invalid
        }
        
        if (index === existingProductIndex) {
          const newQuantity = product.quantity + sanitizedProduct.quantity;
          // Security: Validate quantity limits
          if (newQuantity > 1000) {
            console.error('Quantity limit exceeded');
            return product; // Return unchanged if limit exceeded
          }
          
          return {
            ...product,
            quantity: newQuantity,
          };
        }
        return product;
      });
    } else {
      // Security: Validate array length to prevent memory attacks
      if (products.length >= 100) {
        console.error('Cart limit exceeded');
        throw new Error('Cart is full. Please remove some items before adding more.');
      }
      
      // Add new product
      updatedProducts = [...products, sanitizedProduct];
    }

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  const removeProduct = (productToRemove: ICartProduct) => {
    // Security: Validate input product
    const validation = validateCartProduct(productToRemove);
    if (!validation.isValid) {
      console.error('Invalid product data for removal:', validation.errors);
      return;
    }
    
    const updatedProducts = products.filter((product: ICartProduct) => {
      // Security: Validate each product before comparison
      const productValidation = validateCartProduct(product);
      if (!productValidation.isValid) {
        console.error('Invalid product in cart detected during removal:', productValidation.errors);
        return false; // Remove invalid products
      }
      return product.id !== validation.sanitizedProduct.id;
    });

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  const increaseProductQuantity = (productToIncrease: ICartProduct) => {
    // Security: Validate input product
    const validation = validateCartProduct(productToIncrease);
    if (!validation.isValid) {
      console.error('Invalid product data for quantity increase:', validation.errors);
      return;
    }
    
    const updatedProducts = products.map((product: ICartProduct) => {
      // Security: Validate each product before processing
      const productValidation = validateCartProduct(product);
      if (!productValidation.isValid) {
        console.error('Invalid product in cart detected during quantity increase:', productValidation.errors);
        return product; // Return unchanged if invalid
      }
      
      return updateQuantitySafely(product, validation.sanitizedProduct, 1);
    });

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  const decreaseProductQuantity = (productToDecrease: ICartProduct) => {
    // Security: Validate input product
    const validation = validateCartProduct(productToDecrease);
    if (!validation.isValid) {
      console.error('Invalid product data for quantity decrease:', validation.errors);
      return;
    }
    
    const updatedProducts = products.map((product: ICartProduct) => {
      // Security: Validate each product before processing
      const productValidation = validateCartProduct(product);
      if (!productValidation.isValid) {
        console.error('Invalid product in cart detected during quantity decrease:', productValidation.errors);
        return product; // Return unchanged if invalid
      }
      
      return updateQuantitySafely(product, validation.sanitizedProduct, -1);
    });

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  // Security: Validate entire cart state
  const validateCartState = (): boolean => {
    if (!Array.isArray(products)) {
      console.error('Invalid cart state: products is not an array');
      return false;
    }
    
    for (const product of products) {
      const validation = validateCartProduct(product);
      if (!validation.isValid) {
        console.error('Invalid product in cart state:', validation.errors);
        return false;
      }
    }
    
    return true;
  };

  // Security: Get sanitized products for rendering
  const getSanitizedProducts = (): ICartProduct[] => {
    return products.map(product => {
      const validation = validateCartProduct(product);
      return validation.isValid ? validation.sanitizedProduct : {
        id: 0,
        sku: 0,
        title: 'Invalid Product',
        description: '',
        availableSizes: [],
        style: 'Unknown',
        price: 0,
        installments: 0,
        currencyId: 'USD',
        currencyFormat: '$',
        isFreeShipping: false,
        quantity: 0
      };
    });
  };

  return {
    products: getSanitizedProducts(),
    addProduct,
    removeProduct,
    increaseProductQuantity,
    decreaseProductQuantity,
    validateCartState,
  };
};

export default useCartProducts;
