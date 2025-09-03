// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
const API_BASE_URL = "http://localhost:8000/api";

const getAuthToken = () => localStorage.getItem('authToken');

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = getAuthToken();
    
    const headers = new Headers(options.headers || {});
    // Do NOT set Content-Type if body is FormData, as the browser needs to set it with the correct boundary.
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    headers.set('Accept', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Intercept 401 Unauthorized responses to redirect to login
    if (response.status === 401) {
        localStorage.removeItem('authToken');
        // Use replace to prevent the user from navigating back to the broken page
        window.location.replace('/login'); 
        // Throw an error to prevent further processing in the call stack
        throw new Error('Session expired. Redirecting to login.');
    }

    const text = await response.text();
    // Handle empty response body for success cases (e.g., DELETE 204 No Content)
    if (!text) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return {} as T;
    }

    const responseData = JSON.parse(text);

    if (!response.ok) {
        // Use the message from the JSON error response if available
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }
    
    // Always return the full, raw response data. Unwrapping is handled by consumer hooks.
    return responseData;
};

const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    del: <T>(endpoint:string) => request<T>(endpoint, { method: 'DELETE' }),
    postForm: <T>(endpoint: string, body: FormData) => request<T>(endpoint, { method: 'POST', body }),
};

export default api;