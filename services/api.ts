const API_BASE_URL = 'https://2216f6871b00.ngrok-free.app/api';

const getAuthToken = () => localStorage.getItem('authToken');

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = getAuthToken();
    
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Attempt to parse the JSON body, which is expected for both success and error cases.
    const responseData = await response.json().catch(() => ({ 
        message: 'The server returned a non-JSON or empty response.',
        data: null
    }));

    if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }
    
    // Per the API specification, the actual payload is nested in the `data` property.
    return responseData.data;
};

const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    del: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export default api;