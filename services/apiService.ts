const isProduction = import.meta.env.MODE === 'production' || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'));
const API_BASE = import.meta.env.VITE_API_BASE || (isProduction ? '/api' : 'http://localhost:4000/api');
export const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect fill='%2320282d' width='128' height='128'/><circle cx='64' cy='44' r='26' fill='%234a5568'/><rect x='24' y='80' width='80' height='28' rx='12' fill='%234a5568'/></svg>";

async function apiPost(path: string, body: any) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Handle non-JSON response (e.g. 500/502 from Vercel)
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      if (!res.ok) {
        console.error('API Error:', path, res.status, data);
        return { success: false, message: data.error || data.message || `Error ${res.status}` };
      }
      return data;
    } else {
      const text = await res.text();
      console.error('API Non-JSON Error:', path, res.status, text);
      return { success: false, message: `Server Error (${res.status}): ${text.substring(0, 50)}...` };
    }
  } catch (err) {
    console.error('Network/Server Error:', err);
    return { success: false, message: "Network or Server Error" };
  }
}

async function apiPut(path: string, body: any) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('API Error:', path, res.status, data);
      return { success: false, message: data.error || data.message || `Error ${res.status}` };
    }
    return data;
  } catch (err) {
    console.error('Network/Server Error:', err);
    return { success: false, message: "Network or Server Error" };
  }
}

async function apiGet(path: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      if (!res.ok) {
        // If 404/500 but JSON, could be error message
        const data = await res.json();
        console.error('API Get Error:', path, res.status, data);
        return []; // Return empty array for safety on lists
      }
      return res.json();
    } else {
      const text = await res.text();
      console.error('API Get Non-JSON Error:', path, res.status, text);
      return []; // Return empty array to prevent map() crash
    }
  } catch (e) {
    console.error("API Get Network Error", e);
    return [];
  }
}

export const registerUserApi = (payload: any) => apiPost('/register', payload);
export const loginUserApi = (payload: any) => apiPost('/login', payload);
export const getPromptsApi = () => apiGet('/prompts');
export const createPromptApi = (payload: any) => apiPost('/prompts', payload);
export const updatePromptApi = (id: string, payload: any) => apiPut(`/prompts/${id}`, payload);
export const addFeedbackApi = (payload: any) => apiPost('/feedback', payload);
export const viewPromptApi = (id: string) => apiPost(`/prompts/${id}/view`, {});
export const copyPromptApi = (id: string) => apiPost(`/prompts/${id}/copy`, {});
export const ratePromptApi = (id: string, rating: number, username: string) => apiPost(`/prompts/${id}/rate`, { rating, username });
export const deletePromptApi = (id: string) => fetch(`${API_BASE}/prompts/${id}`, { method: 'DELETE' }).then(r => r.json());

export const getUsersApi = () => apiGet('/users');
export const getUserApi = (username: string) => apiGet(`/users/${username}`);
export const updateUserApi = (payload: any) => apiPut('/users/profile', payload);
export const deleteUserApi = (username: string) => fetch(`${API_BASE}/users/${username}`, { method: 'DELETE' }).then(r => r.json());

export const getFeedbackApi = () => apiGet('/feedback');
export const markFeedbackReadApi = (id: string, read: boolean) => apiPut(`/feedback/${id}/read`, { read });
export const deleteFeedbackApi = (id: string) => fetch(`${API_BASE}/feedback/${id}`, { method: 'DELETE' }).then(r => r.json());
export const verifyPasswordApi = (payload: { username: string, password: string }) => apiPost('/verify-password', payload);
export const toggleFavoriteApi = (id: string, userId: string) => apiPost(`/prompts/${id}/favorite`, { userId });

export const getSettingApi = async (key: string) => {
  try {
    const res = await apiGet(`/settings/${key}`);
    return res;
  } catch (e) {
    return { success: false, value: '' };
  }
};

export const getAllSettingsApi = async () => {
  try {
    const res = await apiGet('/settings');
    return res;
  } catch (e) {
    return { success: false, settings: {} };
  }
};

export const updateSettingApi = async (key: string, value: string, authorId: string) => {
  return apiPut(`/settings/${key}`, { value, authorId });
};

export default { registerUserApi, loginUserApi, getPromptsApi, createPromptApi, updatePromptApi, addFeedbackApi, viewPromptApi, copyPromptApi, ratePromptApi, deletePromptApi, getUsersApi, getUserApi, updateUserApi, deleteUserApi, getFeedbackApi, markFeedbackReadApi, deleteFeedbackApi, toggleFavoriteApi, getSettingApi, updateSettingApi };
