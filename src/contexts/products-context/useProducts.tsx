import { useCallback, useMemo, useRef, useState } from 'react';

import { useProductsContext } from './ProductsContextProvider';
import { IProduct } from 'models';
import { getProducts, APIError, NetworkError, ValidationError } from 'services/products';

// Error state interface
interface ErrorState {
  message: string;
  type: 'network' | 'validation' | 'server' | 'unknown';
  isRetryable: boolean;
  retryCount: number;
}

const useProducts = () => {
  const {
    isFetching,
    setIsFetching,
    products,
    setProducts,
    filters,
    setFilters,
  } = useProductsContext();

  // Cache for all products to avoid repeated API calls
  const allProductsCache = useRef<IProduct[]>([]);
  const isInitialized = useRef(false);
  
  // Error state management
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle API errors with user-friendly messages
  const handleError = useCallback((error: unknown, context: string) => {
    let errorState: ErrorState;

    if (error instanceof NetworkError) {
      errorState = {
        message: 'Unable to connect to the server. Please check your internet connection.',
        type: 'network',
        isRetryable: true,
        retryCount: error.retryCount,
      };
    } else if (error instanceof ValidationError) {
      errorState = {
        message: 'Invalid data received. Please refresh the page.',
        type: 'validation',
        isRetryable: false,
        retryCount: 0,
      };
    } else if (error instanceof APIError) {
      errorState = {
        message: error.message,
        type: error.status && error.status >= 500 ? 'server' : 'unknown',
        isRetryable: error.isRetryable,
        retryCount: error.retryCount,
      };
    } else {
      errorState = {
        message: 'An unexpected error occurred. Please try again.',
        type: 'unknown',
        isRetryable: true,
        retryCount: 0,
      };
    }

    console.error(`Error in ${context}:`, error);
    setError(errorState);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsFetching(true);
      clearError();

      const products = await getProducts();
      allProductsCache.current = products;
      setProducts(products);
      isInitialized.current = true;
    } catch (error) {
      handleError(error, 'fetchProducts');
    } finally {
      setIsFetching(false);
    }
  }, [setIsFetching, setProducts, clearError, handleError]);

  // Retry mechanism for failed requests
  const retryFetch = useCallback(async () => {
    if (!error?.isRetryable) return;

    try {
      setIsRetrying(true);
      clearError();
      
      const products = await getProducts();
      allProductsCache.current = products;
      setProducts(products);
      isInitialized.current = true;
    } catch (error) {
      handleError(error, 'retryFetch');
    } finally {
      setIsRetrying(false);
    }
  }, [error, setProducts, clearError, handleError]);

  // Memoized filtering function with O(n) complexity and error handling
  const filterProducts = useCallback(async (newFilters: string[]) => {
    try {
      setIsFetching(true);
      clearError();

      // Use cached products if available, otherwise fetch
      const productsToFilter = allProductsCache.current.length > 0 
        ? Promise.resolve(allProductsCache.current)
        : getProducts().then((products: IProduct[]) => {
            allProductsCache.current = products;
            return products;
          });

      const products = await productsToFilter;
      
      let filteredProducts: IProduct[];

      if (newFilters && newFilters.length > 0) {
        // Optimized filtering: O(n) instead of O(n²)
        const filterSet = new Set(newFilters);
        filteredProducts = products.filter((product: IProduct) =>
          product.availableSizes.some((size: string) => filterSet.has(size))
        );
      } else {
        filteredProducts = products;
      }

      setFilters(newFilters);
      setProducts(filteredProducts);
    } catch (error) {
      handleError(error, 'filterProducts');
    } finally {
      setIsFetching(false);
    }
  }, [setIsFetching, setFilters, setProducts, clearError, handleError]);

  // Memoized filtered products to prevent unnecessary recalculations
  const filteredProducts = useMemo(() => {
    if (!filters || filters.length === 0) {
      return products;
    }

    const filterSet = new Set(filters);
    return products.filter((product: IProduct) =>
      product.availableSizes.some((size: string) => filterSet.has(size))
    );
  }, [products, filters]);

  // Memoized product count
  const productCount = useMemo(() => filteredProducts.length, [filteredProducts]);

  // Check if we have any products loaded
  const hasProducts = useMemo(() => products.length > 0, [products.length]);

  // Check if we're in a loading state
  const isLoading = useMemo(() => isFetching || isRetrying, [isFetching, isRetrying]);

  return {
    // Data
    products: filteredProducts,
    productCount,
    filters,
    hasProducts,
    
    // Loading states
    isFetching,
    isRetrying,
    isLoading,
    isInitialized: isInitialized.current,
    
    // Error handling
    error,
    clearError,
    retryFetch,
    
    // Actions
    fetchProducts,
    filterProducts,
  };
};

export default useProducts;
