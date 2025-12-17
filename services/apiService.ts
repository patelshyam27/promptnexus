const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
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

export default { registerUserApi, loginUserApi, getPromptsApi, createPromptApi, addFeedbackApi };
