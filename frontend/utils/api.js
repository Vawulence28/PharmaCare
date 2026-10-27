const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchFromApi(endpoint, options = {}) {
  // If endpoint already starts with /api, avoid duplication
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.replace('/api', '') : endpoint;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { success: false, error: { message: 'Invalid server response format' } };
  }

  if (!response.ok || !data.success) {
    const errorMessage = data.error?.message || `HTTP error! Status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}