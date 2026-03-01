const API_URL = '/api/auth';

export const login = async (email: string, password: string) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');
            return data;
        } else {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
    } catch (error: any) {
        console.error("Login error:", error);
        throw error;
    }
};

export const register = async (email: string, password: string) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');
            return data;
        } else {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
    } catch (error: any) {
        console.error("Registration error:", error);
        throw error;
    }
};

export const getToken = () => localStorage.getItem('token');
export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};
