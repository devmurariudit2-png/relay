import { supabase } from '../supabase';

const BASE = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000' : 'https://relay-backend-sigma.vercel.app');

const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

async function req(method, path, body, isFormData = false, options = {}) {
  if (!BASE) throw new Error('Backend API URL is not configured. Set VITE_API_URL.');
  const headers = { ...options.headers };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  
  const token = await getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    const fetchOptions = { ...options };
    delete fetchOptions.idempotencyKey;
    delete fetchOptions.headers;

    res = await fetch(`${BASE}${path}`, {
      method, headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      ...fetchOptions
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(`Cannot connect to API at ${BASE}: ${err.message}`);
  }

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
    const err = new Error(raw.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.errors = raw.errors || null;
    throw err;
  }
  if (raw && typeof raw === 'object' && 'success' in raw)
    return raw.data !== undefined ? raw.data : raw;
  return raw;
}

async function reqFull(method, path, params = {}) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  const headers = { 'Content-Type': 'application/json' };
  const token = await getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}${q ? '?' + q : ''}`, { headers });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
    throw new Error(raw.message || `HTTP ${res.status}`);
  }
  return raw;
}

// Auth via Supabase
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const register = async (name, email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  });
  if (error) throw error;
  return data;
};

export const logout = () => supabase.auth.signOut();
export const getMe = () => req('GET', '/auth/me');
export const updateProfile = (data) => req('PUT', '/auth/profile', data);
export const changePassword = (cur, np) => req('PUT', '/auth/password', { currentPassword: cur, newPassword: np });

// Health
export const getHealth = () => req('GET', '/health');

// Transactions
export const getTransactions = (params = {}) => reqFull('GET', '/transactions', params);
export const createTransaction = (data, options = {}) => req('POST', '/transactions', data, false, options);
export const getTransaction = (id) => req('GET', `/transactions/${id}`);
export const updateTransaction = (id, data) => req('PATCH', `/transactions/${id}`, data);
export const deleteTransaction = (id) => req('DELETE', `/transactions/${id}`);
export const importCSV = (file, source) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('source', source);
  return req('POST', '/transactions/import', fd, true);
};
export const reconcile = (options = {}) => req('POST', '/transactions/reconcile', null, false, options);
export const getLedger = (source) => req('GET', `/transactions/ledger?source=${source}`);
export const getSummary = () => req('GET', '/transactions/summary');

// Tickets
export const getTickets = (params = {}) => reqFull('GET', '/tickets', params);
export const createTicket = (data) => req('POST', '/tickets', data);
export const getTicket = (id) => req('GET', `/tickets/${id}`);
export const updateTicket = (id, data) => req('PATCH', `/tickets/${id}`, data);
export const deleteTicket = (id) => req('DELETE', `/tickets/${id}`);

// Team
export const getTeamMembers = (options = {}) => req('GET', '/team', null, false, options);
export const inviteTeamMember = (email, role) => req('POST', '/team/invite', { email, role });
export const updateTeamMemberRole = (id, role) => req('PATCH', `/team/${id}`, { role });
export const removeTeamMember = (id) => req('DELETE', `/team/${id}`);

// Admin
export const getAdminUsers = (params = {}) => reqFull('GET', '/admin/users', params);
export const getAdminUser = (id) => req('GET', `/admin/users/${id}`);
export const updateAdminUser = (id, data) => req('PATCH', `/admin/users/${id}`, data);
export const deleteAdminUser = (id) => req('DELETE', `/admin/users/${id}`);
export const getAdminAnalytics = () => req('GET', '/admin/analytics');
export const getMonitoring = () => req('GET', '/admin/monitoring');
export const getAuditLog = (params = {}) => reqFull('GET', '/admin/audit', params);

// Export req function for custom API calls (e.g., job status)
export { req };

// Stripe
export const getSubscriptionStatus = () => req('GET', '/stripe/status');
export const createCheckoutSession = (tier) => req('POST', '/stripe/create-checkout', { tier });
export const createPortalSession = () => req('POST', '/stripe/portal');

// Direct fetch wrapper with Auth token for getting raw data (like swagger JSON)
export const fetchAuth = async (path) => {
  const headers = {};
  const token = await getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) {
    if (res.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
};
