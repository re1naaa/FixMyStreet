import { Platform } from "react-native";
import { API_URL } from "../constants/config";
import type {
  Achievement,
  Category,
  AdminOverview,
  CommentItem,
  FixItem,
  NeighborhoodHealth,
  NotificationItem,
  Report,
  ReportCreateInput,
  ReportStats,
  ReportStatus,
  ReportUpdateInput,
} from "../types/reports";
import { ApiError } from "./api";

async function request<T>(token: string, path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  headers.Authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the FixMyStreet API.");
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try { body = JSON.parse(text); } catch { throw new ApiError(response.status, "Unreadable API response"); }
  }
  if (!response.ok) {
    const detail = body && typeof body === "object" && "detail" in body ? (body as { detail: unknown }).detail : "Request failed";
    throw new ApiError(response.status, typeof detail === "string" ? detail : "Request failed");
  }
  return body as T;
}

export const absolutePhotoUrl = (url: string | null) => url ? `${API_URL}${url}` : null;
export const listCategories = (token: string) => request<Category[]>(token, "/api/reports/categories");
export const listReports = (token: string, params: Record<string, string | boolean | undefined> = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  const suffix = query.toString();
  return request<Report[]>(token, `/api/reports${suffix ? `?${suffix}` : ""}`);
};
export const getReportStats = (token: string) => request<ReportStats>(token, "/api/reports/stats");
export const getReport = (token: string, id: number) => request<Report>(token, `/api/reports/${id}`);
export const createReport = (token: string, input: ReportCreateInput) => request<Report>(token, "/api/reports", { method: "POST", body: JSON.stringify(input) });
export const updateReport = (token: string, id: number, input: ReportUpdateInput) => request<Report>(token, `/api/reports/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const toggleVote = (token: string, id: number) => request<{ supported: boolean; vote_count: number }>(token, `/api/reports/${id}/vote`, { method: "POST" });
export const getComments = (token: string, id: number) => request<CommentItem[]>(token, `/api/reports/${id}/comments`);
export const addComment = (token: string, id: number, body: string) => request<CommentItem>(token, `/api/reports/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) });
export const getStatusHistory = (token: string, id: number) => request<Array<{ id: number; from_status: string | null; to_status: string; note: string; created_at: string }>>(token, `/api/reports/${id}/history`);
export const getDuplicates = (token: string, latitude: number, longitude: number, categoryId: number) => request<Report[]>(token, `/api/reports/duplicates?latitude=${latitude}&longitude=${longitude}&category_id=${categoryId}`);
export const getNotifications = (token: string) => request<NotificationItem[]>(token, "/api/reports/notifications");
export const readNotifications = (token: string) => request<void>(token, "/api/reports/notifications/read-all", { method: "POST" });
export const readNotification = (token: string, id: number) => request<void>(token, `/api/reports/notifications/${id}/read`, { method: "POST" });
export const getAchievements = (token: string) => request<Achievement[]>(token, "/api/reports/achievements");
export const getNeighborhoodHealth = (token: string) => request<NeighborhoodHealth>(token, "/api/reports/neighborhood-health");
export const getCommunity = (token: string) => request<{ top_supported: Report[]; recent: Report[]; leaderboard: Array<{ id: number; name: string; points: number }> }>(token, "/api/reports/community");

export const getFixes = (token: string, id: number) => request<FixItem[]>(token, `/api/reports/${id}/fixes`);
export const addFix = (token: string, id: number, body: string, photoPath: string | null) => request<FixItem>(token, `/api/reports/${id}/fixes`, { method: "POST", body: JSON.stringify({ body, photo_path: photoPath }) });
export const getAdminOverview = (token: string) => request<AdminOverview>(token, "/api/admin/overview");
export const updateReportStatus = (token: string, id: number, status: ReportStatus) => request<Report>(token, `/api/admin/reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const removeReport = (token: string, id: number) => request<void>(token, `/api/admin/reports/${id}`, { method: "DELETE" });

export async function uploadPhoto(token: string, uri: string, name: string, type: string) {
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", new File([blob], name, { type: blob.type || type }));
  } else {
    form.append("file", { uri, name, type } as unknown as Blob);
  }
  return request<{ photo_path: string; photo_url: string }>(token, "/api/reports/upload", { method: "POST", body: form });
}
