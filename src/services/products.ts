import axios, { AxiosResponse } from 'axios';
import { IGetProductsResponse, IProduct } from 'models';
import { 
  errorHandler, 
  APIError, 
  NetworkError, 
  ValidationError,
  RetryConfig 
} from 'utils/error-handling';

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = 'https://react-shopping-cart-67954.firebaseio.com';
const API_TIMEOUT = 10000; // 10 seconds

// Custom retry config for products API
const PRODUCTS_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxRetryDelay: 8000,
};

// Enhanced axios instance with error handling
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and authentication
apiClient.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    errorHandler.logError(new NetworkError('Request configuration failed'), 'Request Interceptor');
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const apiError = errorHandler.parseAxiosError(error);
    errorHandler.logError(apiError, 'Response Interceptor');
    return Promise.reject(apiError);
  }
);

// Enhanced getProducts function with comprehensive error handling
export const getProducts = async (): Promise<IProduct[]> => {
  try {
    // Use cached data in development
    if (!isProduction) {
      try {
        const response = require('static/json/products.json');
        return response.data?.products || [];
      } catch (error) {
        throw new ValidationError('Failed to load local products data');
      }
    }

    // Production API call with retry mechanism
    return await errorHandler.retryWithBackoff(async () => {
      const response: AxiosResponse<IGetProductsResponse> = await apiClient.get('/products.json');
      
      // Validate response structure
      const validatedData = errorHandler.validateResponse(response, ['data']);
      
      if (!validatedData.data?.products) {
        throw new ValidationError('Invalid products data structure received');
      }

      // Validate each product has required fields
      const requiredFields = ['id', 'sku', 'title', 'price', 'availableSizes'];
      const invalidProducts = validatedData.data.products.filter(product => 
        requiredFields.some(field => !(field in product))
      );

      if (invalidProducts.length > 0) {
        throw new ValidationError(`Invalid product data: ${invalidProducts.length} products missing required fields`);
      }

      return validatedData.data.products;
    }, 0);

  } catch (error) {
    // Handle specific error types
    if (error instanceof APIError) {
      errorHandler.logError(error, 'getProducts');
      throw error;
    }

    // Handle unexpected errors
    const unexpectedError = new APIError(
      'An unexpected error occurred while fetching products',
      500,
      'UNEXPECTED_ERROR',
      true
    );
    errorHandler.logError(unexpectedError, 'getProducts');
    throw unexpectedError;
  }
};

// Enhanced function to get a single product by ID
export const getProductById = async (productId: number): Promise<IProduct> => {
  try {
    const products = await getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      throw new ValidationError(`Product with ID ${productId} not found`);
    }
    
    return product;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    const unexpectedError = new APIError(
      'An unexpected error occurred while fetching product',
      500,
      'UNEXPECTED_ERROR',
      true
    );
    errorHandler.logError(unexpectedError, 'getProductById');
    throw unexpectedError;
  }
};

// Enhanced function to get products by size filter
export const getProductsBySize = async (sizes: string[]): Promise<IProduct[]> => {
  try {
    const products = await getProducts();
    
    if (!sizes || sizes.length === 0) {
      return products;
    }
    
    const sizeSet = new Set(sizes);
    return products.filter(product => 
      product.availableSizes.some(size => sizeSet.has(size))
    );
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    const unexpectedError = new APIError(
      'An unexpected error occurred while filtering products',
      500,
      'UNEXPECTED_ERROR',
      true
    );
    errorHandler.logError(unexpectedError, 'getProductsBySize');
    throw unexpectedError;
  }
};

// Health check function for API availability
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    if (!isProduction) {
      return true; // Local development always healthy
    }

    const response = await apiClient.get('/products.json', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    errorHandler.logError(
      new NetworkError('API health check failed'),
      'checkAPIHealth'
    );
    return false;
  }
};

// Export error types for use in components
export { APIError, NetworkError, ValidationError } from 'utils/error-handling';
