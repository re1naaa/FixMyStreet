import { API_URL } from "../constants/config";
import type { Neighborhood, PublicUser, RegisterInput, TokenResponse } from "../types/auth";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function messageFromBody(body: unknown): string {
  if (!body || typeof body !== "object" || !("detail" in body)) {
    return "Request failed";
  }
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    if (first?.msg) {
      return first.msg.replace(/^Value error,\s*/i, "");
    }
  }
  return "Request failed";
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the FixMyStreet API. Check EXPO_PUBLIC_API_URL and that the backend is running.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      throw new ApiError(response.status, "The API returned an unreadable response");
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, messageFromBody(body));
  }
  return body as T;
}

export function getHealth(): Promise<{ status: string; database: string }> {
  return request("/api/health");
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(input: RegisterInput): Promise<TokenResponse> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMe(token: string): Promise<PublicUser> {
  return request("/api/auth/me", {}, token);
}

export function updateProfile(
  token: string,
  input: { full_name?: string; neighborhood_id?: number | null },
): Promise<PublicUser> {
  return request(
    "/api/auth/me",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function listNeighborhoods(): Promise<Neighborhood[]> {
  return request("/api/neighborhoods");
}
