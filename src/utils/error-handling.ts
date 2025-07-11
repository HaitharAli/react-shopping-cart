import axios, { AxiosError, AxiosResponse } from 'axios';

// Custom error classes for different types of errors
export class APIError extends Error {
  public status?: number;
  public code?: string;
  public isRetryable: boolean;
  public retryCount: number;

  constructor(
    message: string,
    status?: number,
    code?: string,
    isRetryable: boolean = false,
    retryCount: number = 0
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.isRetryable = isRetryable;
    this.retryCount = retryCount;
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network connection failed', retryCount: number = 0) {
    super(message, undefined, 'NETWORK_ERROR', true, retryCount);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string = 'Invalid data received') {
    super(message, 400, 'VALIDATION_ERROR', false);
    this.name = 'ValidationError';
  }
}

export class ServerError extends APIError {
  constructor(message: string = 'Server error occurred', status: number = 500) {
    super(message, status, 'SERVER_ERROR', true);
    this.name = 'ServerError';
  }
}

// Error message mapping for user-friendly messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server is temporarily unavailable. Please try again later.',
  VALIDATION_ERROR: 'Invalid data received. Please refresh the page.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxRetryDelay: 10000,
};

// Error handler utility
export class ErrorHandler {
  private static instance: ErrorHandler;
  private retryConfig: RetryConfig;

  private constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig;
  }

  static getInstance(retryConfig?: RetryConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(retryConfig);
    }
    return ErrorHandler.instance;
  }

  // Parse axios error and convert to custom error
  parseAxiosError(error: AxiosError): APIError {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new NetworkError(ERROR_MESSAGES.TIMEOUT_ERROR);
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
      return new NetworkError(ERROR_MESSAGES.NETWORK_ERROR);
    }

    const status = error.response.status;
    const message = this.getErrorMessage(status, error.response.data);

    switch (status) {
      case 400:
        return new ValidationError(message);
      case 401:
        return new APIError(message, status, 'UNAUTHORIZED', false);
      case 403:
        return new APIError(message, status, 'FORBIDDEN', false);
      case 404:
        return new APIError(message, status, 'NOT_FOUND', false);
      case 429:
        return new APIError(message, status, 'RATE_LIMIT', true);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message, status);
      default:
        return new APIError(message, status, 'UNKNOWN_ERROR', true);
    }
  }

  // Get user-friendly error message
  getErrorMessage(status: number, data?: any): string {
    if (data?.message) {
      return data.message;
    }

    switch (status) {
      case 400:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 429:
        return ERROR_MESSAGES.RATE_LIMIT;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  // Retry mechanism with exponential backoff
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const apiError = error instanceof APIError ? error : this.parseAxiosError(error as AxiosError);
      
      if (!apiError.isRetryable || retryCount >= this.retryConfig.maxRetries) {
        throw apiError;
      }

      const delay = Math.min(
        this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
        this.retryConfig.maxRetryDelay
      );

      console.warn(`Retrying operation (${retryCount + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryWithBackoff(operation, retryCount + 1);
    }
  }

  // Validate response data
  validateResponse<T extends Record<string, any>>(response: AxiosResponse<T>, expectedStructure?: string[]): T {
    if (!response.data) {
      throw new ValidationError('Empty response received');
    }

    if (expectedStructure) {
      const missingFields = expectedStructure.filter(field => 
        !(field in response.data)
      );
      
      if (missingFields.length > 0) {
        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
      }
    }

    return response.data;
  }

  // Log error for debugging (in development)
  logError(error: APIError, context?: string): void {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error(`🚨 API Error${context ? ` (${context})` : ''}:`, {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code,
        isRetryable: error.isRetryable,
        retryCount: error.retryCount,
        stack: error.stack,
      });
    }
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance(); 