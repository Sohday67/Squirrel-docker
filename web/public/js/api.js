/* API Client Module */
const API = (() => {
    const BASE = '/api';

    function getToken() {
        return localStorage.getItem('squirrel_token');
    }

    function setToken(token) {
        localStorage.setItem('squirrel_token', token);
    }

    function clearToken() {
        localStorage.removeItem('squirrel_token');
    }

    function isAuthenticated() {
        return !!getToken();
    }

    async function request(method, path, body, isBlob) {
        const headers = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const opts = { method, headers };
        if (body && method !== 'GET') {
            opts.body = JSON.stringify(body);
        }

        const res = await fetch(`${BASE}${path}`, opts);

        if (res.status === 401) {
            clearToken();
            window.location.hash = '#login';
            throw new Error('Session expired. Please log in again.');
        }

        if (isBlob) {
            if (!res.ok) throw new Error('Export failed');
            return res.blob();
        }

        if (res.status === 204) return null;

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || data.message || `Request failed (${res.status})`);
        }

        return data;
    }

    // Auth
    const auth = {
        register: (data) => request('POST', '/auth/register', data),
        login: (data) => request('POST', '/auth/login', data),
        verify2fa: (data) => request('POST', '/auth/verify-2fa', data),
        setup2fa: () => request('POST', '/auth/setup-2fa'),
        enable2fa: (data) => request('POST', '/auth/enable-2fa', data),
        disable2fa: (data) => request('POST', '/auth/disable-2fa', data),
        getMe: () => request('GET', '/auth/me'),
    };

    // Spendings
    const spendings = {
        list: (params) => {
            const q = new URLSearchParams(params).toString();
            return request('GET', `/spendings${q ? '?' + q : ''}`);
        },
        create: (data) => request('POST', '/spendings', data),
        update: (id, data) => request('PUT', `/spendings/${id}`, data),
        delete: (id) => request('DELETE', `/spendings/${id}`),
        sync: (data) => request('POST', '/spendings/sync', data),
    };

    // Categories
    const categories = {
        list: () => request('GET', '/categories'),
        create: (data) => request('POST', '/categories', data),
        update: (id, data) => request('PUT', `/categories/${id}`, data),
        delete: (id) => request('DELETE', `/categories/${id}`),
        sync: (data) => request('POST', '/categories/sync', data),
    };

    // Returns
    const returns = {
        list: () => request('GET', '/returns'),
        create: (data) => request('POST', '/returns', data),
        update: (id, data) => request('PUT', `/returns/${id}`, data),
        delete: (id) => request('DELETE', `/returns/${id}`),
        sync: (data) => request('POST', '/returns/sync', data),
    };

    // Export
    const exportData = {
        json: () => request('GET', '/export/json'),
        csv: () => request('GET', '/export/csv', null, true),
    };

    return { auth, spendings, categories, returns, exportData, getToken, setToken, clearToken, isAuthenticated };
})();
