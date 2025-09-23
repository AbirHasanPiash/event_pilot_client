export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = true
): Promise<T> {
  const token =
    typeof window !== "undefined" && includeAuth
      ? localStorage.getItem("access")
      : null;

  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

  // Determine if we're sending FormData
  const isFormData = options.body instanceof FormData;

  // Prepare headers safely
  const baseHeaders: Record<string, string> = {
    ...(token ? { Authorization: `JWT ${token}` } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };

  const extraHeaders =
    options.headers &&
    !(options.headers instanceof Headers) &&
    !Array.isArray(options.headers)
      ? options.headers
      : {};

  const headers: Record<string, string> = {
    ...baseHeaders,
    ...(extraHeaders as Record<string, string>),
  };

  // Perform request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Retry with refreshed access token on 401
  if (response.status === 401 && includeAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      localStorage.setItem("access", newToken);
      return apiFetch<T>(endpoint, options, includeAuth);
    } else {
      throw new Error("Session expired. Please log in again.");
    }
  }

  // Try to parse response content
  const contentType = response.headers.get("content-type");
  let data: unknown = null;

  try {
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch {
    data = {};
  }

  // Handle errors with descriptive message
  if (!response.ok) {
    let message = "Something went wrong.";

    if (data && typeof data === "object" && "detail" in data) {
      message = (data as { detail: string }).detail;
    } else if (typeof data === "string") {
      message = data;
    } else if (data && typeof data === "object") {
      // Collect all error messages from fields
      const errors = Object.entries(data as Record<string, unknown>)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(" ")}`;
          }
          return `${field}: ${String(messages)}`;
        })
        .join(" ");
      message = errors || message;
    }

    throw new Error(message);
  }

  return data as T;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/jwt/refresh/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data.access;
}
