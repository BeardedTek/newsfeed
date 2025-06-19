/**
 * API utility functions for making authenticated requests
 */

// Base URL for API requests
const API_BASE = '/api';

// Default options for fetch requests
const defaultOptions: RequestInit = {
  credentials: 'include', // Always include cookies
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Make a GET request to the API
 * @param endpoint - API endpoint path (without /api prefix)
 * @param options - Additional fetch options
 * @returns Promise with the response data
 */
export async function apiGet<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
  
  // Ensure credentials are included
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    credentials: 'include' as RequestCredentials, // Always include cookies
    method: 'GET',
  };
  
  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Make a POST request to the API
 * @param endpoint - API endpoint path (without /api prefix)
 * @param data - Data to send in the request body
 * @param options - Additional fetch options
 * @returns Promise with the response data
 */
export async function apiPost<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
  
  // Ensure credentials are included
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    credentials: 'include' as RequestCredentials, // Always include cookies
    method: 'POST',
    body: JSON.stringify(data),
  };
  
  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Make a PUT request to the API
 * @param endpoint - API endpoint path (without /api prefix)
 * @param data - Data to send in the request body
 * @param options - Additional fetch options
 * @returns Promise with the response data
 */
export async function apiPut<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
  
  // Ensure credentials are included
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    credentials: 'include' as RequestCredentials, // Always include cookies
    method: 'PUT',
    body: JSON.stringify(data),
  };
  
  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Make a DELETE request to the API
 * @param endpoint - API endpoint path (without /api prefix)
 * @param options - Additional fetch options
 * @returns Promise with the response data
 */
export async function apiDelete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
  
  // Ensure credentials are included
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    credentials: 'include' as RequestCredentials, // Always include cookies
    method: 'DELETE',
  };
  
  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
} 