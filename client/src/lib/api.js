const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("quizrush_token");
}

function setToken(token) {
  localStorage.setItem("quizrush_token", token);
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export async function login(password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
  setToken(data.token);
  return data;
}

export function getQuizzes() {
  return request("/quizzes");
}

export function getQuiz(id) {
  return request(`/quizzes/${id}`);
}

export function createQuiz(payload) {
  return request("/quizzes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateQuiz(id, payload) {
  return request(`/quizzes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteQuiz(id) {
  return request(`/quizzes/${id}`, { method: "DELETE" });
}

export function duplicateQuiz(id) {
  return request(`/quizzes/${id}/duplicate`, { method: "POST" });
}

export function exportQuiz(id) {
  return request(`/quizzes/${id}/export`);
}

export function importQuiz(payload) {
  return request("/quizzes/import", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function clearToken() {
  localStorage.removeItem("quizrush_token");
}

export function hasToken() {
  return Boolean(getToken());
}
