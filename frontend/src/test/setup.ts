import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.alert
window.alert = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock global fetch to handle relative URLs and return default success
global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = input.toString();
  
  // Handle relative URLs by prepending a dummy origin
  if (url.startsWith('/')) {
    url = `http://localhost:3000${url}`;
  }

  // Default successful response structure matching ApiResponse interface
  const defaultResponse = {
    success: true,
    message: 'Operation successful',
    data: {
      token: 'mock-token',
      user: { id: 1, username: 'test_user' }
    }
  };

  return new Response(JSON.stringify(defaultResponse), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});
