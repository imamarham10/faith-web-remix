// Environment variables configuration
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  APP_NAME: 'Unified Faith Service',
  APP_VERSION: '1.0.0',
} as const;
