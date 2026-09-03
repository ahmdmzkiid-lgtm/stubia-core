import { useAuthStore } from '../store/authStore';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (val: any) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = useAuthStore.getState().accessToken;
  const originalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  let res = await fetch(url, { ...options, headers: originalHeaders });

  // If 401 Unauthorized, automatically attempt to refresh token
  if (res.status === 401) {
    if (isRefreshing) {
      try {
        const newToken = await new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        const retryHeaders = {
          ...originalHeaders,
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        };
        return fetch(url, { ...options, headers: retryHeaders });
      } catch (err) {
        return res;
      }
    }

    isRefreshing = true;

    try {
      console.log('[authFetch] 401 encountered, refreshing access token...');
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      const refreshData = await refreshRes.json();

      if (refreshRes.ok && refreshData.success && refreshData.data?.accessToken) {
        const newAccessToken = refreshData.data.accessToken;
        useAuthStore.getState().setAuth(newAccessToken, refreshData.data.user);
        processQueue(null, newAccessToken);

        const retryHeaders = {
          ...originalHeaders,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return fetch(url, { ...options, headers: retryHeaders });
      } else {
        processQueue(new Error('Refresh token invalid'), null);
      }
    } catch (refreshErr) {
      processQueue(refreshErr, null);
    } finally {
      isRefreshing = false;
    }
  }

  return res;
};
