const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // If token expired, try to refresh it silently
  if (res.status === 401) {
    const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("accessToken", data.accessToken);
      // Retry original request with new token
      return fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.accessToken}`,
          ...options.headers,
        },
      });
    } else {
      // Refresh failed — clear session and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("bsc_user");
      window.location.href = "/tracker";
    }
  }

  return res;
}