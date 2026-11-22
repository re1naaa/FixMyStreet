export type ReportStatus = "submitted" | "under_review" | "approved" | "assigned" | "in_progress" | "resolved";
export type Priority = "low" | "medium" | "high" | "critical";

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

export type Report = {
  id: number;
  reference_code: string | null;
  title: string;
  description: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  neighborhood_id: number | null;
  neighborhood_name: string | null;
  latitude: number;
  longitude: number;
  urgency: Priority;
  priority: Priority | null;
  status: ReportStatus;
  photo_url: string | null;
  author_name: string;
  vote_count: number;
  has_voted: boolean;
  comment_count: number;
  fix_count: number;
  created_at: string;
  updated_at: string;
};

export type ReportCreateInput = {
  title: string;
  description: string;
  category_id: number;
  latitude: number;
  longitude: number;
  urgency: Priority;
  neighborhood_id?: number | null;
  photo_path?: string | null;
};

export type ReportStats = {
  my_reports: number;
  resolved_reports: number;
  active_reports: number;
  community_reports: number;
};

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  report_id: number | null;
  read: boolean;
  created_at: string;
};

export type CommentItem = {
  id: number;
  body: string;
  author_name: string;
  created_at: string;
};

export type FixItem = {
  id: number;
  body: string;
  photo_url: string | null;
  author_name: string;
  created_at: string;
};

export type AdminOverview = {
  total: number;
  by_status: Record<ReportStatus, number>;
  community_fixes: number;
};

export type Achievement = {
  code: string;
  name: string;
  description: string;
  earned: boolean;
};

export type NeighborhoodHealth = {
  score: number;
  open_issues: number;
  resolved_issues: number;
  improvement_trend: number;
};
