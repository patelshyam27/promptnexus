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
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
}

export const registerUserApi = (payload: any) => apiPost('/register', payload);
export const loginUserApi = (payload: any) => apiPost('/login', payload);
export const getPromptsApi = () => apiGet('/prompts');
export const createPromptApi = (payload: any) => apiPost('/prompts', payload);
export const addFeedbackApi = (payload: any) => apiPost('/feedback', payload);
export const viewPromptApi = (id: string) => apiPost(`/prompts/${id}/view`, {});
export const copyPromptApi = (id: string) => apiPost(`/prompts/${id}/copy`, {});
export const ratePromptApi = (id: string, rating: number, username: string) => apiPost(`/prompts/${id}/rate`, { rating, username });
export const deletePromptApi = (id: string) => fetch(`${API_BASE}/prompts/${id}`, { method: 'DELETE' }).then(r => r.json());

export const getUsersApi = () => apiGet('/users');
export const getUserApi = (username: string) => apiGet(`/users/${username}`);
export const updateUserApi = (payload: any) => apiPut('/users/profile', payload);
export const deleteUserApi = (username: string) => fetch(`${API_BASE}/users/${username}`, { method: 'DELETE' }).then(r => r.json());

export default { registerUserApi, loginUserApi, getPromptsApi, createPromptApi, addFeedbackApi, viewPromptApi, copyPromptApi, ratePromptApi, deletePromptApi, getUsersApi, getUserApi, updateUserApi, deleteUserApi };
